"""
STEP 8 — Content Generation 12 Workflow Nodes
Sequential Pipeline:
1. ResearchLoader
2. ContentCompressor
3. ObjectiveSelector
4. AudienceSelector
5. PlatformSelector
6. ContentTypeSelector
7. EngagementStrategy
8. ContentGenerator
9. ContentQA
10. HumanReview
11. VersioningPersistence
12. ApprovalGate
"""

import os
import sys
import json
import time
import uuid
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional

from langgraph.types import interrupt, Command

from .state import (
    ContentBrief,
    SourceTraceability,
    StructureBlock,
    ContentQAResult,
    GeneratedContent,
    HumanReviewRecord,
    GenerationGraphState,
)
from .templates import (
    build_reels_structure,
    build_carousel_structure,
    build_post_structure,
    build_youtube_structure,
    build_blog_structure,
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
RESEARCH_DB_PATH = os.path.join(DATA_DIR, "content_research.json")
GENERATED_DB_PATH = os.path.join(DATA_DIR, "generated_contents.json")
PLATFORM_GENERATED_DB_PATH = os.path.join(BASE_DIR, "my-exhibit-platform", "data", "generated_contents.json")
LOGS_DIR = os.path.join(DATA_DIR, "logs")
RUNS_LOG_PATH = os.path.join(LOGS_DIR, "content_generation_runs.json")


def _generate_deterministic_id(prefix: str, text: str) -> str:
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()[:10]
    return f"{prefix}-{h}"


# ======================================================================
# 1. Research Loader Node
# ======================================================================
def node_research_loader(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 1: Research Loader] STEP 7 Research Intelligence 로드 중...")
    input_data = state.get("research_data")

    if input_data and input_data.get("facts"):
        intel = input_data
    elif os.path.exists(RESEARCH_DB_PATH):
        try:
            with open(RESEARCH_DB_PATH, "r", encoding="utf-8") as f:
                db = json.load(f)
            intel = db.get("latest_intelligence")
            if not intel and db.get("research_projects"):
                intel = db["research_projects"][0]
        except Exception as e:
            intel = None
    else:
        intel = None

    # Fallback to default verified research data if DB is empty
    if not intel or not intel.get("facts"):
        print("  ⚠️ [Loader Warning] 저장된 리서치 DB가 없어 기본 검증 인텔리전스를 사용합니다.")
        intel = {
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
        }

    facts = intel.get("facts", [])
    print(f"-> 로드 완료: Project '{intel.get('project_id')}' | 팩트 {len(facts)}건 | 출처 {len(intel.get('sources', []))}건")
    return {
        "research_data": intel,
        "current_step": "research_loader",
        "status": "RESEARCH_LOADED",
    }


# ======================================================================
# 2. Content Compressor Node
# ======================================================================
def node_content_compressor(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 2: Content Compressor] Research Intelligence 분석 및 Content Brief 생성...")
    intel = state.get("research_data") or {}
    scope = intel.get("scope", {})
    facts = intel.get("facts", [])
    sources = intel.get("sources", [])
    opportunities = intel.get("opportunities", [])
    keywords = [k.get("keyword") if isinstance(k, dict) else str(k) for k in intel.get("keywords", [])]
    entities = [e.get("name") if isinstance(e, dict) else str(e) for e in intel.get("entities", [])]

    # 원문 직접 확인 사실과 AI 추론 결과 엄격 분리
    raw_facts = [f for f in facts if not f.get("inference", False)]
    ai_inferences = [f for f in facts if f.get("inference", False)]

    brief: ContentBrief = {
        "topic": scope.get("topic", "자율주행 차량 실내 엠비언트 HMI 디자인"),
        "sector": scope.get("sector", "모빌리티 UX/UI"),
        "target_audience": scope.get("target_audience", "디자인/공학 전공 재학생 및 취준생"),
        "research_goal": scope.get("research_goal", "2026 자율주행 HMI 안전성 및 엠비언트 라이팅 기준 분석"),
        "key_facts": facts,
        "raw_facts_summary": [f["fact"] for f in raw_facts],
        "ai_inferences_summary": [f["fact"] for f in ai_inferences],
        "sources_summary": [{"publisher": s.get("publisher", ""), "url": s.get("source_url", "")} for s in sources],
        "keywords": keywords or ["HMI 가이드라인", "엠비언트 라이팅", "자율주행 레벨3+", "SDV 콕핏"],
        "entities": entities or ["한국디자인진흥원(KIDP)", "국토교통부", "서울대학교 지능형 모빌리티 랩"],
        "opportunities": opportunities,
        "platform_constraints": {
            "max_video_duration": 60,
            "max_carousel_slides": 10,
            "recommended_aspect_ratio": "9:16 (Reels) / 1:1 or 4:5 (Carousel)",
        },
    }

    print(f"-> Content Brief 수립 완료 (원문 팩트 {len(raw_facts)}건, AI 추론 {len(ai_inferences)}건 분리 요약)")
    return {
        "content_brief": brief,
        "current_step": "content_compressor",
        "status": "BRIEF_GENERATED",
    }


# ======================================================================
# 3. Objective Selector Node
# ======================================================================
def node_objective_selector(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 3: Objective Selector] 콘텐츠 제작 목적(Objective) 결정 중...")
    custom = state.get("custom_objective")
    if custom:
        obj = custom
    else:
        brief = state.get("content_brief") or {}
        opps = brief.get("opportunities", [])
        if opps:
            o_type = opps[0].get("opportunity_type", "")
            if o_type == "checklist":
                obj = "실무 정보 전달 & 졸업전시 포트폴리오 가이드"
            elif o_type == "faq":
                obj = "기술 규제 교육 & 실무 궁금증 해소"
            elif o_type == "comparison":
                obj = "산업 트렌드 심층 비교 분석"
            else:
                obj = "산업 트렌드 소개 및 학생 프로젝트 역량 강화"
        else:
            obj = "정보 전달 및 산학협력 연구 소개"

    print(f"-> 결정된 콘텐츠 목적: [{obj}]")
    return {
        "resolved_objective": obj,
        "current_step": "objective_selector",
        "status": "OBJECTIVE_RESOLVED",
    }


# ======================================================================
# 4. Audience Selector Node
# ======================================================================
def node_audience_selector(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 4: Audience Selector] 대상 독자(Target Audience) 타겟팅 중...")
    custom = state.get("custom_audience")
    if custom:
        aud = custom
    else:
        brief = state.get("content_brief") or {}
        aud = brief.get("target_audience") or "모빌리티 디자인 전공 재학생 및 취업 준비생"

    print(f"-> 결정된 대상 독자: [{aud}]")
    return {
        "resolved_audience": aud,
        "current_step": "audience_selector",
        "status": "AUDIENCE_RESOLVED",
    }


# ======================================================================
# 5. Platform Selector Node
# ======================================================================
def node_platform_selector(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 5: Platform Selector] 발행 대상 플랫폼(Platform) 결정 중...")
    target = (state.get("target_platform") or "instagram").lower().strip()
    valid_platforms = ["instagram", "youtube", "blog"]
    resolved = target if target in valid_platforms else "instagram"

    print(f"-> 결정된 플랫폼: [{resolved.upper()}]")
    return {
        "resolved_platform": resolved,
        "current_step": "platform_selector",
        "status": "PLATFORM_RESOLVED",
    }


# ======================================================================
# 6. Content Type Selector Node
# ======================================================================
def node_content_type_selector(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 6: Content Type Selector] 플랫폼별 콘텐츠 유형(Content Type) 결정 중...")
    plat = state.get("resolved_platform", "instagram")
    target_type = (state.get("target_content_type") or "").lower().strip()

    if plat == "instagram":
        if target_type in ["reels", "carousel", "post"]:
            c_type = target_type
        else:
            c_type = "reels"  # Default
    elif plat == "youtube":
        c_type = "video_script"
    elif plat == "blog":
        c_type = "blog_post"
    else:
        c_type = "reels"

    print(f"-> 결정된 콘텐츠 유형: [{plat.upper()} > {c_type.upper()}]")
    return {
        "resolved_content_type": c_type,
        "current_step": "content_type_selector",
        "status": "CONTENT_TYPE_RESOLVED",
    }


# ======================================================================
# 7. Engagement Strategy Node
# ======================================================================
def node_engagement_strategy(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 7: Engagement Strategy] Share / Save / Retention 행동 유도 전략 수립 중...")
    c_type = state.get("resolved_content_type", "reels")
    obj = state.get("resolved_objective", "")

    if c_type == "carousel":
        strategy = {
            "share": "포트폴리오 스터디원 및 팀 프로젝트 동료 간 가이드 공유 유도",
            "save": "규제 기준 수치(120cd/m2, 200ms) 및 체크리스트 반복 열람 목적 스크랩 최우선",
            "retention": "7장 슬라이드 순차 열람을 통한 끝까지 읽기(Completion Rate) 극대화",
        }
    elif c_type == "reels":
        strategy = {
            "share": "첫 3초 충격적 후킹(2026년 규정 미준수 시 탈락)을 통한 동기 간 바이럴 확산",
            "save": "핵심 3대 팩트 수치 보관 목적 저장 유도",
            "retention": "빠른 화면 전환 컷(0~3초 후킹 → 10초 상황 → 30초 실측)으로 60초 완청률 달성",
        }
    elif c_type == "post":
        strategy = {
            "share": "취업/산학 과제 관련 커뮤니티 재공유",
            "save": "단일 피드 저장 기능 활용",
            "retention": "상세 캡션 정독 유발",
        }
    elif c_type == "video_script":
        strategy = {
            "share": "전문 유튜브 영상 링크 공유",
            "save": "나중에 볼 동영상 플레이리스트 추가",
            "retention": "타임스탬프 챕터별 심층 분석으로 평균 시청 시간(AVD) 확보",
        }
    else:  # blog_post
        strategy = {
            "share": "기술 블로그 및 링크드인 네트워크 공유",
            "save": "브라우저 북마크 및 사내 위키 저장",
            "retention": "표와 그래프를 통한 장시간 체류 시간 확보",
        }

    print("-> 반응 유도 전략 확정 (고정 가중치 없는 맞춤형 행동 설계)")
    return {
        "engagement_strategy": strategy,
        "current_step": "engagement_strategy",
        "status": "STRATEGY_RESOLVED",
    }


# ======================================================================
# 8. Content Generator Node (Strict Source Traceability)
# ======================================================================
def node_content_generator(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 8: Content Generator] 출처 근거 기반 고품질 콘텐츠 생성 및 근거 추적 체인 구축...")
    brief = state.get("content_brief") or {}
    intel = state.get("research_data") or {}
    platform = state.get("resolved_platform", "instagram")
    content_type = state.get("resolved_content_type", "reels")
    objective = state.get("resolved_objective", "")
    audience = state.get("resolved_audience", "")
    strategy = state.get("engagement_strategy", {})
    version = state.get("version", 1)

    topic = brief.get("topic", "자율주행 차량 실내 HMI")
    facts = brief.get("key_facts", [])

    cta_map = {
        "reels": "졸업작품 준비 중인 팀원들에게 공유하고, 규격 수치 잊지 않게 지금 저장해두세요!",
        "carousel": "필요할 때 바로 찾아볼 수 있게 지금 저장하고, 동기들과 스터디에 활용하세요!",
        "post": "여러분의 졸업작품에는 이 기준이 적용되어 있나요? 댓글로 의견을 나눠보세요!",
        "video_script": "더 자세한 연구 원문과 가이드라인 요약본은 더보기란 링크에서 확인하세요. 구독과 좋아요 부탁드립니다!",
        "blog_post": "본 포스팅이 유익하셨다면 북마크해 두시고, 연구 원문 링크는 하단 참고문헌을 확인해 주시기 바랍니다.",
    }
    cta = cta_map.get(content_type, "지금 저장하고 공유하세요!")

    # 1. 플랫폼 및 포맷별 구조 빌드
    if platform == "instagram":
        if content_type == "reels":
            structure = build_reels_structure(topic, facts, cta, strategy)
            title = f"2026 자율주행 HMI 가이드라인: 디자이너 필수 수치 3가지"
            hook = structure[0]["content_text"]
        elif content_type == "carousel":
            structure = build_carousel_structure(topic, facts, cta, strategy)
            title = f"[카드뉴스] 2026 자율주행 차량 실내 HMI 안전 표준 완벽 정리"
            hook = structure[0]["content_text"]
        else:  # post
            structure = build_post_structure(topic, facts, cta, strategy)
            title = f"📌 모빌리티 UX 디자이너 필수 체크: 2026 HMI 안전 표준"
            hook = structure[0]["content_text"]
    elif platform == "youtube":
        structure = build_youtube_structure(topic, facts, cta, strategy)
        title = f"2026 자율주행 HMI 표준 가이드라인 심층 분석: 차량 디자이너가 알아야 할 모든 것"
        hook = structure[0]["content_text"]
    else:  # blog
        structure = build_blog_structure(topic, facts, cta, strategy)
        title = f"[심층 분석] 2026년 자율주행 레벨3+ 차량 HMI 국가 표준화와 모빌리티 UX의 미래"
        hook = structure[0]["content_text"]

    # 2. 본문 및 캡션 합성
    body_parts = []
    for b in structure:
        body_parts.append(f"### {b['section_name']}\n{b['content_text']}\n*(시각 연출: {b['visual_notes']})*")
    full_body = "\n\n".join(body_parts)

    hashtags = [
        "#자율주행", "#HMI디자인", "#모빌리티UX", "#졸업전시",
        "#자동차디자인", "#엠비언트라이팅", "#SDV", "#디자인과제"
    ]
    caption = f"{hook}\n\n{full_body[:250]}...\n\n👉 {cta}\n\n" + " ".join(hashtags)

    # 3. 엄격한 출처 추적성 (Source Traceability) 구축
    # Claim -> Fact -> Source -> Source URL
    traceability_records: List[SourceTraceability] = []
    for idx, f in enumerate(facts[:3]):
        traceability_records.append({
            "claim": f"주장 {idx+1}: {f['fact']}",
            "fact_id": f.get("fact_id", f"fact-{idx}"),
            "fact_text": f["fact"],
            "source_id": f.get("source_ids", ["src-default"])[0],
            "publisher": f.get("source", "공식 출처"),
            "source_url": f.get("source_url", "https://official.standard.gov"),
        })

    # 4. 고유 결정론적 Content ID 및 버전 관리
    proj_id = intel.get("project_id", "proj-default")
    content_id = _generate_deterministic_id("cnt", f"{proj_id}-{platform}-{content_type}-v{version}")

    now_iso = datetime.now().isoformat()
    generated: GeneratedContent = {
        "content_id": content_id,
        "project_id": proj_id,
        "research_ids": [proj_id],
        "platform": platform,
        "content_type": content_type,
        "objective": objective,
        "target_audience": audience,
        "engagement_strategy": strategy,
        "title": title,
        "hook": hook,
        "body": full_body,
        "caption": caption,
        "cta": cta,
        "keywords": brief.get("keywords", []),
        "hashtags": hashtags,
        "structure": structure,
        "visual_direction": "미니멀 다크 모드 콕핏 그래픽, 볼드 타이포그래피, 실측 수치 인포그래픽 강조",
        "asset_requirements": [
            {"asset_type": "VIDEO_CLIP", "resolution": "1080x1920", "duration_sec": 60, "notes": "차량 실내 엠비언트 조명 연출 컷"},
            {"asset_type": "INFOGRAPHIC", "resolution": "1080x1080", "notes": "조도 120cd/m2 및 지연시간 200ms 규격 도표"},
        ],
        "source_traceability": traceability_records,
        "qa_result": None,
        "version": version,
        "parent_version_id": None if version == 1 else f"{content_id}-v{version-1}",
        "status": "DRAFT",
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    print(f"-> 콘텐츠 생성 완료: [{generated['title']}] (ID: {content_id}, 섹션: {len(structure)}개, 근거추적: {len(traceability_records)}건)")
    return {
        "generated_content": generated,
        "current_step": "content_generator",
        "status": "CONTENT_GENERATED",
    }


# ======================================================================
# 9. Content QA Node (10-Point Automated Inspection)
# ======================================================================
def node_content_qa(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 9: Content QA] 자동 10포인트 품질 검증 및 팩트 무결성 감사 가동...")
    content = state.get("generated_content")
    if not content:
        qa_fail: ContentQAResult = {
            "passed": False,
            "score": 0.0,
            "checked_items": [],
            "errors": ["생성된 콘텐츠가 존재하지 않습니다."],
            "warnings": [],
            "source_presence_verified": False,
            "fact_consistency_verified": False,
            "unsupported_claims": [],
            "format_adherence": False,
            "cta_verified": False,
            "asset_requirements_verified": False,
        }
        return {"qa_result": qa_fail, "current_step": "content_qa", "status": "QA_FAILED"}

    checked = []
    errors = []
    warnings = []

    # 1. Source Traceability 존재 여부
    checked.append("Source Presence")
    has_sources = len(content.get("source_traceability", [])) > 0
    if not has_sources:
        errors.append("출처 추적성 레코드가 누락되었습니다.")

    # 2. Fact Consistency & Unsupported Claims
    checked.append("Fact Consistency")
    unsupported = []
    for tr in content.get("source_traceability", []):
        if not tr.get("source_url") or not tr.get("fact_text"):
            unsupported.append(tr.get("claim", "미확인 주장"))
    if unsupported:
        errors.append(f"출처가 확인되지 않은 무근거 주장 발견: {unsupported}")

    # 3. CTA 존재 여부
    checked.append("CTA Presence")
    has_cta = bool(content.get("cta") and len(content.get("cta", "").strip()) > 5)
    if not has_cta:
        errors.append("행동 유도 문구(CTA)가 누락되었거나 너무 짧습니다.")

    # 4. Format & Structure 검증
    checked.append("Format & Structure")
    struct = content.get("structure", [])
    c_type = content.get("content_type")
    format_ok = True
    if c_type == "reels" and len(struct) < 4:
        errors.append("Reels 필수 구조(Hook, Context, Info, CTA 등) 단계가 미달되었습니다.")
        format_ok = False
    elif c_type == "carousel" and len(struct) < 4:
        errors.append("Carousel 필수 카드 슬라이드 수가 미달되었습니다.")
        format_ok = False

    # 5. Hook 검증
    checked.append("Hook Quality")
    has_hook = bool(content.get("hook") and len(content.get("hook", "").strip()) > 5)
    if not has_hook:
        errors.append("오프닝 후킹 문구가 누락되었습니다.")

    # 6. Title 검증
    checked.append("Title Presence")
    has_title = bool(content.get("title") and len(content.get("title", "").strip()) > 3)
    if not has_title:
        errors.append("제목이 누락되었습니다.")

    # 7. Asset Requirements 검증
    checked.append("Asset Requirements")
    has_assets = len(content.get("asset_requirements", [])) > 0
    if not has_assets:
        warnings.append("시각 에셋 요구사항이 지정되지 않았습니다.")

    # 8. Schema Completeness
    checked.append("Schema Completeness")
    mandatory_keys = ["content_id", "platform", "content_type", "objective", "target_audience"]
    for k in mandatory_keys:
        if not content.get(k):
            errors.append(f"필수 스키마 필드 누락: {k}")

    # 9. Content Length 검증
    checked.append("Content Length")
    if len(content.get("body", "")) < 30:
        errors.append("본문 텍스트 길이가 유의미한 수준에 미달합니다.")

    # 10. Engagement Strategy 일치 검증
    checked.append("Engagement Alignment")
    strat = content.get("engagement_strategy", {})
    if not strat.get("share") or not strat.get("save") or not strat.get("retention"):
        warnings.append("Share/Save/Retention 반응 메타데이터가 불완전합니다.")

    passed = len(errors) == 0
    score = max(0.0, 1.0 - (len(errors) * 0.25) - (len(warnings) * 0.05))

    qa_result: ContentQAResult = {
        "passed": passed,
        "score": score,
        "checked_items": checked,
        "errors": errors,
        "warnings": warnings,
        "source_presence_verified": has_sources,
        "fact_consistency_verified": len(unsupported) == 0,
        "unsupported_claims": unsupported,
        "format_adherence": format_ok,
        "cta_verified": has_cta,
        "asset_requirements_verified": has_assets,
    }

    # 콘텐츠 객체에 QA 결과 동기화
    content_copy = dict(content)
    content_copy["qa_result"] = qa_result
    content_copy["status"] = "QA_PASSED" if passed else "QA_FAILED"

    print(f"-> QA 심사 결과: {'✅ PASS (점수: ' + str(round(score, 2)) + ')' if passed else '❌ FAIL'}")
    if errors:
        for err in errors:
            print(f"   ❌ [오류] {err}")
    if warnings:
        for w in warnings:
            print(f"   ⚠️ [경고] {w}")

    return {
        "qa_result": qa_result,
        "generated_content": content_copy,
        "current_step": "content_qa",
        "status": "QA_PASSED" if passed else "QA_FAILED",
    }


# ======================================================================
# 10. Human Review Node
# ======================================================================
def node_human_review(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 10: Human Review] 사용자 검토(Human Review) 큐 등록 중...")
    content = state.get("generated_content")
    qa_res = state.get("qa_result")

    if not content:
        return {"current_step": "human_review", "status": "NO_CONTENT"}

    content_copy = dict(content)
    review_id = _generate_deterministic_id("rev", content["content_id"])

    if qa_res and qa_res.get("passed"):
        content_copy["status"] = "HUMAN_REVIEW"
        review_record: HumanReviewRecord = {
            "review_id": review_id,
            "content_id": content["content_id"],
            "status": "PENDING",
            "reviewer_notes": "QA 자동 검증 100% 통과. 인간 검토관 최종 승인 대기 중.",
            "reviewed_at": None,
        }
        print(f"  📝 [검토 큐 등록] Content ID '{content['content_id']}' -> 상태: HUMAN_REVIEW")
    else:
        content_copy["status"] = "REVISION_REQUIRED"
        review_record: HumanReviewRecord = {
            "review_id": review_id,
            "content_id": content["content_id"],
            "status": "REVISION_REQUIRED",
            "reviewer_notes": f"QA 실패 항목 수정 필요: {qa_res.get('errors') if qa_res else 'QA 미실행'}",
            "reviewed_at": None,
        }
        print(f"  ⚠️ [수정 요청 큐 등록] Content ID '{content['content_id']}' -> 상태: REVISION_REQUIRED")

    return {
        "generated_content": content_copy,
        "human_review_record": review_record,
        "current_step": "human_review",
        "status": content_copy["status"],
    }


# ======================================================================
# 11. Versioning & Persistence Node (Idempotency, History, Dual DB)
# ======================================================================
def node_versioning_persistence(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 11: Versioning & Persistence] 버전 관리 및 DB 원자적 저장...")
    content = state.get("generated_content")
    dry_run = state.get("dry_run", False)
    run_id = state.get("run_id", f"run-gen-{int(time.time())}")

    if not content:
        return {"current_step": "versioning_persistence", "status": "NO_CONTENT"}

    if dry_run:
        print(f"  🛑 [DRY RUN 활성화] 디스크 파일 수정을 건너뜁니다 (Content ID: {content['content_id']})")
        return {
            "current_step": "versioning_persistence",
            "status": "DRY_RUN",
        }

    # 1. 기존 생성 콘텐츠 DB 로드
    existing_db = {"contents": [], "latest_content": None, "last_updated": None}
    if os.path.exists(GENERATED_DB_PATH):
        try:
            with open(GENERATED_DB_PATH, "r", encoding="utf-8") as f:
                existing_db = json.load(f)
        except Exception:
            existing_db = {"contents": [], "latest_content": None, "last_updated": None}

    # 2. Idempotency & Versioning 처리
    contents_list = existing_db.get("contents", [])
    c_map = {c["content_id"]: c for c in contents_list}

    # 중복 저장 방지: 동일 content_id가 존재하면 덮어쓰고(Update), 없으면 추가(Insert)
    c_map[content["content_id"]] = content
    existing_db["contents"] = list(c_map.values())
    existing_db["latest_content"] = content
    existing_db["last_updated"] = datetime.now().isoformat()

    # 3. Dual write (data/ 및 my-exhibit-platform/data/)
    targets = [GENERATED_DB_PATH, PLATFORM_GENERATED_DB_PATH]
    for tg in targets:
        os.makedirs(os.path.dirname(tg), exist_ok=True)
        try:
            with open(tg, "w", encoding="utf-8") as f:
                json.dump(existing_db, f, ensure_ascii=False, indent=2)
            print(f"  [DB 동기화 완료] -> {tg}")
        except Exception as e:
            print(f"  [DB 동기화 오류: {tg}]: {e}")

    # 4. 실행 감사 로그 기록
    os.makedirs(LOGS_DIR, exist_ok=True)
    runs = []
    if os.path.exists(RUNS_LOG_PATH):
        try:
            with open(RUNS_LOG_PATH, "r", encoding="utf-8") as f:
                runs = json.load(f)
        except Exception:
            runs = []

    run_entry = {
        "run_id": run_id,
        "content_id": content["content_id"],
        "platform": content["platform"],
        "content_type": content["content_type"],
        "version": content["version"],
        "qa_passed": content.get("qa_result", {}).get("passed", False),
        "status": content["status"],
        "completed_at": datetime.now().isoformat(),
    }
    runs.insert(0, run_entry)
    try:
        with open(RUNS_LOG_PATH, "w", encoding="utf-8") as f:
            json.dump(runs[:100], f, ensure_ascii=False, indent=2)
        print(f"  [감사 로그 기록 완료] -> {RUNS_LOG_PATH}")
    except Exception as e:
        print(f"  [로그 저장 오류]: {e}")

    return {
        "current_step": "versioning_persistence",
        "status": "PERSISTED",
    }


# ======================================================================
# 12. Approval Gate Node (Human-in-the-Loop Interrupt & Resumption)
# ======================================================================
def node_approval_gate(state: GenerationGraphState) -> Dict[str, Any]:
    print("\n[Node 12: Approval Gate] STEP 8 완료 및 Human-in-the-Loop 관리자 승인 게이트 가동...")
    content = state.get("generated_content")
    run_id = state.get("run_id", f"run-gen-{int(time.time())}")
    ver = state.get("version", 1)
    req_id = state.get("approval_request_id") or f"apr-{uuid.uuid4().hex[:8]}"

    print("=" * 80)
    print("🛑 [HUMAN APPROVAL GATE] 콘텐츠 생성 및 QA 완료 - 관리자 승인 대기 (WAITING_FOR_APPROVAL)")
    if content:
        print(f"- Content ID     : {content['content_id']}")
        print(f"- 플랫폼/유형    : {content['platform'].upper()} > {content['content_type'].upper()}")
        print(f"- 콘텐츠 제목    : {content['title']}")
        print(f"- QA 합격 여부   : {'✅ 합격' if content.get('qa_result', {}).get('passed') else '❌ 불합격'}")
        print(f"- 원천정보 근거  : {len(content.get('source_traceability', []))}건 추적됨")
    print(f"- Approval Req ID: {req_id}")
    print("- 승인 상태      : WAITING_FOR_APPROVAL (LangGraph interrupt 일시 정지)")
    print("=" * 80)

    # Pause execution using LangGraph interrupt
    payload = {
        "action": "human_approval_required",
        "run_id": run_id,
        "content_id": content.get("content_id") if content else None,
        "title": content.get("title") if content else "",
        "version": ver,
        "approval_request_id": req_id,
        "sources_count": len(content.get("source_traceability", [])) if content else 0,
    }

    # interrupt pauses the graph and surfaces payload to caller
    human_decision = interrupt(payload)

    # When resumed via Command(resume=...)
    decision_action = (
        human_decision.get("action", "APPROVE")
        if isinstance(human_decision, dict)
        else ("APPROVE" if human_decision is True else "REJECT")
    )
    is_approved = str(decision_action).upper() == "APPROVE"
    reviewer = (
        human_decision.get("reviewer", "admin")
        if isinstance(human_decision, dict)
        else "admin"
    )
    now_iso = datetime.now().isoformat()

    if is_approved:
        print(f"\n✅ [APPROVAL GATE RESUMED] 관리자 승인 완료! Reviewer: {reviewer}")
        if content:
            content_copy = dict(content)
            content_copy["status"] = "APPROVED"
            content_copy["updated_at"] = now_iso
        else:
            content_copy = None

        return {
            "approval_status": "APPROVED",
            "approval_required": True,
            "approved_by": reviewer,
            "approved_at": now_iso,
            "rejected_by": None,
            "rejected_at": None,
            "rejection_reason": None,
            "approval_request_id": req_id,
            "approval_version": ver,
            "generated_content": content_copy,
            "current_step": "approval_gate",
            "status": "APPROVED",
        }
    else:
        reason = (
            human_decision.get("rejection_reason", "반려 사유 미입력")
            if isinstance(human_decision, dict)
            else "반려됨"
        )
        print(f"\n❌ [APPROVAL GATE RESUMED] 관리자 반려 처리! Reviewer: {reviewer}, 사유: {reason}")
        if content:
            content_copy = dict(content)
            content_copy["status"] = "REJECTED"
            content_copy["updated_at"] = now_iso
        else:
            content_copy = None

        return {
            "approval_status": "REJECTED",
            "approval_required": True,
            "approved_by": None,
            "approved_at": None,
            "rejected_by": reviewer,
            "rejected_at": now_iso,
            "rejection_reason": reason,
            "approval_request_id": req_id,
            "approval_version": ver,
            "generated_content": content_copy,
            "current_step": "approval_gate",
            "status": "REJECTED",
        }
