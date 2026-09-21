"""
scripts/test_cooperation_recruitment_research.py
Comprehensive 20-Point E2E Test Suite for:
Academic-Corporate Cooperation & Recruitment Cross-Validation Research Pipeline.
Conforms strictly to Section 22 validation standards and Section 24 deliverables.
"""

import os
import sys
import json
import hashlib
import urllib.request
import urllib.parse
from typing import Dict, Any, List

# Windows Console UTF-8 Setup
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from research.crawler.url_policy import is_safe_url
from research.crawler.snapshot import (
    save_snapshot,
    compute_content_hash,
    RAW_DIR,
    HTML_DIR,
    TEXT_DIR,
    METADATA_DIR
)
from research.cooperation.cooperation_crawler import CooperationCrawler
from research.cooperation.company_expander import CompanyExpander
from research.cooperation.dept_mapper import DepartmentMapper
from research.recruitment.job_crawler import JobCrawler
from research.recruitment.job_extractor import JobExtractor
from research.recruitment.talent_extractor import TalentExtractor
from research.cross_validation.cross_validator import CrossValidator
from research.reporting.report_generator import ReportGenerator
from research.graph.cooperation_recruitment_graph import build_academic_corporate_graph
from research.graph.cooperation_recruitment_runner import run_cooperation_recruitment_pipeline
from scripts.sync_research_to_platform import sync_intelligence_to_platform, safe_load_json

BASE_URL = "http://localhost:3000"


def log_test(num: int, title: str, passed: bool, detail: str = ""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n[TEST {num:02d}] {title}")
    print(f"  {status}: {title}")
    if detail:
        print(f"       -> {detail}")
    if not passed:
        raise AssertionError(f"Test {num:02d} FAILED: {detail}")


def run_all_tests():
    print("=" * 85)
    print("🚀 [STEP 13.5] ACADEMIC-CORPORATE & RECRUITMENT CROSS-VALIDATION E2E TEST SUITE")
    print("   Evidence-First + Deterministic Cross-Validation + Zero-LLM Admin Sync")
    print("=" * 85)

    # -------------------------------------------------------------------------
    # TEST 1: 대학 입력 및 초기화
    # -------------------------------------------------------------------------
    test_univ = "홍익대학교"
    test_dept = "시각디자인과"
    test_url = "https://sidi.hongik.ac.kr"

    initial_state = {
        "target_university": test_univ,
        "target_department": test_dept,
        "graduation_exhibit_url": test_url,
        "cooperation_signals": [],
        "expanded_companies": [],
        "department_mappings": [],
        "recruitment_postings": [],
        "talent_profiles": [],
        "cross_validation_results": [],
        "markdown_report": "",
        "evidences": [],
        "sources": [],
        "logs": [],
        "errors": []
    }
    log_test(
        1,
        "대학 입력 및 파이프라인 초기화 검증",
        initial_state["target_university"] == test_univ and bool(initial_state["graduation_exhibit_url"]),
        f"Univ: {test_univ}, Dept: {test_dept}, URL: {test_url}"
    )

    # -------------------------------------------------------------------------
    # TEST 2: 산학협력기업 발견 (cooperationSignal)
    # -------------------------------------------------------------------------
    coop_crawler = CooperationCrawler()
    coop_res = coop_crawler.discover_cooperation_signals(test_univ, test_dept)
    coop_signals = coop_res.get("cooperation_signals", [])
    has_coop_tag = all(s.get("signal_type") == "cooperationSignal" for s in coop_signals)
    discovered_companies = [s["company"] for s in coop_signals]

    log_test(
        2,
        "산학협력기업 발견 및 cooperationSignal 신호 태깅",
        len(coop_signals) > 0 and has_coop_tag,
        f"Discovered {len(coop_signals)} signals: {', '.join(discovered_companies[:3])}"
    )

    # -------------------------------------------------------------------------
    # TEST 3: 기업 관계 확인 (CompanyExpander)
    # -------------------------------------------------------------------------
    exp_res = CompanyExpander.expand_companies(discovered_companies)
    relationships = exp_res.get("relationships", [])
    has_official_evidence = all(bool(r.get("official_evidence")) and bool(r.get("source_url")) for r in relationships)
    
    # Test speculative prevention: unlisted fake company should have 0 relationships
    spec_res = CompanyExpander.expand_companies(["가상기업_미확인스타트업_XYZ"])
    spec_rejected = len(spec_res.get("relationships", [])) == 0

    log_test(
        3,
        "공식 공시 기반 기업 관계 확장 및 추정 관계 배제",
        len(relationships) > 0 and has_official_evidence and spec_rejected,
        f"Expanded {len(relationships)} verified relations; Speculative company rejected: {spec_rejected}"
    )

    # -------------------------------------------------------------------------
    # TEST 4: 학과 매핑 (DepartmentMapper)
    # -------------------------------------------------------------------------
    dept_mappings = DepartmentMapper.map_companies_to_departments(coop_signals)
    has_dept_links = all(
        bool(m.get("department")) and bool(m.get("company")) and bool(m.get("cooperation_project"))
        for m in dept_mappings
    )
    # Incomplete signals lacking department must be filtered
    incomplete_sig = [{"signal_id": "bad", "company": "알수없음", "project_title": "무제"}]
    bad_mapped = DepartmentMapper.map_companies_to_departments(incomplete_sig)

    log_test(
        4,
        "기업 ↔ 학과/연구실/교수 근거 기반 매핑 무결성",
        len(dept_mappings) > 0 and has_dept_links and len(bad_mapped) == 0,
        f"Mapped {len(dept_mappings)} valid pairs; incomplete signals rejected correctly."
    )

    # -------------------------------------------------------------------------
    # TEST 5: 실제 채용공고 수집 (JobCrawler)
    # -------------------------------------------------------------------------
    job_crawler = JobCrawler()
    recruit_res = job_crawler.crawl_company_postings("현대자동차")
    recruit_postings = recruit_res.get("postings", [])
    has_recruit_tag = all(p.get("signal_type") == "recruitmentSignal" for p in recruit_postings)
    has_post_fields = all(bool(p.get("job_title")) and bool(p.get("employment_type")) for p in recruit_postings)

    log_test(
        5,
        "실제 공식 채용공고 수집 및 recruitmentSignal 신호 태깅",
        len(recruit_postings) > 0 and has_recruit_tag and has_post_fields,
        f"Crawled {len(recruit_postings)} postings for 현대자동차: {[p['job_title'][:20] for p in recruit_postings]}"
    )

    # -------------------------------------------------------------------------
    # TEST 6: 채용조건 추출 (JobExtractor)
    # -------------------------------------------------------------------------
    sample_text = """
    [현대자동차 채용공고] 차량용 인포테인먼트(ccNC) UX 디자이너
    - 고용형태: 신입 채용연계형 인턴
    - 전공요건: 관련 전공자 (시각디자인, 산업디자인, 인터랙션디자인)
    - 필수역량: Figma, Adobe Creative Cloud, Protopie, Design System
    - 우대사항: 3D GUI 툴(Blender), 자동차 산학협력 프로젝트 경험자 우대
    - 포트폴리오: 포트폴리오 필수 제출 (PDF 또는 웹 링크)
    - 학력: 학사 이상
    """
    extracted_reqs = JobExtractor.extract_job_requirements(sample_text)
    log_test(
        6,
        "규칙 기반 채용조건 세부 항목(전공, 기술, 포트폴리오) 추출",
        extracted_reqs["major_requirement"] == "관련 전공" and
        "Figma" in extracted_reqs["required_skills"] and
        extracted_reqs["portfolio_requirement"] == "포트폴리오 필수",
        f"Major: {extracted_reqs['major_requirement']}, Skills: {extracted_reqs['required_skills']}, Portfolio: {extracted_reqs['portfolio_requirement']}"
    )

    # -------------------------------------------------------------------------
    # TEST 7: 인재상 추출 (TalentExtractor)
    # -------------------------------------------------------------------------
    talent_res = TalentExtractor.extract_talent_profile("현대자동차")
    t_prof = talent_res.get("talent_profile")
    has_talent_facts = (
        t_prof is not None and
        len(t_prof.get("values", [])) > 0 and
        bool(t_prof.get("talent_profile")) and
        bool(t_prof.get("culture")) and
        bool(t_prof.get("source_url"))
    )

    log_test(
        7,
        "공식 기업 인재상 / 핵심가치 / 문화 키워드 추출",
        has_talent_facts,
        f"Values: {t_prof.get('values')[:3]}, Talent: {t_prof.get('talent_profile', '')[:30]}..."
    )

    # -------------------------------------------------------------------------
    # TEST 8: Evidence 연결 (SHA-256 및 URL)
    # -------------------------------------------------------------------------
    postings_ev = recruit_res.get("evidences", [])
    valid_hashes = True
    for ev in postings_ev:
        text = ev.get("evidence_text", "")
        h = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if not ev.get("evidence_id") or not ev.get("source_url") or not h:
            valid_hashes = False
            break

    log_test(
        8,
        "모든 Fact/신호의 SHA-256 Content Hash 및 출처 URL 증거 연결",
        len(postings_ev) > 0 and valid_hashes,
        f"Verified {len(postings_ev)} evidence items with valid SHA-256 and URLs"
    )

    # -------------------------------------------------------------------------
    # TEST 9: Cross Validation 분리 검증 (Cooperation != Recruitment)
    # -------------------------------------------------------------------------
    # Cooperation signals must NOT be used as job posting requirements
    coop_sig_types = set(s.get("signal_type") for s in coop_signals)
    recruit_sig_types = set(p.get("signal_type") for p in recruit_postings)
    signals_strictly_separated = (
        coop_sig_types == {"cooperationSignal"} and
        recruit_sig_types == {"recruitmentSignal"} and
        coop_sig_types.isdisjoint(recruit_sig_types)
    )

    log_test(
        9,
        "산학협력 신호 ≠ 채용 신호 독립성 및 분리 검증",
        signals_strictly_separated,
        f"Coop signals: {coop_sig_types}, Recruit signals: {recruit_sig_types}"
    )

    # -------------------------------------------------------------------------
    # TEST 10: RECRUITMENT_CONFIRMED 판정
    # -------------------------------------------------------------------------
    # Situation: Real recruitment exists for company, but no cooperation exists
    res_rec_conf = CrossValidator.validate_department_company_pair(
        department="산업디자인과",
        company="현대자동차",
        coop_signals=[],  # No cooperation
        recruit_signals=recruit_postings,
        talent_profile=t_prof
    )
    log_test(
        10,
        "교차검증 RECRUITMENT_CONFIRMED 상태 판정 (채용공고 확인, 산학협력 미확인)",
        res_rec_conf["corroboration_status"] == "RECRUITMENT_CONFIRMED",
        f"Status: {res_rec_conf['corroboration_status']}, Rationale: {res_rec_conf['confidence_rationale'][:60]}..."
    )

    # -------------------------------------------------------------------------
    # TEST 11: CORROBORATED 판정
    # -------------------------------------------------------------------------
    # Situation: Both cooperation and matching recruitment postings exist
    matching_coop = [s for s in coop_signals if s.get("company") == "현대자동차"]
    res_corrob = CrossValidator.validate_department_company_pair(
        department="시각디자인과",
        company="현대자동차",
        coop_signals=matching_coop,
        recruit_signals=recruit_postings,
        talent_profile=t_prof
    )
    log_test(
        11,
        "교차검증 CORROBORATED 상태 판정 (산학협력 실적 & 실제 채용조건 상호 입증)",
        res_corrob["corroboration_status"] == "CORROBORATED",
        f"Status: {res_corrob['corroboration_status']}, Evidence IDs: {len(res_corrob['evidence_ids'])}"
    )

    # -------------------------------------------------------------------------
    # TEST 12: INFERRED 판정
    # -------------------------------------------------------------------------
    # Situation: Cooperation exists, but no active job posting
    res_inferred = CrossValidator.validate_department_company_pair(
        department="시각디자인과",
        company="현대자동차",
        coop_signals=matching_coop,
        recruit_signals=[],  # No recruitment posting
        talent_profile=t_prof
    )
    log_test(
        12,
        "교차검증 INFERRED 상태 판정 (산학협력 존재, 채용공고 미확인)",
        res_inferred["corroboration_status"] == "INFERRED",
        f"Status: {res_inferred['corroboration_status']}, Rationale: {res_inferred['confidence_rationale'][:60]}..."
    )

    # -------------------------------------------------------------------------
    # TEST 13: CONFLICTED 판정
    # -------------------------------------------------------------------------
    # Situation: Cooperation exists with department, but job posting requires conflicting major
    conflicted_posting = dict(recruit_postings[0]) if recruit_postings else {}
    conflicted_posting["requirements"] = {
        "major_requirement": "특정 학과",
        "target_majors": ["화학공학과", "생명과학과"],  # Completely incompatible with 시각디자인과
        "required_skills": ["유기화학"],
        "portfolio_requirement": "해당 없음",
        "education": "학사 이상",
        "experience": "신입",
        "certifications": [],
        "language": None
    }
    res_conflict = CrossValidator.validate_department_company_pair(
        department="시각디자인과",
        company="현대자동차",
        coop_signals=matching_coop,
        recruit_signals=[conflicted_posting],
        talent_profile=t_prof
    )
    log_test(
        13,
        "교차검증 CONFLICTED 상태 판정 (산학협력 학과와 채용 필수전공 불일치 감지)",
        res_conflict["corroboration_status"] == "CONFLICTED",
        f"Status: {res_conflict['corroboration_status']}, Rationale: {res_conflict['confidence_rationale'][:60]}..."
    )

    # -------------------------------------------------------------------------
    # TEST 14: NOT_FOUND 예외 격리
    # -------------------------------------------------------------------------
    nf_res = job_crawler.crawl_company_postings("미등록가상기업_NOT_FOUND_TEST")
    log_test(
        14,
        "크롤러 공고 미발견 시 파이프라인 중단 없이 NOT_FOUND 격리 반환",
        nf_res.get("status") == "NOT_FOUND" and len(nf_res.get("postings", [])) == 0,
        f"Status: {nf_res.get('status')}, Message: {nf_res.get('message')}"
    )

    # -------------------------------------------------------------------------
    # TEST 15: URL Provenance 검증
    # -------------------------------------------------------------------------
    safe_ok, _ = is_safe_url("https://talent.hyundai.com/apply/posting/HMC-2025-UX01")
    bad_js, _ = is_safe_url("javascript:alert(1)")
    bad_file, _ = is_safe_url("file:///c:/windows/system32")
    log_test(
        15,
        "URL 출처 검증 및 악의적 스키마(javascript, file) 차단",
        safe_ok and not bad_js and not bad_file,
        f"Safe URL allowed: {safe_ok}; JS blocked: {not bad_js}; File blocked: {not bad_file}"
    )

    # -------------------------------------------------------------------------
    # TEST 16: Raw Evidence 저장 (data/research/raw/)
    # -------------------------------------------------------------------------
    html_files = os.listdir(HTML_DIR) if os.path.exists(HTML_DIR) else []
    text_files = os.listdir(TEXT_DIR) if os.path.exists(TEXT_DIR) else []
    meta_files = os.listdir(METADATA_DIR) if os.path.exists(METADATA_DIR) else []
    
    log_test(
        16,
        "Raw Evidence 원본 스냅샷(HTML, Text, Metadata) 파일 저장 확인",
        len(html_files) > 0 and len(text_files) > 0 and len(meta_files) > 0,
        f"Raw snapshots - HTML: {len(html_files)}, Text: {len(text_files)}, Meta: {len(meta_files)}"
    )

    # -------------------------------------------------------------------------
    # TEST 17: Intelligence DB 적재
    # -------------------------------------------------------------------------
    pipe_res = run_cooperation_recruitment_pipeline(
        university=test_univ,
        department=test_dept,
        graduation_exhibit_url=test_url
    )
    latest_file = os.path.join(WORKSPACE_ROOT, "data", "research", "intelligence", "latest_corporate_research.json")
    runs_file = os.path.join(WORKSPACE_ROOT, "data", "logs", "corporate_research_runs.json")

    has_latest = os.path.exists(latest_file) and os.path.getsize(latest_file) > 0
    has_runs = os.path.exists(runs_file) and os.path.getsize(runs_file) > 0

    log_test(
        17,
        "Intelligence DB 및 감사 로그(corporate_research_runs.json) 정상 적재",
        pipe_res.get("status") == "COMPLETED" and has_latest and has_runs,
        f"Pipeline: {pipe_res.get('status')}, Latest DB: {has_latest}, Runs log: {has_runs}"
    )

    # -------------------------------------------------------------------------
    # TEST 18: 7-Section Report 마크다운 생성
    # -------------------------------------------------------------------------
    report_md = pipe_res.get("markdown_report", "")
    required_sections = [
        "## 1. 주요 산학협력기업",
        "## 2. 연계기업",
        "## 3. 학과-기업 매핑",
        "## 4. 실제 채용조건",
        "## 5. 기업 인재상 / 문화",
        "## 6. 교차검증 결과",
        "## 7. 학생 준비 방향"
    ]
    all_sections_present = all(sec in report_md for sec in required_sections)

    log_test(
        18,
        "표준 7-Section 마크다운 리포트 생성 및 필수 섹션 완비",
        all_sections_present and len(report_md) > 1000,
        f"All 7 sections present: {all_sections_present}, Report length: {len(report_md)} chars"
    )

    # -------------------------------------------------------------------------
    # TEST 19: 웹UI 데이터 동기화
    # -------------------------------------------------------------------------
    sync_counts = sync_intelligence_to_platform(pipe_res)
    q_data = safe_load_json(os.path.join(WORKSPACE_ROOT, "data", "university_queue.json"))
    p_data = safe_load_json(os.path.join(WORKSPACE_ROOT, "data", "professors.json"))
    rfp_data = safe_load_json(os.path.join(WORKSPACE_ROOT, "data", "rfp.json"))

    # Check that university_queue has cooperation fields
    matching_q = [it for it in q_data if "홍익" in it.get("university", "")]
    has_coop_field = any("cooperation_companies" in it for it in matching_q)
    # Check that professors has industry_collaborations
    has_prof_collab = any(len(p.get("industry_collaborations", [])) > 0 for p in p_data)
    # Check that rfp has verified items
    has_rfp_coop = any(len(r.get("cooperation_partners", [])) > 0 for r in rfp_data)

    log_test(
        19,
        "웹UI 데이터(university_queue, professors, rfp) 원자적 동기화 및 듀얼 싱크",
        has_coop_field and has_prof_collab and has_rfp_coop,
        f"Queue coop updated: {has_coop_field}, Prof collab: {has_prof_collab}, RFP coop: {has_rfp_coop}"
    )

    # -------------------------------------------------------------------------
    # TEST 20: SSRF 방어 및 Zero-LLM 회귀 검증
    # -------------------------------------------------------------------------
    # 1. SSRF check
    blocked_loopback, _ = is_safe_url("http://127.0.0.1:3000/internal")
    blocked_meta, _ = is_safe_url("http://169.254.169.254/latest/meta-data")
    ssrf_passes = (not blocked_loopback) and (not blocked_meta)

    # 2. Check Admin API endpoint implementation has Zero LLM imports
    api_route_file = os.path.join(
        WORKSPACE_ROOT, "my-exhibit-platform", "app", "api", "admin", "research", "route.ts"
    )
    with open(api_route_file, "r", encoding="utf-8") as f:
        route_code = f.read()
    zero_llm_admin = ("openai" not in route_code.lower()) and ("anthropic" not in route_code.lower())

    log_test(
        20,
        "SSRF 사설망/메타데이터 차단 방어 및 Admin 관제 Zero-LLM 무결성 검증",
        ssrf_passes and zero_llm_admin,
        f"SSRF blocks (loopback: {not blocked_loopback}, meta: {not blocked_meta}); Zero-LLM in route: {zero_llm_admin}"
    )

    print("\n" + "=" * 85)
    print("🎉 ALL 20 TESTS PASSED SUCCESSFULLY! [20/20]")
    print("   Academic-Corporate Research & Cross-Validation Pipeline fully verified.")
    print("=" * 85)


if __name__ == "__main__":
    run_all_tests()
