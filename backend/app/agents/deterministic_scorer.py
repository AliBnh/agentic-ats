import re
from typing import Dict, List, Any, Tuple
from app.core.qdrant_client import vector_store

# Common tech/business skill dictionary for high-precision token matching
COMMON_SKILL_CATALOG = {
    "python", "javascript", "typescript", "react", "fastapi", "django", "flask",
    "postgresql", "postgres", "sql", "nosql", "mongodb", "redis", "docker",
    "kubernetes", "k8s", "aws", "azure", "gcp", "git", "ci/cd", "linux",
    "rest", "graphql", "microservices", "machine learning", "deep learning",
    "nlp", "llm", "langchain", "langgraph", "pytorch", "tensorflow", "pandas",
    "numpy", "scikit-learn", "data science", "agile", "scrum", "devops",
    # French counterparts
    "gestion de projet", "méthode agile", "bases de données", "sécurité",
    "conception logicielle", "architecture logicielle", "analyse de données"
}

ACTION_VERBS = {
    # English
    "spearheaded", "engineered", "architected", "developed", "orchestrated",
    "optimized", "automated", "scaled", "delivered", "transformed", "designed",
    "implemented", "mentored", "reduced", "increased", "accelerated", "built",
    # French
    "conçu", "développé", "optimisé", "automatisé", "orchestré", "dirigé",
    "implémenté", "réduit", "augmenté", "accéléré", "piloté", "supervisé"
}

def extract_skills_from_text(text: str) -> List[str]:
    """Extracts recognized technical and domain competencies from text."""
    lower_text = text.lower()
    found_skills = set()
    for skill in COMMON_SKILL_CATALOG:
        # Check boundary match
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, lower_text):
            found_skills.add(skill.capitalize() if len(skill) > 3 else skill.upper())

    # Also extract capitalized acronyms (like AWS, API, SRE, ETL)
    acronyms = re.findall(r'\b[A-Z]{2,5}\b', text)
    for acr in acronyms:
        if acr not in {"AND", "THE", "FOR", "WITH", "THAT", "THIS"}:
            found_skills.add(acr)

    return sorted(list(found_skills))


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
    language: str = "en"
) -> Dict[str, Any]:
    """
    Deterministic Hybrid ATS Evaluation Tool:
    1. Exact Keyword Overlap (40%)
    2. Qdrant Dense Vector Semantic Similarity (40%)
    3. STAR & Metric Impact Compliance (20%)
    """
    # 1. Skill Extraction
    jd_skills = extract_skills_from_text(job_description)
    resume_skills = extract_skills_from_text(resume_text)

    if not jd_skills:
        jd_skills = ["Software Engineering", "Python", "API", "Databases", "Problem Solving"]

    matched_skills = [s for s in jd_skills if s.lower() in [rs.lower() for rs in resume_skills]]
    missing_skills = [s for s in jd_skills if s.lower() not in [rs.lower() for rs in resume_skills]]

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
        "matched_skills": matched_skills,
        "missing_critical_skills": missing_skills,
        "metrics_detected_count": metrics_count,
        "action_verbs_count": verbs_count,
        "total_bullets_analyzed": len(clean_bullets)
    }
