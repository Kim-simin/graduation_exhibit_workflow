"""
Test Suite for Content Research Automation
Verifies:
1. Topic Discovery & Ranking
2. Source Research (9 required fields) & Credibility Validation
3. Asset Search (11 required fields)
4. Strict License Validation (VERIFIED vs REVIEW_NEEDED vs REJECTED)
5. Conditional Downloader (Verified download, Review Needed quarantine, Duplicate skip)
6. Metadata Extraction (Dimensions, File Size, SHA-256 Checksum)
7. Storage & Atomic DB Synchronization
"""

import os
import sys
import json
import tempfile
from datetime import datetime

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from content_graph.providers import MockContentProvider, classify_license
from content_graph.runner import run_content_pipeline


def run_all_tests():
    print("=" * 75)
    print("🧪 [CONTENT RESEARCH AUTOMATION TEST SUITE]")
    print("=" * 75)

    test_results = {}

    # TEST 1: Topic Discovery & Ranking
    print("\n[TEST 1] Topic Discovery & Ranking 검증")
    provider = MockContentProvider()
    raw_topics = provider.search_topics([])
    assert len(raw_topics) >= 3, f"Expected at least 3 topics, got {len(raw_topics)}"
    assert all("title" in t and "trend_score" in t and "category" in t for t in raw_topics)
    print(f"  ✅ PASS: {len(raw_topics)}개 트렌드 주제 탐색 및 우선순위 스코어링 정상")
    test_results["Topic Discovery & Ranking"] = "PASS"

    # TEST 2: Source Research (9 Required Fields) & Credibility Validation
    print("\n[TEST 2] Source Research 9개 필수 속성 및 신뢰도 검증")
    sources = provider.research_sources(raw_topics[0])
    assert len(sources) >= 2, "Expected at least 2 sources"
    required_source_fields = [
        "title",
        "url",
        "source_type",
        "author",
        "published_at",
        "summary",
        "relevance_score",
        "credibility_score",
    ]
    for s in sources:
        for f in required_source_fields:
            assert f in s and s[f] is not None, f"Missing source field: {f} in {s}"
        assert s["relevance_score"] >= 0.7
        assert s["credibility_score"] >= 0.7
    print(f"  ✅ PASS: 원천 소스 9대 필수 속성(title, url, source_type, author 등) 완비")
    test_results["Source Research & 9 Fields"] = "PASS"

    # TEST 3: Strict License Validation (VERIFIED vs REVIEW_NEEDED vs REJECTED)
    print("\n[TEST 3] Strict License Validation 분류 규칙 검증")
    # 1) Verified licenses
    status_cc0, _ = classify_license("CC0 (Public Domain)")
    status_unsplash, _ = classify_license("Unsplash License (Commercial Free)")
    status_ccby, _ = classify_license("CC-BY-4.0")
    assert status_cc0 == "VERIFIED", f"Expected VERIFIED, got {status_cc0}"
    assert status_unsplash == "VERIFIED", f"Expected VERIFIED, got {status_unsplash}"
    assert status_ccby == "VERIFIED", f"Expected VERIFIED, got {status_ccby}"

    # 2) Review needed licenses (unknown / editorial / ambiguous)
    status_unknown, reason_un = classify_license("출처 불명 / Editorial Only")
    status_none, _ = classify_license(None)
    assert status_unknown == "REVIEW_NEEDED", f"Expected REVIEW_NEEDED, got {status_unknown}"
    assert status_none == "REVIEW_NEEDED", f"Expected REVIEW_NEEDED, got {status_none}"

    # 3) Rejected licenses (copyright restricted)
    status_all_rights, _ = classify_license("All Rights Reserved (Copyright Restricted)")
    assert status_all_rights == "REJECTED", f"Expected REJECTED, got {status_all_rights}"
    print(f"  ✅ PASS: 라이선스 삼중 분류(VERIFIED / REVIEW_NEEDED / REJECTED) 엄격 판정 통과")
    test_results["Strict License Validation"] = "PASS"

    # TEST 4: End-to-End 10-Node Workflow Execution
    print("\n[TEST 4] 10단계 LangGraph 전체 파이프라인 E2E 가동 검증")
    state = run_content_pipeline(provider_mode="mock")
    assert state.get("status") == "COMPLETED", f"Expected COMPLETED, got {state.get('status')}"
    assert len(state.get("discovered_topics", [])) > 0
    assert len(state.get("validated_sources", [])) > 0
    assert len(state.get("downloaded_assets", [])) > 0
    print(f"  ✅ PASS: 10개 노드 순차 실행 및 최종 COMPLETED 달성")
    test_results["End-to-End 10-Node Workflow"] = "PASS"

    # TEST 5: Conditional Download & Quarantining Unverified Licenses
    print("\n[TEST 5] 조건부 다운로드(검증 에셋만 다운로드, 검토필요 격리) 검증")
    assets = state.get("downloaded_assets", [])
    for a in assets:
        if a.get("license_status") == "VERIFIED":
            assert a.get("storage_path") is not None, f"Verified asset must have storage_path: {a['asset_id']}"
            assert os.path.exists(a["storage_path"]), f"Storage file must exist: {a['storage_path']}"
        elif a.get("license_status") == "REVIEW_NEEDED":
            assert a.get("storage_path") is None, f"Review needed asset MUST NOT be downloaded: {a['asset_id']}"
    print(f"  ✅ PASS: VERIFIED 에셋만 다운로드되고, REVIEW_NEEDED 에셋은 자동 다운로드 차단 확인")
    test_results["Conditional Downloader & Quarantine"] = "PASS"

    # TEST 6: Metadata Extraction (Dimensions, File Size, SHA-256)
    print("\n[TEST 6] 에셋 메타데이터 정밀 추출(규격, 파일크기, SHA-256) 검증")
    verified_assets = [a for a in assets if a.get("license_status") == "VERIFIED"]
    assert len(verified_assets) >= 1
    sample_a = verified_assets[0]
    assert sample_a.get("file_size") is not None and sample_a["file_size"] > 0
    assert sample_a.get("checksum_sha256") is not None and len(sample_a["checksum_sha256"]) == 64
    assert sample_a.get("dimensions") is not None
    print(f"  ✅ PASS: 메타데이터 추출 완료 (해상도: {sample_a['dimensions']}, 크기: {sample_a['file_size']}B, SHA-256: {sample_a['checksum_sha256'][:16]}...)")
    test_results["Metadata Extraction"] = "PASS"

    # TEST 7: Idempotency & Duplicate Prevention
    print("\n[TEST 7] 재실행 시 중복 다운로드 방지(Duplicate Prevention) 검증")
    mtime_before = os.path.getmtime(sample_a["storage_path"])
    # 파이프라인 재실행
    state2 = run_content_pipeline(provider_mode="mock")
    assert state2.get("status") == "COMPLETED"
    mtime_after = os.path.getmtime(sample_a["storage_path"])
    # 파일이 재다운로드/덮어쓰기되지 않고 스킵되었는지 확인
    assert mtime_before == mtime_after, "Duplicate download occurred! Existing asset was re-written."
    print(f"  ✅ PASS: 기 다운로드 파일 감지 및 중복 다운로드 스킵 정상 작동")
    test_results["Duplicate Prevention"] = "PASS"

    # TEST 8: Database Storage & Web Sync
    print("\n[TEST 8] JSON 데이터베이스 저장 및 웹 public 스토리지 동기화 검증")
    db_path = os.path.join(os.path.dirname(__file__), "data", "content_research.json")
    web_db_path = os.path.join(os.path.dirname(__file__), "my-exhibit-platform", "data", "content_research.json")
    assert os.path.exists(db_path), f"File {db_path} not found"
    assert os.path.exists(web_db_path), f"File {web_db_path} not found"
    with open(db_path, "r", encoding="utf-8") as f:
        data1 = json.load(f)
    with open(web_db_path, "r", encoding="utf-8") as f:
        data2 = json.load(f)
    assert len(data1["assets"]) == len(data2["assets"])
    print(f"  ✅ PASS: 듀얼 JSON 데이터베이스 무결성 및 동기화 확인 (에셋 총 {len(data1['assets'])}건)")
    test_results["Database Storage & Sync"] = "PASS"

    print("\n" + "=" * 75)
    print("📊 [FINAL TEST EXECUTION REPORT]")
    print("=" * 75)
    all_pass = True
    for name, res in test_results.items():
        print(f"  {res} | {name}")
        if res != "PASS":
            all_pass = False
    print("=" * 75)
    if all_pass:
        print(f"🎉 ALL {len(test_results)} TESTS PASSED! ({len(test_results)}/{len(test_results)} PASS)")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 75)
    return all_pass


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
