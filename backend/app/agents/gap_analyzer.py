import re
from typing import Dict, List, Any

from pydantic import BaseModel, Field

from app.core.llm import invoke_json
from app.prompts import skill_verification_questions_prompt


class SkillVerificationQuestion(BaseModel):
    skill: str
    question: str = Field(min_length=1)


class SkillVerificationQuestions(BaseModel):
    questions: List[SkillVerificationQuestion] = Field(default_factory=list)


def _resume_mentions_skill(resume_text: str, skill: str) -> bool:
    """Match a skill as a complete phrase, not as a substring of another word."""
    normalized_text = re.sub(r"\s+", " ", resume_text).strip().lower()
    normalized_skill = re.sub(r"\s+", " ", skill).strip().lower()
    if not normalized_skill:
        return False
    return bool(
        re.search(
            rf"(?<!\w){re.escape(normalized_skill)}(?!\w)",
            normalized_text,
            flags=re.IGNORECASE,
        )
    )


def analyze_skill_gaps(
    missing_critical_skills: List[str],
    verified_skills: Dict[str, str],
    job_description: str,
    original_resume_text: str,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Analyzes missing skills and determines if a Human-in-the-Loop breakpoint is required.
    Prevents AI hallucination: if a critical skill is completely missing and unverified,
    the agent must stop and ask the human.
    """
    verified_skill_names = {skill.lower() for skill in verified_skills}

    unverified_critical_skills = [
        skill for skill in missing_critical_skills
        if skill.lower() not in verified_skill_names
        and not _resume_mentions_skill(original_resume_text, skill)
    ]

    if unverified_critical_skills:
        context_snippet = "\n".join(
            line.strip()
            for line in job_description.splitlines()
            if any(skill.lower() in line.lower() for skill in unverified_critical_skills)
        )[:4000]
        response = invoke_json(
            skill_verification_questions_prompt(
                skills=unverified_critical_skills,
                context=context_snippet or job_description,
                original_resume_text=original_resume_text,
                language=language,
            ),
            temperature=0.2,
            run_name="Skill Verification Questions",
        )
        generated_questions = SkillVerificationQuestions.model_validate(response).questions
        questions_by_skill = {item.skill.lower(): item.question.strip() for item in generated_questions}
        missing_questions = [
            skill for skill in unverified_critical_skills
            if not questions_by_skill.get(skill.lower())
        ]
        if missing_questions:
            raise ValueError(
                f"Skill verification model did not generate questions for: {', '.join(missing_questions)}"
            )
        hitl_questions = [
            {
                "skill": skill,
                "question": questions_by_skill[skill.lower()],
                "context": next(
                    (
                        line.strip()[:150]
                        for line in job_description.splitlines()
                        if skill.lower() in line.lower()
                    ),
                    f"The job posting lists '{skill}' as a core qualification.",
                ),
                "options": [
                    {"label": f"Yes, I have experience with {skill}", "value": "APPROVED"},
                    {"label": f"No, I do not have experience with {skill}", "value": "DECLINED"},
                    {"label": "I have equivalent / transferable knowledge", "value": "TRANSFERABLE"},
                ],
            }
            for skill in unverified_critical_skills
        ]
        return {
            "hitl_pending": True,
            "hitl_questions": hitl_questions,
            "hitl_question": hitl_questions[0],
            "target_skill": unverified_critical_skills[0],
        }

    return {
        "hitl_pending": False,
        "hitl_questions": [],
        "hitl_question": None,
        "target_skill": None
    }
