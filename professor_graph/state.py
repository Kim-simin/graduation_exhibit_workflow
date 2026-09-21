from typing import TypedDict, List, Dict, Any, Optional

class ProfessorCandidate(TypedDict, total=False):
    candidate_id: str
    name: str
    university: str
    department: str
    lab_name: Optional[str]
    title: Optional[str]
    source_url: str
    source_domain: str
    is_official_domain: bool
    evidence_text: Optional[str]
    raw_page_content: Optional[str]
    confidence_score: float

class ExtractedProfessor(TypedDict, total=False):
    id: str
    name: str
    university: str
    department: str
    lab_name: str
    title: str
    research_areas: List[str]
    avatar_url: str
    bio: str
    source_url: str
    collected_at: str
    is_verified: bool
    confidence_score: float
    evidence_text: str
    inferred_fields: List[str]
    # 학기 핵심 과제
    assignment_one_liner: str
    assignment_details: Dict[str, Any]
    # 산학협력 과제
    industry_collaborations: List[Dict[str, Any]]
    # 학생 포트폴리오 매칭
    student_submission_ids: List[str]
    student_submissions: List[Dict[str, Any]]
    # 입시/B2B 파트너 배너
    partner_academy_banner: Dict[str, Any]
    version: int
    last_run_id: str

class ProfessorGraphState(TypedDict, total=False):
    # 실행 식별자 및 세션 (Run & Thread Management)
    run_id: str
    thread_id: str
    started_at: str
    completed_at: Optional[str]
    provider_mode: str  # 'mock', 'live', 'auto'
    current_step: str
    current_node: str
    status: str
    retry_count: int
    max_retries: int
    errors: List[str]

    # MVP 타겟 설정 (1 University -> 1 Department -> 1 Professor)
    university: str
    department: str
    professor: str
    research_targets: Dict[str, Any]
    target_universities: List[str]
    target_departments: List[str]
    target_professors: List[str]

    # 1. 탐색 타겟 및 결과 (Discovery)
    discovered_universities: List[Dict[str, Any]]
    discovered_departments: List[Dict[str, Any]]
    discovered_candidates: List[ProfessorCandidate]

    # 2. 출처 및 증거 검증 (Sources, Evidence & Validation)
    sources: List[Dict[str, Any]]
    raw_evidence: Dict[str, Any]
    validation_results: Dict[str, Any]
    validated_candidates: List[ProfessorCandidate]
    unverified_candidates: List[ProfessorCandidate]

    # 3. 정보 및 과제 추출 (Extraction)
    extracted_professors: List[ExtractedProfessor]
    semester_data: List[Dict[str, Any]]
    industry_collaboration: List[Dict[str, Any]]
    student_matches: List[Dict[str, Any]]
    matched_professors: List[ExtractedProfessor]

    # 4. 정규화 및 신뢰도 평가 (Normalization & Confidence Evaluation)
    normalized_data: List[Dict[str, Any]]
    confidence_score: float
    verification_status: str  # "VERIFIED", "REVIEW_NEEDED", "UNVERIFIED", "REJECTED"

    # 5. 중복 제거 및 변경 감지 (Deduplication & Change Detection)
    deduplication_result: Dict[str, Any]
    deduplicated_professors: List[ExtractedProfessor]
    change_detection_result: Dict[str, Any]
    change_report: Dict[str, Any]  # {"new": [...], "updated": [...], "unchanged": [...]}

    # 6. 데이터베이스 저장 및 실행 감사 로그 (Persistence & Run Logging)
    database_result: Dict[str, Any]
    final_saved_professors: List[ExtractedProfessor]
    run_summary: Dict[str, Any]
