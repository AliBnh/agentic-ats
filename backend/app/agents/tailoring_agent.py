import logging
from typing import Any, Dict, List, Tuple

from pydantic import BaseModel, Field

from app.core.llm import invoke_json
from app.prompts import tailoring_prompt
from app.schemas.state import ResumeAST

logger = logging.getLogger(__name__)


class TailoredBullet(BaseModel):
    id: str
    tailored: str = Field(min_length=1)


class TailoringResult(BaseModel):
    bullets: List[TailoredBullet] = Field(default_factory=list)


def _bullet_inputs(resume_ast: ResumeAST) -> List[Dict[str, str]]:
    return [
        {"id": bullet.id, "company": experience.company, "role": experience.role, "original": bullet.original}
        for experience in resume_ast.work_experiences
        for bullet in experience.bullets
    ]


def _approved_skills(matched_skills: List[str], verified_skills: Dict[str, str]) -> List[str]:
    return sorted({
        skill
        for skill in [*matched_skills, *verified_skills.keys()]
        if verified_skills.get(skill) != "DECLINED"
    })


def tailor_resume_bullets(
    resume_ast: ResumeAST,
    job_description: str,
    target_role: str,
    matched_skills: List[str],
    verified_skills: Dict[str, str],
    language: str = "en",
) -> Tuple[ResumeAST, List[Dict[str, Any]]]:
    """Tailor existing bullets once, without inventing facts or metrics."""
    bullets = _bullet_inputs(resume_ast)
    if not bullets:
        return resume_ast, []

    tailored_by_id: Dict[str, str] = {}
    try:
        response = invoke_json(
            tailoring_prompt(
                bullets=bullets,
                target_role=target_role,
                approved_skills=_approved_skills(matched_skills, verified_skills),
                language=language,
                job_description=job_description,
            ),
            run_name="Resume Bullet Tailoring",
        )
        result = TailoringResult.model_validate(response)
        tailored_by_id = {
            item.id: item.tailored.strip()
            for item in result.bullets
            if item.id and item.tailored.strip()
        }
    except Exception:
        logger.exception("Bullet tailoring failed; preserving original resume bullets.")

    diff_records: List[Dict[str, Any]] = []
    for experience in resume_ast.work_experiences:
        for bullet in experience.bullets:
            replacement = tailored_by_id.get(bullet.id, bullet.original).strip()
            bullet.tailored = replacement
            if replacement != bullet.original.strip():
                diff_records.append({
                    "bullet_id": bullet.id,
                    "company": experience.company,
                    "role": experience.role,
                    "original": bullet.original.strip(),
                    "tailored": replacement,
                    "is_changed": True,
                })

    return resume_ast, diff_records
