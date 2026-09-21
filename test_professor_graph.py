"""
Test Suite for Professor Intelligence Graph
Verifies the 12 LangGraph nodes, official source validation, deduplication, change detection, and database sync.
"""

import os
import sys
import json
import shutil
from datetime import datetime

# Windows 콘솔 UTF-8 설정
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from professor_graph.runner import run_professor_pipeline
from professor_graph.providers import is_official_domain


def run_tests():
    print("\n" + "=" * 75)
    print("🧪 [PROFESSOR INTELLIGENCE GRAPH AUTOMATED TEST SUITE]")
    print("=" * 75)

    results = []

    # -------------------------------------------------------------
    # Test 1: Official Domain Validator Logic
    # -------------------------------------------------------------
    print("\n[TEST 1] 공식 도메인 판별 규칙 검증 (is_official_domain)")
    test_urls = [
        ("https://design.snu.ac.kr/faculty/wsjung", True),
        ("https://sidi.hongik.ac.kr/faculty/dwkang", True),
        ("https://id.kookmin.ac.kr/faculty/shyoon", True),
        ("https://visdesign.khu.ac.kr/faculty/cmpark", True),
        ("https://unverified-blog.random.com/posts/123", False),
        ("http://fake-university.com/prof", False),
        ("", False),
    ]

    t1_pass = True
    for url, expected in test_urls:
        actual = is_official_domain(url)
        if actual != expected:
            print(f"  ❌ Domain test mismatch for {url}: expected {expected}, got {actual}")
            t1_pass = False
    
    if t1_pass:
        print("  ✅ PASS: 공식 도메인(.ac.kr) 및 비공식 도메인 필터링 100% 일치")
        results.append(("Official Domain Validator", "PASS"))
    else:
        results.append(("Official Domain Validator", "FAIL"))

    # -------------------------------------------------------------
    # Test 2: End-to-End Pipeline Execution with Mock Provider
    # -------------------------------------------------------------
    print("\n[TEST 2] 12개 노드 순차 워크플로우 E2E 완주 검증")
    
    target_univs = ["서울대학교", "홍익대학교", "국민대학교", "경희대학교"]
    state1 = run_professor_pipeline(
        target_universities=target_univs,
        provider_mode="mock"
    )

    t2_nodes = [
        state1.get("discovered_universities"),
        state1.get("discovered_departments"),
        state1.get("discovered_candidates"),
        state1.get("validated_candidates"),
        state1.get("extracted_professors"),
        state1.get("matched_professors"),
        state1.get("deduplicated_professors"),
        state1.get("change_report"),
        state1.get("final_saved_professors"),
        state1.get("run_summary")
    ]

    if all(n is not None for n in t2_nodes) and state1.get("status") == "COMPLETED":
        print("  ✅ PASS: 12개 노드 전 단계 정상 도달 및 상태 COMPLETED 달성")
        results.append(("End-to-End 12-Node Workflow", "PASS"))
    else:
        print(f"  ❌ FAIL: 워크플로우 중간 결함 발견 (status: {state1.get('status')})")
        results.append(("End-to-End 12-Node Workflow", "FAIL"))

    # -------------------------------------------------------------
    # Test 3: Data Integrity & Mandatory Metadata Check
    # -------------------------------------------------------------
    print("\n[TEST 3] 수집 데이터 무결성 및 필수 메타데이터 검증")
    saved_profs = state1.get("final_saved_professors", [])
    
    t3_pass = len(saved_profs) > 0
    for p in saved_profs:
        # 출처 URL 존재 여부
        if not p.get("source_url") or not is_official_domain(p["source_url"]):
            print(f"  ❌ Error: {p.get('name')} 교수 source_url 비정상: {p.get('source_url')}")
            t3_pass = False
        # 수집 시각 존재 여부
        if not p.get("collected_at"):
            print(f"  ❌ Error: {p.get('name')} 교수 collected_at 누락")
            t3_pass = False
        # 신뢰도 점수 (float, >= 0.8)
        if not isinstance(p.get("confidence_score"), (int, float)) or p["confidence_score"] < 0.8:
            print(f"  ❌ Error: {p.get('name')} 교수 confidence_score 기준 미달: {p.get('confidence_score')}")
            t3_pass = False
        # 학기 핵심 과제 존재 여부
        if not p.get("assignment_details") or not p.get("assignment_one_liner"):
            print(f"  ❌ Error: {p.get('name')} 교수 assignment_details 누락")
            t3_pass = False
        # 원문 증거 텍스트 존재 여부
        if not p.get("evidence_text"):
            print(f"  ❌ Error: {p.get('name')} 교수 evidence_text 누락")
            t3_pass = False

    if t3_pass:
        print(f"  ✅ PASS: 저장된 {len(saved_profs)}명의 교수 전원 공식 출처URL, 수집시각, 신뢰도(>=0.8), 과제정보 보유")
        results.append(("Mandatory Metadata & Source URL", "PASS"))
    else:
        results.append(("Mandatory Metadata & Source URL", "FAIL"))

    # -------------------------------------------------------------
    # Test 4: Deduplication & Change Detection (Idempotency)
    # -------------------------------------------------------------
    print("\n[TEST 4] 중복 방지(Deduplication) 및 멱등성 변경 감지(Change Detection)")
    
    # 동일 타겟으로 2차 파이프라인 가동
    state2 = run_professor_pipeline(
        target_universities=target_univs,
        provider_mode="mock"
    )

    report2 = state2.get("change_report", {})
    new_count2 = len(report2.get("new", []))
    unchanged_count2 = len(report2.get("unchanged", []))

    print(f"  -> 2차 실행 변경 보고서: new={new_count2}, updated={len(report2.get('updated', []))}, unchanged={unchanged_count2}")
    
    if new_count2 == 0 and unchanged_count2 >= len(saved_profs):
        print("  ✅ PASS: 동일 데이터 재실행 시 신규 중복 0건, 전원 UNCHANGED 감지 정상 작동")
        results.append(("Deduplication & Change Detection", "PASS"))
    else:
        print(f"  ❌ FAIL: 중복 방지 실패 (new_count: {new_count2})")
        results.append(("Deduplication & Change Detection", "FAIL"))

    # -------------------------------------------------------------
    # Test 5: Database File Sync & Run Logging Verification
    # -------------------------------------------------------------
    print("\n[TEST 5] JSON 데이터베이스 동기화 및 실행 감사 로그 검증")
    
    root_dir = os.path.abspath(os.path.dirname(__file__))
    f1 = os.path.join(root_dir, "data", "professors.json")
    f2 = os.path.join(root_dir, "my-exhibit-platform", "data", "professors.json")
    log_f = os.path.join(root_dir, "data", "logs", "professor_runs.json")

    t5_pass = os.path.exists(f1) and os.path.exists(f2) and os.path.exists(log_f)
    
    if t5_pass:
        with open(f1, "r", encoding="utf-8") as rf1, open(f2, "r", encoding="utf-8") as rf2:
            d1 = json.load(rf1)
            d2 = json.load(rf2)
            if len(d1) != len(d2) or len(d1) == 0:
                t5_pass = False
        with open(log_f, "r", encoding="utf-8") as lf:
            logs = json.load(lf)
            if len(logs) == 0 or logs[0].get("status") != "SUCCESS":
                t5_pass = False

    if t5_pass:
        print(f"  ✅ PASS: data/professors.json 및 my-exhibit-platform/data/professors.json 완전 동기화 ({len(d1)}명)")
        print(f"  ✅ PASS: data/logs/professor_runs.json 감사 로그 기록 확인 (최신 run_id: {logs[0].get('run_id')})")
        results.append(("Database Sync & Run Logging", "PASS"))
    else:
        print("  ❌ FAIL: 파일 동기화 또는 감사 로그 누락")
        results.append(("Database Sync & Run Logging", "FAIL"))

    # -------------------------------------------------------------
    # Final Result Summary
    # -------------------------------------------------------------
    print("\n" + "=" * 75)
    print("📊 [FINAL TEST EXECUTION REPORT]")
    print("=" * 75)
    
    all_passed = True
    for name, status in results:
        mark = "✅ PASS" if status == "PASS" else "❌ FAIL"
        print(f"{mark} | {name}")
        if status != "PASS":
            all_passed = False

    print("=" * 75)
    if all_passed:
        print("🎉 ALL TESTS PASSED! (5/5 PASS)")
    else:
        print("⚠️ SOME TESTS FAILED!")
    print("=" * 75 + "\n")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(run_tests())
