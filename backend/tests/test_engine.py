import pytest
from app.utils.language_detector import detect_language
from app.agents.deterministic_scorer import calculate_hybrid_ats_score, extract_skills_from_text
from app.agents.diagnostic_auditor import audit_resume_health
from app.agents.gap_analyzer import analyze_skill_gaps
from app.agents.pdf_parser import parse_resume_to_ast
from app.schemas.state import ResumeAST
from app.core.graph import ats_graph
from app.utils.seed_data import SAMPLE_RESUMES, SAMPLE_JOB_DESCRIPTIONS

def test_language_detection_bilingual():
    fr_cv = next(r["raw_text"] for r in SAMPLE_RESUMES if r["language"] == "fr")
    en_cv = next(r["raw_text"] for r in SAMPLE_RESUMES if r["language"] == "en")

    fr_lang, fr_conf = detect_language(fr_cv)
    en_lang, en_conf = detect_language(en_cv)

    assert fr_lang == "fr", f"Expected 'fr' but got {fr_lang}"
    assert en_lang == "en", f"Expected 'en' but got {en_lang}"
    assert fr_conf >= 0.60
    assert en_conf >= 0.60

def test_deterministic_scoring_reproducibility():
    """Verify that scoring is mathematically deterministic and NOT a random LLM opinion."""
    en_cv = next(r["raw_text"] for r in SAMPLE_RESUMES if r["language"] == "en")
    en_jd = next(j["text"] for j in SAMPLE_JOB_DESCRIPTIONS if j["id"] == "bcg-x-swe-en")
    bullets = [
        "Architected and deployed microservices handling 25M+ daily requests with 99.98% uptime.",
        "Optimized PostgreSQL query execution plans, reducing p95 database response latency by 42%."
    ]

    score1 = calculate_hybrid_ats_score(en_cv, en_jd, bullets, language="en")
    score2 = calculate_hybrid_ats_score(en_cv, en_jd, bullets, language="en")

    assert score1["overall_ats_score"] == score2["overall_ats_score"]
    assert score1["exact_keyword_ratio"] == score2["exact_keyword_ratio"]
    assert score1["overall_ats_score"] > 30.0


def test_diagnostic_health_audit():
    """Verify standalone diagnostic audit correctly flags lack of metrics and US norms."""
    bad_cv_text = """John Doe
    john@example.com
    Single, Born in 1995.
    Responsible for working on code. Duties included writing scripts.
    """
    ast = parse_resume_to_ast(bad_cv_text, language="en")
    audit_res = audit_resume_health(ast, bad_cv_text, language="en")

    assert audit_res["overall_health_score"] < 80.0
    issues = audit_res["issues"]
    severities = [i["severity"] for i in issues]
    assert "CRITICAL" in severities or "WARNING" in severities

def test_hitl_gap_analyzer():
    """Verify that unverified critical skills trigger an explicit HITL question."""
    missing = ["Kubernetes", "Redis", "Kafka"]
    verified = {}
    jd = "Must have extensive Kubernetes production experience."
    resume_text = "I have Python and Django experience."

    gap_res = analyze_skill_gaps(missing, verified, jd, resume_text)
    assert gap_res["hitl_pending"] is True
    assert gap_res["target_skill"] == "Kubernetes"
    assert "Kubernetes" in gap_res["hitl_question"]["question"]

def test_full_graph_execution():
    """Verify full LangGraph state machine execution on real sample data."""
    en_cv = SAMPLE_RESUMES[0]["raw_text"]
    en_jd = SAMPLE_JOB_DESCRIPTIONS[0]["text"]
    ast = parse_resume_to_ast(en_cv, language="en")

    initial_state = {
        "thread_id": "test-thread-123",
        "user_id": "test-user",
        "raw_resume": en_cv,
        "language": "en",
        "resume_ast": ast.model_dump(),
        "health_score": 0.0,
        "ats_formatting_score": 0.0,
        "content_impact_score": 0.0,
        "language_norm_score": 0.0,
        "audit_issues": [],
        "job_description": en_jd,
        "target_role": "Senior Backend Engineer",
        "required_skills": [],
        "extracted_resume_skills": [],
        "matched_skills": [],
        "missing_critical_skills": [],
        "ats_score": 0.0,
        "score_history": [],
        "iteration_count": 0,
        "max_iterations": 2,
        "hitl_pending": False,
        "resume_after_hitl": False,
        "hitl_questions": [],
        "hitl_question": None,
        "verified_skills": {},
        "tailored_markdown": "",
        "cover_letter": "",
        "diff": [],
        "status": "INGESTION"
    }

    config = {"configurable": {"thread_id": "test-thread-123"}}
    state_after_run1 = ats_graph.invoke(initial_state, config=config)

    assert state_after_run1["ats_score"] > 30.0
    assert len(state_after_run1["score_history"]) >= 1

    # If halted at HITL Truth Gate, simulate human response and resume
    if state_after_run1.get("hitl_pending"):
        question = state_after_run1["hitl_question"]
        skill_to_verify = question["skill"]
        # Human verifies the skill
        state_after_run1["verified_skills"][skill_to_verify] = "APPROVED: 2 years hands-on experience"
        state_after_run1["hitl_pending"] = False
        state_after_run1["hitl_question"] = None
        # Resume graph
        final_state = ats_graph.invoke(state_after_run1, config=config)
    else:
        final_state = state_after_run1

    assert final_state["ats_score"] > 30.0
    assert "status" in final_state
