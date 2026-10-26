from typing import TypedDict, List, Dict, Optional, Any, Annotated
import operator
from pydantic import BaseModel, Field

# --- Fact-Locked Pydantic AST (Prevents Hallucination of Employment Facts) ---

class BulletPoint(BaseModel):
    id: str
    original: str
    tailored: Optional[str] = None
    action_verb: Optional[str] = None
    has_metrics: bool = False
    skills_embedded: List[str] = Field(default_factory=list)

class WorkExperienceItem(BaseModel):
    id: str
    # IMMUTABLE FACTS:
    company: str
    role: str
    dates: str
    location: Optional[str] = None
    # MUTABLE / OPTIMIZABLE CONTENT:
    bullets: List[BulletPoint] = Field(default_factory=list)

class EducationItem(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None

class ResumeAST(BaseModel):
    full_name: str
    contact_info: Dict[str, str] = Field(default_factory=dict) # email, phone, linkedin, github, location
    professional_summary: str
    work_experiences: List[WorkExperienceItem] = Field(default_factory=list)
    projects: List[WorkExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages_spoken: List[str] = Field(default_factory=list)
    leadership: List[str] = Field(default_factory=list)
    language: str = "en"

# --- LangGraph TypedDict State ---

def score_history_reducer(current: List[float], new_items: List[float]) -> List[float]:
    res = list(current) if current else []
    for item in new_items:
        if not res or abs(res[-1] - item) >= 1.0:
            res.append(round(item, 1))
    return res

class AgenticATSState(TypedDict):
    thread_id: str
    user_id: Optional[str]
    raw_resume: str
    language: str # 'en' or 'fr'
    resume_ast: Dict[str, Any] # Serialized ResumeAST
    
    # Phase 1: Diagnostic Health Audit
    health_score: float
    ats_formatting_score: float
    content_impact_score: float
    language_norm_score: float
    audit_issues: List[Dict[str, Any]]
    
    # Phase 2: Target Job Matching
    job_description: str
    target_role: str
    required_skills: List[str]
    extracted_resume_skills: List[str]
    matched_skills: List[str]
    missing_critical_skills: List[str]
    
    # Deterministic Scoring
    ats_score: float
    score_history: Annotated[List[float], score_history_reducer]
    iteration_count: int
    max_iterations: int

    
    # Human-in-the-Loop Gate
    hitl_pending: bool
    resume_after_hitl: bool
    hitl_questions: List[Dict[str, Any]]
    hitl_question: Optional[Dict[str, Any]]
    verified_skills: Dict[str, str] # e.g. {"Kubernetes": "Used for 1 year in staging"}
    
    # Final Output Deliverables
    tailored_markdown: str
    cover_letter: str
    diff: List[Dict[str, Any]]
    status: str # "INGESTION", "AUDITED", "MATCHING", "AWAITING_HITL", "CONVERGED", "MAX_RETRY"
