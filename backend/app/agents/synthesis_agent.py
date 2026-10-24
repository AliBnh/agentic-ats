import logging
from typing import Dict, List, Tuple

from app.core.llm import invoke_text
from app.prompts import cover_letter_prompt
from app.schemas.state import ResumeAST

logger = logging.getLogger(__name__)


SECTION_LABELS = {
    "en": {
        "summary": "Professional Summary",
        "experience": "Professional Experience",
        "projects": "Key Projects",
        "skills": "Skills",
        "education": "Education",
        "certifications": "Certifications",
        "languages": "Languages",
        "leadership": "Leadership",
    },
    "fr": {
        "summary": "Profil professionnel",
        "experience": "Expérience professionnelle",
        "projects": "Projets clés",
        "skills": "Compétences",
        "education": "Formation",
        "certifications": "Certifications",
        "languages": "Langues",
        "leadership": "Leadership",
    },
}


def _labels(language: str) -> Dict[str, str]:
    return SECTION_LABELS.get(language, SECTION_LABELS["en"])


def _contact_line(resume_ast: ResumeAST) -> str:
    return " | ".join(
        value.strip()
        for value in (resume_ast.contact_info or {}).values()
        if isinstance(value, str) and value.strip()
    )


def _headline(resume_ast: ResumeAST, target_role: str) -> str:
    if target_role.strip():
        return target_role.strip()
    if resume_ast.professional_summary.strip():
        return resume_ast.professional_summary.splitlines()[0].strip()
    return ""


def _group_skills(skills: List[str]) -> List[str]:
    seen = set()
    result = []
    for skill in skills:
        value = skill.strip()
        key = value.casefold()
        if value and key not in seen:
            result.append(value)
            seen.add(key)
    return result


def _resume_markdown(resume_ast: ResumeAST, target_role: str, language: str) -> str:
    labels = _labels(language)
    lines = [f"# {resume_ast.full_name.strip()}"]
    headline = _headline(resume_ast, target_role)
    contact = _contact_line(resume_ast)
    if headline:
        lines.append(f"**{headline}**")
    if contact:
        lines.extend(["", contact])

    if resume_ast.professional_summary.strip():
        lines.extend(["", f"## {labels['summary']}", resume_ast.professional_summary.strip()])

    skills = _group_skills(resume_ast.skills)
    if skills:
        lines.extend(["", f"## {labels['skills']}", ", ".join(skills)])

    if resume_ast.work_experiences:
        lines.extend(["", f"## {labels['experience']}"])
        for experience in resume_ast.work_experiences:
            heading = " - ".join(part for part in (experience.role, experience.company) if part)
            lines.extend(["", f"### {heading}"])
            metadata = " | ".join(part for part in (experience.dates, experience.location) if part)
            if metadata:
                lines.append(f"*{metadata}*")
            lines.extend(f"- {(bullet.tailored or bullet.original).strip()}" for bullet in experience.bullets)

    if resume_ast.projects:
        lines.extend(["", f"## {labels['projects']}"])
        for project in resume_ast.projects:
            heading = " - ".join(part for part in (project.role, project.company) if part)
            lines.extend(["", f"### {heading}"])
            lines.extend(f"- {bullet.original.strip()}" for bullet in project.bullets)

    if resume_ast.education:
        lines.extend(["", f"## {labels['education']}"])
        lines.extend(
            f"- {item.degree}, {item.institution}" + (f" ({item.year})" if item.year else "")
            for item in resume_ast.education
        )

    if resume_ast.certifications:
        lines.extend(["", f"## {labels['certifications']}"])
        lines.extend(f"- {item.strip()}" for item in resume_ast.certifications if item.strip())

    if resume_ast.languages_spoken:
        lines.extend(["", f"## {labels['languages']}", ", ".join(_group_skills(resume_ast.languages_spoken))])

    if resume_ast.leadership:
        lines.extend(["", f"## {labels['leadership']}"])
        lines.extend(f"- {item.strip()}" for item in resume_ast.leadership if item.strip())

    return "\n".join(lines).strip() + "\n"


def _cover_letter_fallback(resume_ast: ResumeAST, target_role: str, language: str) -> str:
    if language == "fr":
        return (
            f"{resume_ast.full_name}\n\n"
            f"Objet : Candidature au poste de {target_role or 'ce poste'}\n\n"
            "Madame, Monsieur,\n\n"
            "Je vous adresse ma candidature et serais heureux de mettre mon expérience "
            "et mes compétences au service de votre équipe.\n\n"
            "Je reste à votre disposition pour échanger sur mon parcours et ma motivation.\n\n"
            "Cordialement,\n"
            f"{resume_ast.full_name}"
        )
    return (
        f"{resume_ast.full_name}\n\n"
        f"Subject: Application for {target_role or 'the position'}\n\n"
        "Dear Hiring Team,\n\n"
        "I am writing to express my interest in this opportunity. I would welcome "
        "the chance to discuss how my experience and skills could support your team.\n\n"
        "Thank you for your consideration.\n\n"
        "Sincerely,\n"
        f"{resume_ast.full_name}"
    )


def synthesize_final_deliverables(
    resume_ast: ResumeAST,
    job_description: str,
    target_role: str,
    language: str = "en",
) -> Tuple[str, str]:
    """Build the resume from facts and generate one grounded cover letter."""
    markdown_resume = _resume_markdown(resume_ast, target_role, language)
    experiences = [
        f"{item.role} at {item.company}: " + "; ".join(
            (bullet.tailored or bullet.original).strip() for bullet in item.bullets
        )
        for item in resume_ast.work_experiences
    ]
    projects = [
        f"{item.role} at {item.company}: " + "; ".join(bullet.original.strip() for bullet in item.bullets)
        for item in resume_ast.projects
    ]

    try:
        cover_letter = invoke_text(
            cover_letter_prompt(
                candidate_name=resume_ast.full_name,
                contact_line=_contact_line(resume_ast),
                education="; ".join(f"{item.degree} ({item.institution})" for item in resume_ast.education),
                target_role=target_role,
                company_name="the hiring team",
                skills=", ".join(_group_skills(resume_ast.skills)),
                achievements=experiences + projects,
                job_description=job_description,
                language=language,
            ),
            temperature=0.1,
        )
    except Exception:
        logger.exception("Cover letter generation failed; returning a factual fallback.")
        cover_letter = ""

    return markdown_resume, cover_letter or _cover_letter_fallback(resume_ast, target_role, language)
