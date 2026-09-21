"""
Data Intelligence Domain Models and Schemas
Strict Evidence, Verification Metadata, Taxonomy, and Audit Trail definitions.
No Fake Data Policy enforced: separates raw evidence, normalized facts, and AI summaries.
"""

from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime

# Source Priority Tiers
SOURCE_PRIORITY_OFFICIAL = 1           # 공식 1차 출처 (Official: 대학/기업/교수 공식 포털)
SOURCE_PRIORITY_INSTITUTIONAL = 2       # 공식 기관/플랫폼 (Institutional: 정부/공공기관, 대학알리미)
SOURCE_PRIORITY_PROFESSIONAL = 3        # 전문 플랫폼 (Professional Platform: 채용/전문가/포트폴리오 플랫폼)
SOURCE_PRIORITY_SECONDARY = 4           # 보조 출처 (Secondary: 언론 보도, 아카이브)

# Standard Source Types
SOURCE_TYPE_UNIVERSITY_OFFICIAL = "UNIVERSITY_OFFICIAL"
SOURCE_TYPE_CORPORATE_RFP = "CORPORATE_RFP"
SOURCE_TYPE_PROFESSOR_OFFICIAL = "PROFESSOR_OFFICIAL"
SOURCE_TYPE_MENTOR_PROFILE = "MENTOR_PROFILE"
SOURCE_TYPE_BRAND_IP_OFFICIAL = "BRAND_IP_OFFICIAL"

# Verification Statuses
STATUS_VERIFIED = "VERIFIED"
STATUS_UNVERIFIED = "UNVERIFIED"
STATUS_FAILED = "FAILED"
STATUS_INACTIVE = "INACTIVE"
STATUS_REVIEW_REQUIRED = "REVIEW_REQUIRED"

class InformationSource(TypedDict, total=False):
    source_id: str
    source_url: str
    source_title: str
    source_type: str  # UNIVERSITY_OFFICIAL, CORPORATE_RFP, PROFESSOR_OFFICIAL, MENTOR_PROFILE, BRAND_IP_OFFICIAL
    source_domain: str
    source_priority: int  # 1: Official, 2: Institutional, 3: Professional Platform, 4: Secondary
    verification_status: str  # VERIFIED, UNVERIFIED, FAILED, INACTIVE
    evidence: str
    collected_at: str
    last_verified_at: str
    run_id: str
    entity_id: str

class SourceEvidence(TypedDict, total=False):
    source_url: str
    source_domain: str
    source_type: str
    source_tier: int
    collected_at: str
    verified_at: Optional[str]
    last_checked_at: str
    raw_evidence_snippet: str
    confidence_score: float

class ProfessorProfile(TypedDict, total=False):
    id: str
    name: str
    university: str
    department: str
    lab_name: str
    title: str
    research_areas: List[str]
    avatar_url: str
    information_sources: List[InformationSource]
    bio: str
    email: str
    phone: str
    office: str
    source_url: str
    collected_at: str
    verified_at: str
    is_verified: bool
    verification_status: str  # VERIFIED, REVIEW_REQUIRED, UNVERIFIED
    confidence_score: float
    evidence_text: str
    inferred_fields: List[str]
    assignment_one_liner: str
    assignment_details: Dict[str, Any]
    industry_collaborations: List[Dict[str, Any]]
    student_submission_ids: List[str]
    student_submissions: List[Dict[str, Any]]
    partner_academy_banner: Dict[str, Any]
    last_run_id: str
    version: int

class RFPSubmission(TypedDict, total=False):
    id: str
    student_name: str
    university: str
    department: str
    submitted_at: str
    summary_title: str
    problem_recognition: str
    solution: str
    outcome_image: str

class RFPRecord(TypedDict, total=False):
    id: str
    company: str
    company_name: str
    company_logo: str
    logo_emoji: str
    company_industry: str
    industry: str
    title: str
    # 엄격한 브리프 분리: 원문 vs 기업영업기밀 보호 요약
    original_brief: Optional[str]
    abstract_brief: str
    problem_statement: str
    target_qualifications: str
    target: str
    budget_or_reward: str
    reward: str
    deadline: str
    status: str  # open, evaluating, closed
    source_url: str
    verified_at: str
    verification_status: str  # VERIFIED, REVIEW_REQUIRED
    confidence_score: float
    evidence_text: str
    information_sources: List[InformationSource]
    submissions: List[RFPSubmission]

class BrandOpenIPRecord(TypedDict, total=False):
    id: str
    company: str
    brand_name: Optional[str]
    logo_emoji: str
    logo_url: str
    category: str
    industry: str
    license: str
    license_scope: str  # e.g., "졸업작품/캡스톤 비영리 자유 이용"
    permitted_use: List[str]
    prohibited_use: List[str]
    official_policy_url: str
    source_url: str
    description: str
    badge: str
    package_size: str
    download_count: int
    assets: List[str]  # e.g., ["SVG/AI 로고 키트", "브랜드 가이드라인", "3D 에셋 / 캐릭터 원본", "공식 전용 폰트"]
    verified_at: str
    verification_status: str  # VERIFIED, REVIEW_REQUIRED
    confidence_score: float
    evidence_text: str
    information_sources: List[InformationSource]

class MentorReview(TypedDict, total=False):
    author: str
    university: str
    rating: float
    date: str
    content: str

class CareerMilestone(TypedDict, total=False):
    period: str
    company: str
    role: str
    description: str

class AvailableSlot(TypedDict, total=False):
    date: str
    time: str
    booked: bool

class MentorRecord(TypedDict, total=False):
    id: str
    name: str
    company: str
    company_logo: str
    role: str
    industry: str
    experience_years: int
    specialties: List[str]
    bio: str
    price_per_session: int
    rating: float
    review_count: int
    career_timeline: List[CareerMilestone]
    reviews: List[MentorReview]
    available_slots: List[AvailableSlot]
    # 신뢰성 및 증빙 출처
    career_evidence_url: str
    source_url: str
    verified_at: str
    verification_status: str  # VERIFIED, REVIEW_REQUIRED
    confidence_score: float
    evidence_text: str
    information_sources: List[InformationSource]

class AuditLogRecord(TypedDict, total=False):
    log_id: str
    domain: str  # professors, rfp, brand_assets, mentors, taxonomy
    entity_id: str
    action: str  # CREATED, UPDATED, UNCHANGED, FLAGGED_REVIEW
    old_data: Optional[Dict[str, Any]]
    new_data: Dict[str, Any]
    changed_fields: List[str]
    source_url: str
    confidence_score: float
    recorded_at: str

# 8대 표준 산업군 및 전공 매핑 Taxonomy
STANDARD_TAXONOMY = [
    {
        "id": "mobility_robotics",
        "name": "모빌리티 / 로보틱스",
        "icon": "🚗",
        "keywords": ["자율주행", "PBV", "로봇", "모빌리티", "스마트시티", "HMI", "드론"],
        "related_majors": ["공업디자인", "산업디자인", "인터랙션디자인", "융합디자인", "기계/로봇공학"],
        "color": "#ef4444"
    },
    {
        "id": "fintech_platform",
        "name": "핀테크 / 모바일 플랫폼",
        "icon": "💙",
        "keywords": ["금융", "핀테크", "모바일", "페이먼트", "자산관리", "크라우드펀딩"],
        "related_majors": ["시각디자인", "UX/UI디자인", "디지털미디어", "컴퓨터공학"],
        "color": "#3b82f6"
    },
    {
        "id": "fashion_commerce",
        "name": "패션 / 버추얼 커머스",
        "icon": "🖤",
        "keywords": ["패션", "의류", "커머스", "3D 가상의류", "스트리트웨어", "디지털패션"],
        "related_majors": ["의류디자인", "섬유패션", "패션산업", "3D디지털디자인"],
        "color": "#10b981"
    },
    {
        "id": "ai_agent_hyperscale",
        "name": "생성형 AI / 하이퍼스케일",
        "icon": "🟢",
        "keywords": ["AI", "생성형AI", "LLM", "에이전트", "지능형시스템", "데이터시각화"],
        "related_majors": ["인터랙션디자인", "HCI", "인공지능디자인", "소프트웨어융합"],
        "color": "#8b5cf6"
    },
    {
        "id": "beauty_lifestyle",
        "name": "뷰티 / 지속가능 라이프스타일",
        "icon": "🌸",
        "keywords": ["뷰티", "화장품", "친환경패키징", "웰니스", "리필시스템", "라이프스타일"],
        "related_majors": ["시각디자인", "패키지디자인", "제품디자인", "소재디자인"],
        "color": "#ec4899"
    },
    {
        "id": "character_entertainment",
        "name": "캐릭터 / 엔터테인먼트",
        "icon": "🦁",
        "keywords": ["캐릭터", "IP", "애니메이션", "게임", "엔터테인먼트", "버추얼휴먼"],
        "related_majors": ["영상디자인", "만화/애니메이션", "게임그래픽", "시각디자인"],
        "color": "#f59e0b"
    },
    {
        "id": "spatial_immersive",
        "name": "공간 / 미디어 아트",
        "icon": "🏛️",
        "keywords": ["미디어아트", "공간디자인", "실감형전시", "프로젝션맵핑", "건축"],
        "related_majors": ["실내건축", "공간디자인", "미디어아트", "전시디자인"],
        "color": "#06b6d4"
    },
    {
        "id": "delivery_lifestyle",
        "name": "F&B / 배달 라이프스타일",
        "icon": "🛵",
        "keywords": ["F&B", "푸드테크", "배달", "라이프스타일", "서체/브랜딩"],
        "related_majors": ["시각디자인", "브랜드디자인", "서비스디자인", "외식산업"],
        "color": "#14b8a6"
    }
]
