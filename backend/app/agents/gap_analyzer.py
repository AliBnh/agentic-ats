from typing import Dict, List, Any, Optional

def analyze_skill_gaps(
    missing_critical_skills: List[str],
    verified_skills: Dict[str, str],
    job_description: str,
    original_resume_text: str
) -> Dict[str, Any]:
    """
    Analyzes missing skills and determines if a Human-in-the-Loop breakpoint is required.
    Prevents AI hallucination: if a critical skill is completely missing and unverified,
    the agent must stop and ask the human.
    """
    # If user has already completed HITL verification for this session, proceed with tailoring
    if verified_skills:
        return {
            "hitl_pending": False,
            "hitl_question": None,
            "target_skill": None
        }

    unverified_critical_skills = [
        skill for skill in missing_critical_skills
        if skill not in verified_skills and skill.lower() not in original_resume_text.lower()
    ]

    if unverified_critical_skills:
        # Select the top critical missing skill to ask about
        target_skill = unverified_critical_skills[0]
        
        # Extract a short context snippet from the JD where this skill appears
        context_snippet = ""
        for line in job_description.splitlines():
            if target_skill.lower() in line.lower():
                context_snippet = line.strip()[:150]
                break
        if not context_snippet:
            context_snippet = f"The job posting lists '{target_skill}' as a core qualification."

        hitl_question = {
            "skill": target_skill,
            "question": f"The target role emphasizes '{target_skill}'. Do you have hands-on experience with this to include?",
            "context": context_snippet,
            "options": [
                {"label": f"Yes, I have experience with {target_skill}", "value": "APPROVED"},
                {"label": f"No, I do not have experience with {target_skill}", "value": "DECLINED"},
                {"label": "I have equivalent / transferable knowledge", "value": "TRANSFERABLE"}
            ]
        }
        return {
            "hitl_pending": True,
            "hitl_question": hitl_question,
            "target_skill": target_skill
        }

    return {
        "hitl_pending": False,
        "hitl_question": None,
        "target_skill": None
    }
