import re
import json
import logging
from typing import Dict, List, Any, Tuple
from app.schemas.state import ResumeAST, WorkExperienceItem, BulletPoint
from app.config import settings

logger = logging.getLogger(__name__)

try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


def tailor_resume_bullets(
    resume_ast: ResumeAST,
    job_description: str,
    target_role: str,
    matched_skills: List[str],
    verified_skills: Dict[str, str],
    language: str = "en"
) -> Tuple[ResumeAST, List[Dict[str, Any]]]:
    """
    Rewrites bullet points to align with JD while preserving fact-locked dates, titles, and companies.
    Uses Groq Llama 3.3 70B for synthesis.
    """
    diff_records = []

    # Gather bullets to optimize
    bullets_to_optimize = []
    for exp in resume_ast.work_experiences:
        for b in exp.bullets:
            bullets_to_optimize.append({
                "id": b.id,
                "company": exp.company,
                "role": exp.role,
                "original": b.original
            })

    if not bullets_to_optimize:
        return resume_ast, []

    # Only include skills explicitly verified or approved
    approved_skills = list(set(matched_skills + [k for k, v in verified_skills.items() if v != "DECLINED"]))

    tailored_map = {}

    if GROQ_AVAILABLE and settings.GROQ_API_KEY:
        try:
            llm = ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.GROQ_PRIMARY_MODEL,
                temperature=0.2
            )

            lang_instruction = "in professional French" if language == "fr" else "in professional English"

            prompt = f"""You are an elite Executive Career Strategist and ATS Specialist.
Your task is to refine and strengthen the candidate's experience bullet points to strongly align with the target role and job description.

Target Role: {target_role or 'Senior Specialist'}
Target Skills to prioritize: {', '.join(approved_skills[:12])}
Language: Write {lang_instruction}.

NON-NEGOTIABLE CONSTRAINTS:
1. Do NOT invent fake employers or change dates.
2. Structure every rewritten bullet with the STAR method (Strong Action Verb + Context + Quantifiable Metric/Result).
3. If an original bullet lacks numbers, quantify reasonably based on scope (e.g. 'reduced latency by 35%', 'scaled to 50k+ requests/day').
4. Return a strict JSON array of objects with 'id' and 'tailored'.

Bullets to Rewrite:
{json.dumps(bullets_to_optimize[:8], indent=2)}

Return ONLY a valid JSON array:"""

            response = llm.invoke(prompt)
            content = response.content.strip()
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n?", "", content)
                content = re.sub(r"\n?```$", "", content)

            data = json.loads(content)
            for item in data:
                if isinstance(item, dict) and "id" in item and "tailored" in item:
                    tailored_map[item["id"]] = item["tailored"]

        except Exception as e:
            logger.warning(f"Groq tailoring call failed: {e}. Using deterministic STAR rewriter fallback.")

    # Apply tailored bullets or fallback enhancements
    for exp in resume_ast.work_experiences:
        for b in exp.bullets:
            if b.id in tailored_map:
                new_text = tailored_map[b.id]
            else:
                # Deterministic fallback enhancement
                orig = b.original
                if not re.search(r'\d+', orig):
                    verb = "Orchestré" if language == "fr" else "Spearheaded"
                    new_text = f"{verb} {orig[0].lower() + orig[1:] if len(orig) > 1 else orig}, improving operational efficiency by 25%."
                else:
                    new_text = orig

            b.tailored = new_text
            diff_records.append({
                "bullet_id": b.id,
                "company": exp.company,
                "role": exp.role,
                "original": b.original,
                "tailored": new_text,
                "is_changed": b.original.strip() != new_text.strip()
            })

    return resume_ast, diff_records
