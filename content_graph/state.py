"""
Content Research Automation State Definitions
Models for ResearchScope, ResearchSource, ExtractedFact, ConflictRecord,
TopicKeywordData, ResearchItem, ContentOpportunity, ResearchIntelligence,
and ContentGraphState.
"""

from typing import TypedDict, List, Dict, Any, Optional, Literal, Tuple


# ======================================================================
# 1. Research Scope Model
# ======================================================================
class ResearchScope(TypedDict):
    topic: str
    sector: str
    target_audience: str
    research_goal: str
    date_range: Dict[str, str]  # e.g. {"start": "2025-01-01", "end": "2026-12-31"}
    source_constraints: List[str]  # e.g. ["OFFICIAL_ORG", "ACADEMIC", "PUBLIC_DATA"]
    geographic_scope: str  # e.g. "KR", "Global"
    language: str  # e.g. "ko"
    freshness_requirement: str  # e.g. "within_6_months"


# ======================================================================
# 2. Source Model
# ======================================================================
class ResearchSource(TypedDict):
    source_id: str
    source_url: str
    source_type: Literal[
        "OFFICIAL_ORG",
        "OFFICIAL_DOC",
        "ACADEMIC",
        "PUBLIC_DATA",
        "PROFESSIONAL_ORG",
        "NEWS",
        "AUXILIARY"
    ]
    publisher: str
    title: str
    published_at: str
    accessed_at: str
    authority: float  # 0.0 - 1.0
    language: str
    raw_content: Optional[str]
    extracted_content: Optional[str]
    validation_status: Literal["VERIFIED", "REVIEW_NEEDED", "ACCESSIBILITY_FAILED", "REJECTED"]
    validation_errors: List[str]


# ======================================================================
# 3. Fact & Conflict Models
# ======================================================================
class ExtractedFact(TypedDict):
    fact_id: str
    fact: str
    evidence: str
    source: str
    source_url: str
    source_ids: List[str]  # Supports "동일 Fact + 복수 Source"
    fact_type: Literal[
        "STATISTIC",
        "DATE_EVENT",
        "OFFICIAL_POLICY",
        "CASE_STUDY",
        "FINDING",
        "QUOTE"
    ]
    confidence: Literal[
        "verified",
        "high_confidence",
        "medium_confidence",
        "low_confidence",
        "conflicting",
        "needs_review"
    ]
    confidence_score: float
    inference: bool  # False: 원문 직접 확인 사실, True: AI 추론 결과
    notes: str
    published_at: str
    extracted_at: str


class ConflictRecord(TypedDict):
    conflict_id: str
    fact_id_a: str
    fact_id_b: str
    source_a: str
    source_b: str
    conflict_field: str
    value_a: str
    value_b: str
    status: Literal["conflicting"]
    review_notes: str


# ======================================================================
# 4. Topic, Keyword & Research Item Models
# ======================================================================
class TopicKeywordData(TypedDict):
    topics: List[Dict[str, Any]]
    keywords: List[Dict[str, Any]]
    entities: List[Dict[str, Any]]
    concepts: List[Dict[str, Any]]
    questions: List[str]
    trends: List[str]


class ResearchItem(TypedDict):
    id: str
    topic_ids: List[str]
    fact_ids: List[str]
    source_ids: List[str]
    keyword_ids: List[str]
    opportunity_ids: List[str]
    summary: str
    normalized_title: str


# ======================================================================
# 5. Opportunity & Engagement Models
# ======================================================================
class EngagementRelevance(TypedDict):
    share: str      # 공유 유발 요인 및 타겟 반응 분석
    save: str       # 저장/스크랩 유발 요인 (체크리스트, 가이드라인 등)
    retention: str  # 체류 시간 유지 요인 (심층 비교, 단계별 분석)


class ContentOpportunity(TypedDict):
    opportunity_id: str
    opportunity_type: Literal[
        "checklist",
        "faq",
        "emerging_topic",
        "important_change",
        "practical_information",
        "case_example",
        "comparison",
        "educational",
        "discussion"
    ]
    topic: str
    reason: str
    supporting_research_ids: List[str]
    source_ids: List[str]
    engagement_relevance: EngagementRelevance


# ======================================================================
# 6. Run Log & Comprehensive Research Intelligence Model
# ======================================================================
class ResearchRunLog(TypedDict):
    run_id: str
    started_at: str
    completed_at: Optional[str]
    scope: Dict[str, Any]
    sources_found: int
    sources_processed: int
    facts_extracted: int
    duplicates_removed: int
    conflicts_found: int
    opportunities_found: int
    failed_items: List[Dict[str, Any]]
    status: Literal[
        "COMPLETED",
        "PARTIAL_SUCCESS",
        "FAILED",
        "APPROVAL_REQUIRED",
        "DRY_RUN"
    ]
    error_summary: Optional[str]


class ResearchIntelligence(TypedDict):
    project_id: str
    scope: ResearchScope
    sources: List[ResearchSource]
    facts: List[ExtractedFact]
    conflicts: List[ConflictRecord]
    topics: List[Dict[str, Any]]
    keywords: List[Dict[str, Any]]
    entities: List[Dict[str, Any]]
    research_items: List[ResearchItem]
    opportunities: List[ContentOpportunity]
    run_log: ResearchRunLog


# ======================================================================
# 7. Backward Compatibility Models (Legacy Topic/Source/Asset)
# ======================================================================
class ContentTopic(TypedDict):
    topic_id: str
    title: str
    category: str
    keywords: List[str]
    trend_score: float
    industry_demand_score: float
    rationale: str
    rank: int


class ContentSource(TypedDict):
    source_id: str
    topic_id: str
    title: str
    url: str
    source_type: Literal["ACADEMIC", "INDUSTRY_REPORT", "NEWS", "OFFICIAL_PRESS", "PORTFOLIO"]
    author: str
    published_at: str
    summary: str
    relevance_score: float
    credibility_score: float
    collected_at: str


class ContentAsset(TypedDict):
    asset_id: str
    topic_id: str
    source_url: str
    download_url: str
    asset_type: Literal["IMAGE", "VIDEO", "VECTOR", "DOCUMENT"]
    creator: str
    license: str
    license_url: Optional[str]
    license_status: Literal["VERIFIED", "REVIEW_NEEDED", "REJECTED"]
    dimensions: Optional[Tuple[int, int]]
    duration: Optional[float]
    file_size: Optional[int]
    downloaded_at: Optional[str]
    storage_path: Optional[str]
    web_path: Optional[str]
    checksum_sha256: Optional[str]
    relevance_rank: int


# ======================================================================
# 8. Complete Pipeline LangGraph State
# ======================================================================
class ContentGraphState(TypedDict):
    # Core Controls
    run_id: str
    started_at: str
    completed_at: Optional[str]
    provider_mode: Literal["mock", "live", "auto"]
    dry_run: bool
    resume_checkpoint_id: Optional[str]

    # Node 1: Research Scope
    scope: Optional[ResearchScope]
    target_keywords: List[str]

    # Node 2: Source Discovery
    discovered_sources: List[ResearchSource]

    # Node 3: Source Collection
    collected_sources: List[ResearchSource]

    # Node 4: Source Validation
    validated_sources: List[ResearchSource]
    failed_items: List[Dict[str, Any]]

    # Node 5: Fact Extraction
    raw_facts: List[ExtractedFact]

    # Node 6: Normalization
    normalized_facts: List[ExtractedFact]

    # Node 7: Deduplication & Conflicts
    deduplicated_facts: List[ExtractedFact]
    duplicates_removed: int
    conflicts: List[ConflictRecord]

    # Node 8: Topic & Keyword Extraction
    topic_keyword_data: Optional[TopicKeywordData]
    research_items: List[ResearchItem]

    # Node 9: Content Opportunity Detection
    opportunities: List[ContentOpportunity]

    # Node 10: Persistence
    research_intelligence: Optional[ResearchIntelligence]

    # Node 11: Research Report
    research_report: Optional[str]

    # Node 12: Human Review & Approval Gate
    review_items: List[Dict[str, Any]]
    human_review_required: bool
    approval_status: Literal["PENDING", "APPROVAL_REQUIRED", "APPROVED", "REJECTED"]

    # Backward Compatibility fields (Legacy assets & UI)
    discovered_topics: List[ContentTopic]
    ranked_topics: List[ContentTopic]
    selected_topic: Optional[ContentTopic]
    researched_sources: List[ContentSource]
    discovered_assets: List[ContentAsset]
    validated_assets: List[ContentAsset]
    ranked_assets: List[ContentAsset]
    downloaded_assets: List[ContentAsset]
    stored_assets: List[ContentAsset]

    # Overall State Tracking
    errors: List[str]
    status: str
    current_step: str
    summary: Dict[str, Any]
