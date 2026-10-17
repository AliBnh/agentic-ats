from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.thread import AuditThread
from app.core.security import get_current_user
from app.utils.seed_data import SAMPLE_RESUMES, SAMPLE_JOB_DESCRIPTIONS

router = APIRouter(prefix="/api/threads", tags=["Threads & Sessions"])

@router.get("")
def list_threads(current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id if current_user else "demo-user"
    threads = db.query(AuditThread).filter(AuditThread.user_id == user_id).order_by(AuditThread.updated_at.desc()).all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "language": t.language,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        }
        for t in threads
    ]

@router.post("")
def create_thread(title: Optional[str] = "New Resume Audit", language: Optional[str] = "en", current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id if current_user else "demo-user"
    thread = AuditThread(
        user_id=user_id,
        title=title,
        language=language,
        status="INGESTION"
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return {"id": thread.id, "title": thread.title, "status": thread.status, "language": thread.language}

@router.delete("/{thread_id}")
def delete_thread(thread_id: str, current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.id if current_user else "demo-user"
    thread = db.query(AuditThread).filter(AuditThread.id == thread_id, AuditThread.user_id == user_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    db.delete(thread)
    db.commit()
    return {"status": "DELETED", "id": thread_id}

@router.get("/samples/catalog")
def get_sample_catalog():
    """Returns catalog of 10 pre-seeded bilingual resumes and JDs for 1-click testing."""
    return {
        "sample_resumes": SAMPLE_RESUMES,
        "sample_jds": SAMPLE_JOB_DESCRIPTIONS
    }
