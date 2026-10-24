import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

# --- Real-World Resumes and Benchmark Profiles ---

SAMPLE_RESUMES = [
    {
        "id": "ali-consulting-fr",
        "title": "Mohamed Elmasrar - Conseil IT & Transformation Digitale (FR)",
        "language": "fr",
        "role": "Conseil IT & Transformation Digitale",
        "target_best_fit": ["wavestone-alma-fr", "deloitte-tech-fr", "pwc-tech-fr"],
        "raw_text": """Mohamed Elmasrar
Conseil IT & Transformation Digitale | Ingénierie logiciel & IA
Élève ingénieur ENSIAS | Stage PFE de 6 mois dès janvier 2027
Rabat | +212 6 64 01 43 22 | benhimaali170@gmail.com
linkedin.com/in/ali-benhima

EXPÉRIENCES PROFESSIONNELLES
CMSP : Product Owner / Chef de projet IT | Stage puis freelance 06/2025 - Présent
AMOA, ERP, Scrum, Jira, Coordination métiers/IT
— Mené des ateliers avec les équipes RH, finance, commerce et achats pour cadrer les besoins et les traduire en spécifications, priorités et backlog pour l'équipe de développement.
— Piloté les livraisons et la validation métier d'un ERP multi-entreprises (900+ salariés, 1 400+ contrats, 10 000+ documents), couvrant RH, contrats, pointage et facturation (gain estimé à 75%).

PayLogic : Ingénieur logiciel / Data & IA | Stage 07/2026 - 09/2026
Python, SQL, FastAPI, React, Qdrant, RAG, Docker
— Structuré la veille des marchés monétiques dans plus de 25 pays et défini un scoring métier pour prioriser les opportunités, réduisant de 90% le temps de qualification.
— Conçu une plateforme d'aide à la décision (recherche hybride, agent IA/RAG) générant des dossiers sourcés en moins de 35 s ; déploiement sur 11 conteneurs Docker supervisés.

NetXpert : Consultant IT / Développeur indépendant | Freelance 02/2025 - 04/2026
Relation client, cadrage fonctionnel, livraison, Stripe, Google Maps
— Cadré et livré des plateformes de services, systèmes de réservation et sites web pour des clients marocains et internationaux, du besoin métier au déploiement.
— Intégré des paiements Stripe, notifications e-mail et services Google Maps, en assurant la relation client et le suivi des évolutions.

SetupSys : Ingénieur logiciel | Stage 03/2024 - 06/2024
Java, Spring Boot, React, Kafka, Docker, Kubernetes, CI/CD, Tests
— Développé un SaaS multi-cabinets (patients, rendez-vous, paiements) en microservices ; fiabilisé les livraisons via CI/CD et tests (plus de 80% de couverture).

PROJETS
RGPD AI Copilot | FastAPI, React, RAG, LLMs, Agents IA, Qdrant, Docker
– Conçu un copilote d’audit RGPD (Règlement général sur la protection des données) : analyse documentaire, détection d’écarts, rapports sourcés et recommandations pour prioriser les actions correctives.

FORMATION
École Nationale Supérieure d'Informatique et d'Analyse des Systèmes (ENSIAS) 09/2024 - 06/2027
Diplôme d'ingénieur d'État - Génie logiciel et Data Science
Université Mohammed V - Faculté des Sciences de Rabat (UM5 FSR) 09/2023 – 06/2024
Licence en Sciences mathématiques et informatique | Mention : Très Bien | Major de promotion (1er/220+)

COMPÉTENCES
— Conseil & AMOA : Cadrage SI, besoins métiers, spécifications, cartographie, conduite du changement
— Projet & Produit : Product Ownership, coordination métiers/IT, backlog, Jira, Scrum, recette métier
— Analyse & restitution : Études de marché, analyse de données, KPI, SQL, Excel, PowerPoint, reporting
— Technologies : Python, Java, React, Spring Boot, FastAPI, PostgreSQL, RAG, agents IA, Docker, AWS
— Soft Skills : Esprit d’analyse, synthèse, communication, résolution de problèmes, leadership, travail d’équipe
— Langues : Français (courant), Anglais (courant), Arabe (natif)

DISTINCTIONS ET CERTIFICATIONS
— Certifications : Oracle Certified Associate Java SE 8 Programmer, AWS Certified Cloud Practitioner
— Hackathons : 2e Prix AI Summer School Université Al Akhawayn, 2e Prix Data & AI Hackathon INPT

LEADERSHIP ET ACTIVITÉS ASSOCIATIVES
Président ENSIAS IT Club : Coordonné 230+ membres et organisé 15+ événements techniques.
Membre CINDH : Participation à l’organisation d’actions solidaires et caritatives.
"""
    },
    {
        "id": "ali-swe-genai-en",
        "title": "Salaheddine Benghemid - Software Engineer | Full Stack & GenAI (EN)",
        "language": "en",
        "role": "Software Engineer | Full Stack & GenAI",
        "target_best_fit": ["bcg-x-swe-en", "ostorlab-cyber-en", "capgemini-backend-fr", "mastercard-advisors-en"],
        "raw_text": """Salaheddine Benghemid
Software Engineer | Full Stack & GenAI
ENSIAS Engineering Student | Final-Year Internship (PFE) from January 2027
Rabat | +212 6 64 01 43 22 | benhimaali170@gmail.com | linkedin.com/in/ali-benhima | github.com/AliBnh

PROFESSIONAL EXPERIENCE
PayLogic: Software Engineer | Internship 07/2026 - 09/2026
Python, FastAPI, React, PostgreSQL, Qdrant, Docker, Prometheus, Grafana, RAG, AI Agents, LLMs
- Engineered a full-stack market intelligence platform for digital payment systems across 25+ countries, integrating a hybrid search engine and automated business scoring to reduce qualification time by 90%.
- Deployed an AI agent (RAG with tool-calling and quota guards) that generates sourced briefs in <35s for human-in-the-loop validation, orchestrated across 11 Docker containers and monitored via Prometheus/Grafana (P95<100ms).

CMSP: Software Engineer | Internship 06/2025 - 12/2025
Java, SpringBoot, Spring JPA, Maven, React, Tailwind CSS, PostgreSQL, Jira, Scrum, Agile
- Contributed to the development of an internal multi-company ERP in production, integrating HR, contracts, time and attendance, billing and document management for 900+ employees, 1400+ contracts and 10000+ documents.
- Collaborated within a Scrum team to automate attendance, billing and the contract lifecycle, achieving estimated overall time savings of 75%.

SetupSys: Software Engineer | Internship 03/2024 - 06/2024
Java, Spring Boot, JUnit, FastAPI, PostgreSQL, Kafka, Docker, Kubernetes, Jenkins, Prometheus, Grafana
- Developed a SaaS platform for multiple medical practices, centralizing patients, appointments and payments.
- Designed a microservices architecture with asynchronous processing via Kafka, ensuring reliability through a CI/CD pipeline (GitHub Actions) and >80% test coverage.

PROJECTS
GDPR AI Copilot | FastAPI, React, RAG, LLMs, AI Agents, Qdrant, Docker
- Developed a copilot for automated GDPR compliance audits, analyzing internal documents and generating structured reports through a RAG pipeline and an AI agent.
- Designed a microservices architecture for semantic search, document analysis and decision support.

AI Learning Path Generator | FastAPI, React, Redis, PostgreSQL, LLMs, JWT
- Developed a web application generating personalized IT roadmaps through an LLM pipeline (Gemini API) and prompt engineering; integrated resource recommendations and progress tracking.

EDUCATION
National Higher School of Computer Science and Systems Analysis (ENSIAS) 09/2024 - 06/2027
State Engineering Degree - Software Engineering and Data Science
Mohammed V University - Faculty of Sciences, Rabat (UM5 FSR) 09/2023 - 06/2024
Bachelor's Degree in Mathematics and Computer Science | Honors: Very Good | Top of Class (1st/220+)

SKILLS
- Languages & Full Stack: Java, Python, SQL, Spring Boot, FastAPI, React, REST APIs, Microservices, OOP
- AI & Data: LLMs, RAG, PostgreSQL, MongoDB, VectorDB
- Cloud & DevOps: Docker, Jenkins, CI/CD, Git, AWS
- Languages: English (fluent), French (fluent), Arabic (native)
- Soft Skills: Communication, Teamwork, Problem-solving, Independence, Attention to detail.

AWARDS AND CERTIFICATIONS
- Certifications: Oracle Certified Associate Java SE 8 Programmer, AWS Certified Cloud Practitioner
- Hackathons: 2nd Prize, AI Summer School, Al Akhawayn University; 2nd Prize, Data & AI Hackathon, INPT

LEADERSHIP AND COMMUNITY INVOLVEMENT
President of ENSIAS IT Club: Led a community of 230+ members and organized 15+ technical events (hackathons, conferences, training sessions), strengthening student engagement and skills development.
CINDH Member: Helped organize several community support and charitable initiatives.
"""
    },
    {
        "id": "ali-consulting-en",
        "title": "Ali BENHIMA - IT Consulting & Digital Transformation (EN)",
        "language": "en",
        "role": "IT Consulting & Digital Transformation",
        "target_best_fit": ["visa-vca-en", "mastercard-advisors-en"],
        "raw_text": """Ali BENHIMA
IT Consulting & Digital Transformation | Software Engineering & AI
ENSIAS Engineering Student | 6-Month Final-Year Internship from January 2027
Rabat | +212 6 64 01 43 22 | benhimaali170@gmail.com
linkedin.com/in/ali-benhima

PROFESSIONAL EXPERIENCE
CMSP : Product Owner / IT Project Manager | Internship, then Freelance 06/2025 - Present
Business Analysis, ERP, Scrum, Jira, Business/IT Coordination
• Led workshops with HR, finance, sales, and procurement teams to gather requirements and translate them into specifications, priorities, and a development backlog.
• Oversaw delivery and business acceptance testing of a multi-company ERP (900+ employees, 1 400+ contracts, 10 000+ documents) covering HR, contracts, time tracking, and invoicing (estimated 75% time savings).

PayLogic : Software Engineer / Data & AI | Internship 07/2026 - 09/2026
Python, SQL, FastAPI, React, Qdrant, RAG, Docker
• Structured payments market intelligence across 25+ countries and defined business scoring criteria to prioritize opportunities, reducing qualification time by 90%.
• Built a decision-support platform (hybrid search, AI/RAG agent) generating source-backed reports in under 35 seconds; deployed across 11 monitored Docker containers.

NetXpert : IT Consultant / Independent Developer | Freelance 02/2025 - 04/2026
Client Relations, Requirements Scoping, Delivery, Stripe, Google Maps
• Scoped and delivered service platforms, booking systems, and websites for Moroccan and international clients, from business requirements to deployment.
• Integrated Stripe payments, email notifications, and Google Maps; managed client relations and ongoing updates.

SetupSys : Software Engineer | Internship 03/2024 - 06/2024
Java, Spring Boot, React, Kafka, Docker, Kubernetes, CI/CD, Testing
• Developed a multi-practice SaaS (patients, appointments, payments) using microservices; improved delivery reliability via CI/CD and tests (over 80% coverage).

PROJECTS
GDPR AI Copilot | FastAPI, React, RAG, LLMs, AI Agents, Qdrant, Docker
– Designed a GDPR (General Data Protection Regulation) audit copilot: document analysis, gap detection, source-backed reports, and recommendations to prioritize corrective actions.

EDUCATION
National School of Computer Science and Systems Analysis (ENSIAS) 09/2024 - 06/2027
State Engineering Degree - Software Engineering and Data Science
Mohammed V University - Faculty of Sciences, Rabat (UM5 FSR) 09/2023 - 06/2024
Bachelor’s Degree in Mathematics and Computer Science | High Honors | Ranked 1st out of 220+ students

SKILLS
• IT Consulting & Business Analysis: IT scoping, business needs, specifications, process mapping, change management
• Project & Product: Product Ownership, business/IT coordination, backlog, Jira, Scrum, UAT
• Analysis & Reporting: Market research, data analysis, KPIs, SQL, Excel, PowerPoint, reporting
• Technologies: Python, Java, React, Spring Boot, FastAPI, PostgreSQL, RAG, AI agents, Docker, AWS
• Soft Skills: Analytical thinking, synthesis, communication, problem-solving, leadership, teamwork
• Languages: French (fluent), English (fluent), Arabic (native)

AWARDS AND CERTIFICATIONS
• Certifications: Oracle Certified Associate Java SE 8 Programmer, AWS Certified Cloud Practitioner
• Hackathons: 2nd Place, Al Akhawayn University AI Summer School; 2nd Place, INPT Data & AI Hackathon

LEADERSHIP AND COMMUNITY INVOLVEMENT
President, ENSIAS IT Club: Coordinated 230+ members and organized 15+ technical events.
CINDH Member: Participated in organizing community outreach and charitable initiatives.
"""
    },
    {
        "id": "ali-swe-fastapi-fr",
        "title": "Ali BENHIMA - Software Engineer | Full Stack & GenAI (FR)",
        "language": "fr",
        "role": "Software Engineer | Full Stack & GenAI",
        "target_best_fit": ["ostorlab-cyber-en", "capgemini-backend-fr"],
        "raw_text": """Ali BENHIMA
Software Engineer | Full Stack & GenAI
Élève ingénieur ENSIAS | Stage PFE dès janvier 2027
Rabat | +212 6 64 01 43 22 | benhimaali170@gmail.com
linkedin.com/in/ali-benhima | github.com/AliBnh

EXPÉRIENCES PROFESSIONNELLES
PayLogic : Ingénieur Logiciel | Stage 07/2026 - 09/2026
Python, FastAPI, React, PostgreSQL, Qdrant, Docker, Prometheus, Grafana, RAG, AI Agents, LLMs
— Conçu une plateforme full-stack de veille sur les marchés monétiques (+25 pays), intégrant un moteur hybride (BM25 + vectoriel Qdrant) et un scoring métier automatisé, réduisant de 90% le temps de qualification.
— Déployé un agent IA autonome (RAG tool-calling, quota guard) générant des dossiers sourcés en <35s pour validation humaine, orchestré sur 11 conteneurs Docker supervisés via Prometheus/Grafana (P95 < 50ms).

CMSP : Ingénieur Logiciel | Stage 06/2025 - 12/2025
Python, FastAPI, React, Tailwind CSS, PostgreSQL, Jira, Scrum, Agile
— Contribué au développement d’un ERP interne multi-entreprises en production, intégrant RH, contrats, pointage, facturation et la gestion documentaire à l’échelle de +900 salariés, +1400 contrats et +10000 documents.
— Collaboré, en équipe Scrum, à l’automatisation du pointage, de la facturation et du cycle contractuel, avec un gain de temps global estimé à 75%.

SetupSys : Ingénieur Logiciel | Stage 03/2024 - 06/2024
Java, Spring Boot, JUnit, FastAPI, PostgreSQL, Kafka, Docker, Kubernetes, Jenkins, Prometheus, Grafana
— Développé un SaaS multi-cabinets médicaux centralisant patients, rendez-vous et paiements.
— Conçu une architecture microservices, avec traitement asynchrone via Kafka, garantissant la fiabilité via pipeline CI/CD (Github Actions) et >80% de couverture de tests.

PROJETS
RGPD AI Copilot | FastAPI, React, RAG, LLMs, AI Agents, Qdrant, Docker
– Développé un copilote d’audit automatisé de conformité RGPD, analysant les documents internes et générant des rapports structurés via un pipeline RAG et un agent IA.
– Conçu une architecture microservices pour recherche sémantique, analyse documentaire et assistance à la décision.

AI Learning Path Generator | FastAPI, React, Redis, PostgreSQL, LLMs, JWT
– Développé une application web générant des parcours IT personnalisés via un pipeline LLM (Gemini API) et du prompt engineering ; intégré la recommandation de ressources et le suivi de progression.

FORMATION
École Nationale Supérieure d’Informatique et d’Analyse des Systèmes (ENSIAS) 09/2024 - 06/2027
Diplôme d’ingénieur d’État - Génie logiciel et Data Science
Université Mohammed V - Faculté des Sciences de Rabat (UM5 FSR) 09/2023 – 06/2024
Licence en Sciences mathématiques et informatique | Mention : Très Bien | Major de promotion (1er/220+)

COMPÉTENCES
— Langages & Full Stack : Java, Python, SQL, Spring Boot, FastAPI, React, REST APIs, Microservices, POO
— AI & Data : LLMs, RAG, PostgreSQL, MongoDB, VectorDB
— Cloud & DevOps : Docker, Jenkins, CI/CD, Git, AWS
— Langues : Anglais (courant), Français (courant), Arabe (natif)
— Soft Skills : Communication, Travail d’équipe, Résolution de problèmes, Autonomie, Rigueur.

DISTINCTIONS ET CERTIFICATIONS
— Certifications : Oracle Certified Associate Java SE 8 Programmer, AWS Certified Cloud Practitioner
— Hackathons : 2e Prix AI Summer School Université Al Akhawayn, 2e Prix Data & AI Hackathon INPT

LEADERSHIP ET ACTIVITÉS ASSOCIATIVES
Président ENSIAS IT Club : Piloté une communauté de 230+ membres et organisé 15+ événements techniques.
Membre CINDH : Participation à l’organisation de plusieurs actions solidaires et caritatives.
"""
    }
]

# --- Real-World Target Job Descriptions from Top Employers ---

SAMPLE_JOB_DESCRIPTIONS = [
    {
        "id": "wavestone-alma-fr",
        "title": "Wavestone Casablanca - ALMA Consultant.e Stagiaire",
        "company": "Wavestone Casablanca (ALMA)",
        "language": "fr",
        "best_fit_resume": "ali-consulting-fr",
        "text": """ALMA - Consultant.e stagiaire
Wavestone Casablanca, Maroc | Mode hybride | Stage PFE 6 mois

Description du poste :
Intégrant le collectif des 40 consultant.e.s du bureau de Casablanca et dans un contexte d’accentuation des risques liés aux technologies ou à la géopolitique, les enjeux de souveraineté sont plus que jamais présents chez nos clients. Dans ce contexte, vous serez amenés à intervenir sur :
- Gouvernance et gestion des risques : diagnostics de maturité cyber, stratégies de cybersécurité, analyses de risques numériques.
- IA, cybersécurité et souveraineté numérique : stratégies de souveraineté numérique, impacts de l'IA sur les infrastructures, IA pour la cyber.
- Cadrage et stratégie, études d'opportunité (PoC, études de marché), gouvernance, AMOA, conduite du changement.

Qualifications recherchées :
- Étudiant(e) en dernière année d'une grande école d'ingénieurs (recherche stage de fin d'études 6 mois).
- Appétence forte pour la transformation numérique, le conseil, la gouvernance SI et l'IA.
- Esprit d’analyse, synthèse, curiosité, sens du service client.
- Maîtrise courante du Français et de l'Anglais.
"""
    },
    {
        "id": "deloitte-tech-fr",
        "title": "Deloitte Afrique - Stagiaire Conseil en Technologies",
        "company": "Deloitte Afrique (Casablanca)",
        "language": "fr",
        "best_fit_resume": "ali-consulting-fr",
        "text": """Deloitte Afrique - Stagiaire Conseil en Technologies (6 mois)
Casablanca, Maroc

Missions au sein de l'activité Technology Consulting :
- Élaboration de stratégie IT et schéma directeur SI.
- Diagnostic et définition de trajectoire d’évolution des systèmes d’information.
- AMOA : expression des besoins, spécifications fonctionnelles, choix de solutions et recette métier.
- Assistance à la gestion de projet (coordination, pilotage des risques, budget, PMO).
- Élaboration de modèles financiers étayant les transformations SI et Due Diligence IT.

Profil recherché :
- Étudiant(e) en dernière année d'école d'ingénieurs ou de commerce avec spécialisation SI ou data.
- Très bon sens de la formalisation, rigueur, esprit de synthèse.
- Maîtrise des outils bureautiques (PowerPoint, Excel) et bonne culture technologique (Cloud, ERP, IA).
- Français et anglais courants.
"""
    },
    {
        "id": "pwc-tech-fr",
        "title": "PwC Morocco - Stagiaire Conseil en Technologie & AMOA",
        "company": "PwC Morocco (Casablanca)",
        "language": "fr",
        "best_fit_resume": "ali-consulting-fr",
        "text": """PwC Technology Consulting - Stage PFE (6 mois)
Casablanca, Maroc

Rôle et missions :
- Stratégie SI et alignement entre besoins métiers et informatique.
- Accompagnement des DSI dans leur organisation, leur gouvernance et la maîtrise des coûts.
- AMOA : recueil des besoins, rédaction des cahiers des charges, recette fonctionnelle et conduite du changement.
- Pilotage de projets de transformation numérique et sélection d'outils ERP/SaaS.

Profil :
- Étudiant(e) en dernière année d'école d'ingénieurs ou Master spécialisé en SI / Informatique.
- Capacités rédactionnelles, esprit d'analyse et de synthèse.
- Français et anglais courants à l'écrit comme à l'oral.
"""
    },
    {
        "id": "visa-vca-en",
        "title": "Visa Consulting & Analytics (VCA) - Intern",
        "company": "Visa Consulting & Analytics (VCA)",
        "language": "en",
        "best_fit_resume": "ali-consulting-en",
        "text": """Visa Consulting & Analytics (VCA) - Consulting & Analytics Intern
Casablanca / Regional Hub

Role & Responsibilities:
- Conduct market research and gather digital payments industry intelligence.
- Analyze internal and external transaction data to identify trends and strategic opportunities across fintechs and financial institutions.
- Support consulting teams in developing recommendations and presentation decks for executive clients.
- Advanced proficiency in data analysis, Excel-based models, and PowerPoint presentations.
- Strong problem-solving, structured analytical thinking, and client orientation.
- Degree in Engineering, Computer Science, Data Analytics, Economics, or related fields.
"""
    },
    {
        "id": "mastercard-advisors-en",
        "title": "Mastercard Advisors - Associate Consultant Intern",
        "company": "Mastercard Advisors & Consulting Services (Casablanca)",
        "language": "en",
        "best_fit_resume": "ali-consulting-en",
        "text": """Mastercard Advisors & Consulting Services - Associate Consultant Intern
Morocco

What you’ll do:
- Collaborate within small teams to support strategic consulting engagements across digital payments, banking, and retail.
- Analyze data, identify market trends, and translate insights into actionable C-level recommendations.
- Create clear, compelling presentations and structured financial/operational models.
- Support strategy, operating model transformation, and technological innovation.
- Core competencies: Analytical excellence, structured problem solving, data query skills (SQL, Python), excellent English communication.
"""
    },
    {
        "id": "bcg-x-swe-en",
        "title": "BCG X Delivery - Software Engineering Intern",
        "company": "Boston Consulting Group (BCG X)",
        "language": "en",
        "best_fit_resume": "ali-swe-genai-en",
        "text": """BCG X Delivery - Software Engineering Intern (6-Month Internship)
Casablanca, Morocco

What You'll Do:
- Support product and consulting teams in designing, building, and delivering scalable technology solutions.
- Hands-on exposure to modern software engineering across the full lifecycle (Clean Code, TDD, OOP).
- Backend development with Python (FastAPI, Django) or Node.js / Java Spring Boot.
- Frontend development with React, TypeScript, and modern styling libraries (Tailwind CSS).
- Relational databases (PostgreSQL) and vector databases.
- Microservices, Docker containerization, Git workflows, and CI/CD automation.
- Fluent in English (French is a plus).
"""
    },
    {
        "id": "ostorlab-cyber-en",
        "title": "Ostorlab - Cybersecurity & Security Platform Intern",
        "company": "Ostorlab (Casablanca)",
        "language": "en",
        "best_fit_resume": "ali-swe-genai-en",
        "text": """Ostorlab - Security Testing Automation Platform Intern
Casablanca, Morocco | 6-month internship

Role Overview:
Ostorlab is a fast-growing cybersecurity startup and security testing automation platform trusted by 22,000+ developers in 80+ countries.
- Develop services and improve scanning pipelines powering static and dynamic security analysis.
- Maintain clean, performant, and secure RESTful APIs (Python).
- Use AI-assisted coding and automated testing to build high-performance distributed systems.
- Contribute to production systems, Docker containers, and CI/CD pipelines.
- Solid understanding of data structures, algorithms, and clean software architecture.
"""
    },
    {
        "id": "capgemini-backend-fr",
        "title": "Capgemini Engineering - Stagiaire Développeur Back-End / Full Stack",
        "company": "Capgemini Engineering (Casablanca)",
        "language": "fr",
        "best_fit_resume": "ali-swe-fastapi-fr",
        "text": """Capgemini Engineering - Stagiaire Développeur Back-End / Full Stack (Bac+5)
Casablanca, Maroc

Missions du stage :
- Conception et développement des services back-end pour l'application d'éco-mobilité Smart Carpool Network.
- Maîtrise de Java Spring Boot ou Python FastAPI / Node.js, et des API REST.
- Modélisation et requêtes sur bases de données relationnelles PostgreSQL / MySQL.
- Gestion de l'authentification sécurisée, respect du RGPD, et conteneurisation Docker.
- Calcul en temps réel des indicateurs d'impact et déploiement cloud (Azure).
- Niveau Bac+5 / École d’ingénieur d'État.
"""
    },
    {
        "id": "sofrecom-fullstack-fr",
        "title": "Sofrecom - Développeur Full Stack (Java / Spring Boot / Angular)",
        "company": "Sofrecom (Orange Group)",
        "language": "fr",
        "best_fit_resume": "ali-swe-fastapi-fr",
        "text": """Sofrecom - Développeur Full Stack (Java / Spring Boot / Angular)
Maroc

À propos du poste :
Dans le cadre du renforcement de notre équipe, nous recherchons un(e) jeune diplômé(e) motivé(e) et passionné(e) par le développement logiciel, pour rejoindre un projet innovant au sein d’un environnement technique stimulant. Vous participerez à la conception, au développement et à la maintenance d’applications web, en collaboration avec une équipe technique expérimentée.

Missions principales :
- Participer au développement d’applications full stack
- Concevoir et développer des fonctionnalités back-end et front-end
- Contribuer à l’intégration des API et aux tests techniques
- Participer à l’amélioration continue des applications
- Collaborer avec les équipes projet et technique
- Respecter les bonnes pratiques de développement et de qualité logicielle

Compétences techniques requises :
Indispensables :
- Architecture Full Micro-services
- Angular
- Java, Spring Boot
- SQL, MariaDB
- Git / GitLab

Souhaitables :
- Spring Cloud
- Méthodologie Scrum
- Docker, GitLab CI/CD
- Camunda

Profil recherché :
- Jeune diplômé(e) en informatique, développement logiciel ou domaine équivalent
- Bonne base en développement web et programmation orientée objet
- Motivation, rigueur et envie d’apprendre
- Esprit d’équipe et bonne capacité d’adaptation
- Autonomie progressive et sens du service
"""
    },
    {
        "id": "capgemini-data-ai-fr",
        "title": "Capgemini Engineering - Stagiaire PFE Data & AI",
        "company": "Capgemini Engineering",
        "language": "fr",
        "best_fit_resume": "ali-swe-fastapi-fr",
        "text": """Capgemini Engineering - Stagiaire PFE Data & AI
Maroc | Mode hybride | Stage PFE Bac+5

À propos du poste :
Capgemini Engineering recherche un(e) stagiaire PFE Data & AI pour rejoindre notre équipe et contribuer au développement de solutions analytiques et d’intelligence artificielle. Vous participerez à l’exploitation, la valorisation et l’automatisation des données afin d’améliorer nos processus internes et faciliter la prise de décision.

Les missions du poste :
- Concevoir des analyses exploratoires et réaliser des visualisations pertinentes.
- Participer au développement de modèles d’IA et de machine learning.
- Contribuer à la création ou la mise à jour de dashboards (Power BI / Tableau).
- Automatiser des scripts et pipelines de données.
- Documenter les travaux réalisés et assurer le suivi des projets.
- Réaliser une veille sur les technologies Data & AI.

Votre profil :
- Étudiant(e) en dernière année Bac+5 en Data Science, Big Data, AI ou équivalent.
- Maîtrise de Python (pandas, numpy, scikit-learn).
- Connaissance des bases de données SQL.
- Bonne compréhension du machine learning et des méthodes statistiques.
- À l’aise avec un outil de data visualisation.
- Curiosité, rigueur, sens analytique, et capacité à travailler en équipe.
"""
    },
    {
        "id": "viseo-senior-llm-en",
        "title": "VISEO - (Senior) Software Engineer (LLMs & GenAI)",
        "company": "VISEO",
        "language": "en",
        "best_fit_resume": "ali-swe-genai-en",
        "text": """VISEO - (Senior) Software Engineer (LLMs & GenAI)
Hybrid / Global | Full-Time

About the job:
We are seeking a (Senior) Software Engineer with strong technical expertise and hands-on experience in integrating Large Language Models (LLMs) into software applications. This role emphasizes excellent software architecture and development skills, with the ability to support and scale production applications deployed to thousands of users. You will be responsible for building, evolving, and maintaining a collection of AI-first applications within a team of software engineers.

Main Responsibilities:
- Develop applications incorporating Agent workflows, LLMs, and RAG in their functionalities.
- Implement prompt engineering techniques for LLMs (OpenAI, Anthropic, Mistral, Groq).
- Containerize AI applications with Docker and orchestrate cloud deployments (Kubernetes).
- Develop intelligent agents and complex stateful workflows.
- Scale MVPs to production-grade enterprise applications.
- Build Proofs of Concept (PoC) to validate AI solutions and manage the full lifecycle of generative applications.

Requirements:
- 3-5 years of full-stack software engineering experience.
- Python & TypeScript.
- Docker and Kubernetes.
- CI/CD pipelines and Git-based workflows.
- Software architecture, OOP, and clean design patterns.
- SQL databases (PostgreSQL/MySQL).
- Authentication standards (JWT/OAuth2).
- Unit and integration testing.

Desirable skills / experience:
- Next.js / React with Tailwind CSS.
- Integrating LLMs (OpenAI, Anthropic, Mistral) into enterprise applications.
- Practical experience coding with AI assistants (Claude Code, Cursor, Copilot) with session memory and context.
- Start-up mindset, obsession with delivering impact, and high sense of ownership.
- Fluent in English.
"""
    },
    {
        "id": "chaingpt-ainative-en",
        "title": "ChainGPT - AI-Native Software Engineer (Early Career)",
        "company": "ChainGPT",
        "language": "en",
        "best_fit_resume": "ali-swe-genai-en",
        "text": """ChainGPT - AI-Native Software Engineer (Early Career)
Remote / Global | Full-Time

About ChainGPT:
ChainGPT is a fast-moving Web3 and AI company building products at the intersection of blockchain infrastructure, token ecosystems, and intelligent automation. We're building Brain by AIVM, a platform that makes enterprise AI verifiable, governed, and genuinely trustworthy.

About The Role:
We're looking for an exceptional early-career engineer who has grown up building with AI. What matters most is raw ability, curiosity, strong technical instincts, and a genuine obsession with modern AI tooling. You'll work closely with founders and senior engineers, build real features and prototypes, and learn how to use AI agents to move faster than traditional teams.

What You'll Do:
- Build real features, prototypes, and demos using tools like Codex, Claude Code, and modern AI coding agents.
- Turn ideas into working demos quickly, then help make them more reliable, scalable, and production-ready.
- Learn how to direct, evaluate, and control AI coding agents to multiply engineering output.
- Explore new AI development workflows, agentic systems, and automations.
- Contribute to a fast-moving product where experimentation, speed, and quality all matter.

Requirements:
- You build with AI tools regularly and have examples of projects, repos, demos, prototypes, or technical experiments.
- Excited about tools like Cursor, Claude Code, AI agents, and agentic development workflows.
- Strong technical curiosity and ability to figure things out independently.
- Background or strong interest in Python, TypeScript, modern web stacks, and AI agents.
- Fluent in English, high ownership mindset, and rapid learning velocity.
"""
    }
]


def seed_database(db: Session):
    """Creates default test user and pre-seeds demonstration threads if empty."""
    try:
        # Check if demo user already exists
        existing_user = db.query(User).filter(User.email == "demo@agenticats.com").first()
        if not existing_user:
            demo_user = User(
                email="demo@agenticats.com",
                hashed_password=get_password_hash("Password123!"),
                full_name="Demo User"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            logger.info("Successfully seeded demo user: demo@agenticats.com / Password123!")
        else:
            if existing_user.full_name != "Demo User":
                existing_user.full_name = "Demo User"
                db.commit()
                logger.info("Updated demo user display name to Demo User.")
            logger.info("Demo user already exists.")
    except Exception as e:
        logger.warning(f"Database seed skipped or failed: {e}")
