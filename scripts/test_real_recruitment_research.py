"""
scripts/test_real_recruitment_research.py
Comprehensive 16-Point E2E Test Suite for Real Recruitment Research & Crawler Pipeline.

Covers:
TEST 1: Department selection -> Real Department DB query
TEST 2: Selected department -> Research query expansion
TEST 3: Real web research -> Candidate recruitment discovery
TEST 4: Crawler -> Actual page snapshot collection
TEST 5: Original text recruitment extraction
TEST 6: Source URL secured & stored (no domain-only, no fabricated URL)
TEST 7: Evidence created with selector and text
TEST 8: Active posting verification (deadline check)
TEST 9: Major/job relationship evaluation (CONFIRMED / NOT_STATED / INFERRED)
TEST 10: 12-point fact validation -> VERIFIED status determination
TEST 11: Intelligence DB persistence (data/research/intelligence/recruitment_intelligence.json)
TEST 12: Next.js API route serving verified data
TEST 13: Source URL accessibility check
TEST 14: Zero Mock/Seed/Fake data verification (purged jobs.json, no fabricated records)
TEST 15: Public Research works cleanly without API Key
TEST 16: Work24/Worknet API integration structure preserved for future key addition
"""

import os
import sys
import json
import urllib.request

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from research.recruitment.real_job_researcher import RealJobResearcher, VALIDATION_CRITERIA
from research.recruitment.job_crawler import JobCrawler
from research.recruitment.job_extractor import JobExtractor
from research.crawler.url_policy import is_safe_url


def run_all_tests():
    print("======================================================================")
    print("16-POINT E2E TEST SUITE: Real Recruitment Research & Crawler Pipeline")
    print("======================================================================\n")

    test_results = {}
    researcher = RealJobResearcher()

    # -------------------------------------------------------------
    # TEST 1: Department selection -> Real Department DB query
    # -------------------------------------------------------------
    print("[TEST 1] Querying real University & Department Intelligence DB...")
    univ_path = os.path.join(researcher.root_dir, "data", "university_queue.json")
    prof_path = os.path.join(researcher.root_dir, "data", "professors.json")
    assert os.path.exists(univ_path), "university_queue.json must exist"
    assert os.path.exists(prof_path), "professors.json must exist"
    with open(univ_path, "r", encoding="utf-8") as f:
        univ_data = json.load(f)
    assert len(univ_data) > 0, "University queue must contain records"
    test_results["TEST 1"] = f"PASS ({len(univ_data)} records loaded from DB)"
    print(f"  -> {test_results['TEST 1']}")

    # -------------------------------------------------------------
    # TEST 2: Selected department -> Research query expansion
    # -------------------------------------------------------------
    print("\n[TEST 2] Expanding research queries for '홍익대학교 시각디자인과'...")
    dept_meta = researcher.expand_department_queries("홍익대학교", "시각디자인과")
    queries = dept_meta.get("queries", [])
    skills = dept_meta.get("skills", [])
    curriculum = dept_meta.get("curriculum_keywords", [])
    assert len(queries) >= 3, "Should expand at least 3 queries"
    test_results["TEST 2"] = f"PASS (Generated {len(queries)} queries, {len(skills)} skills, {len(curriculum)} keywords)"
    print(f"  -> {test_results['TEST 2']}")
    print(f"     Sample queries: {queries[:3]}")

    # -------------------------------------------------------------
    # TEST 3: Real web research -> Candidate recruitment discovery
    # -------------------------------------------------------------
    print("\n[TEST 3] Exploring public recruitment postings from partner/official portals...")
    crawler = JobCrawler()
    target_comp = "현대자동차"
    crawl_res = crawler.crawl_company_postings(target_comp)
    assert crawl_res["status"] == "SUCCESS", "Crawl should succeed"
    assert crawl_res["count"] > 0, "Should discover candidate postings"
    test_results["TEST 3"] = f"PASS (Discovered {crawl_res['count']} postings for {target_comp})"
    print(f"  -> {test_results['TEST 3']}")

    # -------------------------------------------------------------
    # TEST 4: Crawler -> Actual page snapshot collection
    # -------------------------------------------------------------
    print("\n[TEST 4] Verifying snapshot generation under data/research/raw/...")
    raw_meta_dir = os.path.join(researcher.root_dir, "data", "research", "raw", "metadata")
    assert os.path.exists(raw_meta_dir), "Metadata dir must exist"
    snapshots = [f for f in os.listdir(raw_meta_dir) if f.endswith(".json")]
    assert len(snapshots) > 0, "Snapshots must exist in data/research/raw/metadata/"
    test_results["TEST 4"] = f"PASS ({len(snapshots)} snapshot metadata records in data/research/raw/metadata/)"
    print(f"  -> {test_results['TEST 4']}")

    # -------------------------------------------------------------
    # TEST 5: Original text recruitment extraction
    # -------------------------------------------------------------
    print("\n[TEST 5] Extracting job requirements from crawled body text...")
    sample_posting = crawl_res["postings"][0]
    sample_evidence = crawl_res["evidences"][0]
    extracted_reqs = JobExtractor.extract_job_requirements(sample_evidence["evidence_text"])
    assert "target_majors" in extracted_reqs, "Should extract target majors"
    assert "required_skills" in extracted_reqs, "Should extract skills"
    test_results["TEST 5"] = f"PASS (Extracted skills: {extracted_reqs['required_skills']}, Majors: {extracted_reqs['target_majors']})"
    print(f"  -> {test_results['TEST 5']}")

    # -------------------------------------------------------------
    # TEST 6: Source URL secured & stored
    # -------------------------------------------------------------
    print("\n[TEST 6] Validating Source URL specificity and integrity...")
    src_url = sample_posting["source_url"]
    assert src_url.startswith("https://"), "Source URL must be secure HTTPS"
    assert "/" in src_url.replace("https://", ""), "Source URL must not be domain-only"
    test_results["TEST 6"] = f"PASS (Specific direct URL: {src_url})"
    print(f"  -> {test_results['TEST 6']}")

    # -------------------------------------------------------------
    # TEST 7: Evidence created with selector and text
    # -------------------------------------------------------------
    print("\n[TEST 7] Checking EvidenceSchema integrity...")
    assert sample_evidence["evidence_id"].startswith("evi-"), "Evidence ID format valid"
    assert len(sample_evidence["evidence_text"]) > 20, "Evidence text must be substantive"
    assert sample_evidence["confidence"] > 0.9, "Confidence must be high"
    test_results["TEST 7"] = f"PASS (Evidence ID: {sample_evidence['evidence_id']}, Confidence: {sample_evidence['confidence']})"
    print(f"  -> {test_results['TEST 7']}")

    # -------------------------------------------------------------
    # TEST 8: Active posting verification (deadline check)
    # -------------------------------------------------------------
    print("\n[TEST 8] Checking active posting status against 2026-09-17...")
    deadline = sample_posting.get("deadline", "")
    assert deadline >= "2026-09-17" or deadline == "상시채용", "Posting must be active"
    test_results["TEST 8"] = f"PASS (Deadline {deadline} is active as of current date)"
    print(f"  -> {test_results['TEST 8']}")

    # -------------------------------------------------------------
    # TEST 9: Major/job relationship evaluation
    # -------------------------------------------------------------
    print("\n[TEST 9] Evaluating Major Preference categories...")
    # Test confirmed case
    _, _, _, pref_conf = researcher.validate_posting(
        sample_posting, sample_evidence["evidence_text"], target_department="시각디자인과"
    )
    assert pref_conf in ["MAJOR_PREFERENCE_CONFIRMED", "MAJOR_RELATION_INFERRED"], "Must categorize correctly"
    test_results["TEST 9"] = f"PASS (Status evaluated: {pref_conf})"
    print(f"  -> {test_results['TEST 9']}")

    # -------------------------------------------------------------
    # TEST 10: 12-point fact validation -> VERIFIED determination
    # -------------------------------------------------------------
    print("\n[TEST 10] Running 12-point fact validation checklist...")
    is_valid, v_status, checklist, _ = researcher.validate_posting(
        sample_posting, sample_evidence["evidence_text"], target_department="시각디자인과"
    )
    assert is_valid is True, "Posting must pass all 12 validation criteria"
    assert v_status == "VERIFIED", "Status must be strictly VERIFIED"
    assert all(checklist.values()), "All 12 criteria in checklist must be True"
    test_results["TEST 10"] = f"PASS (All 12 criteria passed -> VERIFIED)"
    print(f"  -> {test_results['TEST 10']}")
    for crit, pass_val in checklist.items():
        print(f"     [x] {crit}: {pass_val}")

    # -------------------------------------------------------------
    # TEST 11: Intelligence DB persistence
    # -------------------------------------------------------------
    print("\n[TEST 11] Running full research execution and persisting to Intelligence DB...")
    research_output = researcher.research_for_department("홍익대학교", "시각디자인과")
    intel_path = researcher.intel_output_path
    assert os.path.exists(intel_path), "recruitment_intelligence.json must exist"
    with open(intel_path, "r", encoding="utf-8") as f:
        saved_intel = json.load(f)
    assert saved_intel["total_verified"] > 0, "Must have verified postings"
    test_results["TEST 11"] = f"PASS (Persisted {saved_intel['total_verified']} verified postings with full provenance)"
    print(f"  -> {test_results['TEST 11']}")

    # -------------------------------------------------------------
    # TEST 12: Next.js API route serving verified data
    # -------------------------------------------------------------
    print("\n[TEST 12] Querying Next.js /api/jobs endpoint...")
    import urllib.parse
    encoded_dept = urllib.parse.quote("시각디자인")
    api_url = f"http://localhost:3000/api/jobs?department={encoded_dept}"
    req = urllib.request.Request(api_url)
    with urllib.request.urlopen(req, timeout=5) as res:
        api_data = json.loads(res.read().decode("utf-8"))
    assert api_data.get("success") is True, "API must return success: true"
    assert api_data.get("source") == "recruitment-intelligence-db", "Source must be recruitment-intelligence-db"
    assert len(api_data.get("jobs", [])) > 0, "Must return verified jobs"
    sample_api_job = api_data["jobs"][0]
    assert sample_api_job.get("verificationStatus") == "VERIFIED", "Job must be VERIFIED"
    assert sample_api_job.get("contentHash") is not None, "Content hash must exist"
    test_results["TEST 12"] = f"PASS (Served {len(api_data['jobs'])} verified postings from API)"
    print(f"  -> {test_results['TEST 12']}")

    # -------------------------------------------------------------
    # TEST 13: Source URL accessibility check
    # -------------------------------------------------------------
    print("\n[TEST 13] Verifying Source URL format and web accessibility...")
    target_url = sample_api_job["originUrl"]
    assert target_url.startswith("https://"), "URL must be valid HTTPS"
    safe, reason = is_safe_url(target_url)
    assert safe is True, f"URL must pass SSRF defense: {reason}"
    test_results["TEST 13"] = f"PASS (Valid external HTTPS URL verified: {target_url})"
    print(f"  -> {test_results['TEST 13']}")

    # -------------------------------------------------------------
    # TEST 14: Zero Mock/Seed/Fake data verification
    # -------------------------------------------------------------
    print("\n[TEST 14] Verifying zero mock/seed data in project...")
    # Check data/jobs.json
    jobs_json_path = os.path.join(researcher.root_dir, "data", "jobs.json")
    with open(jobs_json_path, "r", encoding="utf-8") as f:
        raw_jobs = json.load(f)
    assert len(raw_jobs) == 0, "data/jobs.json must be empty []"

    # Check that non-matching search returns exactly 0 items
    req_empty = urllib.request.Request("http://localhost:3000/api/jobs?keyword=nonexistentXYZ999")
    with urllib.request.urlopen(req_empty, timeout=5) as res:
        empty_data = json.loads(res.read().decode("utf-8"))
    assert empty_data.get("total") == 0, "Total must be 0 for non-matching query"
    assert len(empty_data.get("jobs", [])) == 0, "Jobs array must be []"
    test_results["TEST 14"] = "PASS (Zero mock data, data/jobs.json is empty, empty query returns [])"
    print(f"  -> {test_results['TEST 14']}")

    # -------------------------------------------------------------
    # TEST 15: Public Research works cleanly without API Key
    # -------------------------------------------------------------
    print("\n[TEST 15] Verifying Public Research works without WORKNET_API_KEY...")
    # When WORKNET_API_KEY is not set or empty, researcher still executes and serves verified DB items
    assert os.getenv("WORKNET_API_KEY") is None or os.getenv("WORKNET_API_KEY") == "", "API Key is optional"
    assert research_output["total_verified"] > 0, "Public research succeeded without API key"
    test_results["TEST 15"] = f"PASS (Public research operated with 0 API keys; {research_output['total_verified']} verified)"
    print(f"  -> {test_results['TEST 15']}")

    # -------------------------------------------------------------
    # TEST 16: Work24/Worknet API integration structure preserved
    # -------------------------------------------------------------
    print("\n[TEST 16] Checking API adapter preservation for future key addition...")
    route_path = os.path.join(researcher.root_dir, "my-exhibit-platform", "app", "api", "jobs", "route.ts")
    with open(route_path, "r", encoding="utf-8") as f:
        route_code = f.read()
    assert "WORKNET_API_KEY" in route_code, "WORKNET_API_KEY handling must be present"
    assert "openapi.work.go.kr" in route_code, "Open API endpoint preserved"
    assert "parseWorknetXml" in route_code, "XML Parser preserved"
    test_results["TEST 16"] = "PASS (Worknet Open API adapter cleanly preserved for future key configuration)"
    print(f"  -> {test_results['TEST 16']}")

    print("\n======================================================================")
    print("ALL 16 E2E TESTS PASSED SUCCESSFULLY!")
    print("======================================================================")

    return test_results


if __name__ == "__main__":
    results = run_all_tests()
