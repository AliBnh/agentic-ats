import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class ResumeRecord(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String(36), ForeignKey("audit_threads.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    parsed_json = Column(JSON, nullable=True)
    language = Column(String(10), default="en")
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    thread = relationship("AuditThread", back_populates="resumes")

class AuditReport(Base):
    __tablename__ = "audit_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String(36), ForeignKey("audit_threads.id", ondelete="CASCADE"), nullable=False)
    overall_health_score = Column(Float, nullable=False)
    ats_formatting_score = Column(Float, nullable=False)
    content_impact_score = Column(Float, nullable=False)
    language_norm_score = Column(Float, nullable=False)
    issues_json = Column(JSON, nullable=False) # list of { category, severity, title, description, recommendation }
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    thread = relationship("AuditThread", back_populates="reports")

class TailoredVersion(Base):
    __tablename__ = "tailored_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String(36), ForeignKey("audit_threads.id", ondelete="CASCADE"), nullable=False)
    job_description = Column(Text, nullable=False)
    target_role = Column(String(255), nullable=True)
    initial_ats_score = Column(Float, nullable=False)
    final_ats_score = Column(Float, nullable=False)
    score_history = Column(JSON, nullable=False)
    tailored_markdown = Column(Text, nullable=False)
    cover_letter = Column(Text, nullable=True)
    diff_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    thread = relationship("AuditThread", back_populates="tailored_versions")
