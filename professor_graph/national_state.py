"""
National Professor Intelligence Automation State Definitions
Complete typed definitions for University Queue, Department Queue, Professor Queue,
Failure Tracking, National Run, and Statistics.
"""

from typing import TypedDict, List, Dict, Any, Optional, Literal


# ---------------------------------------------------------------------------
# 1. University Definitions
# ---------------------------------------------------------------------------
class UniversityRecord(TypedDict):
    university_id: str
    university_name: str
    official_url: str
    source_url: str
    source_type: str  # "official_portal", "archive_queue", "seed"
    verification_status: Literal['VERIFIED', 'CONDITIONAL', 'UNVERIFIED']
    collected_at: Optional[str]
    region: Optional[str]


class UniversityQueueItem(TypedDict):
    job_id: str
    run_id: str
    university_id: str
    name: str
    raw_name: str
    status: Literal['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY_WAIT', 'SKIPPED', 'CANCELLED']
    departments_count: int
    professors_count: int
    attempt_count: int
    max_retries: int
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    last_error: Optional[str]
    next_retry_at: Optional[str]


# ---------------------------------------------------------------------------
# 2. Department Definitions
# ---------------------------------------------------------------------------
class DepartmentRecord(TypedDict):
    department_id: str
    university_id: str
    department_name: str
    official_url: Optional[str]
    source_url: Optional[str]
    verification_status: Literal['VERIFIED', 'CONDITIONAL', 'UNVERIFIED']


class DepartmentQueueItem(TypedDict):
    job_id: str
    run_id: str
    university_id: str
    department_id: str
    university_name: str
    department_name: str
    status: Literal['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED']
    attempt_count: int
    last_error: Optional[str]
    timestamps: Dict[str, Optional[str]]


# ---------------------------------------------------------------------------
# 3. Professor Definitions (Core Execution Queue)
# ---------------------------------------------------------------------------
class ProfessorQueueItem(TypedDict):
    job_id: str
    run_id: str
    professor_id: str
    university_id: str
    department_id: str
    university_name: str
    department_name: str
    candidate_name: str
    official_profile_url: Optional[str]
    source_url: Optional[str]
    verification_status: Literal['VERIFIED', 'CONDITIONAL', 'UNVERIFIED', 'REVIEW_NEEDED']
    status: Literal['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY_WAIT', 'SKIPPED']
    attempt_count: int
    priority: int
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    last_error: Optional[str]
    next_retry_at: Optional[str]


# ---------------------------------------------------------------------------
# 4. Failure Tracking & Classification
# ---------------------------------------------------------------------------
ErrorType = Literal[
    'RESEARCH_ERROR',
    'NETWORK_ERROR',
    'RATE_LIMIT',
    'BROWSER_ERROR',
    'VALIDATION_ERROR',
    'DATABASE_ERROR',
    'UNKNOWN_ERROR'
]


class FailureRecord(TypedDict):
    entity_id: str
    entity_type: Literal['university', 'department', 'professor']
    name: str
    run_id: str
    error_type: ErrorType
    error_message: str
    retryable: bool
    attempt_count: int
    last_attempt_at: str
    status: str


class FailedUniversityRecord(TypedDict):
    university_name: str
    error: str
    error_type: Optional[str]
    retryable: Optional[bool]
    attempt_count: int
    failed_at: str


class FailedProfessorRecord(TypedDict):
    university_name: str
    department_name: str
    candidate_name: str
    profile_url: Optional[str]
    error: str
    error_type: Optional[str]
    retryable: Optional[bool]
    attempt_count: Optional[int]
    failed_at: str


# ---------------------------------------------------------------------------
# 5. Statistics & National Run Metadata
# ---------------------------------------------------------------------------
class NationalStatistics(TypedDict):
    total_universities: int
    total_departments: int
    total_professors: int
    completed: int
    in_progress: int
    failed: int
    retry_wait: int
    skipped: int
    new_professors: int
    updated_professors: int
    new_tasks: int
    new_collaborations: int
    progress_percentage: float
    last_collected_at: Optional[str]
    next_scheduled_at: Optional[str]


class NationalRunMetadata(TypedDict):
    run_id: str
    workflow_name: str
    trigger_type: Literal['manual', 'api']
    started_at: str
    completed_at: Optional[str]
    status: Literal['INITIATED', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL_SUCCESS']
    total_universities: int
    total_departments: int
    total_professors: int
    success_count: int
    failed_count: int
    retry_count: int
    dry_run: bool
    batch_size: int
    concurrency_limit: int


class NationalOrchestratorState(TypedDict):
    run_id: str
    started_at: str
    batch_size: int
    rate_limit_delay: float
    max_retries: int
    max_concurrency: int
    current_page: int
    status: Literal['INITIATED', 'RUNNING', 'COMPLETED', 'FAILED']
    current_step: str
    
    # Discovery & Queues
    discovered_university_names: List[str]
    university_queue: List[UniversityQueueItem]
    department_queue: List[DepartmentQueueItem]
    professor_queue: List[ProfessorQueueItem]
    
    # Active Batch
    current_batch_universities: List[str]
    
    # Execution Tracking & Failure Logs
    failed_universities: List[FailedUniversityRecord]
    failed_professors: List[FailedProfessorRecord]
    
    # Consolidated Results
    accumulated_extracted_professors: List[Dict[str, Any]]
    deduplicated_professors: List[Dict[str, Any]]
    change_report: Dict[str, List[Any]]
    
    # Global Statistics
    statistics: NationalStatistics
