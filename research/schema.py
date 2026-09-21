"""
research/schema.py
Academic-Corporate Cooperation and Recruitment Intelligence DB Schema.
Provides typed definitions for:
- University, Department, Professor
- Company, CompanyRelationship
- CooperationProject, CooperationSignal
- RecruitmentPosting, JobRequirement, RecruitmentSignal
- TalentProfile
- Evidence, Source, Provenance
- CrossValidationResult, AcademicCorporateGraphState
"""

from typing import Dict, Any, List, Optional, Literal
from typing_extensions import TypedDict


# Status Literals
VerificationStatus = Literal[
    "CONFIRMED",
    "CORROBORATED",
    "INFERRED",
    "RECRUITMENT_CONFIRMED",
    "CONFLICTED",
    "INSUFFICIENT_EVIDENCE",
    "UNVERIFIED"
]

CooperationType = Literal[
    "공동 R&D",
    "산학공동연구",
    "현장실습",
    "인턴십",
    "캡스톤디자인",
    "장학",
    "기업 프로젝트",
    "기술이전",
    "산학협력 협약",
    "기타 공식 협력"
]

RelationshipType = Literal[
    "subsidiary",      # 자회사
    "affiliate",       # 계열사
    "partner",         # 공식 파트너사
    "joint_venture",   # 합작사
    "collaborator"     # 공동 프로젝트 기업
]


class SourceSchema(TypedDict):
    source_id: str
    source_type: str                  # e.g., "UNIV_OFFICIAL", "GOV_PUBLIC", "CAREER_OFFICIAL", "RECRUIT_PORTAL"
    source_url: str
    requested_url: str
    final_url: str
    canonical_url: str
    accessed_at: str
    content_hash: str
    http_status: int
    title: Optional[str]


class EvidenceSchema(TypedDict):
    evidence_id: str
    source_id: str
    source_url: str
    evidence_text: str
    selector_or_location: Optional[str]
    screenshot_path: Optional[str]
    captured_at: str
    confidence: float
    verification_status: VerificationStatus


class CooperationSignal(TypedDict):
    signal_id: str
    university: str
    company: str
    cooperation_type: str
    project_title: str
    department: Optional[str]
    laboratory: Optional[str]
    professor: Optional[str]
    date: str
    description: str
    source_url: str
    source_id: str
    evidence_id: str
    signal_status: str                # Strictly "cooperationSignal"
    signal_type: Optional[str]        # Alias: "cooperationSignal"


class CompanyRelationship(TypedDict):
    parent_company: str
    related_company: str
    relationship_type: RelationshipType
    official_evidence: str
    source_url: str
    evidence_id: str
    verified_status: VerificationStatus


class CompanySchema(TypedDict):
    company_id: str
    name: str
    aliases: List[str]
    industry: str
    website_url: Optional[str]
    career_url: Optional[str]
    relationships: List[CompanyRelationship]
    is_verified: bool


class JobRequirement(TypedDict):
    major_requirement: str             # "전공 필수", "전공 무관", "관련 전공", "특정 학과"
    target_majors: List[str]
    required_skills: List[str]         # Software, Tools, Programming, AI, Design, Communication
    preferred_skills: List[str]
    portfolio_requirement: str        # "포트폴리오 필수", "포트폴리오 우대", "해당 없음"
    portfolio_details: Optional[str]
    education: str                    # 학력 조건
    experience: str                   # 신입, 경력, 경력무관
    certifications: List[str]
    language: Optional[str]


class RecruitmentPosting(TypedDict):
    job_id: str
    company: str
    job_title: str
    department_or_team: Optional[str]
    job_category: str
    employment_type: str              # 정규직, 인턴, 계약직 등
    location: Optional[str]
    requirements: JobRequirement
    qualifications: List[str]
    preferred_qualifications: List[str]
    deadline: Optional[str]
    published_at: Optional[str]
    source_url: str
    source_id: str
    evidence_id: str
    recruitment_signal_status: str    # "recruitmentSignal"
    signal_type: Optional[str]        # Alias: "recruitmentSignal"


class TalentProfile(TypedDict):
    company: str
    values: List[str]                 # 핵심 가치
    talent_profile: str               # 공식 인재상
    culture: str                      # 기업 문화
    working_style: str                # 일하는 방식
    collaboration_style: str          # 협업 방식
    growth_policy: Optional[str]      # 성장/교육 정책
    preferred_behavior: List[str]     # 선호하는 행동 양식
    official_description: str
    source_url: str
    evidence_id: str
    verified_status: VerificationStatus


class CrossValidationResult(TypedDict):
    department: str
    company: str
    cooperation_signals: List[CooperationSignal]
    recruitment_signals: List[RecruitmentPosting]
    talent_profile: Optional[TalentProfile]
    cooperation_evidence: str
    department_evidence: str
    recruitment_evidence: str
    skill_evidence: List[str]
    portfolio_evidence: str
    talent_evidence: str
    corroboration_status: VerificationStatus
    confidence_rationale: str
    evidence_ids: List[str]


class AcademicCorporateGraphState(TypedDict):
    run_id: str
    target_university: str
    target_department: Optional[str]
    graduation_exhibit_url: Optional[str]
    current_step: str
    cooperation_signals: List[CooperationSignal]
    expanded_companies: List[CompanyRelationship]
    department_mappings: List[Dict[str, Any]]
    recruitment_postings: List[RecruitmentPosting]
    talent_profiles: List[TalentProfile]
    cross_validation_results: List[CrossValidationResult]
    markdown_report: str
    evidences: List[EvidenceSchema]
    sources: List[SourceSchema]
    errors: List[str]
    status: str
    started_at: str
    completed_at: Optional[str]
