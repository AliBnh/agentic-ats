import io
import time
from fastapi.testclient import TestClient
from app.main import app
from app.utils.seed_data import SAMPLE_RESUMES, SAMPLE_JOB_DESCRIPTIONS
from app.utils.pdf_exporter import generate_ats_pdf
import pypdf

client = TestClient(app)

def run_real_world_scenario(scenario_name, resume_idx, jd_idx, target_role, expected_lang):
    print(f"\n{'='*70}")
    print(f"[RUNNING SCENARIO] {scenario_name}")
    print(f"{'='*70}")

    sample_resume = SAMPLE_RESUMES[resume_idx]
    sample_jd = SAMPLE_JOB_DESCRIPTIONS[jd_idx]

    # Step 1: Ingestion & Upload
    print(f"1. Ingestion of CV: '{sample_resume['title']}'...")
    upload_res = client.post("/api/audit/upload", data={"raw_text": sample_resume["raw_text"]})
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    thread_id = upload_data["thread_id"]
    detected_lang = upload_data["detected_language"]
    print(f"   [OK] Uploaded. Thread ID: {thread_id}")
    print(f"   [OK] Detected Language: {detected_lang.upper()} (Confidence: {upload_data['language_confidence']*100}%)")
    assert detected_lang == expected_lang, f"Expected {expected_lang}, got {detected_lang}"

    # Step 2: Confirm Parsing & Run Diagnostic Audit
    print("2. Running Stage 1 Diagnostic Health Audit...")
    confirm_res = client.post("/api/audit/confirm-parsing", json={
        "thread_id": thread_id,
        "verified_text": upload_data["extracted_text"],
        "language": detected_lang
    })
    assert confirm_res.status_code == 200, f"Diagnostic failed: {confirm_res.text}"
    diag_data = confirm_res.json()
    print(f"   [OK] Overall Health Score: {diag_data['health_score']}%")
    print(f"   [OK] ATS Parseability: {diag_data['ats_formatting_score']}%")
    print(f"   [OK] Content & STAR Score: {diag_data['content_impact_score']}%")
    print(f"   [OK] Cultural / Regional Norms: {diag_data['language_norm_score']}%")
    print(f"   [OK] Issues Found: {len(diag_data['audit_issues'])}")

    # Step 3: Target Job Alignment (Stage 2)
    print(f"3. Aligning with Target JD: '{sample_jd['title']}'...")
    start_time = time.time()
    match_res = client.post("/api/audit/match-job", json={
        "thread_id": thread_id,
        "job_description": sample_jd["text"],
        "target_role": target_role
    })
    assert match_res.status_code == 200, f"Match failed: {match_res.text}"
    match_data = match_res.json()

    # Step 4: Handle HITL Truth Gate if triggered
    final_result = None
    if match_data.get("hitl_pending"):
        question = match_data["hitl_question"]
        skill = question["skill"]
        print(f"   [HITL GATE TRIGGERED] Critical skill required: '{skill}'")
        print(f"   Question: {question['question']}")
        print(f"   Context from JD: '{question['context']}'")
        print("   -> Simulating User Confirmation: 'APPROVED (2 years production experience)'...")

        # Resume execution
        resume_res = client.post(f"/api/audit/resume/{thread_id}", json={
            "skill": skill,
            "decision": "APPROVED",
            "notes": "2 years production experience"
        })
        assert resume_res.status_code == 200, f"Resume failed: {resume_res.text}"
        final_result = resume_res.json()
        print("   [OK] State machine successfully resumed from checkpoint!")
    else:
        final_result = match_data

    elapsed = round(time.time() - start_time, 2)
    print(f"4. Optimization Results (Completed in {elapsed}s):")
    print(f"   [OK] Initial ATS Score: {final_result['initial_score']}%")
    print(f"   [OK] Final ATS Score: {final_result['final_score']}%")
    print(f"   [OK] Score Progression: {final_result['score_history']}")
    print(f"   [OK] Matched Skills: {', '.join(final_result['matched_skills'][:6])}")
    print(f"   [OK] Tailored Bullets (Diff items): {len(final_result.get('diff', []))}")
    assert final_result['final_score'] >= final_result['initial_score'], "Score did not improve or hold"
    assert len(final_result['tailored_markdown']) > 200, "Markdown resume is empty"
    assert len(final_result['cover_letter']) > 100, "Cover letter is empty"

    # Step 5: PDF Export Integrity Check
    print("5. Exporting ATS PDF & Checking File Structure...")
    pdf_res = client.post("/api/audit/export/pdf", json={
        "markdown_content": final_result["tailored_markdown"]
    })
    assert pdf_res.status_code == 200, "PDF export failed"
    pdf_bytes = pdf_res.content
    assert pdf_bytes.startswith(b"%PDF-"), "Invalid PDF header bytes"

    # Verify PDF is readable by pypdf
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) >= 1, "PDF has no pages"
    extracted_pdf_text = reader.pages[0].extract_text()
    assert len(extracted_pdf_text) > 100, "PDF text extraction failed"
    print(f"   [OK] PDF generated successfully ({len(pdf_bytes)} bytes, {len(reader.pages)} page(s)).")
    print(f"   [OK] Verified ATS parseability of exported PDF.")

    print(f"[SUCCESS] SCENARIO '{scenario_name}' PASSED 100% PERFECTLY!\n")


def test_suite():
    # 1. Real-World IT / Software Engineering (English)
    run_real_world_scenario(
        scenario_name="1. Senior Software Engineer (US/UK)",
        resume_idx=0, # Alex Morgan (Senior SWE)
        jd_idx=0,     # Staff Backend Engineer
        target_role="Staff Backend Engineer",
        expected_lang="en"
    )

    # 2. Real-World Data Science / ML Engineer (English)
    run_real_world_scenario(
        scenario_name="2. Lead Data Scientist & ML (US/UK)",
        resume_idx=1, # Dr. Elena Rostova
        jd_idx=1,     # Senior AI & ML Scientist
        target_role="Senior AI & Machine Learning Scientist",
        expected_lang="en"
    )

    # 3. Real-World IT Strategy Consultant (English)
    run_real_world_scenario(
        scenario_name="3. IT Strategy Consultant (US/UK)",
        resume_idx=2, # Marcus Vance
        jd_idx=2,     # Lead Technology Strategy Consultant
        target_role="Lead Technology Strategy Consultant",
        expected_lang="en"
    )

    # 4. Real-World Développeur Full Stack Senior (French)
    run_real_world_scenario(
        scenario_name="4. Développeur Full Stack Senior (France)",
        resume_idx=5, # Julien Dupont
        jd_idx=5,     # Lead Développeur Full Stack Python / React
        target_role="Lead Développeur Full Stack",
        expected_lang="fr"
    )

    # 5. Real-World Consultant Transformation IT (French)
    run_real_world_scenario(
        scenario_name="5. Consultant Transformation IT & Cloud (France)",
        resume_idx=7, # Antoine Lefebvre
        jd_idx=7,     # Consultant Manager Transformation IT
        target_role="Consultant Manager Transformation IT",
        expected_lang="fr"
    )

if __name__ == "__main__":
    test_suite()
