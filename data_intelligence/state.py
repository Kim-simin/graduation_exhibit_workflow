"""
Data Intelligence LangGraph State Definition
Handles state for multi-domain verification, evidence tracking, change detection,
deduplication, and atomic persistence.
"""

from typing import TypedDict, List, Dict, Any, Optional
from .models import (
    ProfessorProfile,
    RFPRecord,
    BrandOpenIPRecord,
    MentorRecord,
    AuditLogRecord,
    SourceEvidence,
)

class DataIntelligenceState(TypedDict, total=False):
    # 실행 식별자 및 세션 (Run & Thread Management)
    run_id: str
    thread_id: str
    domain: str  # "professors" | "rfp" | "brand_assets" | "mentors" | "taxonomy" | "all"
    provider_mode: str  # "mock" | "live" | "auto"
    started_at: str
    completed_at: Optional[str]
    current_step: str
    current_node: str
    status: str
    retry_count: int
    max_retries: int
    errors: List[str]

    # 1. 수집 및 추출 단계 (Raw -> Discovered -> Extracted)
    raw_discovered: List[Dict[str, Any]]
    extracted_records: List[Dict[str, Any]]
    source_evidences: List[SourceEvidence]

    # 2. 정규화 및 매칭 (Normalization & Entity Matching)
    normalized_records: List[Dict[str, Any]]
    matched_entities: List[Dict[str, Any]]

    # 3. 검증 및 신뢰도 평가 (Verification & Confidence)
    verified_records: List[Dict[str, Any]]
    flagged_records: List[Dict[str, Any]]  # REVIEW_REQUIRED
    rejected_records: List[Dict[str, Any]]

    # 4. 중복 제거 및 변경 감지 (Deduplication & Change Detection)
    deduplicated_records: List[Dict[str, Any]]
    detected_changes: List[Dict[str, Any]]

    # 5. DB 업데이트 및 감사 로깅 (Persistence & Audit)
    updated_db_counts: Dict[str, int]
    audit_logs: List[AuditLogRecord]
    sync_results: Dict[str, Any]

    # 6. 휴먼 인 더 루프 승인 (Human-in-the-loop Gate)
    needs_human_review: bool
    review_reasons: List[str]
    is_approved: bool
