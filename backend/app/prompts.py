import json
from typing import Any


def resume_parser_prompt(raw_text: str, language: str) -> str:
    return f"""You are a precise ATS resume parser.
Extract only facts explicitly present in the resume. Never invent employers, dates,
degrees, metrics, skills, or contact details.

Return a JSON object with this schema:
{{
  "full_name": "string",
  "contact_info": {{"email": "string", "phone": "string", "linkedin": "string", "github": "string", "location": "string"}},
  "professional_summary": "string",
  "work_experiences": [{{"company": "string", "role": "string", "dates": "string", "location": "string", "bullets": ["string"]}}],
  "projects": [{{"name": "string", "technologies": "string", "bullets": ["string"]}}],
  "education": [{{"degree": "string", "institution": "string", "year": "string"}}],
  "skills": ["string"],
  "certifications": ["string"],
  "languages_spoken": ["string"],
  "leadership": ["string"],
  "language": "{language}"
}}

Resume text:
{raw_text[:25000]}

Return only valid JSON."""


def resume_vision_parser_prompt(language: str, page_count: int) -> str:
    return f"""You are a precise ATS resume parser reading {page_count} page images.
Read every page and combine the candidate's facts into one JSON object. Preserve
the exact text of employers, dates, degrees, skills, and accomplishments. Never
invent missing details. The document language is {language}.

Use this schema:
{{
  "full_name": "string",
  "contact_info": {{"email": "string", "phone": "string", "linkedin": "string", "github": "string", "location": "string"}},
  "professional_summary": "string",
  "work_experiences": [{{"company": "string", "role": "string", "dates": "string", "location": "string", "bullets": ["string"]}}],
  "projects": [{{"name": "string", "technologies": "string", "bullets": ["string"]}}],
  "education": [{{"degree": "string", "institution": "string", "year": "string"}}],
  "skills": ["string"],
  "certifications": ["string"],
  "languages_spoken": ["string"],
  "leadership": ["string"],
  "language": "{language}"
}}

Return only valid JSON."""


def skill_verification_prompt(
    skill: str,
    context_snippet: str,
    original_resume_text: str,
    language: str,
) -> str:
    output_language = "professional French" if language == "fr" else "professional English"
    return f"""You are a careful human-in-the-loop resume assistant.
Write one concise, natural question in {output_language} asking the candidate
whether they have hands-on experience with the specific skill below.

Skill: {skill}
Why it matters in the job posting: {context_snippet}
Resume evidence currently available:
{original_resume_text[:5000]}

Do not assume the candidate has this skill. Do not mention hidden analysis,
missing keywords, or the parsing process. Ask only about this skill and invite
the candidate to briefly describe where or how they used it if they have
experience. Return only a JSON object with this shape:
{{"question": "string"}}
"""


def skill_verification_questions_prompt(
    skills: list[str],
    context: str,
    original_resume_text: str,
    language: str,
) -> str:
    output_language = "professional French" if language == "fr" else "professional English"
    return f"""You are a careful human-in-the-loop resume assistant.
Write one concise, natural question in {output_language} for each skill below.
Ask whether the candidate has hands-on experience and, if yes, where or how
they used it.

Skills to verify: {json.dumps(skills, ensure_ascii=False)}
Relevant job requirements:
{context[:4000]}
Resume evidence currently available:
{original_resume_text[:5000]}

Do not assume the candidate has any skill. Do not mention hidden analysis,
missing keywords, or parsing. Return exactly one question for every input skill,
in the same order, as JSON:
{{"questions": [{{"skill": "string", "question": "string"}}]}}
"""


def tailoring_prompt(
    bullets: list[dict[str, Any]],
    target_role: str,
    approved_skills: list[str],
    language: str,
    job_description: str = "",
) -> str:
    output_language = "professional French" if language == "fr" else "professional English"
    return f"""You are a careful ATS resume editor.
Rewrite each supplied bullet in {output_language} for the target role.
Preserve every fact, technology, employer, date, and outcome from the original.
Never invent a metric, percentage, employer, responsibility, or achievement.
If the original has no metric, improve clarity without adding one. Return one
result for every input bullet, using the same id.

Target role: {target_role or "Senior Specialist"}
Verified skills to prioritize: {", ".join(approved_skills[:12])}
Job description:
{job_description[:4000]}

Return a JSON object with a "bullets" array containing exactly objects with
"id" and "tailored".
Bullets:
{json.dumps(bullets[:8], ensure_ascii=False, indent=2)}
"""


def cover_letter_prompt(
    candidate_name: str,
    contact_line: str,
    education: str,
    target_role: str,
    company_name: str,
    skills: str,
    achievements: list[str],
    job_description: str,
    language: str,
) -> str:
    output_language = "impeccable professional French" if language == "fr" else "executive, compelling English"
    return f"""You are an executive career coach.
Write a fact-grounded four-paragraph cover letter in {output_language}.
Use only the candidate facts below. Do not invent experience, employers, metrics,
or qualifications. Include a header, subject, salutation, evidence, role fit,
call to action, and professional closing. Return only the complete letter.

Candidate: {candidate_name}
Contact: {contact_line}
Education: {education}
Target role: {target_role}
Target company: {company_name}
Skills: {skills}
Achievements:
{chr(10).join(f"- {item}" for item in achievements)}

Job description excerpt:
{job_description[:1200]}
"""
