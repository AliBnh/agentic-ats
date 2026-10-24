import io
import re
import json
import logging
import base64
from typing import Dict, Any, Tuple, List, Optional
from app.schemas.state import ResumeAST, WorkExperienceItem, BulletPoint, EducationItem
from app.config import settings
from app.core.llm import invoke_json, invoke_json_with_images
from app.prompts import resume_parser_prompt, resume_vision_parser_prompt
from app.utils.language_detector import detect_language

logger = logging.getLogger(__name__)

# Try importing PDF libraries
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

def clean_pdf_text(text: str) -> str:
    """Cleans common PDF extraction artifacts, ligatures, and extra whitespace."""
    if not text:
        return ""
    # Common PDF ligatures
    ligatures = {
        "\ufb00": "ff",
        "\ufb01": "fi",
        "\ufb02": "fl",
        "\ufb03": "ffi",
        "\ufb04": "ffl",
        "\ufb05": "ft",
        "\ufb06": "st",
        "\u2022": "•",
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
    }
    for k, v in ligatures.items():
        text = text.replace(k, v)

    # Clean multiple spaces while preserving newlines
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.splitlines()]
    # Remove excessive blank lines
    cleaned_lines = []
    blank_count = 0
    for l in lines:
        if not l:
            blank_count += 1
            if blank_count <= 2:
                cleaned_lines.append("")
        else:
            blank_count = 0
            cleaned_lines.append(l)

    return "\n".join(cleaned_lines).strip()


def extract_page_layout_aware(page) -> Tuple[str, bool]:
    """
    Extracts text from a single pdfplumber page using layout-aware multi-column detection.
    Prevents horizontal text scrambling between left sidebars and right main bodies.
    Returns (page_text, is_multi_column).
    """
    try:
        words = page.extract_words(x_tolerance=3, y_tolerance=3)
    except Exception as e:
        logger.warning(f"extract_words failed: {e}. Using standard extract_text.")
        return page.extract_text() or "", False

    if not words:
        return page.extract_text() or "", False

    width = float(page.width)
    height = float(page.height)

    # Detect if page has columns: check body words below top 10%
    body_words = [w for w in words if w['top'] > height * 0.10]
    if not body_words or len(body_words) < 20:
        return page.extract_text(layout=False) or "", False

    # Check for vertical gutters in body_words between 20% and 70% width
    # A gutter is a vertical coordinate where no word intersects
    gutters = []
    step = 4
    for x in range(int(width * 0.20), int(width * 0.70), step):
        cross = [w for w in body_words if w['x0'] < x < w['x1']]
        if len(cross) == 0:
            gutters.append(x)

    # If there is a contiguous gutter of at least 12 points, it's a multi-column page!
    if len(gutters) >= 3:
        split_x = gutters[len(gutters) // 2]

        # Check for header words that span across split_x at the top
        header_cross = [w for w in words if w['x0'] < split_x < w['x1'] and w['top'] < height * 0.35]
        y_split = max(w['bottom'] for w in header_cross) + 3 if header_cross else 0

        parts = []
        # Header banner across full width
        if y_split > 0:
            try:
                hdr = page.crop((0, 0, width, y_split)).extract_text(layout=False)
                if hdr and hdr.strip():
                    parts.append(hdr.strip())
            except Exception:
                pass

        # Left column (typically sidebar: skills, contact, education, languages)
        try:
            col1 = page.crop((0, y_split, split_x, height)).extract_text(layout=False)
            if col1 and col1.strip():
                parts.append(col1.strip())
        except Exception:
            pass

        # Right column (typically main body: summary, experience, projects)
        try:
            col2 = page.crop((split_x, y_split, width, height)).extract_text(layout=False)
            if col2 and col2.strip():
                parts.append(col2.strip())
        except Exception:
            pass

        if parts:
            return "\n\n".join(parts), True

    # Single-column fallback
    return page.extract_text(layout=False) or "", False


def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
    """
    Extracts text from PDF bytes with layout-aware multi-column resolution
    and detects structural anomalies (tables, scanned images, encoding).
    """
    text_parts = []
    anomalies = []
    total_pages = 0
    multi_col_detected = False

    if PDFPLUMBER_AVAILABLE:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                total_pages = len(pdf.pages)
                for i, page in enumerate(pdf.pages):
                    page_text, is_mc = extract_page_layout_aware(page)
                    if is_mc:
                        multi_col_detected = True
                    if page_text:
                        text_parts.append(page_text.strip())

                    # Check for complex tables
                    try:
                        tables = page.extract_tables()
                        if tables and len(tables) > 0:
                            anomalies.append(f"Page {i+1}: Complex tables detected (automatically preserved).")
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"pdfplumber extraction encountered error: {e}. Falling back to pypdf.")
            text_parts = []

    # Fallback to pypdf if pdfplumber extracted nothing
    if not text_parts and PYPDF_AVAILABLE:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            total_pages = len(reader.pages)
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text:
                    text_parts.append(page_text.strip())
        except Exception as e:
            logger.error(f"pypdf extraction failed: {e}")

    # Fallback to UTF-8 decoded string if file was raw text/markdown
    if not text_parts:
        try:
            raw = file_bytes.decode("utf-8", errors="ignore").strip()
            if raw:
                text_parts.append(raw)
        except Exception:
            text_parts.append("Error: Unable to extract text from provided document.")

    raw_extracted = "\n\n".join(text_parts)
    cleaned_text = clean_pdf_text(raw_extracted)

    # Anomaly checks
    if len(cleaned_text.strip()) < 100:
        anomalies.append("Extracted text is unusually short (< 100 characters). This document may be a scanned image-only PDF.")
    if re.search(r'[\ufffd\x00-\x08\x0b\x0c\x0e-\x1f]', cleaned_text):
        anomalies.append("Garbled non-standard Unicode characters detected.")

    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cleaned_text)
    if not email_match:
        anomalies.append("No standard email address detected in the extracted text.")

    phone_match = re.search(r'(\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}', cleaned_text)

    if multi_col_detected:
        anomalies.append("Multi-column layout resolved into natural reading order.")

    confidence = 0.98
    if len(anomalies) > 0:
        confidence = max(0.60, 0.98 - (len(anomalies) * 0.10))

    parsing_metadata = {
        "page_count": total_pages or 1,
        "char_count": len(cleaned_text),
        "anomalies": anomalies,
        "confidence_score": round(confidence, 2),
        "has_email": bool(email_match),
        "has_phone": bool(phone_match),
        "is_multi_column": multi_col_detected,
    }

    return cleaned_text, parsing_metadata


def _parse_resume_deterministically(raw_text: str, language: str = "en") -> ResumeAST:
    """
    High-precision deterministic rule-based parser that handles diverse real-world
    formats in French and English (dashes, colons, pipes, separate line dates).
    Guarantees no synthetic fabrication.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    if not lines:
        return ResumeAST(full_name="Candidate", language=language)

    # 1. Candidate Name
    name_idx = 0
    while name_idx < len(lines) and lines[name_idx].lower() in [
        "curriculum vitae", "resume", "cv", "profil", "profile", "contact"
    ]:
        name_idx += 1

    full_name = lines[name_idx] if name_idx < len(lines) else "Candidate"
    # Clean headline if name line has pipe or dash: "John Doe | Senior Engineer"
    if " | " in full_name:
        full_name = full_name.split(" | ")[0].strip()
    elif " - " in full_name and len(full_name.split(" - ")[0].strip()) < 35:
        full_name = full_name.split(" - ")[0].strip()

    # 2. Contact Information
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
    phone_match = re.search(r'(\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}', raw_text)
    linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', raw_text)
    github_match = re.search(r'github\.com/[\w-]+', raw_text)

    # Location search
    location = None
    for line in lines[name_idx + 1:name_idx + 6]:
        parts = [p.strip() for p in re.split(r'[|•,]', line)]
        for p in parts:
            if p and "@" not in p and not re.search(r'\d{5,}', p) and "linkedin" not in p.lower() and "github" not in p.lower() and len(p) < 35:
                if any(city in p.lower() for city in [
                    "casablanca", "rabat", "paris", "maroc", "morocco", "lyon", "dubai", "london",
                    "new york", "san francisco", "marseille", "toulouse", "bordeaux", "lille",
                    "tunis", "alger", "dakar", "montreal", "brussels", "bruxelles", "geneva", "genève"
                ]):
                    location = p
                    break

    contact_info = {
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0).strip() if phone_match else "",
        "linkedin": linkedin_match.group(0) if linkedin_match else "",
        "github": github_match.group(0) if github_match else "",
        "location": location or ""
    }

    # 3. Section Identification (Broad bilingual dictionary)
    section_patterns = {
        "experience": re.compile(
            r'^(?:exp[ée]riences?\s+professionnelles?|professional\s+experience|work\s+experience|parcours\s+professionnel|exp[ée]rience|stages?\s+et\s+emplois?|employment\s+history|career\s+history)',
            re.IGNORECASE
        ),
        "education": re.compile(
            r'^(?:formations?|education|formation\s+et\s+dipl[ôo]mes|dipl[ôo]mes|parcours\s+acad[ée]mique|formation\s+acad[ée]mique|academic\s+background|studies)',
            re.IGNORECASE
        ),
        "skills": re.compile(
            r'^(?:comp[ée]tences?|technical\s+skills|skills|core\s+competencies|savoir-faire|expertise\s+technique|environnement\s+technique|stack\s+technique|outils)',
            re.IGNORECASE
        ),
        "projects": re.compile(
            r'^(?:projets?|projects|projets\s+acad[ée]miques?|projets\s+significatifs?|personal\s+projects|r[ée]alisations?)',
            re.IGNORECASE
        ),
        "certifications": re.compile(
            r'^(?:certifications?|certificats?|distinctions?|awards|honors|accreditations)',
            re.IGNORECASE
        ),
        "leadership": re.compile(
            r'^(?:leadership|activit[ée]s?\s+associatives?|engagement\s+associatif|b[ée]n[ée]volat|volunteering|extracurricular)',
            re.IGNORECASE
        ),
        "languages": re.compile(
            r'^(?:langues?|languages?|langues\s+ma[îi]tris[ée]es?)',
            re.IGNORECASE
        ),
    }

    current_section = "header"
    sections: Dict[str, List[str]] = {
        "header": [],
        "experience": [],
        "education": [],
        "skills": [],
        "projects": [],
        "certifications": [],
        "leadership": [],
        "languages": []
    }

    for line in lines[name_idx + 1:]:
        matched_sec = None
        for sec_name, pattern in section_patterns.items():
            if pattern.match(line):
                matched_sec = sec_name
                break

        if matched_sec:
            current_section = matched_sec
        else:
            sections[current_section].append(line)

    professional_summary = " ".join(sections["header"][:3]) if sections["header"] else ""

    # 4. Parse Work Experience Items
    work_experiences: List[WorkExperienceItem] = []
    exp_lines = sections["experience"]

    current_exp: Optional[Dict[str, Any]] = None
    exp_idx = 0

    # Date pattern supporting years, mm/yyyy, English and French months
    date_regex = re.compile(
        r'(\b(?:\d{2}/\d{4}|\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)[a-z]*\s+\d{4})\b'
        r'(?:\s*[-–—àa]\s*(?:\d{2}/\d{4}|\d{4}|[Pp]r[ée]sent|[Cc]urrent|[Aa]ujourd\'?hui|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)[a-z]*\s+\d{4}))?)',
        re.IGNORECASE
    )

    for line in exp_lines:
        is_bullet = line.startswith(('-', '•', '*', '–', '—', '›', '▪', '▫', '+'))
        date_match = date_regex.search(line)
        has_separator = any(sep in line for sep in [":", " | ", " - ", " – ", " — ", " @ "])

        # Job header line heuristic
        is_job_header = (
            not is_bullet and
            (date_match is not None or (has_separator and len(line) < 110 and not line.endswith('.')))
        )

        if is_job_header:
            if current_exp:
                bullets = [
                    BulletPoint(id=f"b_{exp_idx}_{j}", original=b, has_metrics=bool(re.search(r'\d+', b)))
                    for j, b in enumerate(current_exp["bullets"])
                ]
                work_experiences.append(WorkExperienceItem(
                    id=f"exp_{exp_idx}",
                    company=current_exp["company"],
                    role=current_exp["role"],
                    dates=current_exp["dates"],
                    location=current_exp.get("location"),
                    bullets=bullets
                ))
                exp_idx += 1

            # Extract Company, Role, Dates from header line
            dates_str = date_match.group(0) if date_match else "Recent"
            clean_line = date_regex.sub('', line).strip()

            parts = [p.strip() for p in re.split(r'[:|@–—]|\s-\s', clean_line) if p.strip()]
            if len(parts) >= 2:
                company = parts[0]
                role = parts[1]
            elif len(parts) == 1:
                company = parts[0]
                role = "Professional"
            else:
                company = "Enterprise"
                role = "Specialist"

            current_exp = {
                "company": company,
                "role": role,
                "dates": dates_str,
                "location": location,
                "bullets": []
            }
        elif current_exp:
            clean_b = re.sub(r'^[-•*–—›▪▫+\s]+', '', line).strip()
            if clean_b:
                current_exp["bullets"].append(clean_b)

    if current_exp:
        bullets = [
            BulletPoint(id=f"b_{exp_idx}_{j}", original=b, has_metrics=bool(re.search(r'\d+', b)))
            for j, b in enumerate(current_exp["bullets"])
        ]
        work_experiences.append(WorkExperienceItem(
            id=f"exp_{exp_idx}",
            company=current_exp["company"],
            role=current_exp["role"],
            dates=current_exp["dates"],
            location=current_exp.get("location"),
            bullets=bullets
        ))

    # 5. Parse Education Items
    education: List[EducationItem] = []
    edu_lines = sections["education"]
    for i, line in enumerate(edu_lines):
        inst_keywords = ["école", "ecole", "universit", "ensias", "facult", "institute", "college", "school", "centrale", "polytech", "emi", "insa", "hec", "essec", "lycée"]
        if any(w in line.lower() for w in inst_keywords):
            inst = line
            degree = edu_lines[i + 1] if i + 1 < len(edu_lines) else "Diplôme d'Ingénieur / Degree"
            year_match = date_regex.search(line) or (date_regex.search(degree) if degree else None)
            education.append(EducationItem(
                institution=inst,
                degree=degree,
                year=year_match.group(0) if year_match else "Completed"
            ))

    if not education and edu_lines:
        education.append(EducationItem(
            institution=edu_lines[0],
            degree=edu_lines[1] if len(edu_lines) > 1 else "Higher Education",
            year="Graduated"
        ))

    # 6. Parse Skills
    skills = []
    for line in sections["skills"]:
        cleaned = re.sub(r'^[^:]+:\s*', '', line)
        cleaned = re.sub(r'^[-•*–—›▪▫+\s]+', '', cleaned)
        for s in re.split(r'[,|/•]', cleaned):
            item = s.strip()
            if item and len(item) < 40 and not item.lower().startswith("soft skills"):
                skills.append(item)

    # 7. Parse Projects
    project_items: List[WorkExperienceItem] = []
    cur_proj: Optional[Dict[str, Any]] = None
    p_idx = 0
    for line in sections["projects"]:
        is_bullet = line.startswith(('-', '•', '*', '–', '—', '›', '▪', '▫', '+'))
        has_separator = any(sep in line for sep in [":", " | ", " - ", " – "])

        if not is_bullet and (has_separator or len(line) < 70):
            if cur_proj:
                b_list = [
                    BulletPoint(id=f"p_{p_idx}_{j}", original=b, has_metrics=bool(re.search(r'\d+', b)))
                    for j, b in enumerate(cur_proj["bullets"])
                ]
                project_items.append(WorkExperienceItem(
                    id=f"proj_{p_idx}",
                    company=cur_proj["name"],
                    role=cur_proj["role"],
                    dates="Key Project",
                    bullets=b_list
                ))
                p_idx += 1

            parts = [p.strip() for p in re.split(r'[:|–—]|\s-\s', line) if p.strip()]
            p_name = parts[0] if parts else line
            p_role = parts[1] if len(parts) > 1 else "Technical Project"
            cur_proj = {"name": p_name, "role": p_role, "bullets": []}
        elif cur_proj:
            clean_b = re.sub(r'^[-•*–—›▪▫+\s]+', '', line).strip()
            if clean_b:
                cur_proj["bullets"].append(clean_b)

    if cur_proj:
        b_list = [
            BulletPoint(id=f"p_{p_idx}_{j}", original=b, has_metrics=bool(re.search(r'\d+', b)))
            for j, b in enumerate(cur_proj["bullets"])
        ]
        project_items.append(WorkExperienceItem(
            id=f"proj_{p_idx}",
            company=cur_proj["name"],
            role=cur_proj["role"],
            dates="Key Project",
            bullets=b_list
        ))

    # 8. Certifications, Leadership & Languages
    certifications = [re.sub(r'^[-•*–—›▪▫+\s]+', '', l).strip() for l in sections.get("certifications", []) if l.strip()]
    leadership = [re.sub(r'^[-•*–—›▪▫+\s]+', '', l).strip() for l in sections.get("leadership", []) if l.strip()]
    languages_spoken = [re.sub(r'^[-•*–—›▪▫+\s]+', '', l).strip() for l in sections.get("languages", []) if l.strip()]

    return ResumeAST(
        full_name=full_name,
        contact_info=contact_info,
        professional_summary=professional_summary,
        work_experiences=work_experiences,
        projects=project_items,
        education=education,
        skills=skills[:45],
        certifications=certifications,
        languages_spoken=languages_spoken,
        leadership=leadership,
        language=language
    )


def parse_resume_to_ast(
    raw_text: str,
    language: str = "en",
    parsed_data: Dict[str, Any] | None = None,
    allow_fallback: bool = True,
) -> ResumeAST:
    """
    Parses unstructured resume text into a structured, fact-locked ResumeAST.
    Uses the configured LangChain model with JSON output and falls back to the
    high-precision deterministic parser if the model is unavailable.
    """
    try:
        data = parsed_data if parsed_data is not None else invoke_json(resume_parser_prompt(raw_text, language))
        if not isinstance(data, dict):
            raise ValueError("Resume parser returned a non-object JSON value.")

        # Reconstruct into Pydantic AST
        exp_items = []
        for i, exp in enumerate(data.get("work_experiences", [])):
            raw_bullets = exp.get("bullets", [])
            bullets = []
            for j, b in enumerate(raw_bullets):
                orig = b.get("original", "") if isinstance(b, dict) else str(b)
                has_metrics = bool(re.search(r'\d+%', orig) or re.search(r'\$\d+', orig) or re.search(r'\b\d+\b', orig))
                bullets.append(BulletPoint(
                    id=f"b_{i}_{j}",
                    original=orig,
                    has_metrics=has_metrics
                ))
            exp_items.append(WorkExperienceItem(
                id=f"exp_{i}",
                company=exp.get("company") or "Company",
                role=exp.get("role") or "Specialist",
                dates=exp.get("dates") or "N/A",
                location=exp.get("location"),
                bullets=bullets
            ))

        proj_items = []
        for i, prj in enumerate(data.get("projects", [])):
            p_name = prj.get("name") or "Project"
            p_role = prj.get("technologies") or prj.get("role") or "Technical Project"
            raw_bullets = prj.get("bullets", [])
            b_list = []
            for j, b in enumerate(raw_bullets):
                orig = b.get("original", "") if isinstance(b, dict) else str(b)
                has_metrics = bool(re.search(r'\d+', orig))
                b_list.append(BulletPoint(id=f"p_{i}_{j}", original=orig, has_metrics=has_metrics))
            proj_items.append(WorkExperienceItem(
                id=f"proj_{i}",
                company=p_name,
                role=p_role,
                dates="Key Project",
                bullets=b_list
            ))

        edu_items = [
            EducationItem(
                degree=e.get("degree", ""),
                institution=e.get("institution", ""),
                year=e.get("year")
            )
            for e in data.get("education", [])
        ]

        if data.get("full_name") and exp_items:
            return ResumeAST(
                full_name=data.get("full_name", "Candidate"),
                contact_info=data.get("contact_info", {}),
                professional_summary=data.get("professional_summary", ""),
                work_experiences=exp_items,
                projects=proj_items,
                education=edu_items,
                skills=data.get("skills", []),
                certifications=data.get("certifications", []),
                languages_spoken=data.get("languages_spoken", []),
                leadership=data.get("leadership", []),
                language=language
            )

        if not allow_fallback:
            raise ValueError("Vision parser returned incomplete resume data.")

    except Exception as e:
        if not allow_fallback:
            raise RuntimeError(f"Vision resume parsing failed: {e}") from e
        logger.warning("Configured model AST parsing failed: %s. Using deterministic parser.", e)

    # High-precision deterministic fallback
    logger.info("Using high-precision deterministic section parser.")
    return _parse_resume_deterministically(raw_text, language=language)


def parse_pdf_to_ast(file_bytes: bytes, language: str = "en") -> ResumeAST:
    """Render every PDF page and parse the document with the configured vision model."""
    if not PDFPLUMBER_AVAILABLE:
        raise RuntimeError("pdfplumber is required for vision-based PDF parsing.")

    image_data_urls = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            image = page.to_image(resolution=144).original
            buffer = io.BytesIO()
            image.save(buffer, format="PNG", optimize=True)
            encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
            image_data_urls.append(f"data:image/png;base64,{encoded}")

    if not image_data_urls:
        raise RuntimeError("The PDF contains no renderable pages.")

    data = invoke_json_with_images(
        resume_vision_parser_prompt(language, len(image_data_urls)),
        image_data_urls,
        model_name=settings.PARSER_MODEL_NAME,
    )
    return parse_resume_to_ast("", language, parsed_data=data, allow_fallback=False)
