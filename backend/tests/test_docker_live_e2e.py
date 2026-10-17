import io
import time
import requests
import pypdf

BASE_URL = "http://localhost:8000"

def run_live_scenario(scenario_name, resume_id, jd_id, user_verification_note="2 years production experience"):
    print(f"\n{'='*75}")
    print(f"[LIVE DOCKER TEST] {scenario_name}")
    print(f"{'='*75}")

    # 1. Fetch sample catalog from live Docker container
    catalog_res = requests.get(f"{BASE_URL}/api/threads/samples/catalog")
    assert catalog_res.status_code == 200
    catalog = catalog_res.json()
    
    resume_obj = next((r for r in catalog["sample_resumes"] if r["id"] == resume_id), None)
    jd_obj = next((j for j in catalog["sample_jds"] if j["id"] == jd_id), None)
    assert resume_obj is not None, f"Resume {resume_id} not found"
    assert jd_obj is not None, f"JD {jd_id} not found"

    print(f"1. Ingesting Candidate: {resume_obj['title']}...")
    upload_res = requests.post(f"{BASE_URL}/api/audit/upload", data={"raw_text": resume_obj["raw_text"]})
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    thread_id = upload_data["thread_id"]
    detected_lang = upload_data["detected_language"]
    print(f"   [OK] Thread ID: {thread_id} | Language: {detected_lang.upper()} ({upload_data['language_confidence']*100}%)")

    # 2. Stage 1 Health Diagnostic
    print("2. Executing Stage 1 Diagnostic Health Audit...")
    confirm_res = requests.post(f"{BASE_URL}/api/audit/confirm-parsing", json={
        "thread_id": thread_id,
        "verified_text": upload_data["extracted_text"],
        "language": detected_lang
    })
    assert confirm_res.status_code == 200
    diag_data = confirm_res.json()
    print(f"   [OK] Overall Health: {diag_data['health_score']}% | ATS: {diag_data['ats_formatting_score']}% | STAR: {diag_data['content_impact_score']}% | Norms: {diag_data['language_norm_score']}%")

    # 3. Stage 2 Target Job Matching
    print(f"3. Matching against Target Role: '{jd_obj['title']}'...")
    start_time = time.time()
    match_res = requests.post(f"{BASE_URL}/api/audit/match-job", json={
        "thread_id": thread_id,
        "job_description": jd_obj["text"],
        "target_role": jd_obj["title"]
    })
    assert match_res.status_code == 200
    match_data = match_res.json()

    # 4. Handle HITL if triggered
    final_res = None
    if match_data.get("hitl_pending"):
        q = match_data["hitl_question"]
        skill = q["skill"]
        print(f"   [HITL BREAKPOINT] Intercepted unverified skill: '{skill}'")
        print(f"   Question: {q['question']}")
        print(f"   -> Resuming with User Clearance: APPROVED ({user_verification_note})...")
        
        resume_res = requests.post(f"{BASE_URL}/api/audit/resume/{thread_id}", json={
            "skill": skill,
            "decision": "APPROVED",
            "notes": user_verification_note
        })
        assert resume_res.status_code == 200
        final_res = resume_res.json()
        print("   [OK] State machine successfully resumed from PostgreSQL checkpoint!")
    else:
        final_res = match_data

    elapsed = round(time.time() - start_time, 2)
    print(f"4. Optimization Results (Groq Inference Time: {elapsed}s):")
    print(f"   [OK] Initial ATS Score: {final_res['initial_score']}% -> Final ATS Score: {final_res['final_score']}%")
    print(f"   [OK] Score Convergence Path: {final_res['score_history']}")
    print(f"   [OK] Matched Skills: {', '.join(final_res['matched_skills'][:8])}")
    print(f"   [OK] Tailored Bullets (Diff items): {len(final_res.get('diff', []))}")

    # 5. Export PDF
    print("5. Validating Live ATS PDF Export...")
    pdf_res = requests.post(f"{BASE_URL}/api/audit/export/pdf", json={
        "markdown_content": final_res["tailored_markdown"]
    })
    assert pdf_res.status_code == 200
    pdf_bytes = pdf_res.content
    assert pdf_bytes.startswith(b"%PDF-"), "Invalid PDF binary stream"
    
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    print(f"   [OK] Downloaded valid ATS PDF ({len(pdf_bytes)} bytes, {len(reader.pages)} page(s)).")
    print(f"[SUCCESS] {scenario_name} PASSED COMPLETELY ON DOCKER!\n")


if __name__ == "__main__":
    # Test User's Specific Real-World Pairings:
    
    # 1. Ali BENHIMA (Conseil IT) -> Wavestone Casablanca (ALMA)
    run_live_scenario(
        scenario_name="Pairing 1: Ali BENHIMA -> Wavestone ALMA (Cyber & Stratégie)",
        resume_id="ali-consulting-fr",
        jd_id="wavestone-alma-fr",
        user_verification_note="Cadrage stratégique et analyse des risques"
    )

    # 2. Ali BENHIMA (Software Engineer & GenAI) -> BCG X Delivery
    run_live_scenario(
        scenario_name="Pairing 2: Ali BENHIMA -> BCG X Delivery (Tech & AI)",
        resume_id="ali-swe-genai-en",
        jd_id="bcg-x-swe-en",
        user_verification_note="FastAPI, React, microservices and LLM pipelines"
    )

    # 3. Ali BENHIMA (IT Consulting & Digital Transf.) -> Deloitte Afrique
    run_live_scenario(
        scenario_name="Pairing 3: Ali BENHIMA -> Deloitte Afrique (Technology Consulting)",
        resume_id="ali-consulting-fr",
        jd_id="deloitte-tech-fr",
        user_verification_note="AMOA, spécifications et gouvernance SI"
    )

    # 4. Ali BENHIMA (Payments & Consulting) -> Visa Consulting & Analytics (VCA)
    run_live_scenario(
        scenario_name="Pairing 4: Ali BENHIMA -> Visa Consulting & Analytics (VCA)",
        resume_id="ali-consulting-en",
        jd_id="visa-vca-en",
        user_verification_note="Payments market intelligence across 25+ countries"
    )

    # 5. Ali BENHIMA (Full Stack & GenAI) -> Ostorlab Cybersecurity
    run_live_scenario(
        scenario_name="Pairing 5: Ali BENHIMA -> Ostorlab Security Automation Platform",
        resume_id="ali-swe-genai-en",
        jd_id="ostorlab-cyber-en",
        user_verification_note="Automated security audit copilot and clean APIs"
    )

    # 6. Ali BENHIMA (Full Stack) -> Capgemini Engineering
    run_live_scenario(
        scenario_name="Pairing 6: Ali BENHIMA -> Capgemini Engineering (Smart Carpool)",
        resume_id="ali-swe-fastapi-fr",
        jd_id="capgemini-backend-fr",
        user_verification_note="Java Spring Boot, FastAPI, Docker, and PostgreSQL"
    )
