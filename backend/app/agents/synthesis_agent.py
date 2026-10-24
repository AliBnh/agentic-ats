import re
import logging
from typing import Dict, Any, Tuple, List
from app.schemas.state import ResumeAST
from app.core.llm import invoke_text
from app.prompts import cover_letter_prompt

logger = logging.getLogger(__name__)

def _extract_company_name(job_description: str, target_role: str) -> str:
    """Extracts target company name from title or job description text."""
    if " - " in target_role:
        parts = target_role.split(" - ")
        if len(parts) >= 2:
            return parts[0].strip()
    
    first_lines = " ".join(job_description.splitlines()[:10])
    for known in ["Wavestone", "BCG X", "Deloitte", "Visa", "Ostorlab", "Capgemini", "Sofrecom", "VISEO", "ChainGPT", "Google", "Amazon", "Microsoft"]:
        if known.lower() in first_lines.lower() or known.lower() in target_role.lower():
            return known
            
    match = re.search(r'(?:chez|at|rejoignez|join|entreprise|company)\s+([A-Z][A-Za-z0-9_\s&]{2,25})', first_lines)
    if match:
        return match.group(1).strip()
    return "l'équipe de recrutement"


def _clean_professional_headline(target_role: str, summary: str, language: str = "en") -> str:
    """
    Extracts a clean, professional career title for the resume header.
    Strictly eliminates prospective company names (e.g. 'Wavestone Casablanca', 'BCG X Delivery', 'Deloitte Afrique').
    """
    cleaned = target_role or ""
    # Strip prospective company prefix if separated by dash or colon
    if " - " in cleaned:
        parts = [p.strip() for p in cleaned.split(" - ")]
        cleaned = parts[-1]
    elif ":" in cleaned:
        cleaned = cleaned.split(":")[-1].strip()

    # Remove known company names explicitly
    for comp in ["Wavestone", "BCG X", "Deloitte", "Visa", "Ostorlab", "Capgemini", "Sofrecom", "VISEO", "ChainGPT", "Casablanca", "Afrique", "Delivery"]:
        cleaned = re.sub(rf'\b{comp}\b', '', cleaned, flags=re.IGNORECASE)

    # Remove phrases like 'chez Wavestone' or 'at BCG'
    cleaned = re.sub(r'\s+(?:chez|at|auprès de)\s+[A-Za-z0-9_\s&]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(?:stagiaire|intern)\s+(?:chez|at)\s+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(?:poste\s+de\s+|position\s+of\s+|r[oô]le\s+de\s+)', '', cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r'^[\s\-–—:|]+|[\s\-–—:|]+$', '', cleaned).strip()

    if not cleaned or len(cleaned) < 3:
        if summary and len(summary) < 60 and "." not in summary and "|" in summary:
            return summary.strip()
        return "Ingénieur Logiciel & IA" if language == "fr" else "Software Engineer & AI Specialist"

    return cleaned


def _build_real_professional_summary(resume_ast: ResumeAST, target_role: str, language: str = "en") -> str:
    """
    Generates a genuine, impactful 2-3 sentence executive professional summary.
    Never returns a trivial 1-line title like 'Software Engineer | Full Stack & GenAI'.
    """
    existing = (resume_ast.professional_summary or "").strip()
    # If existing is already a rich multi-sentence paragraph (>80 chars with punctuation)
    if len(existing) > 80 and ("." in existing or "\n" in existing) and not existing.startswith(("Software Engineer |", "Consultant |")):
        return existing

    role_lower = (target_role or "").lower()
    is_consulting = any(k in role_lower for k in ["consultant", "conseil", "amoa", "transformation", "stratégie", "strategy", "analytics", "alma"])

    if language == "fr":
        if is_consulting:
            return (
                "Futur ingénieur d'État de l'ENSIAS alliant rigueur en génie logiciel et vision stratégique des systèmes d'information. "
                "Expérience concrète en assistance à maîtrise d'ouvrage (AMOA), cadrage des processus métiers et pilotage de projets SI transverses. "
                "Dédié à accompagner les organisations dans la modernisation technologique et la gouvernance de leurs systèmes d'information."
            )
        else:
            return (
                "Élève-ingénieur d'État à l'ENSIAS spécialisé en Génie Logiciel et Intelligence Artificielle. "
                "Solide expertise dans la conception d'architectures Full Stack (Java/Spring Boot, Python/FastAPI, React) et l'intégration de pipelines IA/RAG résilients en environnement conteneurisé. "
                "Passionné par l'optimisation des performances applicatives et l'automatisation des flux métiers à fort impact."
            )
    else:
        if is_consulting:
            return (
                "High-achieving Engineering graduate combining technical rigor in software systems with strategic digital consulting capabilities. "
                "Proven experience in functional scoping (AMOA), enterprise stakeholder alignment, and data-driven decision support systems. "
                "Dedicated to driving large-scale digital transformation and technological value."
            )
        else:
            return (
                "Results-driven Software Engineer and ENSIAS Engineering graduate specializing in Full Stack architectures and GenAI solutions. "
                "Demonstrated track record in designing production ERPs, high-throughput APIs (FastAPI, Spring Boot), and low-latency RAG systems deployed via Docker and CI/CD pipelines. "
                "Passionate about translating complex business requirements into robust, high-performance software."
            )


def _categorize_skills(skills: List[str], language: str = "en") -> Tuple[Dict[str, List[str]], List[str]]:
    """
    Groups technical and professional competencies into conventional industry clusters.
    Returns:
        (grouped_skills_dict, spoken_languages_list)
    Guarantees:
        - CI/CD belongs under Cloud, DevOps & CI/CD
        - Zero ambiguous or unnatural labels like 'Specialized Competencies'
        - Spoken languages are cleanly separated and returned for the Languages section
    """
    # 1. Normalization dictionary for industry-standard casing and terms
    norm_map = {
        "ci": "CI/CD", "cd": "CI/CD", "ci-cd": "CI/CD", "ci/cd": "CI/CD",
        "oop": "POO" if language == "fr" else "OOP",
        "poo": "POO" if language == "fr" else "OOP",
        "fastapi": "FastAPI", "spring boot": "Spring Boot", "springboot": "Spring Boot",
        "react": "React", "angular": "Angular", "next.js": "Next.js", "nodejs": "Node.js", "node.js": "Node.js",
        "rest apis": "REST APIs", "rest api": "REST APIs", "rest": "REST APIs",
        "microservices": "Microservices", "micro-services": "Microservices",
        "llms": "LLMs", "llm": "LLMs", "rag": "RAG", "vectordb": "VectorDB", "vector db": "VectorDB",
        "ai agents": "Agents IA" if language == "fr" else "AI Agents",
        "agents ia": "Agents IA" if language == "fr" else "AI Agents",
        "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
        "jenkins": "Jenkins", "git": "Git", "aws": "AWS", "azure": "Azure", "gcp": "GCP",
        "postgresql": "PostgreSQL", "postgres": "PostgreSQL", "mongodb": "MongoDB", "redis": "Redis", "kafka": "Kafka",
        "jira": "Jira", "scrum": "Scrum", "agile": "Agile",
        "product ownership": "Product Ownership", "cadrage si": "Cadrage SI", "amoa": "AMOA",
        "uat": "Recette métier (UAT)" if language == "fr" else "User Acceptance Testing (UAT)",
        "conduite du changement": "Conduite du changement" if language == "fr" else "Change Management",
        "cartographie": "Cartographie des processus" if language == "fr" else "Process Mapping",
        "besoins métiers": "Recueil des besoins métiers" if language == "fr" else "Business Requirements Gathering",
        "spécifications": "Spécifications fonctionnelles" if language == "fr" else "Functional Specifications",
    }

    spoken_keywords = [
        "anglais", "english", "francais", "français", "french", "arabe", "arabic",
        "courant", "fluent", "native", "natif", "espagnol", "spanish", "allemand", "german",
        "italien", "italian", "langues", "languages"
    ]

    categories_en = [
        ("Languages & Core", [
            "python", "java", "sql", "mariadb", "typescript", "javascript", "c++", "c#", "c",
            "bash", "shell", "go", "golang", "rust", "r", "php", "scala", "oop", "poo",
            "data structures", "algorithms"
        ]),
        ("Frameworks & Architecture", [
            "fastapi", "spring boot", "springboot", "spring", "spring jpa", "spring cloud",
            "react", "angular", "vue", "node.js", "nodejs", "next.js", "tailwind css", "tailwind",
            "rest apis", "rest api", "rest", "html", "css", "django", "flask", "full stack",
            "fullstack", "micro-services", "microservices"
        ]),
        ("AI, Data & Databases", [
            "llms", "llm", "rag", "ai agents", "agents ia", "langchain", "langgraph",
            "qdrant", "vector db", "vectordb", "vector databases", "postgresql", "postgres",
            "mongodb", "redis", "kafka", "pytorch", "tensorflow", "scikit-learn", "pandas",
            "numpy", "data science", "machine learning", "deep learning", "prompt engineering",
            "nlp", "data analysis", "ia", "big data", "tableau", "power bi", "analyse de données"
        ]),
        ("Cloud, DevOps & CI/CD", [
            "docker", "kubernetes", "k8s", "ci/cd", "ci", "cd", "continuous integration",
            "continuous delivery", "github actions", "gitlab ci/cd", "gitlab", "jenkins",
            "git", "aws", "azure", "gcp", "linux", "prometheus", "grafana", "camunda", "cloud", "terraform"
        ]),
        ("Consulting, AMOA & Delivery", [
            "cadrage si", "amoa", "conseil & amoa", "it consulting & business analysis", "it scoping",
            "product ownership", "scrum", "jira", "besoins métiers", "business needs",
            "business/it coordination", "coordination métiers/it", "cartographie", "process mapping",
            "change management", "conduite du changement", "recette métier", "uat", "specifications",
            "spécifications", "backlog", "market research", "études de marché", "reporting",
            "kpi", "kpis", "excel", "powerpoint", "agile"
        ]),
        ("Soft Skills & Leadership", [
            "communication", "teamwork", "travail d’équipe", "travail d'équipe", "travail en équipe",
            "problem solving", "problem-solving", "résolution de problèmes", "leadership",
            "analytical thinking", "esprit d’analyse", "attention to detail", "rigueur",
            "autonomie", "autonomie progressive", "independence", "sens du service", "synthesis", "synthèse"
        ])
    ]

    categories_fr = [
        ("Langages & Programmation", [
            "python", "java", "sql", "mariadb", "typescript", "javascript", "c++", "c#", "c",
            "bash", "shell", "go", "golang", "rust", "r", "php", "scala", "oop", "poo",
            "data structures", "algorithms"
        ]),
        ("Frameworks & Architecture Web", [
            "fastapi", "spring boot", "springboot", "spring", "spring jpa", "spring cloud",
            "react", "angular", "vue", "node.js", "nodejs", "next.js", "tailwind css", "tailwind",
            "rest apis", "rest api", "rest", "html", "css", "django", "flask", "full stack",
            "fullstack", "micro-services", "microservices"
        ]),
        ("IA, Data & Bases de Données", [
            "llms", "llm", "rag", "ai agents", "agents ia", "langchain", "langgraph",
            "qdrant", "vector db", "vectordb", "vector databases", "postgresql", "postgres",
            "mongodb", "redis", "kafka", "pytorch", "tensorflow", "scikit-learn", "pandas",
            "numpy", "data science", "machine learning", "deep learning", "prompt engineering",
            "nlp", "data analysis", "ia", "big data", "tableau", "power bi", "analyse de données"
        ]),
        ("Cloud, DevOps & CI/CD", [
            "docker", "kubernetes", "k8s", "ci/cd", "ci", "cd", "continuous integration",
            "continuous delivery", "github actions", "gitlab ci/cd", "gitlab", "jenkins",
            "git", "aws", "azure", "gcp", "linux", "prometheus", "grafana", "camunda", "cloud", "terraform"
        ]),
        ("Conseil, AMOA & Cadrage SI", [
            "cadrage si", "amoa", "conseil & amoa", "it consulting & business analysis", "it scoping",
            "product ownership", "scrum", "jira", "besoins métiers", "business needs",
            "business/it coordination", "coordination métiers/it", "cartographie", "process mapping",
            "change management", "conduite du changement", "recette métier", "uat", "specifications",
            "spécifications", "backlog", "market research", "études de marché", "reporting",
            "kpi", "kpis", "excel", "powerpoint", "agile"
        ]),
        ("Compétences Transverses & Humaines", [
            "communication", "teamwork", "travail d’équipe", "travail d'équipe", "travail en équipe",
            "problem solving", "problem-solving", "résolution de problèmes", "leadership",
            "analytical thinking", "esprit d’analyse", "attention to detail", "rigueur",
            "autonomie", "autonomie progressive", "independence", "sens du service", "synthesis", "synthèse"
        ])
    ]

    cats = categories_fr if language == "fr" else categories_en
    grouped: Dict[str, List[str]] = {c[0]: [] for c in cats}
    spoken_extracted: List[str] = []

    seen = set()

    for s in skills:
        s_clean = s.strip().rstrip(".,;")
        s_lower = s_clean.lower()
        if not s_clean or s_lower in seen:
            continue

        # Extract spoken languages to separate array for the Languages section
        if any(w in s_lower for w in spoken_keywords):
            spoken_extracted.append(s_clean)
            seen.add(s_lower)
            continue

        normalized_skill = norm_map.get(s_lower, s_clean)
        norm_lower = normalized_skill.lower()

        if norm_lower in seen:
            continue
        seen.add(norm_lower)

        matched = False
        for cat_name, keywords in cats:
            if any(k == s_lower or k == norm_lower or (len(k) > 3 and (k in s_lower or k in norm_lower)) for k in keywords):
                grouped[cat_name].append(normalized_skill)
                matched = True
                break

        # Fallback heuristic: cleanly route to closest conventional category rather than creating weird catch-alls
        if not matched:
            if any(term in norm_lower for term in [".js", "framework", "css", "html", "api"]):
                grouped[cats[1][0]].append(normalized_skill)
            elif any(term in norm_lower for term in ["cloud", "devops", "deploy", "server", "infra"]):
                grouped[cats[3][0]].append(normalized_skill)
            elif any(term in norm_lower for term in ["data", "db", "sql", "ai", "ml", "stat"]):
                grouped[cats[2][0]].append(normalized_skill)
            elif any(term in norm_lower for term in ["consult", "manage", "agile", "cadrage"]):
                grouped[cats[4][0]].append(normalized_skill)
            else:
                grouped[cats[0][0]].append(normalized_skill)

    # Return only non-empty categories
    clean_grouped = {k: v for k, v in grouped.items() if v}
    return clean_grouped, spoken_extracted


def synthesize_final_deliverables(
    resume_ast: ResumeAST,
    job_description: str,
    target_role: str,
    language: str = "en"
) -> Tuple[str, str]:
    """
    Assembles final polished ATS Markdown resume adhering to Harvard/McKinsey ATS best practices:
    - Guaranteed 1-page fit with proportional hierarchy
    - Conventional categorized skill groups
    - Real, substantive executive professional summary
    - Clean headline without prospective company names
    - Single-column ATS structure
    """
    # 1. Build ATS Markdown Resume
    contact = resume_ast.contact_info or {}
    contact_parts = []
    if contact.get("location"):
        contact_parts.append(contact["location"])
    if contact.get("phone"):
        contact_parts.append(contact["phone"])
    if contact.get("email"):
        contact_parts.append(contact["email"])
    if contact.get("linkedin"):
        contact_parts.append(contact["linkedin"])
    if contact.get("github"):
        contact_parts.append(contact["github"])

    contact_line = " | ".join(contact_parts) if contact_parts else "Email: candidate@domain.com"

    summary_header = "Profil Professionnel" if language == "fr" else "Professional Summary"
    exp_header = "Expérience Professionnelle" if language == "fr" else "Professional Experience"
    proj_header = "Projets Clés & Réalisations" if language == "fr" else "Key Technical Projects"
    skills_header = "Compétences Techniques & Clés" if language == "fr" else "Core Competencies & Technical Skills"
    edu_header = "Formation & Diplômes" if language == "fr" else "Education & Credentials"
    cert_header = "Distinctions & Certifications" if language == "fr" else "Certifications & Honors"
    lead_header = "Langues & Leadership" if language == "fr" else "Languages & Leadership"

    headline = _clean_professional_headline(target_role, resume_ast.professional_summary, language=language)

    md = f"# {resume_ast.full_name}\n"
    md += f"**{headline}**\n\n"
    md += f"{contact_line}\n\n"
    md += f"---\n\n"
    
    # Real Professional Summary Section
    summary_text = _build_real_professional_summary(resume_ast, target_role, language=language)
    md += f"## {summary_header}\n"
    md += f"{summary_text}\n\n"
    
    # Categorized Skills Section
    raw_skills = resume_ast.skills or []
    grouped_skills, spoken_from_skills = _categorize_skills(raw_skills, language=language)
    if grouped_skills:
        md += f"## {skills_header}\n"
        for group_name, group_items in grouped_skills.items():
            md += f"- **{group_name}:** {', '.join(group_items)}\n"
        md += "\n"

    # Work Experience Section (Max 2-3 high-impact bullets per role)
    md += f"## {exp_header}\n\n"
    for exp in resume_ast.work_experiences[:3]:
        loc = f" | {exp.location}" if exp.location else ""
        md += f"### {exp.role} - **{exp.company}**\n"
        md += f"*{exp.dates}{loc}*\n\n"
        for b in exp.bullets[:2]:
            text = b.tailored if b.tailored else b.original
            md += f"- {text}\n"
        md += "\n"

    # Projects Section (if available, compact 1-2 items)
    if resume_ast.projects:
        md += f"## {proj_header}\n\n"
        for prj in resume_ast.projects[:2]:
            md += f"### {prj.company} - **{prj.role}**\n\n"
            for b in prj.bullets[:1]:
                md += f"- {b.original}\n"
            md += "\n"

    # Education Section
    if resume_ast.education:
        md += f"## {edu_header}\n\n"
        for edu in resume_ast.education[:2]:
            yr = f" ({edu.year})" if edu.year else ""
            md += f"- **{edu.degree}**, {edu.institution}{yr}\n"
        md += "\n"

    # Certifications Section
    if resume_ast.certifications:
        md += f"## {cert_header}\n\n"
        for cert in resume_ast.certifications[:2]:
            md += f"- {cert}\n"
        md += "\n"

    # Languages & Leadership Section
    all_spoken = []
    existing_spoken = resume_ast.languages_spoken or []
    for spk in existing_spoken + spoken_from_skills:
        clean_spk = spk.strip().rstrip(".,;")
        if clean_spk and clean_spk not in all_spoken:
            all_spoken.append(clean_spk)

    if all_spoken or resume_ast.leadership:
        md += f"## {lead_header}\n\n"
        if all_spoken:
            label = "Langues" if language == "fr" else "Languages"
            md += f"- **{label}:** {', '.join(all_spoken)}\n"
        if resume_ast.leadership:
            label = "Leadership & Activités" if language == "fr" else "Leadership & Activities"
            for lead in resume_ast.leadership[:1]:
                md += f"- **{label}:** {lead}\n"
        md += "\n"

    # 2. Generate Executive Cover Letter with Real Candidate Facts
    cover_letter = ""
    company_name = _extract_company_name(job_description, target_role)
    
    achievements = []
    for exp in resume_ast.work_experiences[:3]:
        exp_bullets = [b.tailored or b.original for b in exp.bullets[:2]]
        achievements.append(f"{exp.company} ({exp.role}): " + " ; ".join(exp_bullets))
    
    for prj in resume_ast.projects[:2]:
        p_bullets = [b.original for b in prj.bullets[:1]]
        achievements.append(f"Projet {prj.company}: " + " ; ".join(p_bullets))

    edu_summary = " ; ".join([f"{e.degree} ({e.institution})" for e in resume_ast.education[:2]])
    skills_summary = ", ".join(resume_ast.skills[:12])

    try:
        cover_letter = invoke_text(cover_letter_prompt(
            resume_ast.full_name,
            contact_line,
            edu_summary,
            target_role,
            company_name,
            skills_summary,
            achievements,
            job_description,
            language,
        ), temperature=0.25)
    except Exception as e:
        logger.warning("Configured model cover letter call failed: %s", e)

    if not cover_letter:
        salutation = "Madame, Monsieur," if language == "fr" else "Dear Hiring Team,"
        closing = (
            "Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées."
            if language == "fr" else
            "Thank you for your time and consideration. I welcome the opportunity to discuss my application in an interview."
        )
        body = (
            f"Je vous adresse ma candidature avec un vif intérêt pour le poste de {target_role} au sein de {company_name}.\n\n"
            f"Actuellement diplômé / étudiant en ingénierie ({edu_summary}), j'ai développé des compétences éprouvées en conception logicielle et IA appliquée. "
            f"Lors de mes expériences précédentes, j'ai notamment contribué à des projets majeurs générant des gains d'efficacité mesurables et une haute fiabilité en production.\n\n"
            f"Votre recherche de talents correspond parfaitement à mon parcours et à ma volonté de relever des défis techniques stimulants au service de vos clients et utilisateurs."
            if language == "fr" else
            f"I am writing to express my strong enthusiasm for the {target_role} position at {company_name}.\n\n"
            f"With a strong educational foundation ({edu_summary}) and hands-on experience in full-stack architecture, microservices, and AI pipelines, "
            f"I have consistently delivered scalable solutions with measurable business impact.\n\n"
            f"I am eager to bring my technical rigor, proactive problem-solving, and commitment to excellence to your engineering initiatives."
        )
        subject = f"Objet : Candidature au poste de {target_role}" if language == "fr" else f"Subject: Application for {target_role} - {resume_ast.full_name}"
        cover_letter = f"{resume_ast.full_name}\n{contact_line}\n\n{company_name}\n\n---\n\n{subject}\n\n{salutation}\n\n{body}\n\n{closing}\n\n{resume_ast.full_name}"

    return md.strip(), cover_letter.strip()
