from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AuditIssue(BaseModel):
    category: str # "ATS_FORMATTING", "CONTENT_IMPACT", "LANGUAGE_NORMS", "STRUCTURE"
    severity: str # "CRITICAL", "WARNING", "SUGGESTION"
    title: str
    description: str
    recommendation: str

class DiagnosticReportResponse(BaseModel):
    thread_id: str
    overall_health_score: float
    ats_formatting_score: float
    content_impact_score: float
    language_norm_score: float
    detected_language: str
    issues: List[AuditIssue]

class JobMatchRequest(BaseModel):
    thread_id: str
    job_description: str
    target_role: Optional[str] = None

class HITLResumeRequest(BaseModel):
    thread_id: str
    verified_skills: Dict[str, str] # e.g. {"Kubernetes": "Used in production for 1 year", "Docker": "None"}
    user_approved: bool = True

class TailoredResultResponse(BaseModel):
    thread_id: str
    initial_score: float
    final_score: float
    score_history: List[float]
    iterations_used: int
    tailored_markdown: str
    cover_letter: Optional[str] = None
    diff: Optional[List[Dict[str, Any]]] = None
