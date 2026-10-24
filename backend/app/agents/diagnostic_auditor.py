import re
from typing import Dict, List, Any
from app.schemas.state import ResumeAST
from app.schemas.audit import AuditIssue

PASSIVE_WEAK_PHRASES = {
    "en": [
        "responsible for", "duties included", "assisted with", "helped out",
        "worked on", "handled", "participated in", "was tasked with"
    ],
    "fr": [
        "responsable de", "chargé de", "aidé à", "participé à",
        "travaillé sur", "tâches comprenaient", "mission consistait"
    ]
}

def audit_resume_health(resume_ast: ResumeAST, raw_text: str, language: str = "en") -> Dict[str, Any]:
    """
    Performs standalone Diagnostic Audit of the resume according to recruitment best practices.
    Language-aware (French vs. English norms).
    """
    issues: List[AuditIssue] = []
    
    # 1. ATS Formatting & Structure Audit (35 points)
    ats_score = 100.0
    
    # Check contact info
    contact = resume_ast.contact_info or {}
    if not contact.get("email"):
        ats_score -= 25.0
        issues.append(AuditIssue(
            category="ATS_FORMATTING",
            severity="CRITICAL",
            title="Missing or Unparseable Email Address",
            description="No valid email address was detected in the contact section.",
            recommendation="Include a clear email at the top of your resume (e.g., name@domain.com) without hiding it in icons or graphic headers."
        ))
    if not contact.get("phone"):
        ats_score -= 10.0
        issues.append(AuditIssue(
            category="ATS_FORMATTING",
            severity="WARNING",
            title="Missing Phone Number",
            description="No standard international phone number was identified.",
            recommendation="Add a standard phone number with country code (e.g. +33 or +1)."
        ))

    # Check work experiences
    if not resume_ast.work_experiences or len(resume_ast.work_experiences) == 0:
        ats_score -= 30.0
        issues.append(AuditIssue(
            category="STRUCTURE",
            severity="CRITICAL",
            title="No Work Experience Section Found",
            description="The ATS parser could not identify standard professional experience entries.",
            recommendation="Use recognized headers like 'Professional Experience' or 'Expérience Professionnelle'."
        ))
    else:
        experiences_without_bullets = sum(
            not experience.bullets for experience in resume_ast.work_experiences
        )
        if experiences_without_bullets:
            ats_score -= min(20.0, experiences_without_bullets * 10.0)
            issues.append(AuditIssue(
                category="STRUCTURE",
                severity="WARNING",
                title="Experience Entries Need Detail",
                description=f"{experiences_without_bullets} experience entry(ies) have no readable achievement bullets.",
                recommendation="Add concise accomplishment bullets beneath every professional experience."
            ))

    if not resume_ast.professional_summary.strip():
        ats_score -= 10.0
        issues.append(AuditIssue(
            category="STRUCTURE",
            severity="WARNING",
            title="Professional Summary Missing",
            description="No professional summary was detected.",
            recommendation="Add a two- or three-line summary focused on your target role and strongest evidence."
        ))

    if not resume_ast.skills:
        ats_score -= 10.0
        issues.append(AuditIssue(
            category="ATS_FORMATTING",
            severity="WARNING",
            title="Skills Section Missing",
            description="No explicit skills were detected for keyword matching.",
            recommendation="Include a concise skills section using the exact terminology relevant to your experience."
        ))

    # 2. Content & Impact Audit (35 points)
    content_score = 100.0
    all_bullets = []
    for exp in resume_ast.work_experiences:
        for b in exp.bullets:
            all_bullets.append(b.original)

    # Check quantifiable metrics
    bullets_with_metrics = [b for b in all_bullets if re.search(r'(\d+[\d,.]*|\d+%\s*|\$\d+)', b)]
    metric_ratio = len(bullets_with_metrics) / max(1, len(all_bullets))
    
    if not all_bullets:
        content_score -= 45.0
        issues.append(AuditIssue(
            category="CONTENT_IMPACT",
            severity="CRITICAL",
            title="No Achievement Bullets Found",
            description="The resume contains no readable work-experience achievements to evaluate.",
            recommendation="Describe the actions you took, the scope of the work, and the resulting outcome."
        ))
    elif metric_ratio < 0.30:
        deduction = 25.0 if metric_ratio < 0.15 else 15.0
        content_score -= deduction
        issues.append(AuditIssue(
            category="CONTENT_IMPACT",
            severity="CRITICAL" if metric_ratio < 0.15 else "WARNING",
            title="Low Frequency of Quantifiable Metrics",
            description=f"Only {round(metric_ratio*100)}% of your bullet points contain measurable results or metrics.",
            recommendation="Incorporate numbers, percentages, budget sizes, team counts, or latency reductions using the STAR formula."
        ))

    action_starters = {
        "built", "created", "designed", "developed", "delivered", "engineered",
        "implemented", "improved", "increased", "reduced", "led", "managed",
        "optimized", "automated", "architected", "conçu", "développé",
        "implémenté", "optimisé", "automatisé", "piloté", "réduit", "augmenté",
    }
    action_ratio = sum(
        bullet.lstrip("- ").split(maxsplit=1)[0].lower().rstrip(".,:;")
        in action_starters
        for bullet in all_bullets
    ) / max(1, len(all_bullets))
    if all_bullets and action_ratio < 0.35:
        content_score -= 10.0
        issues.append(AuditIssue(
            category="CONTENT_IMPACT",
            severity="WARNING",
            title="Weak Achievement Openings",
            description=f"Only {round(action_ratio * 100)}% of bullets start with clear action verbs.",
            recommendation="Start bullets with specific verbs that show ownership, such as Built, Led, Reduced, or Optimized."
        ))

    # Check passive weak verbs
    weak_phrases = PASSIVE_WEAK_PHRASES.get(language, PASSIVE_WEAK_PHRASES["en"])
    found_weak_phrases = []
    lower_raw = raw_text.lower()
    for phrase in weak_phrases:
        if phrase in lower_raw:
            found_weak_phrases.append(phrase)

    if found_weak_phrases:
        content_score -= min(20.0, len(found_weak_phrases) * 5.0)
        issues.append(AuditIssue(
            category="CONTENT_IMPACT",
            severity="WARNING",
            title="Passive Phrasing Detected",
            description=f"Found passive clichés: {', '.join(found_weak_phrases[:3])}.",
            recommendation="Replace passive duties with powerful action verbs like 'Spearheaded', 'Architected', 'Optimized', or 'Conçu/Développé'."
        ))

    # 3. Cultural & Regional Best Practices Audit (30 points)
    norm_score = 100.0

    if language == "en":
        # English / US / UK Resume Norms
        # Anti-discrimination check: photos, age, marital status
        discriminatory_triggers = ["marital status", "single", "married", "birth date", "born on", "driving license", "photo attached"]
        found_triggers = [t for t in discriminatory_triggers if t in lower_raw]
        if found_triggers:
            norm_score -= 20.0
            issues.append(AuditIssue(
                category="LANGUAGE_NORMS",
                severity="CRITICAL",
                title="US/UK Anti-Discrimination Violation",
                description=f"Mention of personal details ({', '.join(found_triggers)}) can lead to immediate rejection by North American/UK recruiters.",
                recommendation="Remove all references to marital status, date of birth, photos, or nationality to comply with US/UK EEO standards."
            ))

        # Check for first-person pronouns
        pronouns = re.findall(r'\b(i|my|me|myself)\b', lower_raw)
        if len(pronouns) > 3:
            norm_score -= 15.0
            issues.append(AuditIssue(
                category="LANGUAGE_NORMS",
                severity="WARNING",
                title="First-Person Pronouns Detected",
                description=f"Found {len(pronouns)} instances of 'I', 'my', or 'me'.",
                recommendation="Use standard telegraphic resume style (e.g. 'Engineered high-throughput API' instead of 'I engineered an API')."
            ))

    elif language == "fr":
        # French CV Norms
        # Section naming checks
        has_fr_headers = any(h in lower_raw for h in ["expérience", "formation", "compétences"])
        if not has_fr_headers:
            norm_score -= 15.0
            issues.append(AuditIssue(
                category="LANGUAGE_NORMS",
                severity="WARNING",
                title="Nomenclature des Sections Non Standard (Norme Française)",
                description="Le CV manque des titres canoniques reconnus par les recruteurs francophones.",
                recommendation="Structurez votre CV avec les rubriques: 'Expérience Professionnelle', 'Formation & Diplômes', et 'Compétences Techniques'."
            ))

    # Ensure scores bounded in 0-100
    ats_score = max(20.0, round(ats_score, 1))
    content_score = max(20.0, round(content_score, 1))
    norm_score = max(20.0, round(norm_score, 1))
    
    overall_health = round((0.35 * ats_score) + (0.35 * content_score) + (0.30 * norm_score), 1)

    return {
        "overall_health_score": overall_health,
        "ats_formatting_score": ats_score,
        "content_impact_score": content_score,
        "language_norm_score": norm_score,
        "detected_language": language,
        "issues": [issue.model_dump() for issue in issues]
    }
