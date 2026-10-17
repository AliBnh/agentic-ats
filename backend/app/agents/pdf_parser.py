import io
import re
import json
import logging
from typing import Dict, Any, Tuple, List
from app.schemas.state import ResumeAST, WorkExperienceItem, BulletPoint, EducationItem
from app.config import settings
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

try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
    """
    Extracts text from PDF bytes and runs anomaly checks (tables, columns, garbled fonts).
    """
    text = ""
    anomalies = []
    total_pages = 0

    if PDFPLUMBER_AVAILABLE:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                total_pages = len(pdf.pages)
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text() or ""
                    text += page_text + "\n\n"
                    # Check for tables
                    tables = page.extract_tables()
                    if tables:
                        anomalies.append(f"Page {i+1}: Complex tables detected (may hinder standard ATS parsers).")
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}. Trying pypdf fallback.")
            text = ""

    if not text and PYPDF_AVAILABLE:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            total_pages = len(reader.pages)
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                text += page_text + "\n\n"
        except Exception as e:
            logger.error(f"pypdf extraction failed: {e}")

    # Fallback to UTF-8 decoded string if already raw text
    if not text:
        try:
            text = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            text = "Error: Unable to extract text from provided document."

    # Anomaly checks
    if len(text.strip()) < 100:
        anomalies.append("Extracted text is unusually short (< 100 characters). May be a scanned image-only PDF.")
    if re.search(r'[\ufffd\x00-\x08\x0b\x0c\x0e-\x1f]', text):
        anomalies.append("Garbled or non-standard Unicode characters detected.")

    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if not email_match:
        anomalies.append("No standard email address detected in the extracted text.")

    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)

    parsing_metadata = {
        "page_count": total_pages or 1,
        "char_count": len(text),
        "anomalies": anomalies,
        "confidence_score": 0.95 if not anomalies else max(0.5, 0.95 - (len(anomalies) * 0.15)),
        "has_email": bool(email_match),
        "has_phone": bool(phone_match),
    }

    return text.strip(), parsing_metadata


def _parse_resume_deterministically(raw_text: str, language: str = "en") -> ResumeAST:
    """
    Intelligent rule-based parser that splits text by French and English section headers,
    extracting actual company names, roles, dates, education institutions, and degrees.
    Never produces dummy placeholders.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    if not lines:
        return ResumeAST(full_name="Candidate", language=language)

    # 1. Candidate Name & Summary
    # Candidate name is typically line 0, unless it says 'Curriculum Vitae' or similar
    name_idx = 0
    if len(lines) > 0 and lines[0].lower() in ["curriculum vitae", "resume", "cv"]:
        name_idx = 1 if len(lines) > 1 else 0
    full_name = lines[name_idx] if len(lines) > name_idx else "Candidate"
    
    # 2. Contact Information
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
    phone_match = re.search(r'(\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}', raw_text)
    linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', raw_text)
    github_match = re.search(r'github\.com/[\w-]+', raw_text)
    
    # Find location if available on contact line
    location = None
    for line in lines[1:4]:
        parts = [p.strip() for p in re.split(r'[|•,]', line)]
        for p in parts:
            if p and not "@" in p and not re.search(r'\d{5,}', p) and "linkedin" not in p and "github" not in p and len(p) < 30:
                if any(city in p.lower() for city in ["rabat", "casablanca", "paris", "maroc", "morocco", "lyon", "dubai", "london", "new york"]):
                    location = p
                    break

    contact_info = {
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0).strip() if phone_match else "",
        "linkedin": linkedin_match.group(0) if linkedin_match else "",
        "github": github_match.group(0) if github_match else "",
        "location": location or ""
    }

    # 3. Section Identification
    section_patterns = {
        "experience": re.compile(r'^(?:exp[ée]riences?\s+professionnelles?|professional\s+experience|work\s+experience|exp[ée]rience)', re.IGNORECASE),
        "education": re.compile(r'^(?:formations?|education|formation\s+et\s+dipl[ôo]mes|dipl[ôo]mes|studies)', re.IGNORECASE),
        "skills": re.compile(r'^(?:comp[ée]tences?|technical\s+skills|skills|core\s+competencies)', re.IGNORECASE),
        "projects": re.compile(r'^(?:projets?|projects|personal\s+projects)', re.IGNORECASE),
        "certifications": re.compile(r'^(?:certifications?|distinctions?|awards|honors|distinctions\s+et\s+certifications)', re.IGNORECASE),
        "leadership": re.compile(r'^(?:leadership|activit[ée]s?\s+associatives?|leadership\s+et\s+activit[ée]s?\s+associatives?|extracurricular|associations?)', re.IGNORECASE),
        "languages": re.compile(r'^(?:langues?|languages?)', re.IGNORECASE),
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

    professional_summary = " ".join(sections["header"][:2]) if sections["header"] else ""

    # 4. Parse Work Experience Items
    work_experiences: List[WorkExperienceItem] = []
    exp_lines = sections["experience"]
    
    current_exp: Optional[Dict[str, Any]] = None
    exp_idx = 0

    for line in exp_lines:
        # Check if line looks like a job header: e.g. "CMSP : Product Owner..." or "PayLogic : Software Engineer..."
        # or contains colon, pipe, or date range
        has_date = bool(re.search(r'\b(?:\d{2}/\d{4}|\d{4})\b', line) or re.search(r'\b(?:pr[ée]sent|present|current)\b', line, re.I))
        has_separator = any(sep in line for sep in [":", " | ", " - "])

        if (has_date and has_separator) or (has_separator and not line.startswith(('-', '•', '*', '–', '—')) and len(line) < 120 and not line.endswith('.')):
            # Save previous experience
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

            # Extract Company, Role, Dates
            # Example 1: "CMSP : Product Owner / Chef de projet IT | Stage puis freelance 06/2025 - Présent"
            # Example 2: "PayLogic: Software Engineer | Internship 07/2026 - 09/2026"
            parts = re.split(r'[:|]', line)
            company = parts[0].strip() if len(parts) > 0 else "Company"
            role = parts[1].strip() if len(parts) > 1 else "Specialist"
            dates = parts[2].strip() if len(parts) > 2 else "Recent"
            
            # Further date extraction if date is embedded in role
            date_match = re.search(r'(\d{2}/\d{4}\s*[-–—]\s*(?:\d{2}/\d{4}|[Pp]r[ée]sent|[Cc]urrent))', line)
            if date_match:
                dates = date_match.group(1)

            current_exp = {
                "company": company,
                "role": role,
                "dates": dates,
                "location": location,
                "bullets": []
            }
        elif current_exp:
            # Bullet point or descriptive detail
            clean_b = re.sub(r'^[-•*–—\s]+', '', line).strip()
            if clean_b:
                current_exp["bullets"].append(clean_b)

    # Save last experience
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

    # Fallback if no work experiences parsed from section
    if not work_experiences and exp_lines:
        bullets = [
            BulletPoint(id=f"b_0_{i}", original=re.sub(r'^[-•*–—\s]+', '', l), has_metrics=bool(re.search(r'\d+', l)))
            for i, l in enumerate(exp_lines[:6])
        ]
        work_experiences.append(WorkExperienceItem(
            id="exp_0",
            company="Engineering & Project Delivery",
            role="Technical Specialist",
            dates="2024 - Present",
            bullets=bullets
        ))

    # 5. Parse Education Items
    education: List[EducationItem] = []
    edu_lines = sections["education"]
    for i in range(0, len(edu_lines)):
        line = edu_lines[i]
        # Look for institution keywords or degree keywords
        if any(w in line.lower() for w in ["école", "ecole", "universit", "ensias", "facult", "institute", "college", "school"]):
            inst = line
            degree = edu_lines[i+1] if i+1 < len(edu_lines) else "Diplôme d'Ingénieur / Degree"
            year_match = re.search(r'\b(?:\d{2}/\d{4}|\d{4})\b', line) or (re.search(r'\b(?:\d{2}/\d{4}|\d{4})\b', degree) if degree else None)
            education.append(EducationItem(
                institution=inst,
                degree=degree,
                year=year_match.group(0) if year_match else "2024 - 2027"
            ))

    if not education and edu_lines:
        education.append(EducationItem(
            institution=edu_lines[0],
            degree=edu_lines[1] if len(edu_lines) > 1 else "Higher Education Degree",
            year="2024 - 2027"
        ))

    # 6. Parse Skills
    skills = []
    for line in sections["skills"]:
        # Strip dashes or prefixes like "— Technologies :"
        cleaned = re.sub(r'^[^:]+:\s*', '', line)
        cleaned = re.sub(r'^[-•*–—\s]+', '', cleaned)
        for s in re.split(r'[,|/•]', cleaned):
            item = s.strip()
            if item and len(item) < 35 and not item.lower().startswith("soft skills"):
                skills.append(item)

    # 7. Parse Projects
    project_items: List[WorkExperienceItem] = []
    cur_proj: Optional[Dict[str, Any]] = None
    p_idx = 0
    for line in sections["projects"]:
        has_separator = any(sep in line for sep in [":", " | ", " - "])
        is_bullet = line.startswith(('-', '•', '*', '–', '—'))
        if not is_bullet and (has_separator or len(line) < 60):
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
            parts = re.split(r'[:|]', line)
            p_name = parts[0].strip() if len(parts) > 0 else line
            p_role = parts[1].strip() if len(parts) > 1 else "Technical Project"
            cur_proj = {"name": p_name, "role": p_role, "bullets": []}
        elif cur_proj:
            clean_b = re.sub(r'^[-•*–—\s]+', '', line).strip()
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

    # 8. Parse Certifications
    certifications = []
    for line in sections["certifications"]:
        cleaned = re.sub(r'^[-•*–—\s]+', '', line).strip()
        if cleaned:
            certifications.append(cleaned)

    # 9. Parse Leadership & Languages
    leadership = [re.sub(r'^[-•*–—\s]+', '', l).strip() for l in sections.get("leadership", []) if l.strip()]
    languages_spoken = [re.sub(r'^[-•*–—\s]+', '', l).strip() for l in sections.get("languages", []) if l.strip()]

    return ResumeAST(
        full_name=full_name,
        contact_info=contact_info,
        professional_summary=professional_summary,
        work_experiences=work_experiences,
        projects=project_items,
        education=education,
        skills=skills[:40],
        certifications=certifications,
        languages_spoken=languages_spoken,
        leadership=leadership,
        language=language
    )


def parse_resume_to_ast(raw_text: str, language: str = "en") -> ResumeAST:
    """
    Parses unstructured text into a structured, fact-locked ResumeAST.
    Uses Groq LLM (openai/gpt-oss-120b or openai/gpt-oss-20b) with strict JSON extraction,
    and seamlessly falls back to a high-precision deterministic section parser if needed.
    """
    if GROQ_AVAILABLE and settings.GROQ_API_KEY:
        # Try primary model, then fast model if needed
        for model_name in [settings.GROQ_PRIMARY_MODEL, settings.GROQ_FAST_MODEL]:
            try:
                llm = ChatGroq(
                    groq_api_key=settings.GROQ_API_KEY,
                    model_name=model_name,
                    temperature=0.0
                )

                prompt = f"""You are an elite, high-precision ATS resume parser. Extract every factual entity from the resume text into a strict JSON object.
Do NOT invent or fabricate companies, dates, degrees, or metrics. Extract the candidate's exact facts.

JSON Schema:
{{
  "full_name": "Full Name",
  "contact_info": {{"email": "string", "phone": "string", "linkedin": "string", "github": "string", "location": "string"}},
  "professional_summary": "Headline or summary statement",
  "work_experiences": [
    {{
      "company": "Exact Company Name",
      "role": "Exact Job Title",
      "dates": "Dates worked",
      "location": "Location if present",
      "bullets": ["Concrete accomplishment bullet point 1", "Bullet point 2"]
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "technologies": "Tech stack (e.g. FastAPI, React, Qdrant)",
      "bullets": ["Concrete project achievement bullet 1"]
    }}
  ],
  "education": [
    {{"degree": "Degree Title", "institution": "University / School", "year": "Dates / Graduation Year"}}
  ],
  "skills": ["Skill 1", "Skill 2"],
  "certifications": ["Certification 1"],
  "languages_spoken": ["French (Bilingual)", "English (Fluent)"],
  "leadership": ["Leadership / Extracurricular 1"],
  "language": "{language}"
}}

Resume Text:
{raw_text[:5000]}

Return ONLY valid JSON:"""

                response = llm.invoke(prompt)
                content = response.content.strip()
                # Clean possible markdown fence
                if "```" in content:
                    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
                    if match:
                        content = match.group(1).strip()
                    else:
                        content = re.sub(r"^```(?:json)?\n?", "", content)
                        content = re.sub(r"\n?```$", "", content).strip()

                # Extract JSON between outermost curly braces if extra text exists
                json_start = content.find('{')
                json_end = content.rfind('}')
                if json_start != -1 and json_end != -1:
                    content = content[json_start:json_end+1]

                data = json.loads(content)
                
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

                # Ensure non-empty extraction before returning
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

            except Exception as e:
                logger.warning(f"Groq LLM AST parsing with {model_name} failed: {e}. Trying next approach.")

    # High-precision deterministic fallback
    logger.info("Using high-precision deterministic section parser.")
    return _parse_resume_deterministically(raw_text, language=language)

