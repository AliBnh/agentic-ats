import logging
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.schemas.state import AgenticATSState, ResumeAST
from app.agents.diagnostic_auditor import audit_resume_health
from app.agents.deterministic_scorer import calculate_hybrid_ats_score
from app.agents.gap_analyzer import analyze_skill_gaps
from app.agents.tailoring_agent import tailor_resume_bullets
from app.agents.synthesis_agent import synthesize_final_deliverables

logger = logging.getLogger(__name__)

# --- Graph Nodes ---

def node_diagnostic_audit(state: AgenticATSState) -> Dict[str, Any]:
    """Node 1: Evaluates standalone CV health, formatting, and cultural norms."""
    logger.info(f"Executing Node: Diagnostic Health Audit for thread {state.get('thread_id')}")
    ast_dict = state.get("resume_ast") or {}
    resume_ast = ResumeAST(**ast_dict) if isinstance(ast_dict, dict) and ast_dict else ResumeAST(full_name="Candidate", professional_summary="", language=state.get("language", "en"))
    
    audit_res = audit_resume_health(
        resume_ast=resume_ast,
        raw_text=state.get("raw_resume", ""),
        language=state.get("language", "en")
    )

    updates = {
        "health_score": audit_res["overall_health_score"],
        "ats_formatting_score": audit_res["ats_formatting_score"],
        "content_impact_score": audit_res["content_impact_score"],
        "language_norm_score": audit_res["language_norm_score"],
        "audit_issues": audit_res["issues"],
        "status": "AUDITED" if not state.get("job_description") else "MATCHING"
    }
    return updates


def node_evaluate_ats(state: AgenticATSState) -> Dict[str, Any]:
    """Node 2: Deterministic Hybrid ATS Evaluation (Keyword Overlap + Qdrant Cosine Similarity + STAR compliance)."""
    logger.info(f"Executing Node: Hybrid ATS Scoring (Iteration {state.get('iteration_count', 0)})")
    ast_dict = state.get("resume_ast") or {}
    resume_ast = ResumeAST(**ast_dict)

    bullets = []
    for exp in resume_ast.work_experiences:
        for b in exp.bullets:
            bullets.append(b.tailored if b.tailored else b.original)

    # Add verified skills to resume skills list if approved
    verified = state.get("verified_skills", {})
    for skill, val in verified.items():
        if val != "DECLINED" and skill not in resume_ast.skills:
            resume_ast.skills.append(skill)

    ats_res = calculate_hybrid_ats_score(
        resume_text=state.get("raw_resume", "") + " " + " ".join(resume_ast.skills),
        job_description=state.get("job_description", ""),
        resume_bullets=bullets,
        language=state.get("language", "en")
    )

    current_score = ats_res["overall_ats_score"]
    return {
        "ats_score": current_score,
        "score_history": [current_score],
        "required_skills": ats_res["required_skills"],
        "matched_skills": ats_res["matched_skills"],
        "missing_critical_skills": ats_res["missing_critical_skills"],
        "resume_ast": resume_ast.model_dump()
    }


def conditional_check_convergence(state: AgenticATSState) -> Literal["node_synthesis", "node_gap_analysis"]:
    """Conditional Edge: Checks if ATS score meets the 85% threshold or exceeded max retry budget."""
    score = state.get("ats_score", 0.0)
    iterations = state.get("iteration_count", 0)
    max_iter = state.get("max_iterations", 3)

    logger.info(f"Convergence Check: Score={score}%, Iteration={iterations}/{max_iter}")

    if score >= 85.0 or iterations >= max_iter:
        return "node_synthesis"
    return "node_gap_analysis"


def node_gap_analysis(state: AgenticATSState) -> Dict[str, Any]:
    """Node 3: Identifies missing skills and flags unverified competencies for HITL."""
    logger.info("Executing Node: Gap Analyzer & HITL Planner")
    gap_res = analyze_skill_gaps(
        missing_critical_skills=state.get("missing_critical_skills", []),
        verified_skills=state.get("verified_skills", {}),
        job_description=state.get("job_description", ""),
        original_resume_text=state.get("raw_resume", "")
    )

    if gap_res["hitl_pending"]:
        logger.info(f"HITL Triggered: Unverified skill '{gap_res['target_skill']}' requires human confirmation.")
        return {
            "hitl_pending": True,
            "hitl_question": gap_res["hitl_question"],
            "status": "AWAITING_HITL"
        }

    return {
        "hitl_pending": False,
        "hitl_question": None,
        "status": "TAILORING"
    }


def conditional_check_hitl(state: AgenticATSState) -> Literal["node_tailor_bullets", "__end__"]:
    """Conditional Edge: Pauses execution if human input is needed; otherwise proceeds to tailoring."""
    if state.get("hitl_pending"):
        return "__end__" # Halts execution until /resume endpoint is called with human verification
    return "node_tailor_bullets"


def node_tailor_bullets(state: AgenticATSState) -> Dict[str, Any]:
    """Node 4: Rewrites bullet points to improve STAR compliance & embed verified keywords."""
    logger.info("Executing Node: STAR Bullet Point Tailoring")
    ast_dict = state.get("resume_ast") or {}
    resume_ast = ResumeAST(**ast_dict)

    updated_ast, diff_records = tailor_resume_bullets(
        resume_ast=resume_ast,
        job_description=state.get("job_description", ""),
        target_role=state.get("target_role", ""),
        matched_skills=state.get("matched_skills", []),
        verified_skills=state.get("verified_skills", {}),
        language=state.get("language", "en")
    )

    iterations = state.get("iteration_count", 0) + 1
    return {
        "resume_ast": updated_ast.model_dump(),
        "diff": diff_records,
        "iteration_count": iterations,
        "status": "IN_PROGRESS"
    }


def node_synthesis(state: AgenticATSState) -> Dict[str, Any]:
    """Node 5: Assembles final ATS Markdown resume and generates tailored cover letter."""
    logger.info("Executing Node: Final Synthesis & Deliverables Assembly")
    ast_dict = state.get("resume_ast") or {}
    resume_ast = ResumeAST(**ast_dict)

    markdown_resume, cover_letter = synthesize_final_deliverables(
        resume_ast=resume_ast,
        job_description=state.get("job_description", ""),
        target_role=state.get("target_role", ""),
        language=state.get("language", "en")
    )

    final_status = "CONVERGED" if state.get("ats_score", 0.0) >= 85.0 else "OPTIMIZED_MAX_RETRIES"
    return {
        "tailored_markdown": markdown_resume,
        "cover_letter": cover_letter,
        "status": final_status
    }


# --- Graph Construction ---

def build_agentic_ats_graph(checkpointer=None):
    workflow = StateGraph(AgenticATSState)

    # Add Nodes
    workflow.add_node("node_diagnostic_audit", node_diagnostic_audit)
    workflow.add_node("node_evaluate_ats", node_evaluate_ats)
    workflow.add_node("node_gap_analysis", node_gap_analysis)
    workflow.add_node("node_tailor_bullets", node_tailor_bullets)
    workflow.add_node("node_synthesis", node_synthesis)

    # Add Edges
    workflow.add_edge(START, "node_diagnostic_audit")

    # Routing from Diagnostic Audit:
    # If job description is already present, proceed straight to ATS scoring;
    # If not, pause so the user can inspect the diagnostic report first.
    def route_after_diagnostic(state: AgenticATSState):
        if state.get("job_description"):
            return "node_evaluate_ats"
        return END

    workflow.add_conditional_edges(
        "node_diagnostic_audit",
        route_after_diagnostic,
        {"node_evaluate_ats": "node_evaluate_ats", END: END}
    )

    # From Evaluation -> check convergence (score >= 85% or max retries)
    workflow.add_conditional_edges(
        "node_evaluate_ats",
        conditional_check_convergence,
        {
            "node_synthesis": "node_synthesis",
            "node_gap_analysis": "node_gap_analysis"
        }
    )

    # From Gap Analysis -> check if human verification is required
    workflow.add_conditional_edges(
        "node_gap_analysis",
        conditional_check_hitl,
        {
            "node_tailor_bullets": "node_tailor_bullets",
            "__end__": END
        }
    )

    # From Tailoring -> Cycle back to Evaluation!
    workflow.add_edge("node_tailor_bullets", "node_evaluate_ats")

    # From Synthesis -> Complete
    workflow.add_edge("node_synthesis", END)

    memory_saver = checkpointer or MemorySaver()
    app_graph = workflow.compile(checkpointer=memory_saver)
    return app_graph

# Global compiled graph instance
global_checkpointer = MemorySaver()
ats_graph = build_agentic_ats_graph(checkpointer=global_checkpointer)
