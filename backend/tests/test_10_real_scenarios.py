import io
import time
import requests
import pypdf

BASE_URL = "http://localhost:8000"

SCENARIOS = [
    {
        "id": "scenario_1_swe_cloud",
        "name": "Sarah Connor - Cloud & Distributed Systems",
        "lang": "en",
        "role": "Senior Cloud Platform Engineer",
        "cv": """Sarah Connor
Senior Cloud Engineer | Distributed Systems & DevOps
San Francisco, CA | +1 (415) 890-1234 | sconnor@cloudtech.io | linkedin.com/in/sarah-connor | github.com/sconnor

EXPERIENCE
CloudScale Technologies : Staff Cloud Architect | 2023 - Present
- Architected multi-region Kubernetes platform across AWS and GCP supporting 12M active users, achieving 99.99% service availability.
- Automated Terraform infrastructure-as-code deployments for 45 microservices, reducing deployment cycle time by 65%.

Datadog Partner Lab : Senior DevOps Engineer | 2021 - 2023
- Designed observability pipelines with Prometheus and Grafana, reducing Mean Time to Detection (MTTD) by 45%.
- Implemented blue-green deployments on Amazon EKS, eliminating deployment downtime across 120 production releases.

EDUCATION
University of California, Berkeley - Bachelor of Science in Computer Science (2017 - 2021)

SKILLS
Kubernetes, Docker, AWS, Terraform, Python, Go, Prometheus, Grafana, CI/CD, Microservices
""",
        "jd": """Senior Cloud Platform Engineer
Global FinTech Corp is seeking a Senior Cloud Platform Engineer to scale our hybrid cloud Kubernetes clusters.
Requirements:
- 3+ years experience with Kubernetes, Terraform, and AWS/GCP cloud environments.
- Deep expertise in CI/CD pipeline automation and infrastructure as code.
- Proven experience with Prometheus/Grafana monitoring and high-availability distributed systems.
"""
    },
    {
        "id": "scenario_2_data_science",
        "name": "Yassine Mansouri - Senior Data Scientist & ML",
        "lang": "fr",
        "role": "Lead Data Scientist & IA",
        "cv": """Yassine Mansouri
Lead Data Scientist | Machine Learning & LLMs
Casablanca | +212 6 12 34 56 78 | y.mansouri@datascience.ma | linkedin.com/in/ymansouri

EXPÉRIENCES PROFESSIONNELLES
Maroc Data Lab : Senior Data Scientist | 2023 - Présent
- Développé des modèles de scoring prédictif sous XGBoost et PyTorch pour le secteur bancaire, générant 15M MAD de valeur nette.
- Conçu un moteur de recommandation hybride en temps réel sous Python et FastAPI, augmentant le taux de clics de 35%.

AI Factory Casablanca : Ingénieur Machine Learning | 2021 - 2023
- Entraîné et déployé des modèles NLP pour la détection de fraudes transactionnelles, réduisant les faux positifs de 40%.
- Mis en production des pipelines MLOps automatisés avec MLflow et Docker sous environnement cloud.

FORMATION
INSEA Rabat - Diplôme d'ingénieur d'État en Statistique et Big Data (2018 - 2021)

COMPÉTENCES
Python, PyTorch, Scikit-Learn, MLOps, SQL, FastAPI, Docker, XGBoost, NLP, Big Data
""",
        "jd": """Lead Data Scientist & IA
Banque Internationale recherche un Lead Data Scientist pour piloter la stratégie Machine Learning et modélisation prédictive.
Profil recherché :
- Diplôme d'ingénieur d'État ou Master en Data Science / Statistiques.
- Maîtrise de Python, PyTorch, Scikit-Learn et des architectures MLOps.
- Expérience concrète dans le déploiement de modèles prédictifs et de scoring métier.
"""
    },
    {
        "id": "scenario_3_cybersecurity",
        "name": "Marcus Vance - Cyber Defense & AppSec",
        "lang": "en",
        "role": "Application Security Architect",
        "cv": """Marcus Vance
Application Security Architect | DevSecOps & Threat Modeling
London, UK | +44 20 7946 0912 | mvance@cybersec.co.uk | linkedin.com/in/mvance-sec

EXPERIENCE
Fortress Security Solutions : Lead Security Engineer | 2022 - Present
- Conducted dynamic and static security audits (DAST/SAST) across 80+ web applications, mitigating 300+ critical vulnerabilities.
- Integrated SonarQube, Snyk, and OWASP ZAP into GitLab CI/CD pipelines, enforcing zero-trust code quality gates.

CyberDefense UK : Penetration Tester | 2020 - 2022
- Executed penetration testing and threat modeling for banking clients, preventing data exfiltration risks.
- Authored remediation guides and trained 150+ engineers in secure coding practices.

EDUCATION
Imperial College London - M.Sc. in Information Security (2019 - 2020)

SKILLS
AppSec, SAST, DAST, OWASP Top 10, DevSecOps, Python, Docker, Penetration Testing, Cryptography
""",
        "jd": """Application Security Architect
Global Security Firm seeks an Application Security Architect to lead secure software development life cycle (SSDLC).
Responsibilities:
- Drive SAST, DAST, and penetration testing integrations in CI/CD pipelines.
- Conduct threat modeling and vulnerability remediation for enterprise microservices.
- Enforce OWASP Top 10 standards and zero-trust application architectures.
"""
    },
    {
        "id": "scenario_4_frontend_lead",
        "name": "Camille Dupont - Staff Frontend Architect",
        "lang": "fr",
        "role": "Architecte Front-End & Design System",
        "cv": """Camille Dupont
Architecte Front-End | React, Next.js & Performance Web
Paris | +33 6 12 34 56 78 | camille.dupont@reactexpert.fr | github.com/cdupont

EXPÉRIENCES PROFESSIONNELLES
SaaS Enterprise France : Lead Front-End Developer | 2022 - Présent
- Piloté la refonte front-end complète vers Next.js 14 et Tailwind CSS, améliorant les Web Vitals (LCP < 1.2s, score 98/100).
- Conçu et maintenu un Design System partagé consommé par 8 équipes agiles, réduisant le time-to-market de 50%.

Digital Agency Paris : Développeuse Front-End Senior | 2019 - 2022
- Développé des interfaces SaaS réactives sous React, TypeScript et Redux Toolkit pour 500k utilisateurs actifs.

FORMATION
Télécom Paris - Diplôme d'ingénieur en Informatique et Réseaux (2016 - 2019)

COMPÉTENCES
React, TypeScript, Next.js, Tailwind CSS, Redux, Web Vitals, Jest, CI/CD, Architecture Front
""",
        "jd": """Architecte Front-End & Design System
Rejoignez notre scale-up internationale en tant qu'Architecte Front-End.
Missions :
- Définir l'architecture technique des applications web modernes sous React, Next.js et TypeScript.
- Structurer un Design System modulaire et optimiser les performances web (Core Web Vitals).
- Garantir la qualité du code par des tests unitaires et d'intégration rigoureux.
"""
    },
    {
        "id": "scenario_5_product_manager",
        "name": "Elena Rostova - Senior Technical Product Manager",
        "lang": "en",
        "role": "Principal Technical Product Manager",
        "cv": """Elena Rostova
Senior Technical Product Manager | API Platforms & Developer Experience
Zurich, Switzerland | +41 44 123 4567 | elena@apiproduct.ch | linkedin.com/in/erostova

EXPERIENCE
Nexus API Platform : Senior Technical Product Manager | 2022 - Present
- Owned the developer platform product roadmap, scaling monthly active API consumers by 140% to 35k developers.
- Defined technical specifications for GraphQL and REST interfaces, increasing developer onboarding conversion by 45%.

Fintech Solutions : Technical Product Owner | 2019 - 2022
- Managed backlog, user stories, and bi-weekly sprint planning across 3 distributed engineering teams.

EDUCATION
ETH Zurich - M.Sc. in Computer Science & Management (2017 - 2019)

SKILLS
Product Strategy, API Design, Agile, Scrum, Jira, Roadmapping, Data Analytics, Developer Experience
""",
        "jd": """Principal Technical Product Manager
Seeking an experienced Technical Product Manager to lead our Core API and Platform services.
Requirements:
- 4+ years managing developer-focused platforms, APIs, or enterprise SaaS products.
- Deep technical fluency in REST/GraphQL APIs, microservices, and modern developer tooling.
- Proven leadership in Agile roadmap execution and cross-functional engineering alignment.
"""
    },
    {
        "id": "scenario_6_backend_java",
        "name": "Hamza Benjelloun - Senior Backend Java Engineer",
        "lang": "fr",
        "role": "Ingénieur Back-End Java / Spring Boot",
        "cv": """Hamza Benjelloun
Ingénieur Back-End Senior | Java, Spring Boot & Systèmes Temps Réel
Rabat | +212 6 98 76 54 32 | h.benjelloun@javamaster.ma | github.com/hbenjelloun

EXPÉRIENCES PROFESSIONNELLES
Systèmes Monétiques Maroc : Développeur Java Senior | 2022 - Présent
- Conçu des services de traitement transactionnel bancaire sous Java 21 et Spring Boot, traitant 8M requêtes/jour.
- Optimisé les requêtes SQL et l'indexation PostgreSQL, réduisant le temps de réponse moyen de 180ms à 35ms.

Tech Delivery Rabat : Ingénieur Logiciel | 2020 - 2022
- Implémenté des architectures événementielles avec Apache Kafka et RabbitMQ sous Kubernetes.

FORMATION
EMI Rabat - Ingénieur d'État en Informatique (2017 - 2020)

COMPÉTENCES
Java, Spring Boot, Spring Data JPA, Kafka, PostgreSQL, Docker, Microservices, CI/CD, JUnit
""",
        "jd": """Ingénieur Back-End Java / Spring Boot
Leader dans les paiements numériques recrute un Ingénieur Back-End Senior.
Missions :
- Développement de microservices hautement scalables en Java / Spring Boot.
- Traitement de flux asynchrones avec Apache Kafka et bases de données PostgreSQL.
- Mise en place de tests automatisés et optimisation continue de la latence de traitement.
"""
    },
    {
        "id": "scenario_7_it_consultant",
        "name": "Nadia Chraibi - Senior IT Management Consultant",
        "lang": "fr",
        "role": "Consultante Senior Stratégie SI & AMOA",
        "cv": """Nadia Chraibi
Consultante Senior Stratégie SI | AMOA & Transformation Digitale
Casablanca | +212 6 55 44 33 22 | nadia.chraibi@consulting.ma | linkedin.com/in/nadiachraibi

EXPÉRIENCES PROFESSIONNELLES
Cabinet Conseil Casablanca : Consultante Senior SI | 2022 - Présent
- Conduit 8 missions de cadrage stratégique SI et AMOA pour des banques et assurances de premier plan.
- Rédigé les cahiers des charges fonctionnels et piloté la recette métier lors de l'intégration d'un ERP Core Banking.

Wavestone Partner : Consultante Junior | 2020 - 2022
- Réalisé des diagnostics de maturité digitale et élaboré des schémas directeurs des systèmes d'information.

FORMATION
Centrale Casablanca - Diplôme d'ingénieur d'État (2017 - 2020)

COMPÉTENCES
Stratégie SI, AMOA, Cadrage fonctionnel, Conduite du changement, Gestion de projet, Jira, PowerPoint, Excel
""",
        "jd": """Consultante Senior Stratégie SI & AMOA
Cabinet de conseil international recrute des Consultant(e)s pour accompagner la transformation digitale de ses clients.
Attentes :
- Cadrage stratégique des systèmes d'information et études d'opportunité.
- Accompagnement AMOA : expression de besoins, rédaction de spécifications, pilotage de projets.
- Rigueur, esprit d'analyse, excellentes qualités rédactionnelles et relationnelles.
"""
    },
    {
        "id": "scenario_8_devops_sre",
        "name": "Alexander Weiss - Site Reliability Engineer (SRE)",
        "lang": "en",
        "role": "Principal Site Reliability Engineer",
        "cv": """Alexander Weiss
Site Reliability Engineer (SRE) | Chaos Engineering & Distributed Reliability
Berlin, Germany | +49 30 1234567 | alex@sre-systems.de | github.com/aweiss-sre

EXPERIENCE
FinTech Scaleup Berlin : Lead SRE | 2022 - Present
- Maintained 99.995% uptime across 250 microservices by introducing Chaos Engineering and automated canary deployments.
- Decreased MTTR from 32 minutes to 4.5 minutes through automated root cause detection and runbook automation.

E-Commerce Global : Infrastructure Engineer | 2019 - 2022
- Managed multi-zone Kubernetes clusters and optimized cloud spending by 30% through automated pod autoscaling.

EDUCATION
Technical University of Berlin - M.Sc. in Computer Science (2017 - 2019)

SKILLS
SRE, Kubernetes, Chaos Engineering, Prometheus, Grafana, Terraform, Go, Linux, OpenTelemetry
""",
        "jd": """Principal Site Reliability Engineer
Global SaaS company seeking a Principal SRE to architect high-reliability automation.
Key Skills:
- Proven track record maintaining 99.99%+ service level objectives (SLOs/SLAs).
- Deep mastery of Kubernetes orchestration, Terraform, Prometheus/Grafana, and incident automation.
- Passion for chaos engineering, performance profiling, and resilient architectures.
"""
    },
    {
        "id": "scenario_9_fullstack_ai",
        "name": "Leila Benjelloun - Full Stack & GenAI Engineer",
        "lang": "fr",
        "role": "Ingénieure Full Stack & Solutions IA",
        "cv": """Leila Benjelloun
Ingénieure Full Stack & GenAI | Python, React & RAG Systems
Rabat | +212 6 22 11 00 99 | leila.b@aifullstack.ma | github.com/leilabnh

EXPÉRIENCES PROFESSIONNELLES
TechAI Studio : Ingénieure Full Stack IA | 2023 - Présent
- Développé des applications web intégrant des agents IA conversationnels sous FastAPI, React et LangChain.
- Déployé des pipelines RAG avec recherche sémantique vectorielle sous Qdrant, générant des synthèses en <2s.

SaaS Lab Maroc : Développeuse Web Full Stack | 2021 - 2023
- Conçu des API REST performantes et des interfaces interactives en React, Tailwind CSS et PostgreSQL.

FORMATION
ENSIAS Rabat - Diplôme d'ingénieur d'État en Génie Logiciel (2020 - 2023)

COMPÉTENCES
Python, FastAPI, React, LangChain, RAG, Qdrant, PostgreSQL, Docker, Tailwind CSS, REST APIs
""",
        "jd": """Ingénieure Full Stack & Solutions IA
Startup en intelligence artificielle recherche une Ingénieure Full Stack pour concevoir des produits SaaS dopés aux LLMs.
Exigences :
- Maîtrise de FastAPI / Python et de React / TypeScript.
- Expérience concrète dans la mise en œuvre de pipelines RAG (LangChain/LlamaIndex) et bases vectorielles.
- Esprit d'innovation, autonomie et rigueur dans les livrables techniques.
"""
    },
    {
        "id": "scenario_10_ai_research_eng",
        "name": "Dr. David Chen - AI / LLM Research Engineer",
        "lang": "en",
        "role": "Staff LLM & Generative AI Engineer",
        "cv": """David Chen, Ph.D.
Staff AI & LLM Engineer | Foundation Models & Inference Optimization
Boston, MA | +1 (617) 555-0199 | dchen@ai-systems.org | github.com/dchen-ai

EXPERIENCE
Frontier AI Labs : Staff AI Research Engineer | 2022 - Present
- Optimized multi-billion parameter LLM inference using vLLM, TensorRT-LLM, and flash attention, cutting latency by 50%.
- Fine-tuned specialized models on domain-specific datasets using LoRA/QLoRA with continuous evaluations.

MIT AI Center : Postdoctoral AI Researcher | 2020 - 2022
- Published 4 peer-reviewed papers on neural architectures and reinforcement learning from human feedback (RLHF).

EDUCATION
MIT - Ph.D. in Artificial Intelligence & Computer Science (2016 - 2020)

SKILLS
LLMs, PyTorch, vLLM, LoRA, Fine-Tuning, CUDA, Python, Distributed Training, HuggingFace
""",
        "jd": """Staff LLM & Generative AI Engineer
AI Platform Lab seeks a Staff LLM Engineer to push the boundaries of real-time foundation model inference.
Requirements:
- Ph.D. or M.Sc. in Computer Science, Machine Learning, or related field.
- Deep expertise in PyTorch, vLLM, TensorRT-LLM, model distillation, and quantization.
- Proven experience deploying low-latency LLM serving pipelines in production environments.
"""
    }
]


def run_test_suite():
    print(f"\n{'='*75}")
    print(f"STARTING COMPREHENSIVE 10-REAL-WORLD SCENARIOS AUDIT & TEST SUITE")
    print(f"{'='*75}\n")

    created_thread_ids = []
    passed_count = 0

    for idx, sc in enumerate(SCENARIOS, 1):
        print(f"[{idx}/10] Testing: {sc['name']} ({sc['role']})")
        start_t = time.time()

        # 1. Ingestion
        res_upload = requests.post(f"{BASE_URL}/api/audit/upload", data={"raw_text": sc["cv"]})
        assert res_upload.status_code == 200, f"Upload failed for {sc['id']}"
        upload_data = res_upload.json()
        tid = upload_data["thread_id"]
        created_thread_ids.append(tid)

        # 2. Stage 1 Health Diagnostic
        res_confirm = requests.post(f"{BASE_URL}/api/audit/confirm-parsing", json={
            "thread_id": tid,
            "verified_text": sc["cv"],
            "language": sc["lang"]
        })
        assert res_confirm.status_code == 200, f"Confirm failed for {sc['id']}"
        health_data = res_confirm.json()
        assert health_data["health_score"] >= 80.0, f"Low health score for {sc['id']}"

        # 3. Stage 2 Job Matching & Tailoring
        res_match = requests.post(f"{BASE_URL}/api/audit/match-job", json={
            "thread_id": tid,
            "job_description": sc["jd"],
            "target_role": sc["role"]
        })
        assert res_match.status_code == 200, f"Matching failed for {sc['id']}"
        match_data = res_match.json()

        # Handle HITL if triggered
        final_res = None
        if match_data.get("hitl_pending"):
            skill = match_data["hitl_question"]["skill"]
            res_resume = requests.post(f"{BASE_URL}/api/audit/resume/{tid}", json={
                "skill": skill,
                "decision": "APPROVED",
                "notes": "Verified hands-on production experience"
            })
            assert res_resume.status_code == 200
            final_res = res_resume.json()
        else:
            final_res = match_data

        # 4. Validations
        tailored_md = final_res["tailored_markdown"]
        cover_letter = final_res["cover_letter"]
        assert len(tailored_md) > 200, "Empty tailored markdown"
        assert len(cover_letter) > 100, "Empty cover letter"

        # 5. Export Resume PDF
        res_pdf = requests.post(f"{BASE_URL}/api/audit/export/pdf", json={"markdown_content": tailored_md})
        assert res_pdf.status_code == 200
        assert res_pdf.content.startswith(b"%PDF-")

        # 6. Export Cover Letter PDF
        res_cl_pdf = requests.post(f"{BASE_URL}/api/audit/export/pdf", json={"markdown_content": cover_letter})
        assert res_cl_pdf.status_code == 200
        assert res_cl_pdf.content.startswith(b"%PDF-")

        elapsed = round(time.time() - start_t, 2)
        print(f"   -> [PASSED] Score: {final_res.get('final_score')}% | PDFs generated in {elapsed}s")
        passed_count += 1

    print(f"\n{'='*75}")
    print(f"COMPREHENSIVE TEST SUITE COMPLETE: {passed_count}/10 SCENARIOS PASSED 100%!")
    print(f"{'='*75}\n")

    # Clean up test threads so demo database remains pristine
    print(f"Cleaning up {len(created_thread_ids)} temporary test threads...")
    for tid in created_thread_ids:
        requests.delete(f"{BASE_URL}/api/threads/{tid}")
    print("Database cleaned! Only curated demo threads remain.\n")


if __name__ == "__main__":
    run_test_suite()
