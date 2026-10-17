import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class AuditThread(Base):
    __tablename__ = "audit_threads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False, default="Untitled Audit")
    language = Column(String(10), default="en") # 'en' or 'fr'
    status = Column(String(50), default="INGESTION") # INGESTION, AUDIT_COMPLETE, MATCHING, HITL_PENDING, COMPLETED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="threads")
    resumes = relationship("ResumeRecord", back_populates="thread", cascade="all, delete-orphan")
    reports = relationship("AuditReport", back_populates="thread", cascade="all, delete-orphan")
    tailored_versions = relationship("TailoredVersion", back_populates="thread", cascade="all, delete-orphan")
