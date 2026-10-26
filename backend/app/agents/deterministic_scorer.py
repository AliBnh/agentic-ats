import re
import logging
from functools import lru_cache
from typing import Dict, List, Any, Tuple
from pydantic import BaseModel, Field
from app.core.qdrant_client import vector_store
from app.core.llm import invoke_json

logger = logging.getLogger(__name__)

class ExtractedSkills(BaseModel):
    skills: List[str] = Field(default_factory=list)


def _skill_extraction_prompt(text: str) -> str:
    return f"""Extract the professional skills and competencies explicitly present
in the text below. Include technical skills, tools, methodologies, business
domains, analytical capabilities, and languages when they are presented as
candidate qualifications or job requirements.

Do not include:
- company, department, product, school, or organization names
- job titles, locations, benefits, responsibilities, or generic nouns
- skills inferred only from context

Normalize equivalent spellings to one concise name (for example, Kubernetes
instead of K8s when both refer to the same skill). Preserve meaningful
distinctions such as Python and Python programming only once. Return only JSON:
{{"skills": ["skill name"]}}

Text:
{text[:18000]}
"""


ACTION_VERBS = {
    # English
    "spearheaded", "engineered", "architected", "developed", "orchestrated",
    "optimized", "automated", "scaled", "delivered", "transformed", "designed",
    "implemented", "mentored", "reduced", "increased", "accelerated", "built",
    # French
    "conçu", "développé", "optimisé", "automatisé", "orchestré", "dirigé",
    "implémenté", "réduit", "augmenté", "accéléré", "piloté", "supervisé"
}

@lru_cache(maxsize=256)
def extract_skills_from_text(text: str) -> List[str]:
    """Extract skills with the model and cache results for stable scoring."""
    if not text.strip():
        return []

    try:
        result = invoke_json(
            _skill_extraction_prompt(text),
            temperature=0.0,
            run_name="Skill Extraction",
        )
        extracted = ExtractedSkills.model_validate(result)
        return sorted({
            skill.strip()
            for skill in extracted.skills
            if skill.strip() and len(skill.strip()) <= 80
        })
    except Exception:
        logger.exception("Model skill extraction failed.")
        return []


def evaluate_star_compliance(bullets: List[str]) -> Tuple[float, int, int]:
    """
    Evaluates how many bullets comply with STAR methodology (action verb + quantifiable metric).
    Returns (ratio, total_with_metrics, total_with_action_verbs).
    """
    if not bullets:
        return 0.0, 0, 0

    metric_count = 0
    verb_count = 0

    for b in bullets:
        lower_b = b.lower()
        # Metric check: numbers, %, $, savings, latency, users
        if re.search(r'(\d+[\d,.]*|\d+%\s*|\$\d+|\b\d+\b)', b):
            metric_count += 1
        # Action verb check: check first 3 words
        words = lower_b.split()[:4]
        if any(w.strip(",.") in ACTION_VERBS for w in words):
            verb_count += 1

    metric_ratio = metric_count / len(bullets)
    verb_ratio = verb_count / len(bullets)
    compliance_score = (0.6 * metric_ratio) + (0.4 * verb_ratio)
    return round(compliance_score, 4), metric_count, verb_count


def calculate_hybrid_ats_score(
    resume_text: str,
    job_description: str,
    resume_bullets: List[str],
    language: str = "en",
    required_skills: List[str] | None = None,
    resume_skills: List[str] | None = None,
) -> Dict[str, Any]:
    """
    Deterministic Hybrid ATS Evaluation Tool:
    1. Exact Keyword Overlap (40%)
    2. Qdrant Dense Vector Semantic Similarity (40%)
    3. STAR & Metric Impact Compliance (20%)
    """
    # 1. Skill Extraction
    jd_skills = required_skills if required_skills is not None else extract_skills_from_text(job_description)
    extracted_resume_skills = resume_skills if resume_skills is not None else extract_skills_from_text(resume_text)

    matched_skills = [s for s in jd_skills if s.lower() in [rs.lower() for rs in extracted_resume_skills]]
    missing_skills = [s for s in jd_skills if s.lower() not in [rs.lower() for rs in extracted_resume_skills]]

    keyword_ratio = len(matched_skills) / max(1, len(jd_skills))

    # 2. Semantic Similarity via Qdrant / Dense Vectors
    jd_sentences = [s.strip() for s in re.split(r'[.\n;]', job_description) if len(s.strip()) > 25]
    if not jd_sentences:
        jd_sentences = [job_description[:200]]

    clean_bullets = [b for b in resume_bullets if len(b.strip()) > 10]
    if not clean_bullets:
        clean_bullets = [resume_text[:200]]

    semantic_sim = vector_store.compute_mean_semantic_similarity(jd_sentences[:8], clean_bullets[:12])

    # 3. STAR Compliance
    star_ratio, metrics_count, verbs_count = evaluate_star_compliance(clean_bullets)

    # 4. Hybrid Mathematical Score
    # Score = (0.40 * Keyword) + (0.40 * Semantic) + (0.20 * STAR)
    raw_score = (0.40 * keyword_ratio) + (0.40 * semantic_sim) + (0.20 * star_ratio)
    final_score = round(min(98.0, max(25.0, raw_score * 100.0)), 1)

    return {
        "overall_ats_score": final_score,
        "exact_keyword_ratio": round(keyword_ratio * 100.0, 1),
        "semantic_similarity_ratio": round(semantic_sim * 100.0, 1),
        "star_compliance_ratio": round(star_ratio * 100.0, 1),
        "required_skills": jd_skills,
        "resume_skills": extracted_resume_skills,
        "matched_skills": matched_skills,
        "missing_critical_skills": missing_skills,
        "metrics_detected_count": metrics_count,
        "action_verbs_count": verbs_count,
        "total_bullets_analyzed": len(clean_bullets)
    }
