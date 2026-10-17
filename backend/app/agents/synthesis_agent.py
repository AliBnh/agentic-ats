import re
import logging
from typing import Dict, Any, Tuple
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
    for known in ["Wavestone", "BCG X", "Deloitte", "Visa", "Ostorlab", "Capgemini", "Google", "Amazon", "Microsoft"]:
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

    # Remove phrases like 'chez Wavestone' or 'at BCG'
    cleaned = re.sub(r'\s+(?:chez|at|auprès de)\s+[A-Za-z0-9_\s&]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(?:stagiaire|intern)\s+(?:chez|at)\s+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(?:poste\s+de\s+|position\s+of\s+|r[oô]le\s+de\s+)', '', cleaned, flags=re.IGNORECASE).strip()

    if not cleaned or len(cleaned) < 3:
        if summary and len(summary) < 60 and not "." in summary:
            return summary.strip()
        return "Ingénieur Logiciel & IA" if language == "fr" else "Software Engineer & AI Specialist"

    return cleaned


def synthesize_final_deliverables(
    resume_ast: ResumeAST,
    job_description: str,
    target_role: str,
    language: str = "en"
) -> Tuple[str, str]:
    """
    Assembles final polished ATS Markdown resume adhering to Harvard/McKinsey ATS best practices,
    and generates an executive-level, bespoke cover letter with candidate's actual achievements.
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
    
    # Summary Section
    md += f"## {summary_header}\n"
    summary_text = resume_ast.professional_summary or (
        "Ingénieur rigoureux et axé sur les résultats, doté d'une solide expertise technique et d'une passion pour la conception de solutions logicielles et IA performantes."
        if language == "fr" else
        "Dynamic, results-driven professional with proven expertise in architecting high-impact solutions, delivering scalable projects, and driving continuous improvement."
    )
    md += f"{summary_text}\n\n"
    
    # Skills Section
    all_skills = sorted(list(set(resume_ast.skills)))
    if all_skills:
        md += f"## {skills_header}\n"
        md += f"**Technical & Domain:** {', '.join(all_skills[:24])}\n\n"

    # Work Experience Section
    md += f"## {exp_header}\n\n"
    for exp in resume_ast.work_experiences:
        loc = f" | {exp.location}" if exp.location else ""
        md += f"### {exp.role} - **{exp.company}**\n"
        md += f"*{exp.dates}{loc}*\n\n"
        for b in exp.bullets:
            text = b.tailored if b.tailored else b.original
            md += f"- {text}\n"
        md += "\n"

    # Projects Section (if available)
    if resume_ast.projects:
        md += f"## {proj_header}\n\n"
        for prj in resume_ast.projects:
            md += f"### {prj.company} - **{prj.role}**\n\n"
            for b in prj.bullets:
                md += f"- {b.original}\n"
            md += "\n"

    # Education Section
    if resume_ast.education:
        md += f"## {edu_header}\n\n"
        for edu in resume_ast.education:
            yr = f" ({edu.year})" if edu.year else ""
            md += f"- **{edu.degree}**, {edu.institution}{yr}\n"
        md += "\n"

    # Certifications Section
    if resume_ast.certifications:
        md += f"## {cert_header}\n\n"
        for cert in resume_ast.certifications:
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
            for lead in resume_ast.leadership:
                md += f"- **{label}:** {lead}\n"
        md += "\n"

    # 2. Generate Executive Cover Letter with Real Candidate Facts
    cover_letter = ""
    company_name = _extract_company_name(job_description, target_role)
    
    # Prepare factual highlights from the parsed candidate AST
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
