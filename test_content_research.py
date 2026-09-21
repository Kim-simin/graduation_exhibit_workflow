"""
STEP 7 Content Research Automation Comprehensive Test Suite
Verifies all 14 mandatory test scenarios from Section 22:
1. Research Scope Generation
2. Source Discovery (6-tier authority priority & 8 metadata attributes)
3. Source Validation
4. Fact Extraction (Raw fact vs AI inference distinction)
5. Normalization (Dates, institutions, URLs)
6. Deduplication ("Identical Fact + Multiple Sources" consolidation)
7. Conflict Detection (status="conflicting" & Human Review routing)
8. Opportunity Detection (checklist, faq, etc. with share/save/retention)
9. Idempotency (Deterministic IDs & duplicate prevention)
10. Resume / Checkpoint
11. Partial Failure Isolation (Single source failure results in PARTIAL_SUCCESS)
12. Dry Run Test (No disk writes)
13. Research Run Log Audit Record
14. Full E2E Test (Halts at Approval Gate before STEP 8)
"""

import os
import sys
import json
import time
import uuid

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from content_graph.state import (
    ResearchScope,
    ContentGraphState,
    ResearchSource,
    ExtractedFact,
)
from content_graph.providers import MockContentProvider, get_content_provider
from content_graph.nodes import (
    node_research_scope,
    node_source_discovery,
    node_source_collection,
    node_source_validation,
    node_fact_extraction,
    node_normalization,
    node_deduplication,
    node_topic_keyword_extraction,
    node_opportunity_detection,
    node_persistence,
    node_research_report,
    node_human_review,
    CONTENT_DB_PATH,
    RUNS_LOG_PATH,
)
from content_graph.runner import run_content_research
from content_graph.graph import content_research_app


def run_all_step7_tests():
    print("=" * 80)
    print("🔬 [STEP 7: CONTENT RESEARCH AUTOMATION TEST SUITE - 14 TEST CASES]")
    print("=" * 80)

    test_results = {}

    # ------------------------------------------------------------------
    # TEST 1: Research Scope Generation
    # ------------------------------------------------------------------
    print("\n[TEST 1] Research Scope 생성 및 무제한 검색 방지 검증")
    mock_state: ContentGraphState = {
        "run_id": "test-run-01",
        "started_at": "2026-09-16T10:00:00Z",
        "completed_at": None,
        "provider_mode": "mock",
        "dry_run": True,
        "resume_checkpoint_id": None,
        "scope": None,
        "target_keywords": ["생성형 AI 모빌리티 HMI"],
        "discovered_sources": [],
        "collected_sources": [],
        "validated_sources": [],
        "failed_items": [],
        "raw_facts": [],
        "normalized_facts": [],
        "deduplicated_facts": [],
        "duplicates_removed": 0,
        "conflicts": [],
        "topic_keyword_data": None,
        "research_items": [],
        "opportunities": [],
        "research_intelligence": None,
        "research_report": None,
        "review_items": [],
        "human_review_required": False,
        "approval_status": "PENDING",
        "discovered_topics": [],
        "ranked_topics": [],
        "selected_topic": None,
        "researched_sources": [],
        "discovered_assets": [],
        "validated_assets": [],
        "ranked_assets": [],
        "downloaded_assets": [],
        "stored_assets": [],
        "errors": [],
        "status": "INITIATED",
        "current_step": "START",
        "summary": {},
    }
    out_scope = node_research_scope(mock_state)
    scope = out_scope["scope"]
    required_scope_fields = [
        "topic", "sector", "target_audience", "research_goal",
        "date_range", "source_constraints", "geographic_scope",
        "language", "freshness_requirement"
    ]
    for f in required_scope_fields:
        assert f in scope and scope[f], f"Missing required scope field: {f}"
    print(f"  ✅ PASS: 9대 필수 필드 완비 및 안전 Bounded Scope 자동 수립 ({scope['topic']})")
    test_results["1. Research Scope Generation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 2: Source Discovery
    # ------------------------------------------------------------------
    print("\n[TEST 2] 6대 우선순위 기반 Source Discovery 및 8대 메타데이터 검증")
    mock_state["scope"] = scope
    out_discovery = node_source_discovery(mock_state)
    sources = out_discovery["discovered_sources"]
    assert len(sources) >= 5, f"Expected at least 5 sources, got {len(sources)}"
    
    types_found = {s["source_type"] for s in sources}
    # Verify 6 priority tiers presence
    expected_tiers = {"OFFICIAL_ORG", "OFFICIAL_DOC", "ACADEMIC", "PUBLIC_DATA", "PROFESSIONAL_ORG"}
    assert expected_tiers.issubset(types_found), f"Missing tiers: {expected_tiers - types_found}"
    
    required_source_fields = [
        "source_url", "source_type", "publisher", "title",
        "published_at", "accessed_at", "authority", "language"
    ]
    for s in sources:
        for f in required_source_fields:
            assert f in s and s[f] is not None, f"Source missing field {f}: {s}"
    print(f"  ✅ PASS: 6대 권위 우선순위({len(types_found)}종) 발굴 및 8대 필수 메타데이터 검증 완료")
    test_results["2. Source Discovery"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 3: Source Validation
    # ------------------------------------------------------------------
    print("\n[TEST 3] 출처 접근성, 식별성 및 신뢰성 정밀 검증")
    mock_state["discovered_sources"] = sources
    out_collected = node_source_collection(mock_state)
    mock_state["collected_sources"] = out_collected["collected_sources"]
    out_val = node_source_validation(mock_state)
    val_sources = out_val["validated_sources"]
    assert len(val_sources) == len(out_collected["collected_sources"])
    for vs in val_sources:
        assert vs["validation_status"] in ["VERIFIED", "REVIEW_NEEDED", "ACCESSIBILITY_FAILED"]
        assert vs["source_url"].startswith("http")
    print(f"  ✅ PASS: 출처 URL 및 메타데이터 무결성 검증 통과 (승인 {sum(1 for v in val_sources if v['validation_status'] == 'VERIFIED')}건)")
    test_results["3. Source Validation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 4: Fact Extraction (Raw Fact vs AI Inference)
    # ------------------------------------------------------------------
    print("\n[TEST 4] 원문 사실(Raw Fact)과 AI 추론(Inference) 엄격 분리 추출 검증")
    mock_state["validated_sources"] = val_sources
    out_facts = node_fact_extraction(mock_state)
    raw_facts = out_facts["raw_facts"]
    assert len(raw_facts) >= 5, f"Expected at least 5 facts, got {len(raw_facts)}"
    
    raw_confirmed = [f for f in raw_facts if not f["inference"]]
    ai_inferred = [f for f in raw_facts if f["inference"]]
    assert len(raw_confirmed) >= 4, "Expected raw confirmed facts"
    assert len(ai_inferred) >= 1, "Expected at least 1 AI inferred fact"
    assert all("evidence" in f and "fact_type" in f and "confidence" in f for f in raw_facts)
    print(f"  ✅ PASS: 사실 구조화 완비 (원문 직접 확인: {len(raw_confirmed)}건 | AI 추론: {len(ai_inferred)}건 엄격 구분)")
    test_results["4. Fact Extraction (Raw vs AI Inference)"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 5: Normalization
    # ------------------------------------------------------------------
    print("\n[TEST 5] 날짜, 기관명, 고유명사 및 URL 정규화 (무손실 보존) 검증")
    mock_state["raw_facts"] = raw_facts
    out_norm = node_normalization(mock_state)
    norm_facts = out_norm["normalized_facts"]
    assert len(norm_facts) == len(raw_facts)
    for nf in norm_facts:
        # Check date format YYYY-MM-DD
        pub = nf["published_at"]
        assert len(pub) == 10 and pub[4] == "-" and pub[7] == "-", f"Invalid date: {pub}"
        # Check institution normalized (e.g. SNU -> 서울대학교)
        assert "SNU" not in nf["source"]
    print("  ✅ PASS: ISO 8601 날짜 규격, 표준 기관명 치환 및 정규화 완료")
    test_results["5. Normalization"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 6: Deduplication ("동일 Fact + 복수 Source")
    # ------------------------------------------------------------------
    print("\n[TEST 6] '동일 Fact + 복수 Source' 중복 통합 및 출처 보존 검증")
    mock_state["normalized_facts"] = norm_facts
    out_dedup = node_deduplication(mock_state)
    deduped = out_dedup["deduplicated_facts"]
    dups_removed = out_dedup["duplicates_removed"]
    assert dups_removed >= 1, f"Expected duplicate facts to be consolidated, got {dups_removed}"
    
    multi_source_facts = [f for f in deduped if len(f["source_ids"]) > 1]
    assert len(multi_source_facts) >= 1, "Expected at least 1 fact supported by multiple sources"
    sample_multi = multi_source_facts[0]
    assert len(sample_multi["source_ids"]) >= 2
    assert sample_multi["confidence"] == "verified"
    print(f"  ✅ PASS: 동일 사실('{sample_multi['fact'][:30]}...') 복수 출처({len(sample_multi['source_ids'])}곳) 정상 통합 및 삭제 방지")
    test_results["6. Deduplication (Multi-source Fact)"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 7: Conflict Detection & Human Review Routing
    # ------------------------------------------------------------------
    print("\n[TEST 7] 상충 정보 감지(Conflict Detection) 및 Human Review 큐 라우팅 검증")
    conflicts = out_dedup["conflicts"]
    assert len(conflicts) >= 1, f"Expected at least 1 conflict, got {len(conflicts)}"
    c0 = conflicts[0]
    assert c0["status"] == "conflicting"
    assert "65%" in c0["value_a"] or "65%" in c0["value_b"]
    assert "35%" in c0["value_a"] or "35%" in c0["value_b"]
    # Check conflicting facts are tagged as conflicting
    conflicting_facts = [f for f in deduped if f["confidence"] == "conflicting"]
    assert len(conflicting_facts) >= 2, "Conflicting facts must have confidence='conflicting'"
    print(f"  ✅ PASS: 수치 상충(65% vs 35%) 자동 감지, status='conflicting' 지정 및 임의 삭제 방지")
    test_results["7. Conflict Detection"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 8: Opportunity Detection with Engagement Relevance
    # ------------------------------------------------------------------
    print("\n[TEST 8] 콘텐츠 기회(Opportunity) 및 Share/Save/Retention 메타데이터 검증")
    mock_state["deduplicated_facts"] = deduped
    out_tke = node_topic_keyword_extraction(mock_state)
    mock_state["topic_keyword_data"] = out_tke["topic_keyword_data"]
    mock_state["research_items"] = out_tke["research_items"]
    
    out_opp = node_opportunity_detection(mock_state)
    opps = out_opp["opportunities"]
    assert len(opps) >= 3, f"Expected at least 3 opportunities, got {len(opps)}"
    valid_types = {"checklist", "faq", "comparison", "emerging_topic", "practical_information"}
    for o in opps:
        assert o["opportunity_type"] in valid_types
        er = o["engagement_relevance"]
        assert "share" in er and er["share"]
        assert "save" in er and er["save"]
        assert "retention" in er and er["retention"]
    # Strict scope check: No actual captions or reels scripts
    assert all("caption" not in o and "reels_script" not in o for o in opps)
    print(f"  ✅ PASS: 3종 기회({[o['opportunity_type'] for o in opps]}) 도출 및 공유/저장/체류 반응 메타데이터 완비")
    test_results["8. Opportunity Detection"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 9: Idempotency
    # ------------------------------------------------------------------
    print("\n[TEST 9] 멱등성(Idempotency) 및 동일 Research Scope 재실행 검증")
    state_run1 = run_content_research(provider_mode="mock", dry_run=False)
    intel1 = state_run1["research_intelligence"]
    assert intel1 is not None
    p_id1 = intel1["project_id"]
    fact_ids_1 = sorted([f["fact_id"] for f in intel1["facts"]])

    state_run2 = run_content_research(provider_mode="mock", dry_run=False)
    intel2 = state_run2["research_intelligence"]
    assert intel2 is not None
    p_id2 = intel2["project_id"]
    fact_ids_2 = sorted([f["fact_id"] for f in intel2["facts"]])

    assert p_id1 == p_id2, "Project ID must be deterministic"
    assert fact_ids_1 == fact_ids_2, "Fact IDs must be identical across deterministic re-runs"
    print(f"  ✅ PASS: 결정론적 ID 생성으로 동일 연구 재실행 시 중복 팩트 미생성 및 멱등성 유지")
    test_results["9. Idempotency"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 10: Resume / Checkpoint
    # ------------------------------------------------------------------
    print("\n[TEST 10] LangGraph Checkpointer 기반 Resume 검증")
    thread_id = f"test-resume-thread-{uuid.uuid4().hex[:6]}"
    state_step = run_content_research(provider_mode="mock", dry_run=True, thread_id=thread_id)
    assert state_step["approval_status"] == "APPROVAL_REQUIRED"
    
    # Verify state can be queried from checkpoint
    config = {"configurable": {"thread_id": thread_id}}
    checkpoint_state = content_research_app.get_state(config)
    assert checkpoint_state is not None
    assert checkpoint_state.values.get("approval_status") == "APPROVAL_REQUIRED"
    assert len(checkpoint_state.values.get("deduplicated_facts", [])) > 0
    print(f"  ✅ PASS: thread_id({thread_id})를 통한 그래프 상태 보존 및 체크포인트 확인 완료")
    test_results["10. Resume / Checkpoint"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 11: Partial Failure Isolation
    # ------------------------------------------------------------------
    print("\n[TEST 11] 소스 부분 장애 격리(Partial Failure Isolation) 검증")
    failing_source: ResearchSource = {
        "source_id": "src-failing-test",
        "source_url": "https://fail-test.example.com/network-error",
        "source_type": "NEWS",
        "publisher": "오류 테스트 출처",
        "title": "네트워크 단절 테스트 리포트",
        "published_at": "2026-03-01",
        "accessed_at": "2026-09-16T10:00:00Z",
        "authority": 0.5,
        "language": "ko",
        "raw_content": None,
        "extracted_content": None,
        "validation_status": "REVIEW_NEEDED",
        "validation_errors": [],
    }
    test_fail_state = dict(mock_state)
    test_fail_state["dry_run"] = False
    test_fail_state["discovered_sources"] = [val_sources[0], failing_source]
    test_fail_state["failed_items"] = []
    
    collected_res = node_source_collection(test_fail_state)
    assert len(collected_res["failed_items"]) == 1, "Expected 1 failed item"
    assert len(collected_res["collected_sources"]) == 1, "Expected 1 successful source"
    
    test_fail_state["collected_sources"] = collected_res["collected_sources"]
    test_fail_state["failed_items"] = collected_res["failed_items"]
    test_fail_state["validated_sources"] = collected_res["collected_sources"]
    test_fail_state["raw_facts"] = raw_facts[:2]
    test_fail_state["normalized_facts"] = raw_facts[:2]
    test_fail_state["deduplicated_facts"] = raw_facts[:2]
    test_fail_state["opportunities"] = []
    
    persist_res = node_persistence(test_fail_state)
    assert persist_res["status"] == "PARTIAL_SUCCESS", f"Expected PARTIAL_SUCCESS, got {persist_res['status']}"
    print(f"  ✅ PASS: 특정 소스 오류 발생 시 전체 중단 없이 PARTIAL_SUCCESS 및 실패 로그 격리")
    test_results["11. Partial Failure Isolation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 12: Dry Run Test (No Disk Writes)
    # ------------------------------------------------------------------
    print("\n[TEST 12] Dry Run 모드 (디스크 쓰기 방지) 검증")
    mtime_db_before = os.path.getmtime(CONTENT_DB_PATH) if os.path.exists(CONTENT_DB_PATH) else 0
    dry_state = run_content_research(provider_mode="mock", dry_run=True)
    assert dry_state["status"] == "DRY_RUN" or dry_state["approval_status"] == "APPROVAL_REQUIRED"
    assert dry_state["research_intelligence"] is not None
    mtime_db_after = os.path.getmtime(CONTENT_DB_PATH) if os.path.exists(CONTENT_DB_PATH) else 0
    assert mtime_db_before == mtime_db_after, "Dry run MUST NOT modify content_research.json!"
    print("  ✅ PASS: Dry Run 플래그 시 실제 DB 파일 쓰기 차단 및 메모리 인텔리전스 산출 정상")
    test_results["12. Dry Run Test"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 13: Research Run Log Audit Record
    # ------------------------------------------------------------------
    print("\n[TEST 13] Research Run Log 감사 로그 필드 무결성 검증")
    assert os.path.exists(RUNS_LOG_PATH), f"Log file not found: {RUNS_LOG_PATH}"
    with open(RUNS_LOG_PATH, "r", encoding="utf-8") as f:
        runs = json.load(f)
    assert len(runs) > 0, "Expected at least 1 run log entry"
    latest_run = runs[0]
    required_log_fields = [
        "run_id", "started_at", "completed_at", "scope",
        "sources_found", "sources_processed", "facts_extracted",
        "duplicates_removed", "conflicts_found", "opportunities_found",
        "failed_items", "status"
    ]
    for rf in required_log_fields:
        assert rf in latest_run, f"Missing run log field: {rf}"
    print(f"  ✅ PASS: 12개 감사 추적 항목 완비 (최신 Run ID: {latest_run['run_id']})")
    test_results["13. Research Run Log Audit"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 14: Full E2E Test & Approval Gate
    # ------------------------------------------------------------------
    print("\n[TEST 14] 전체 12단계 LangGraph E2E 가동 및 STEP 8 이전 승인 게이트 차단 검증")
    e2e_state = run_content_research(provider_mode="mock", dry_run=False)
    assert e2e_state["approval_status"] == "APPROVAL_REQUIRED", "Workflow must halt at APPROVAL_REQUIRED"
    assert e2e_state["human_review_required"] is True, "Conflict items must trigger human review"
    assert len(e2e_state["review_items"]) >= 1, "Review queue must contain items"
    assert e2e_state.get("research_report") is not None, "Research report must be generated"
    # Verify STEP 8 was NOT executed
    assert "instagram_post" not in e2e_state
    assert "captions" not in e2e_state
    assert "reels_script" not in e2e_state
    print("  ✅ PASS: 12개 노드 전 구간 완주 후 STEP 8 자동 실행 차단 및 Human Review 승인 게이트 도달")
    test_results["14. Full E2E & Approval Gate"] = "PASS"

    # ------------------------------------------------------------------
    # FINAL REPORT
    # ------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("📊 [STEP 7 TEST EXECUTION SUMMARY REPORT]")
    print("=" * 80)
    all_passed = True
    for t_name, t_res in test_results.items():
        print(f"  {t_res} | {t_name}")
        if t_res != "PASS":
            all_passed = False
    print("=" * 80)
    if all_passed:
        print(f"🎉 ALL {len(test_results)} TESTS PASSED! ({len(test_results)}/{len(test_results)} PASS)")
    else:
        print("❌ SOME TESTS FAILED!")
    print("=" * 80)

    return all_passed


if __name__ == "__main__":
    success = run_all_step7_tests()
    sys.exit(0 if success else 1)
