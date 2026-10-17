import re
import logging
from typing import Dict, Any, Tuple, List
from app.schemas.state import ResumeAST
from app.config import settings

logger = logging.getLogger(__name__)

try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


def _extract_company_name(job_description: str, target_role: str) -> str:
    """Extracts target company name from title or job description text."""
    if " - " in target_role:
        parts = target_role.split(" - ")
        if len(parts) >= 2:
            return parts[0].strip()
    
    first_lines = " ".join(job_description.splitlines()[:10])
    for known in ["Wavestone", "BCG X", "Deloitte", "Visa", "Ostorlab", "Capgemini", "Sofrecom", "VISEO", "ChainGPT", "Google", "Amazon", "Microsoft"]:
        if known.lower() in first_lines.lower() or known.lower() in target_role.lower():
            return known
            
    match = re.search(r'(?:chez|at|rejoignez|join|entreprise|company)\s+([A-Z][A-Za-z0-9_\s&]{2,25})', first_lines)
    if match:
        return match.group(1).strip()
    return "l'équipe de recrutement"


def _clean_professional_headline(target_role: str, summary: str, language: str = "en") -> str:
    """
    Extracts a clean, professional career title for the resume header.
    Strictly eliminates prospective company names (e.g. 'Wavestone Casablanca', 'BCG X Delivery', 'Deloitte Afrique').
    """
    cleaned = target_role or ""
    # Strip prospective company prefix if separated by dash or colon
    if " - " in cleaned:
        parts = [p.strip() for p in cleaned.split(" - ")]
        cleaned = parts[-1]
    elif ":" in cleaned:
        cleaned = cleaned.split(":")[-1].strip()

    # Remove known company names explicitly
    for comp in ["Wavestone", "BCG X", "Deloitte", "Visa", "Ostorlab", "Capgemini", "Sofrecom", "VISEO", "ChainGPT", "Casablanca", "Afrique", "Delivery"]:
        cleaned = re.sub(rf'\b{comp}\b', '', cleaned, flags=re.IGNORECASE)

    # Remove phrases like 'chez Wavestone' or 'at BCG'
    cleaned = re.sub(r'\s+(?:chez|at|auprès de)\s+[A-Za-z0-9_\s&]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(?:stagiaire|intern)\s+(?:chez|at)\s+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(?:poste\s+de\s+|position\s+of\s+|r[oô]le\s+de\s+)', '', cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r'^[\s\-–—:|]+|[\s\-–—:|]+$', '', cleaned).strip()

    if not cleaned or len(cleaned) < 3:
        if summary and len(summary) < 60 and "." not in summary and "|" in summary:
            return summary.strip()
        return "Ingénieur Logiciel & IA" if language == "fr" else "Software Engineer & AI Specialist"

    return cleaned


def _build_real_professional_summary(resume_ast: ResumeAST, target_role: str, language: str = "en") -> str:
    """
    Generates a genuine, impactful 2-3 sentence executive professional summary.
    Never returns a trivial 1-line title like 'Software Engineer | Full Stack & GenAI'.
    """
    existing = (resume_ast.professional_summary or "").strip()
    # If existing is already a rich multi-sentence paragraph (>80 chars with punctuation)
    if len(existing) > 80 and ("." in existing or "\n" in existing) and not existing.startswith(("Software Engineer |", "Consultant |")):
        return existing

    role_lower = (target_role or "").lower()
    is_consulting = any(k in role_lower for k in ["consultant", "conseil", "amoa", "transformation", "stratégie", "strategy", "analytics", "alma"])

    if language == "fr":
        if is_consulting:
            return (
                "Futur ingénieur d'État de l'ENSIAS alliant rigueur en génie logiciel et vision stratégique des systèmes d'information. "
                "Expérience concrète en assistance à maîtrise d'ouvrage (AMOA), cadrage des processus métiers et pilotage de projets SI transverses. "
                "Dédié à accompagner les organisations dans la modernisation technologique et la gouvernance de leurs systèmes d'information."
            )
        else:
            return (
                "Élève-ingénieur d'État à l'ENSIAS spécialisé en Génie Logiciel et Intelligence Artificielle. "
                "Solide expertise dans la conception d'architectures Full Stack (Java/Spring Boot, Python/FastAPI, React) et l'intégration de pipelines IA/RAG résilients en environnement conteneurisé. "
                "Passionné par l'optimisation des performances applicatives et l'automatisation des flux métiers à fort impact."
            )
    else:
        if is_consulting:
            return (
                "High-achieving Engineering graduate combining technical rigor in software systems with strategic digital consulting capabilities. "
                "Proven experience in functional scoping (AMOA), enterprise stakeholder alignment, and data-driven decision support systems. "
                "Dedicated to driving large-scale digital transformation and technological value."
            )
        else:
            return (
                "Results-driven Software Engineer and ENSIAS Engineering graduate specializing in Full Stack architectures and GenAI solutions. "
                "Demonstrated track record in designing production ERPs, high-throughput APIs (FastAPI, Spring Boot), and low-latency RAG systems deployed via Docker and CI/CD pipelines. "
                "Passionate about translating complex business requirements into robust, high-performance software."
            )


def _categorize_skills(skills: List[str], language: str = "en") -> Dict[str, List[str]]:
    """
    Groups technical and professional competencies into conventional industry clusters.
    """
    categories_en = [
        ("Languages & Core", ["python", "java", "sql", "mariadb", "typescript", "javascript", "c++", "c#", "c", "bash", "go", "rust", "r", "php", "scala", "oop", "poo"]),
        ("Frameworks & Full Stack", ["fastapi", "spring boot", "springboot", "spring", "spring jpa", "spring cloud", "react", "angular", "vue", "node.js", "nodejs", "next.js", "tailwind css", "tailwind", "rest apis", "rest api", "rest", "html", "css", "django", "flask", "full stack", "fullstack", "micro-services", "microservices"]),
        ("AI, ML & Data", ["llms", "llm", "rag", "ai agents", "agents ia", "langchain", "langgraph", "qdrant", "vector db", "vectordb", "vector databases", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "data science", "machine learning", "deep learning", "prompt engineering", "nlp", "data analysis", "ia", "big data", "tableau", "power bi"]),
        ("Cloud, DevOps & Tools", ["docker", "kubernetes", "k8s", "ci/cd", "github actions", "gitlab ci/cd", "gitlab", "jenkins", "git", "aws", "azure", "gcp", "postgresql", "postgres", "mysql", "mongodb", "redis", "kafka", "linux", "prometheus", "grafana", "camunda", "cloud"]),
        ("Methodologies & Soft Skills", ["agile", "scrum", "jira", "amoa", "product ownership", "cadrage si", "leadership", "communication", "problem solving", "problem-solving", "résolution de problèmes", "teamwork", "travail d’équipe", "travail en équipe", "autonomie", "autonomie progressive", "rigueur", "esprit d’analyse", "analytical skills", "sens du service"])
    ]

    categories_fr = [
        ("Langages & Programmation", ["python", "java", "sql", "mariadb", "typescript", "javascript", "c++", "c#", "c", "bash", "go", "rust", "r", "php", "scala", "oop", "poo"]),
        ("Frameworks & Full Stack", ["fastapi", "spring boot", "springboot", "spring", "spring jpa", "spring cloud", "react", "angular", "vue", "node.js", "nodejs", "next.js", "tailwind css", "tailwind", "rest apis", "rest api", "rest", "html", "css", "django", "flask", "full stack", "fullstack", "micro-services", "microservices"]),
        ("IA, Data & Recherche", ["llms", "llm", "rag", "ai agents", "agents ia", "langchain", "langgraph", "qdrant", "vector db", "vectordb", "vector databases", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "data science", "machine learning", "deep learning", "prompt engineering", "nlp", "data analysis", "ia", "big data", "tableau", "power bi"]),
        ("Cloud, DevOps & Outils", ["docker", "kubernetes", "k8s", "ci/cd", "github actions", "gitlab ci/cd", "gitlab", "jenkins", "git", "aws", "azure", "gcp", "postgresql", "postgres", "mysql", "mongodb", "redis", "kafka", "linux", "prometheus", "grafana", "camunda", "cloud"]),
        ("Méthodologies & Soft Skills", ["agile", "scrum", "jira", "amoa", "product ownership", "cadrage si", "leadership", "communication", "problem solving", "problem-solving", "résolution de problèmes", "teamwork", "travail d’équipe", "travail en équipe", "autonomie", "autonomie progressive", "rigueur", "esprit d’analyse", "analytical skills", "sens du service"])
    ]

    cats = categories_fr if language == "fr" else categories_en
    grouped: Dict[str, List[str]] = {c[0]: [] for c in cats}
    other: List[str] = []

    seen = set()
    spoken_language_keywords = ["français", "francais", "anglais", "arabe", "arabic", "french", "english", "courant", "fluent", "native", "langues", "languages"]
    
    for s in skills:
        s_clean = s.strip().rstrip(".,;")
        s_lower = s_clean.lower()
        if not s_clean or s_lower in seen:
            continue
        
        # Omit spoken languages from technical competencies (they have their own section)
        if any(w in s_lower for w in spoken_language_keywords):
            continue
            
        # Normalize common abbreviations
        if s_lower in ["ci", "cd"]:
            s_clean = "CI/CD"
            s_lower = "ci/cd"

        if s_lower in seen:
            continue
        seen.add(s_lower)
        
        matched = False
        for cat_name, keywords in cats:
            if any(k == s_lower or (len(k) > 3 and k in s_lower) for k in keywords):
                grouped[cat_name].append(s_clean)
                matched = True
                break
        if not matched:
            other.append(s_clean)

    if other:
        label = "Technologies Spécialisées" if language == "fr" else "Specialized Competencies"
        grouped[label] = other[:6]

    return {k: v for k, v in grouped.items() if v}


def synthesize_final_deliverables(
    resume_ast: ResumeAST,
    job_description: str,
    target_role: str,
    language: str = "en"
) -> Tuple[str, str]:
    """
    Assembles final polished ATS Markdown resume adhering to Harvard/McKinsey ATS best practices:
    - Guaranteed 1-page fit with proportional hierarchy
    - Conventional categorized skill groups
    - Real, substantive executive professional summary
    - Clean headline without prospective company names
    - Single-column ATS structure
    """
    # 1. Build ATS Markdown Resume
    contact = resume_ast.contact_info or {}
    contact_parts = []
    if contact.get("location"):
        contact_parts.append(contact["location"])
    if contact.get("phone"):
        contact_parts.append(contact["phone"])
    if contact.get("email"):
        contact_parts.append(contact["email"])
    if contact.get("linkedin"):
        contact_parts.append(contact["linkedin"])
    if contact.get("github"):
        contact_parts.append(contact["github"])

    contact_line = " | ".join(contact_parts) if contact_parts else "Email: candidate@domain.com"

    summary_header = "Profil Professionnel" if language == "fr" else "Professional Summary"
    exp_header = "Expérience Professionnelle" if language == "fr" else "Professional Experience"
    proj_header = "Projets Clés & Réalisations" if language == "fr" else "Key Technical Projects"
    skills_header = "Compétences Techniques & Clés" if language == "fr" else "Core Competencies & Technical Skills"
    edu_header = "Formation & Diplômes" if language == "fr" else "Education & Credentials"
    cert_header = "Distinctions & Certifications" if language == "fr" else "Certifications & Honors"
    lead_header = "Langues & Leadership" if language == "fr" else "Languages & Leadership"

    headline = _clean_professional_headline(target_role, resume_ast.professional_summary, language=language)

    md = f"# {resume_ast.full_name}\n"
    md += f"**{headline}**\n\n"
    md += f"{contact_line}\n\n"
    md += f"---\n\n"
    
    # Real Professional Summary Section
    summary_text = _build_real_professional_summary(resume_ast, target_role, language=language)
    md += f"## {summary_header}\n"
    md += f"{summary_text}\n\n"
    
    # Categorized Skills Section
    raw_skills = resume_ast.skills or []
    grouped_skills = _categorize_skills(raw_skills, language=language)
    if grouped_skills:
        md += f"## {skills_header}\n"
        for group_name, group_items in grouped_skills.items():
            md += f"- **{group_name}:** {', '.join(group_items)}\n"
        md += "\n"

    # Work Experience Section (Max 2-3 high-impact bullets per role)
    md += f"## {exp_header}\n\n"
    for exp in resume_ast.work_experiences[:3]:
        loc = f" | {exp.location}" if exp.location else ""
        md += f"### {exp.role} - **{exp.company}**\n"
        md += f"*{exp.dates}{loc}*\n\n"
        for b in exp.bullets[:2]:
            text = b.tailored if b.tailored else b.original
            md += f"- {text}\n"
        md += "\n"

    # Projects Section (if available, compact 1-2 items)
    if resume_ast.projects:
        md += f"## {proj_header}\n\n"
        for prj in resume_ast.projects[:2]:
            md += f"### {prj.company} - **{prj.role}**\n\n"
            for b in prj.bullets[:1]:
                md += f"- {b.original}\n"
            md += "\n"

    # Education Section
    if resume_ast.education:
        md += f"## {edu_header}\n\n"
        for edu in resume_ast.education[:2]:
            yr = f" ({edu.year})" if edu.year else ""
            md += f"- **{edu.degree}**, {edu.institution}{yr}\n"
        md += "\n"

    # Certifications Section
    if resume_ast.certifications:
        md += f"## {cert_header}\n\n"
        for cert in resume_ast.certifications[:2]:
            md += f"- {cert}\n"
        md += "\n"

    # Languages & Leadership Section
    if resume_ast.languages_spoken or resume_ast.leadership:
        md += f"## {lead_header}\n\n"
        if resume_ast.languages_spoken:
            label = "Langues" if language == "fr" else "Languages"
            md += f"- **{label}:** {', '.join(resume_ast.languages_spoken)}\n"
        if resume_ast.leadership:
            label = "Leadership & Activités" if language == "fr" else "Leadership & Activities"
            for lead in resume_ast.leadership[:1]:
                md += f"- **{label}:** {lead}\n"
        md += "\n"

    # 2. Generate Executive Cover Letter with Real Candidate Facts
    cover_letter = ""
    company_name = _extract_company_name(job_description, target_role)
    
    achievements = []
    for exp in resume_ast.work_experiences[:3]:
        exp_bullets = [b.tailored or b.original for b in exp.bullets[:2]]
        achievements.append(f"{exp.company} ({exp.role}): " + " ; ".join(exp_bullets))
    
    for prj in resume_ast.projects[:2]:
        p_bullets = [b.original for b in prj.bullets[:1]]
        achievements.append(f"Projet {prj.company}: " + " ; ".join(p_bullets))

    edu_summary = " ; ".join([f"{e.degree} ({e.institution})" for e in resume_ast.education[:2]])
    skills_summary = ", ".join(resume_ast.skills[:12])

    if GROQ_AVAILABLE and settings.GROQ_API_KEY:
        try:
            llm = ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.GROQ_PRIMARY_MODEL,
                temperature=0.25
            )
            lang_instruction = "in impeccable professional French" if language == "fr" else "in executive, compelling English"

            prompt = f"""You are an elite Executive Career Coach specializing in high-conversion cover letters for top-tier consulting firms and global tech leaders.
Write a bespoke, highly convincing 4-paragraph cover letter {lang_instruction} tailored precisely to this candidate and job.

Candidate Facts:
- Full Name: {resume_ast.full_name}
- Contact: {contact_line}
- Education: {edu_summary}
- Target Role: {target_role}
- Target Company: {company_name}
- Core Stack & Skills: {skills_summary}
- Proven Accomplishments:
{chr(10).join(['  * ' + a for a in achievements])}

Target Job Excerpt:
{job_description[:1200]}

MANDATORY COVER LETTER STRUCTURE:
1. Header: Candidate coordinates, Target Company ({company_name}), and Date.
2. Subject Line: "Objet : Candidature au poste de {target_role}" (French) or "Subject: Application for {target_role} - {resume_ast.full_name}" (English).
3. Salutation: "Madame, Monsieur," or "Dear Hiring Team,".
4. Paragraph 1 (The Hook): State enthusiastic motivation for {company_name}'s specific mission and introduce candidate's current status and degree.
5. Paragraph 2 (Proven Evidence & Quantified Impact): Directly highlight 2 concrete achievements from past internships/projects with exact numbers (%, latency, volume) proving technical and operational excellence.
6. Paragraph 3 (Strategic Fit): Explain how candidate's unique blend of technical expertise ({skills_summary}) and problem-solving mindset directly addresses the challenges outlined in the job description.
7. Paragraph 4 (Call to Action & Professional Closing): Confident request for an interview followed by formal, polite French or English closing.

DO NOT use generic clichés. Ground every paragraph in the candidate's real experiences and the company's real requirements.
Return ONLY the complete letter text:"""

            response = llm.invoke(prompt)
            cover_letter = response.content.strip()
        except Exception as e:
            logger.warning(f"Groq cover letter generation failed: {e}")

    if not cover_letter:
        salutation = "Madame, Monsieur," if language == "fr" else "Dear Hiring Team,"
        closing = (
            "Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées."
            if language == "fr" else
            "Thank you for your time and consideration. I welcome the opportunity to discuss my application in an interview."
        )
        body = (
            f"Je vous adresse ma candidature avec un vif intérêt pour le poste de {target_role} au sein de {company_name}.\n\n"
            f"Actuellement diplômé / étudiant en ingénierie ({edu_summary}), j'ai développé des compétences éprouvées en conception logicielle et IA appliquée. "
            f"Lors de mes expériences précédentes, j'ai notamment contribué à des projets majeurs générant des gains d'efficacité mesurables et une haute fiabilité en production.\n\n"
            f"Votre recherche de talents correspond parfaitement à mon parcours et à ma volonté de relever des défis techniques stimulants au service de vos clients et utilisateurs."
            if language == "fr" else
            f"I am writing to express my strong enthusiasm for the {target_role} position at {company_name}.\n\n"
            f"With a strong educational foundation ({edu_summary}) and hands-on experience in full-stack architecture, microservices, and AI pipelines, "
            f"I have consistently delivered scalable solutions with measurable business impact.\n\n"
            f"I am eager to bring my technical rigor, proactive problem-solving, and commitment to excellence to your engineering initiatives."
        )
        subject = f"Objet : Candidature au poste de {target_role}" if language == "fr" else f"Subject: Application for {target_role} - {resume_ast.full_name}"
        cover_letter = f"{resume_ast.full_name}\n{contact_line}\n\n{company_name}\n\n---\n\n{subject}\n\n{salutation}\n\n{body}\n\n{closing}\n\n{resume_ast.full_name}"

    return md.strip(), cover_letter.strip()
