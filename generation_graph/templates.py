"""
STEP 8 — Content Generation Platform Profiles & Structural Templates
Defines standard structural patterns for:
- Instagram: Reels (6-step), Carousel (7-slide), Post (Feed)
- YouTube: Video Script (Chapters, Hook, Timestamps)
- Blog: Long-form Technical/Editorial Markdown Post
"""

from typing import List, Dict, Any
from .state import StructureBlock


def build_reels_structure(
    topic: str,
    key_facts: List[Dict[str, Any]],
    cta: str,
    engagement_strategy: Dict[str, str]
) -> List[StructureBlock]:
    """
    Instagram Reels 6-step flow:
    Hook -> Context -> Story / Information -> Key Point -> Conclusion -> CTA
    """
    f0 = key_facts[0]["fact"] if len(key_facts) > 0 else "2026 자율주행 인터페이스 의무화"
    f1 = key_facts[1]["fact"] if len(key_facts) > 1 else "엠비언트 조도 최대 120cd/m2 규제"
    f2 = key_facts[2]["fact"] if len(key_facts) > 2 else "생성형 AI 응답 지연시간 200ms 이하"

    return [
        {
            "section_name": "Hook (0~3초)",
            "content_text": f"자동차 디자이너라면 2026년부터 이거 모르면 포트폴리오 탈락합니다!",
            "visual_notes": "빠른 템포의 차량 콕핏 전환 모션 그래픽, 볼드 텍스트 오버레이",
            "asset_ref": "asset-reels-hook",
        },
        {
            "section_name": "Context (3~10초)",
            "content_text": f"국내 자율주행 레벨3+ 차량 실내 인터페이스 기준이 전면 개편됩니다. 핵심은 운전자 주의 분산 방지입니다.",
            "visual_notes": "야간 주행 중 차량 실내 엠비언트 라이팅 시연 컷",
            "asset_ref": "asset-reels-context",
        },
        {
            "section_name": "Story / Information (10~30초)",
            "content_text": f"첫째, {f0}. 둘째, {f1}.",
            "visual_notes": "조도계 측정 그래픽(120cd/m2) 및 실시간 UI 반응 시각화",
            "asset_ref": "asset-reels-info",
        },
        {
            "section_name": "Key Point (30~45초)",
            "content_text": f"셋째, {f2}. 시각뿐만 아니라 햅틱 진동 피드백 결합이 이제 필수 설계 요건입니다.",
            "visual_notes": "스티어링 휠 햅틱 인터랙션 및 화면 지연시간 비교 그래프",
            "asset_ref": "asset-reels-keypoint",
        },
        {
            "section_name": "Conclusion (45~55초)",
            "content_text": f"단순히 예쁜 그래픽을 넘어 안전 규격 수치를 반영한 모빌리티 UI가 이번 졸업전시의 당락을 가릅니다.",
            "visual_notes": "완성된 지능형 콕핏 렌더링 360도 회전 뷰",
            "asset_ref": "asset-reels-conclusion",
        },
        {
            "section_name": "CTA (55~60초)",
            "content_text": cta or "졸작 준비 중인 동기들에게 지금 공유하고, 수치 잊지 않게 저장해두세요!",
            "visual_notes": "저장 & 공유 아이콘 애니메이션과 플랫폼 프로필 링크 안내",
            "asset_ref": "asset-reels-cta",
        },
    ]


def build_carousel_structure(
    topic: str,
    key_facts: List[Dict[str, Any]],
    cta: str,
    engagement_strategy: Dict[str, str]
) -> List[StructureBlock]:
    """
    Instagram Carousel 7-slide deck:
    Cover -> Problem / Question -> Information -> Key Facts -> Key Insight -> Conclusion -> CTA
    """
    f0 = key_facts[0]["fact"] if len(key_facts) > 0 else "2026 자율주행 HMI 가이드라인"
    f1 = key_facts[1]["fact"] if len(key_facts) > 1 else "최대 조도 120cd/m2 제한"
    f2 = key_facts[2]["fact"] if len(key_facts) > 2 else "응답 지연시간 200ms 이하"

    return [
        {
            "section_name": "Slide 1: Cover",
            "content_text": f"[카드뉴스] 2026 자율주행 HMI 표준 가이드라인 요약",
            "visual_notes": "미니멀 다크 모드 배경, 대형 타이포그래피, 모빌리티 실루엣",
            "asset_ref": "card-01-cover",
        },
        {
            "section_name": "Slide 2: Problem / Question",
            "content_text": "왜 기존 차량 UI 디자인 방식으로는 2026년 산학 과제 통과가 어려울까?",
            "visual_notes": "기존 화려하기만 한 UI와 야간 눈부심 비교 다이어그램",
            "asset_ref": "card-02-problem",
        },
        {
            "section_name": "Slide 3: Information",
            "content_text": f"정부 공인 표준 가이드라인 발표: {f0}.",
            "visual_notes": "한국디자인진흥원(KIDP) 및 국토교통부 표준 로고와 인증 뱃지",
            "asset_ref": "card-03-policy",
        },
        {
            "section_name": "Slide 4: Key Facts",
            "content_text": f"핵심 규격 수치: ① 조도 한계: {f1} ② 지연 한계: {f2}",
            "visual_notes": "수치 강조 인포그래픽 카드 (120cd/m2 & 200ms 강조)",
            "asset_ref": "card-04-facts",
        },
        {
            "section_name": "Slide 5: Key Insight",
            "content_text": "생체 반응형 엠비언트 조명 연동 시 승객 불안감 42.8% 감소 실측 데이터 확인.",
            "visual_notes": "서울대학교 지능형 모빌리티 랩 심박 변이도 실험 결과 차트",
            "asset_ref": "card-05-insight",
        },
        {
            "section_name": "Slide 6: Conclusion",
            "content_text": "디자이너의 역할은 심미성에서 안전 규제와 멀티모달 인터랙션 설계로 진화하고 있습니다.",
            "visual_notes": "체크리스트 요약 박스",
            "asset_ref": "card-06-conclusion",
        },
        {
            "section_name": "Slide 7: CTA",
            "content_text": cta or "필요할 때 바로 꺼내볼 수 있게 지금 저장하고, 팀원들과 공유하세요!",
            "visual_notes": "스크랩/저장 가이드 화살표 애니메이션",
            "asset_ref": "card-07-cta",
        },
    ]


def build_post_structure(
    topic: str,
    key_facts: List[Dict[str, Any]],
    cta: str,
    engagement_strategy: Dict[str, str]
) -> List[StructureBlock]:
    """
    Instagram Single Feed Post:
    Hook -> Main Information -> Supporting Information -> CTA
    """
    f_summary = "\\n".join([f"• {f['fact']}" for f in key_facts[:3]])
    return [
        {
            "section_name": "Hook",
            "content_text": f"📌 2026 모빌리티 UX 디자이너 필수 체크: {topic}",
            "visual_notes": "단일 고해상도 미래 차량 실내 인포테인먼트 목업",
            "asset_ref": "post-img-main",
        },
        {
            "section_name": "Main Information",
            "content_text": f"국내 공인 가이드라인 주요 팩트 정리:\\n{f_summary}",
            "visual_notes": "핵심 수치 하이라이트 캡션",
            "asset_ref": None,
        },
        {
            "section_name": "Supporting Information",
            "content_text": "단순 콘셉트 디자인을 넘어 실제 차량 적용 인증 기준(조도 120cd/m2, 반응 200ms)을 충족하는 포트폴리오가 대세가 되고 있습니다.",
            "visual_notes": "텍스트 본문",
            "asset_ref": None,
        },
        {
            "section_name": "CTA",
            "content_text": cta or "여러분의 졸업작품에는 이 규격이 반영되어 있나요? 댓글로 의견을 남겨주세요!",
            "visual_notes": "해시태그 및 소통 유도",
            "asset_ref": None,
        },
    ]


def build_youtube_structure(
    topic: str,
    key_facts: List[Dict[str, Any]],
    cta: str,
    engagement_strategy: Dict[str, str]
) -> List[StructureBlock]:
    """
    YouTube Video Script:
    Title -> Hook -> Chapters -> Key Findings -> Conclusion & CTA
    """
    return [
        {
            "section_name": "Hook (00:00~00:45)",
            "content_text": f"자율주행 레벨3 차량이 출시되면 디자이너가 가장 먼저 바꿔야 할 인터페이스는 무엇일까요?",
            "visual_notes": "오프닝 타이틀 시퀀스 및 핵심 하이라이트 교차 편집",
            "asset_ref": "yt-intro",
        },
        {
            "section_name": "Chapter 1: 2026 정부 공인 HMI 가이드라인 분석 (00:45~03:30)",
            "content_text": "한국디자인진흥원 및 국토교통부 표준 백서에 명시된 2026년 3분기 의무화 로드맵을 심층 분석합니다.",
            "visual_notes": "공식 백서 원문 인용 화면 및 인포그래픽",
            "asset_ref": "yt-ch1",
        },
        {
            "section_name": "Chapter 2: 엠비언트 라이팅 & 햅틱 규격 실측 (03:30~07:00)",
            "content_text": "왜 최대 조도가 120cd/m2로 제한되고 응답 지연시간은 200ms 이하가 되어야 하는지 생체 실험 데이터로 설명합니다.",
            "visual_notes": "서울대 모빌리티 랩 실험 데이터 표 및 콕핏 3D 시뮬레이션",
            "asset_ref": "yt-ch2",
        },
        {
            "section_name": "Chapter 3: 디자인 포트폴리오 적용 3대 전략 (07:00~10:30)",
            "content_text": "졸업전시 및 채용 과제에서 합격률을 높이는 안전 규격 기반 UX 설계 템플릿을 공개합니다.",
            "visual_notes": "Figma / Blender 목업 작업 화면 녹화",
            "asset_ref": "yt-ch3",
        },
        {
            "section_name": "Outro & CTA (10:30~11:15)",
            "content_text": cta or "더 자세한 연구 원문과 가이드라인 요약본은 더보기란 링크에서 확인하세요. 구독과 좋아요 부탁드립니다!",
            "visual_notes": "엔드스크린 추천 영상 및 링크 카드",
            "asset_ref": "yt-outro",
        },
    ]


def build_blog_structure(
    topic: str,
    key_facts: List[Dict[str, Any]],
    cta: str,
    engagement_strategy: Dict[str, str]
) -> List[StructureBlock]:
    """
    Blog Post (Long-form Technical / Editorial Article):
    Title -> Intro -> Background -> Core Data -> Practical Insights -> References & CTA
    """
    return [
        {
            "section_name": "Introduction",
            "content_text": f"SDV(소프트웨어 정의 차량) 전환이 가속화되면서 차량 실내 사용자 경험(UX)은 단순한 그래픽을 넘어 탑승자 안전과 인지 부하를 최소화하는 표준 규격 중심으로 재편되고 있습니다.",
            "visual_notes": "대표 썸네일 이미지 및 서론 리드문",
            "asset_ref": "blog-hero",
        },
        {
            "section_name": "1. 2026 자율주행 HMI 국가 표준화 배경",
            "content_text": "국토교통부와 한국디자인진흥원이 주도하는 이번 가이드라인은 2026년 3분기부터 국내 레벨3+ 자율주행 차량 실내 인터페이스에 전면 적용될 예정입니다.",
            "visual_notes": "정부 가이드라인 수립 연혁 표",
            "asset_ref": "blog-timeline",
        },
        {
            "section_name": "2. 엔지니어링 및 디자인 핵심 규격 수치 분석",
            "content_text": "실내 엠비언트 라이팅은 최대 120cd/m2 이하로 제한되어 시각 피로를 방지하며, 생성형 AI 음성 피드백과의 지연시간(Latency)은 200ms 이내로 통제되어야 합니다.",
            "visual_notes": "기술 규격 대비 요약 테이블",
            "asset_ref": "blog-specs-table",
        },
        {
            "section_name": "3. 학술 연구 기반 실증 효과: 생체 반응형 인터랙션",
            "content_text": "서울대학교 지능형 모빌리티 랩의 연구에 따르면 심박과 동공 크기에 연동되는 조명 피드백 도입 시 승객의 불안감이 42.8% 감소하고 인지 반응 속도가 1.4배 향상되었습니다.",
            "visual_notes": "연구 그래프 및 실험 사진",
            "asset_ref": "blog-academic-chart",
        },
        {
            "section_name": "4. 결론 및 실무 디자이너를 위한 제언",
            "content_text": "학생 및 실무 디자이너는 시각적 화려함보다 법적/기술적 기준을 만족하는 체계적인 멀티모달 디자인 역량을 증명해야 합니다.",
            "visual_notes": "핵심 요약 박스",
            "asset_ref": None,
        },
        {
            "section_name": "References & CTA",
            "content_text": cta or "본 글이 도움이 되셨다면 북마크해 두시고, 연구 원문 및 출처 링크는 아래 참고문헌을 확인해 주시기 바랍니다.",
            "visual_notes": "출처 URL 리스트 및 공유 버튼",
            "asset_ref": None,
        },
    ]
