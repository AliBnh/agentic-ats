import json
import logging
import asyncio
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.thread import AuditThread
from app.models.resume import ResumeRecord, AuditReport, TailoredVersion
from app.core.security import get_current_user
from app.core.graph import ats_graph, global_checkpointer
from app.agents.pdf_parser import extract_text_from_pdf, parse_pdf_to_ast, parse_resume_to_ast
from app.utils.language_detector import detect_language
from app.utils.pdf_exporter import generate_ats_pdf
from app.schemas.audit import JobMatchRequest, HITLResumeRequest
from app.schemas.state import ResumeAST
from app.core.metrics import (
    ATS_AUDITS_TOTAL,
    ATS_MATCHES_TOTAL,
    HITL_INTERRUPTS_TOTAL,
    ATS_SCORE_HISTOGRAM
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/audit", tags=["Audit & Optimization"])

# In-memory thread active states dictionary for fast SSE & state bridging
ACTIVE_GRAPH_STATES: Dict[str, Dict[str, Any]] = {}


def _sse_event(payload: Dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, default=str)}\n\n"


@router.post("/match-job/stream")
async def stream_match_job(
    request: JobMatchRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream each LangGraph node update for a live frontend activity view."""
    thread_id = request.thread_id
    current_state = ACTIVE_GRAPH_STATES.get(thread_id)
    if not current_state:
        thread = db.query(AuditThread).filter(AuditThread.id == thread_id).first()
        resume_rec = (
            db.query(ResumeRecord)
            .filter(ResumeRecord.thread_id == thread_id)
            .order_by(ResumeRecord.created_at.desc())
            .first()
        )
        if not thread or not resume_rec:
            raise HTTPException(status_code=404, detail="Active audit thread not found.")
        current_state = {
            "thread_id": thread_id,
            "user_id": current_user.id if current_user else "demo-user",
            "raw_resume": resume_rec.raw_text,
            "language": resume_rec.language,
            "resume_ast": resume_rec.parsed_json or parse_resume_to_ast(resume_rec.raw_text, resume_rec.language).model_dump(),
            "health_score": 75.0,
            "ats_formatting_score": 80.0,
            "content_impact_score": 70.0,
            "language_norm_score": 80.0,
            "audit_issues": [],
            "job_description": "",
            "target_role": "",
            "required_skills": [],
            "matched_skills": [],
            "missing_critical_skills": [],
            "ats_score": 0.0,
            "score_history": [],
            "iteration_count": 0,
            "max_iterations": 3,
            "hitl_pending": False,
            "hitl_question": None,
            "verified_skills": {},
            "tailored_markdown": "",
            "cover_letter": "",
            "diff": [],
            "status": "AUDITED",
        }

    current_state["job_description"] = request.job_description
    current_state["target_role"] = request.target_role or "Target Role"
    current_state["status"] = "MATCHING"

    async def events():
        state = dict(current_state)
        try:
            config = {"configurable": {"thread_id": thread_id}}
            async for update in ats_graph.astream(state, config=config, stream_mode="updates"):
                node_name = next(iter(update), "graph")
                node_update = update.get(node_name, {})
                state.update(node_update)
                yield _sse_event({
                    "type": "node",
                    "node": node_name,
                    "status": state.get("status"),
                    "update": node_update,
                })
                await asyncio.sleep(0)

            ACTIVE_GRAPH_STATES[thread_id] = state
            if state.get("hitl_pending"):
                yield _sse_event({
                    "type": "hitl",
                    "result": {
                        "thread_id": thread_id,
                        "status": "AWAITING_HITL",
                        "hitl_pending": True,
                        "hitl_question": state.get("hitl_question"),
                        "current_score": state.get("ats_score"),
                        "matched_skills": state.get("matched_skills"),
                        "missing_skills": state.get("missing_critical_skills"),
                    },
                })
                return

            yield _sse_event({"type": "complete", "result": _save_and_return_tailored_result(state, db)})
        except Exception as exc:
            logger.exception("Streaming job match failed for thread %s", thread_id)
            yield _sse_event({"type": "error", "message": str(exc)})

    return StreamingResponse(events(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })

@router.post("/upload")
async def upload_resume(
    thread_id: Optional[str] = Form(None),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 1 (Ingestion): Uploads PDF or raw text, detects language and formatting anomalies.
    Returns parsed preview for Human-in-the-Loop Confirmation.
    """
    user_id = current_user.id if current_user else "demo-user"

    # Get or create thread
    if not thread_id:
        thread = AuditThread(user_id=user_id, title="New Resume Audit", status="INGESTION")
        db.add(thread)
        db.commit()
        db.refresh(thread)
        thread_id = thread.id
    else:
        thread = db.query(AuditThread).filter(AuditThread.id == thread_id).first()
        if not thread:
            thread = AuditThread(id=thread_id, user_id=user_id, title="New Resume Audit", status="INGESTION")
            db.add(thread)
            db.commit()

    extracted_text = ""
    metadata = {}
    filename = ""
    parsed_ast = None

    if file:
        filename = file.filename
        file_bytes = await file.read()
        extracted_text, metadata = extract_text_from_pdf(file_bytes)
    elif raw_text:
        extracted_text = raw_text.strip()
        first_line = extracted_text.splitlines()[0].strip() if extracted_text.splitlines() else "Resume"
        candidate_guess = first_line.split("|")[0].split(":")[0].strip()
        filename = f"{candidate_guess} - CV" if candidate_guess else "Candidate - CV"
        metadata = {
            "page_count": 1,
            "char_count": len(extracted_text),
            "anomalies": [],
            "confidence_score": 0.98,
            "has_email": "@" in extracted_text,
            "has_phone": True
        }
    else:
        raise HTTPException(status_code=400, detail="Please upload a PDF file or provide resume text.")

    # Detect language
    lang, conf = detect_language(extracted_text)
    if file:
        try:
            parsed_ast = parse_pdf_to_ast(file_bytes, language=lang)
        except Exception as exc:
            logger.exception("Vision PDF parsing failed for %s", filename)
            raise HTTPException(status_code=422, detail=f"Unable to parse the PDF with the configured vision model: {exc}") from exc
    thread.language = lang
    thread.title = filename or f"Resume Audit ({lang.upper()})"
    db.commit()

    ATS_AUDITS_TOTAL.labels(language=lang, status="uploaded").inc()

    return {
        "thread_id": thread_id,
        "filename": filename,
        "extracted_text": extracted_text,
        "detected_language": lang,
        "language_confidence": conf,
        "parsing_metadata": metadata,
        "parsed_ast": parsed_ast.model_dump() if parsed_ast else None,
    }


@router.post("/confirm-parsing")
def confirm_parsing(
    payload: Dict[str, Any],
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 2: User confirms parsed text.
    Executes LangGraph Node 1 (Diagnostic Health Audit) and stores report.
    """
    thread_id = payload.get("thread_id")
    verified_text = payload.get("verified_text", "")
    language = payload.get("language", "en")
    parsed_ast = payload.get("parsed_ast")

    if not thread_id or not verified_text:
        raise HTTPException(status_code=400, detail="thread_id and verified_text are required.")

    thread = db.query(AuditThread).filter(AuditThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found.")

    # Parse into structured Pydantic AST
    resume_ast = ResumeAST(**parsed_ast) if parsed_ast else parse_resume_to_ast(verified_text, language=language)

    # Initialize LangGraph state
    initial_state = {
        "thread_id": thread_id,
        "user_id": current_user.id if current_user else "demo-user",
        "raw_resume": verified_text,
        "language": language,
        "resume_ast": resume_ast.model_dump(),
        "health_score": 0.0,
        "ats_formatting_score": 0.0,
        "content_impact_score": 0.0,
        "language_norm_score": 0.0,
        "audit_issues": [],
        "job_description": "",
        "target_role": "",
        "required_skills": [],
        "matched_skills": [],
        "missing_critical_skills": [],
        "ats_score": 0.0,
        "score_history": [],
        "iteration_count": 0,
        "max_iterations": 3,
        "hitl_pending": False,
        "hitl_question": None,
        "verified_skills": {},
        "tailored_markdown": "",
        "cover_letter": "",
        "diff": [],
        "status": "INGESTION"
    }

    # Run Diagnostic Node through graph
    config = {
        "configurable": {"thread_id": thread_id},
        "run_name": f"Stage 1: Health Diagnostic ({language.upper()})",
        "tags": ["agentic-ats", "diagnostic-audit", language],
        "metadata": {"thread_id": thread_id, "language": language, "stage": "health_audit"}
    }
    result_state = ats_graph.invoke(initial_state, config=config)
    ACTIVE_GRAPH_STATES[thread_id] = result_state

    # Save to database
    thread.status = "AUDIT_COMPLETE"
    thread.language = language
    if resume_ast.full_name and resume_ast.full_name != "Candidate":
        thread.title = f"{resume_ast.full_name} - CV Audit"

    # Save resume record
    resume_rec = ResumeRecord(
        thread_id=thread_id,
        raw_text=verified_text,
        parsed_json=resume_ast.model_dump(),
        language=language,
        is_verified=True
    )
    db.add(resume_rec)

    # Save audit report
    audit_rep = AuditReport(
        thread_id=thread_id,
        overall_health_score=result_state.get("health_score", 70.0),
        ats_formatting_score=result_state.get("ats_formatting_score", 75.0),
        content_impact_score=result_state.get("content_impact_score", 70.0),
        language_norm_score=result_state.get("language_norm_score", 80.0),
        issues_json=result_state.get("audit_issues", [])
    )
    db.add(audit_rep)
    db.commit()

    ATS_AUDITS_TOTAL.labels(language=language, status="health_audited").inc()

    return {
        "thread_id": thread_id,
        "health_score": result_state.get("health_score"),
        "ats_formatting_score": result_state.get("ats_formatting_score"),
        "content_impact_score": result_state.get("content_impact_score"),
        "language_norm_score": result_state.get("language_norm_score"),
        "audit_issues": result_state.get("audit_issues"),
        "status": "AUDIT_COMPLETE"
    }


@router.post("/match-job")
def match_job(
    request: JobMatchRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 3 (Targeting & Remediation): Ingests target Job Description and initiates
    the LangGraph multi-agent convergence loop.
    """
    thread_id = request.thread_id
    current_state = ACTIVE_GRAPH_STATES.get(thread_id)

    if not current_state:
        # Reconstruct state from DB
        thread = db.query(AuditThread).filter(AuditThread.id == thread_id).first()
        resume_rec = db.query(ResumeRecord).filter(ResumeRecord.thread_id == thread_id).order_by(ResumeRecord.created_at.desc()).first()
        if not thread or not resume_rec:
            raise HTTPException(status_code=404, detail="Active audit thread not found.")
        
        current_state = {
            "thread_id": thread_id,
            "user_id": current_user.id if current_user else "demo-user",
            "raw_resume": resume_rec.raw_text,
            "language": resume_rec.language,
            "resume_ast": resume_rec.parsed_json or parse_resume_to_ast(resume_rec.raw_text, resume_rec.language).model_dump(),
            "health_score": 75.0,
            "ats_formatting_score": 80.0,
            "content_impact_score": 70.0,
            "language_norm_score": 80.0,
            "audit_issues": [],
            "job_description": "",
            "target_role": "",
            "required_skills": [],
            "matched_skills": [],
            "missing_critical_skills": [],
            "ats_score": 0.0,
            "score_history": [],
            "iteration_count": 0,
            "max_iterations": 3,
            "hitl_pending": False,
            "hitl_question": None,
            "verified_skills": {},
            "tailored_markdown": "",
            "cover_letter": "",
            "diff": [],
            "status": "AUDITED"
        }

    target_role_clean = request.target_role or "Target Role"
    current_state["job_description"] = request.job_description
    current_state["target_role"] = target_role_clean
    current_state["status"] = "MATCHING"

    config = {
        "configurable": {"thread_id": thread_id},
        "run_name": f"Stage 2: Target Optimization - {target_role_clean}",
        "tags": ["agentic-ats", "target-optimization", current_state.get("language", "en")],
        "metadata": {
            "thread_id": thread_id,
            "target_role": target_role_clean,
            "language": current_state.get("language", "en"),
            "stage": "target_optimization"
        }
    }
    result_state = ats_graph.invoke(current_state, config=config)
    ACTIVE_GRAPH_STATES[thread_id] = result_state

    # Check if halted for HITL
    if result_state.get("hitl_pending"):
        HITL_INTERRUPTS_TOTAL.labels(action="triggered").inc()
        thread = db.query(AuditThread).filter(AuditThread.id == thread_id).first()
        if thread:
            thread.status = "HITL_PENDING"
            db.commit()
        return {
            "thread_id": thread_id,
            "status": "AWAITING_HITL",
            "hitl_pending": True,
            "hitl_question": result_state.get("hitl_question"),
            "current_score": result_state.get("ats_score"),
            "matched_skills": result_state.get("matched_skills"),
            "missing_skills": result_state.get("missing_critical_skills")
        }

    # If converged without HITL
    return _save_and_return_tailored_result(result_state, db)


@router.post("/resume/{thread_id}")
def resume_hitl_execution(
    thread_id: str,
    payload: Dict[str, Any],
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 4 (HITL Resume): Receives user's verification for the unverified skill,
    updates state, and resumes LangGraph execution to complete tailoring.
    """
    current_state = ACTIVE_GRAPH_STATES.get(thread_id)
    if not current_state:
        raise HTTPException(status_code=404, detail="No suspended execution found for this thread.")

    skill = payload.get("skill", "")
    decision = payload.get("decision", "APPROVED") # APPROVED, DECLINED, TRANSFERABLE
    notes = payload.get("notes", "")

    # Update verified skills
    verified = current_state.get("verified_skills", {})
    verified[skill] = f"{decision}: {notes}" if notes else decision
    current_state["verified_skills"] = verified
    current_state["hitl_pending"] = False
    current_state["hitl_question"] = None

    HITL_INTERRUPTS_TOTAL.labels(action="resolved").inc()

    # Resume graph execution
    config = {
        "configurable": {"thread_id": thread_id},
        "run_name": f"Stage 3: HITL Resumed - {skill}",
        "tags": ["agentic-ats", "hitl-resumed", current_state.get("language", "en")],
        "metadata": {
            "thread_id": thread_id,
            "verified_skill": skill,
            "decision": decision,
            "stage": "hitl_resumed"
        }
    }
    result_state = ats_graph.invoke(current_state, config=config)
    ACTIVE_GRAPH_STATES[thread_id] = result_state

    # Check if another HITL question is pending
    if result_state.get("hitl_pending"):
        thread = db.query(AuditThread).filter(AuditThread.id == thread_id).first()
        if thread:
            thread.status = "HITL_PENDING"
            db.commit()
        return {
            "thread_id": thread_id,
            "status": "AWAITING_HITL",
            "hitl_pending": True,
            "hitl_question": result_state.get("hitl_question"),
            "current_score": result_state.get("ats_score"),
            "matched_skills": result_state.get("matched_skills"),
            "missing_skills": result_state.get("missing_critical_skills")
        }

    return _save_and_return_tailored_result(result_state, db)


def _save_and_return_tailored_result(state: Dict[str, Any], db: Session) -> Dict[str, Any]:
    thread_id = state.get("thread_id")
    thread = db.query(AuditThread).filter(AuditThread.id == thread_id).first()
    if thread:
        thread.status = "COMPLETED"
        ast = state.get("resume_ast") or {}
        cand_name = ast.get("full_name") if isinstance(ast, dict) else None
        target_role = state.get("target_role")
        if cand_name and cand_name != "Candidate":
            thread.title = f"{cand_name} - {target_role or 'Optimized'}"
        elif target_role:
            thread.title = f"{thread.title.split(' - ')[0]} - {target_role}"


    score_hist = state.get("score_history", [state.get("ats_score", 85.0)])
    initial_score = score_hist[0] if score_hist else 50.0
    final_score = state.get("ats_score", 85.0)

    tailored_rec = TailoredVersion(
        thread_id=thread_id,
        job_description=state.get("job_description", ""),
        target_role=state.get("target_role", ""),
        initial_ats_score=initial_score,
        final_ats_score=final_score,
        score_history=score_hist,
        tailored_markdown=state.get("tailored_markdown", ""),
        cover_letter=state.get("cover_letter", ""),
        diff_json=state.get("diff", [])
    )
    db.add(tailored_rec)
    db.commit()

    ATS_MATCHES_TOTAL.labels(status="completed").inc()
    ATS_SCORE_HISTOGRAM.observe(final_score)

    return {
        "thread_id": thread_id,
        "status": state.get("status", "CONVERGED"),
        "initial_score": initial_score,
        "final_score": final_score,
        "score_history": score_hist,
        "iterations_used": state.get("iteration_count", 1),
        "required_skills": state.get("required_skills", []),
        "matched_skills": state.get("matched_skills", []),
        "missing_critical_skills": state.get("missing_critical_skills", []),
        "tailored_markdown": state.get("tailored_markdown", ""),
        "cover_letter": state.get("cover_letter", ""),
        "diff": state.get("diff", [])
    }


@router.get("/result/{thread_id}")
def get_audit_result(
    thread_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches complete audit and tailored results for a thread."""
    thread = db.query(AuditThread).filter(AuditThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    report = db.query(AuditReport).filter(AuditReport.thread_id == thread_id).order_by(AuditReport.created_at.desc()).first()
    tailored = db.query(TailoredVersion).filter(TailoredVersion.thread_id == thread_id).order_by(TailoredVersion.created_at.desc()).first()

    return {
        "thread_id": thread_id,
        "title": thread.title,
        "language": thread.language,
        "status": thread.status,
        "diagnostic_report": {
            "overall_health_score": report.overall_health_score,
            "ats_formatting_score": report.ats_formatting_score,
            "content_impact_score": report.content_impact_score,
            "language_norm_score": report.language_norm_score,
            "issues": report.issues_json
        } if report else None,
        "tailored_result": {
            "initial_score": tailored.initial_ats_score,
            "final_score": tailored.final_ats_score,
            "score_history": tailored.score_history,
            "tailored_markdown": tailored.tailored_markdown,
            "cover_letter": tailored.cover_letter,
            "diff": tailored.diff_json
        } if tailored else None
    }


@router.post("/export/pdf")
def export_pdf(payload: Dict[str, str]):
    """Exports ATS-compliant PDF with single-column clean layout."""
    markdown_content = payload.get("markdown_content", "")
    if not markdown_content:
        raise HTTPException(status_code=400, detail="markdown_content is required.")

    pdf_bytes = generate_ats_pdf(markdown_content)
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=optimized_resume.pdf"}
    )
