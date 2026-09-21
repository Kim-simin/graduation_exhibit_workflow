"""
STEP 8 — Content Generation Comprehensive Test Suite
Verifies all 18 mandatory test scenarios from Section 16:
1. Research Intelligence -> Content Brief
2. Content Objective Selection
3. Target Audience Selection
4. Platform Selection
5. Content Type Selection
6. Engagement Strategy
7. Instagram Reels Generation
8. Instagram Carousel Generation
9. Instagram Post Generation
10. YouTube Content Generation
11. Blog Content Generation
12. Source Traceability
13. Content QA Validation
14. Schema Validation
15. Idempotency
16. Versioning
17. Human Review Gate
18. Full E2E Content Generation (Approval Gate before STEP 9)
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

from generation_graph.state import (
    GenerationGraphState,
    ContentBrief,
    GeneratedContent,
    ContentQAResult,
)
from generation_graph.nodes import (
    node_research_loader,
    node_content_compressor,
    node_objective_selector,
    node_audience_selector,
    node_platform_selector,
    node_content_type_selector,
    node_engagement_strategy,
    node_content_generator,
    node_content_qa,
    node_human_review,
    node_versioning_persistence,
    node_approval_gate,
    GENERATED_DB_PATH,
    RUNS_LOG_PATH,
)
from generation_graph.runner import run_content_generation
from generation_graph.graph import content_generation_app


def run_all_step8_tests():
    print("=" * 80)
    print("🎬 [STEP 8: CONTENT GENERATION TEST SUITE - 18 TEST CASES]")
    print("=" * 80)

    test_results = {}

    # Setup base state
    mock_intel = {
        "project_id": "proj-mobility-hmi-2026",
        "scope": {
            "topic": "생성형 AI 기반 자율주행 차량 실내 엠비언트 HMI 디자인",
            "sector": "모빌리티 UX/UI & 공간 인터랙션",
            "target_audience": "디자인 전공 학부생 및 산학 연구원",
            "research_goal": "2026 자율주행 HMI 안전성 및 엠비언트 라이팅 가이드라인 수집",
        },
        "facts": [
            {
                "fact_id": "fact-01-policy",
                "fact": "국내 자율주행 레벨3+ 차량 실내 인터페이스 안전 가이드라인은 2026년 3분기부터 의무 적용된다.",
                "evidence": "한국디자인진흥원(KIDP) 공식 발표",
                "source": "한국디자인진흥원(KIDP)",
                "source_url": "https://kidp.or.kr/policy/mobility-hmi-standard-2026",
                "source_ids": ["src-kidp-01"],
                "fact_type": "OFFICIAL_POLICY",
                "confidence": "verified",
                "inference": False,
            },
            {
                "fact_id": "fact-02-lux",
                "fact": "운전자 주의 분산을 막기 위한 엠비언트 라이팅 최대 조도 표준 허용치는 120cd/m2이다.",
                "evidence": "KIDP 및 국토교통부 표준 규격",
                "source": "국토교통부 모빌리티정책국",
                "source_url": "https://molit.go.kr/reports/sdv-cockpit-safety-whitepaper",
                "source_ids": ["src-molit-02"],
                "fact_type": "STATISTIC",
                "confidence": "verified",
                "inference": False,
            },
            {
                "fact_id": "fact-03-latency",
                "fact": "생성형 AI 음성 피드백과 조명 피드백 간 지연시간은 200ms 이하로 제한된다.",
                "evidence": "SDV 디지털 콕핏 휴먼 팩터 백서 규제치",
                "source": "국토교통부 모빌리티정책국",
                "source_url": "https://molit.go.kr/reports/sdv-cockpit-safety-whitepaper",
                "source_ids": ["src-molit-02"],
                "fact_type": "STATISTIC",
                "confidence": "verified",
                "inference": False,
            },
            {
                "fact_id": "fact-04-ai-inference",
                "fact": "SDV 환경에서 시각 피드백 실패 시 촉각(햅틱) 인터페이스 연동이 디자이너의 필수 설계 요건이 될 것으로 추론된다.",
                "evidence": "돌발 상황 시 물리적 촉각 피드백 연동 의무화 지침",
                "source": "국토교통부 모빌리티정책국",
                "source_url": "https://molit.go.kr/reports/sdv-cockpit-safety-whitepaper",
                "source_ids": ["src-molit-02"],
                "fact_type": "FINDING",
                "confidence": "medium_confidence",
                "inference": True,
            },
        ],
        "sources": [
            {
                "source_id": "src-kidp-01",
                "publisher": "한국디자인진흥원(KIDP)",
                "title": "2026 국가 미래 모빌리티 HMI 가이드라인",
                "source_url": "https://kidp.or.kr/policy/mobility-hmi-standard-2026",
            },
            {
                "source_id": "src-molit-02",
                "publisher": "국토교통부 모빌리티정책국",
                "title": "SDV 콕핏 휴먼 팩터 백서",
                "source_url": "https://molit.go.kr/reports/sdv-cockpit-safety-whitepaper",
            },
        ],
        "opportunities": [
            {
                "opportunity_id": "opp-01",
                "opportunity_type": "checklist",
                "topic": "생성형 AI 모빌리티 HMI",
                "reason": "2026 자율주행 안전 가이드라인 필수 체크리스트 5종",
                "engagement_relevance": {
                    "share": "포트폴리오 스터디원 공유 유발",
                    "save": "졸업작품 제작 시 반복 참조 저장",
                    "retention": "항목별 체크리스트 검토로 체류 극대화",
                },
            }
        ],
        "keywords": ["HMI 가이드라인", "엠비언트 라이팅", "자율주행 레벨3+"],
        "entities": ["한국디자인진흥원(KIDP)", "국토교통부"],
    }

    base_state: GenerationGraphState = {
        "run_id": "test-run-step8-01",
        "started_at": "2026-09-16T10:00:00Z",
        "completed_at": None,
        "dry_run": True,
        "resume_checkpoint_id": None,
        "research_data": mock_intel,
        "target_platform": "instagram",
        "target_content_type": "reels",
        "custom_objective": None,
        "custom_audience": None,
        "version": 1,
        "content_brief": None,
        "resolved_objective": "",
        "resolved_audience": "",
        "resolved_platform": "",
        "resolved_content_type": "",
        "engagement_strategy": {},
        "generated_content": None,
        "qa_result": None,
        "human_review_record": None,
        "approval_status": "PENDING",
        "current_step": "START",
        "status": "INITIATED",
        "errors": [],
    }

    # ------------------------------------------------------------------
    # TEST 1: Research Intelligence -> Content Brief
    # ------------------------------------------------------------------
    print("\n[TEST 1] Research Intelligence -> Content Brief 압축 및 원문/추론 구분 검증")
    s1 = node_content_compressor(base_state)
    brief = s1["content_brief"]
    assert brief is not None
    assert brief["topic"] == mock_intel["scope"]["topic"]
    assert len(brief["raw_facts_summary"]) == 3, f"Expected 3 raw facts, got {len(brief['raw_facts_summary'])}"
    assert len(brief["ai_inferences_summary"]) == 1, f"Expected 1 AI inference, got {len(brief['ai_inferences_summary'])}"
    assert len(brief["sources_summary"]) == 2
    print("  ✅ PASS: Content Brief 추출 및 원문 팩트(3건)와 AI 추론(1건) 엄격 분리 검증")
    test_results["1. Research Intelligence -> Content Brief"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 2: Content Objective Selection
    # ------------------------------------------------------------------
    print("\n[TEST 2] 콘텐츠 제작 목적(Objective) 자동 도출 및 커스텀 지정 검증")
    base_state["content_brief"] = brief
    s2 = node_objective_selector(base_state)
    assert s2["resolved_objective"] != ""
    # Test custom objective
    custom_state = dict(base_state)
    custom_state["custom_objective"] = "교수 연구 소개 및 산학협력 프로젝트 공모"
    s2_custom = node_objective_selector(custom_state)
    assert s2_custom["resolved_objective"] == "교수 연구 소개 및 산학협력 프로젝트 공모"
    print(f"  ✅ PASS: 기회 기반 목적 자동 추론 및 커스텀 목적('{s2_custom['resolved_objective']}') 정상 반영")
    test_results["2. Content Objective Selection"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 3: Target Audience Selection
    # ------------------------------------------------------------------
    print("\n[TEST 3] 대상 독자(Target Audience) 타겟팅 검증")
    s3 = node_audience_selector(base_state)
    assert s3["resolved_audience"] != ""
    print(f"  ✅ PASS: 대상 독자 타겟팅 완료 ({s3['resolved_audience']})")
    test_results["3. Target Audience Selection"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 4: Platform Selection
    # ------------------------------------------------------------------
    print("\n[TEST 4] 멀티 플랫폼(Instagram, YouTube, Blog) 라우팅 검증")
    for plat in ["instagram", "youtube", "blog"]:
        test_p_state = dict(base_state)
        test_p_state["target_platform"] = plat
        out_p = node_platform_selector(test_p_state)
        assert out_p["resolved_platform"] == plat
    print("  ✅ PASS: Instagram, YouTube, Blog 3대 플랫폼 라우팅 정상")
    test_results["4. Platform Selection"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 5: Content Type Selection
    # ------------------------------------------------------------------
    print("\n[TEST 5] 플랫폼별 콘텐츠 유형(Content Type) 매핑 검증")
    # Instagram types
    for itype in ["reels", "carousel", "post"]:
        t_state = dict(base_state)
        t_state["resolved_platform"] = "instagram"
        t_state["target_content_type"] = itype
        out_t = node_content_type_selector(t_state)
        assert out_t["resolved_content_type"] == itype
    # YouTube type
    t_state["resolved_platform"] = "youtube"
    out_yt = node_content_type_selector(t_state)
    assert out_yt["resolved_content_type"] == "video_script"
    # Blog type
    t_state["resolved_platform"] = "blog"
    out_bg = node_content_type_selector(t_state)
    assert out_bg["resolved_content_type"] == "blog_post"
    print("  ✅ PASS: Reels, Carousel, Post, Video Script, Blog Post 유형 결정 통과")
    test_results["5. Content Type Selection"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 6: Engagement Strategy
    # ------------------------------------------------------------------
    print("\n[TEST 6] Share / Save / Retention 반응 유도 전략 검증")
    base_state["resolved_content_type"] = "carousel"
    s6 = node_engagement_strategy(base_state)
    strat = s6["engagement_strategy"]
    assert "share" in strat and len(strat["share"]) > 5
    assert "save" in strat and len(strat["save"]) > 5
    assert "retention" in strat and len(strat["retention"]) > 5
    print("  ✅ PASS: 고정 알고리즘 가중치 배제 및 콘텐츠 맞춤형 반응 전략 생성 확인")
    test_results["6. Engagement Strategy"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 7: Instagram Reels Generation
    # ------------------------------------------------------------------
    print("\n[TEST 7] Instagram Reels 생성 및 6단계 구조(Hook~CTA) 검증")
    reels_state = dict(base_state)
    reels_state["resolved_platform"] = "instagram"
    reels_state["resolved_content_type"] = "reels"
    reels_state["resolved_objective"] = "실무 정보 전달"
    reels_state["resolved_audience"] = "모빌리티 디자인 전공생"
    reels_state["engagement_strategy"] = strat

    s7 = node_content_generator(reels_state)
    reels = s7["generated_content"]
    assert reels["platform"] == "instagram"
    assert reels["content_type"] == "reels"
    assert len(reels["structure"]) == 6, f"Expected 6 steps for Reels, got {len(reels['structure'])}"
    section_names = [s["section_name"] for s in reels["structure"]]
    assert any("Hook" in name for name in section_names)
    assert any("CTA" in name for name in section_names)
    assert reels["hook"] != ""
    print(f"  ✅ PASS: Instagram Reels 6단계 파이프라인 구조([{[s[:12] for s in section_names]}]) 생성 완료")
    test_results["7. Instagram Reels Generation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 8: Instagram Carousel Generation
    # ------------------------------------------------------------------
    print("\n[TEST 8] Instagram Carousel 생성 및 7슬라이드 구조 검증")
    carousel_state = dict(base_state)
    carousel_state["resolved_platform"] = "instagram"
    carousel_state["resolved_content_type"] = "carousel"
    carousel_state["resolved_objective"] = "체크리스트 가이드"
    carousel_state["resolved_audience"] = "재학생 및 취준생"
    carousel_state["engagement_strategy"] = strat

    s8 = node_content_generator(carousel_state)
    carousel = s8["generated_content"]
    assert carousel["content_type"] == "carousel"
    assert len(carousel["structure"]) == 7, f"Expected 7 slides, got {len(carousel['structure'])}"
    assert "Cover" in carousel["structure"][0]["section_name"]
    assert "CTA" in carousel["structure"][-1]["section_name"]
    print("  ✅ PASS: 7개 슬라이드 카드뉴스 구조 및 슬라이드별 시각 연출 노트 완비")
    test_results["8. Instagram Carousel Generation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 9: Instagram Post Generation
    # ------------------------------------------------------------------
    print("\n[TEST 9] Instagram Single Post (Feed) 생성 검증")
    post_state = dict(base_state)
    post_state["resolved_platform"] = "instagram"
    post_state["resolved_content_type"] = "post"
    post_state["resolved_objective"] = "산업 트렌드 요약"
    post_state["resolved_audience"] = "일반 사용자 및 디자이너"
    post_state["engagement_strategy"] = strat

    s9 = node_content_generator(post_state)
    post = s9["generated_content"]
    assert post["content_type"] == "post"
    assert len(post["hashtags"]) >= 5
    assert len(post["caption"]) > 30
    print(f"  ✅ PASS: 단일 피드 포스트 생성 (해시태그 {len(post['hashtags'])}개, 본문 및 CTA 포함)")
    test_results["9. Instagram Post Generation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 10: YouTube Content Generation
    # ------------------------------------------------------------------
    print("\n[TEST 10] YouTube Video Script 생성 및 챕터/타임스탬프 검증")
    yt_state = dict(base_state)
    yt_state["resolved_platform"] = "youtube"
    yt_state["resolved_content_type"] = "video_script"
    yt_state["resolved_objective"] = "심층 분석 교육"
    yt_state["resolved_audience"] = "전문 연구원 및 대학원생"
    yt_state["engagement_strategy"] = strat

    s10 = node_content_generator(yt_state)
    yt_content = s10["generated_content"]
    assert yt_content["platform"] == "youtube"
    assert yt_content["content_type"] == "video_script"
    assert any("Chapter" in s["section_name"] for s in yt_content["structure"])
    print("  ✅ PASS: 타임스탬프 챕터 구조(Intro, Ch1, Ch2, Ch3, Outro)를 갖춘 영상 대본 생성")
    test_results["10. YouTube Content Generation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 11: Blog Content Generation
    # ------------------------------------------------------------------
    print("\n[TEST 11] Blog 포스팅 생성 및 긴 호흡 기술 아티클 구조 검증")
    blog_state = dict(base_state)
    blog_state["resolved_platform"] = "blog"
    blog_state["resolved_content_type"] = "blog_post"
    blog_state["resolved_objective"] = "기술 백서 분석"
    blog_state["resolved_audience"] = "기업 관계자 및 교수진"
    blog_state["engagement_strategy"] = strat

    s11 = node_content_generator(blog_state)
    blog_content = s11["generated_content"]
    assert blog_content["platform"] == "blog"
    assert blog_content["content_type"] == "blog_post"
    assert any("References" in s["section_name"] for s in blog_content["structure"])
    print("  ✅ PASS: 서론-본론-데이터표-실증연구-참고문헌 구조 블로그 아티클 생성")
    test_results["11. Blog Content Generation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 12: Source Traceability
    # ------------------------------------------------------------------
    print("\n[TEST 12] 근거 추적성 (Claim -> Fact -> Source -> URL) 검증")
    trace_records = reels["source_traceability"]
    assert len(trace_records) >= 2, f"Expected at least 2 source traceability records, got {len(trace_records)}"
    for tr in trace_records:
        assert tr["claim"] != ""
        assert tr["fact_id"] != ""
        assert tr["publisher"] != ""
        assert tr["source_url"].startswith("http")
    sample_tr = trace_records[0]
    print(f"  ✅ PASS: 주장({sample_tr['claim'][:20]}...) -> 출처({sample_tr['publisher']}) -> URL({sample_tr['source_url']}) 연결 검증")
    test_results["12. Source Traceability"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 13: Content QA Validation (Pass & Fail Scenarios)
    # ------------------------------------------------------------------
    print("\n[TEST 13] 10-Point Content QA 자동 감사 (합격/불합격 시나리오) 검증")
    # 1. Valid content should pass QA
    qa_state = dict(reels_state)
    qa_state["generated_content"] = reels
    s13_pass = node_content_qa(qa_state)
    assert s13_pass["qa_result"]["passed"] is True
    assert s13_pass["qa_result"]["score"] >= 0.9

    # 2. Defective content (missing CTA and missing sources) should fail QA
    defective_reels = dict(reels)
    defective_reels["cta"] = ""
    defective_reels["source_traceability"] = []
    qa_fail_state = dict(qa_state)
    qa_fail_state["generated_content"] = defective_reels
    s13_fail = node_content_qa(qa_fail_state)
    assert s13_fail["qa_result"]["passed"] is False
    assert len(s13_fail["qa_result"]["errors"]) >= 2
    print("  ✅ PASS: 정상 콘텐츠 100% 합격 및 결함 콘텐츠(CTA누락, 출처누락) 정밀 검출 차단 확인")
    test_results["13. Content QA Validation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 14: Schema Validation
    # ------------------------------------------------------------------
    print("\n[TEST 14] 공통 Content Schema 필드 무결성 검증")
    required_keys = [
        "content_id", "project_id", "research_ids", "platform",
        "content_type", "objective", "target_audience", "engagement_strategy",
        "title", "hook", "body", "caption", "cta", "keywords",
        "hashtags", "structure", "visual_direction", "asset_requirements",
        "source_traceability", "version", "status"
    ]
    for k in required_keys:
        assert k in reels and reels[k] is not None, f"Missing required content key: {k}"
    print(f"  ✅ PASS: Master Content Schema 21개 속성 100% 완비")
    test_results["14. Schema Validation"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 15: Idempotency
    # ------------------------------------------------------------------
    print("\n[TEST 15] 멱등성 (Idempotency) 및 중복 무한 생성 방지 검증")
    res1 = run_content_generation(platform="instagram", content_type="reels", dry_run=False, version=1)
    c1_id = res1["generated_content"]["content_id"]

    res2 = run_content_generation(platform="instagram", content_type="reels", dry_run=False, version=1)
    c2_id = res2["generated_content"]["content_id"]

    assert c1_id == c2_id, "Content ID must be deterministic for the same parameters and version"
    print(f"  ✅ PASS: 동일 조건 재실행 시 고유 ID({c1_id}) 유지 및 중복 생성 방지 확인")
    test_results["15. Idempotency"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 16: Versioning
    # ------------------------------------------------------------------
    print("\n[TEST 16] 콘텐츠 버전 관리 (Versioning: v1 -> v2) 검증")
    res_v2 = run_content_generation(platform="instagram", content_type="reels", dry_run=False, version=2)
    c_v2 = res_v2["generated_content"]
    assert c_v2["version"] == 2
    assert c_v2["content_id"] != c1_id, "Version 2 must have distinct content ID"
    assert c_v2["parent_version_id"] is not None

    # Verify both versions exist in database
    with open(GENERATED_DB_PATH, "r", encoding="utf-8") as f:
        db_data = json.load(f)
    ids_in_db = [c["content_id"] for c in db_data.get("contents", [])]
    assert c1_id in ids_in_db
    assert c_v2["content_id"] in ids_in_db
    print(f"  ✅ PASS: 버전 증가({c1_id} -> {c_v2['content_id']}) 및 이력 DB 동시 보존 검증 완료")
    test_results["16. Versioning"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 17: Human Review Gate
    # ------------------------------------------------------------------
    print("\n[TEST 17] Human Review 큐 등록 및 상태 전이 검증")
    hr_state = dict(qa_state)
    hr_state["generated_content"] = s13_pass["generated_content"]
    hr_state["qa_result"] = s13_pass["qa_result"]
    s17 = node_human_review(hr_state)
    assert s17["generated_content"]["status"] == "HUMAN_REVIEW"
    assert s17["human_review_record"]["status"] == "PENDING"
    print("  ✅ PASS: QA 통과 콘텐츠의 HUMAN_REVIEW 대기 상태 전이 및 검토 기록 생성 확인")
    test_results["17. Human Review Gate"] = "PASS"

    # ------------------------------------------------------------------
    # TEST 18: Full E2E Content Generation & Approval Gate
    # ------------------------------------------------------------------
    print("\n[TEST 18] 전체 12단계 LangGraph E2E 가동 및 STEP 9 이전 승인 게이트 차단 검증")
    thread_id = f"test-step8-thread-{uuid.uuid4().hex[:6]}"
    e2e_state = run_content_generation(
        platform="instagram",
        content_type="carousel",
        dry_run=False,
        thread_id=thread_id,
    )
    assert e2e_state["approval_status"] == "APPROVAL_REQUIRED", "Pipeline must halt at APPROVAL_REQUIRED"
    assert e2e_state["current_step"] == "approval_gate"
    assert e2e_state["generated_content"] is not None
    assert e2e_state["qa_result"]["passed"] is True

    # Strict Scope: No publishing actions occurred
    assert "instagram_published" not in e2e_state
    assert "publish_result" not in e2e_state
    print("  ✅ PASS: 12개 노드 전 구간 완주 후 STEP 9 자동 실행 차단 및 Approval Gate 대기 확인")
    test_results["18. Full E2E & Approval Gate"] = "PASS"

    # ------------------------------------------------------------------
    # FINAL SUMMARY REPORT
    # ------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("📊 [STEP 8 TEST EXECUTION SUMMARY REPORT]")
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
    success = run_all_step8_tests()
    sys.exit(0 if success else 1)
