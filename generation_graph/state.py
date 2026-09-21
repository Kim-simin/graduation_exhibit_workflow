"""
STEP 8 — Content Generation State Definitions
Models for ContentBrief, ContentObjective, TargetAudience, Platform,
ContentType, EngagementStrategy, ContentStructure, SourceTraceability,
GeneratedContent, ContentQAResult, HumanReviewRecord, and GenerationGraphState.
"""

from typing import TypedDict, List, Dict, Any, Optional, Literal


# ======================================================================
# 1. Content Brief Model (Compressor Output)
# ======================================================================
class ContentBrief(TypedDict):
    topic: str
    sector: str
    target_audience: str
    research_goal: str
    key_facts: List[Dict[str, Any]]
    raw_facts_summary: List[str]
    ai_inferences_summary: List[str]
    sources_summary: List[Dict[str, str]]
    keywords: List[str]
    entities: List[str]
    opportunities: List[Dict[str, Any]]
    platform_constraints: Dict[str, Any]


# ======================================================================
# 2. Source Traceability Model
# ======================================================================
class SourceTraceability(TypedDict):
    claim: str
    fact_id: str
    fact_text: str
    source_id: str
    publisher: str
    source_url: str


# ======================================================================
# 3. Content Structure Block Model
# ======================================================================
class StructureBlock(TypedDict):
    section_name: str  # e.g., "Hook", "Context", "Slide 1", "Key Point", "CTA"
    content_text: str
    visual_notes: str
    asset_ref: Optional[str]


# ======================================================================
# 4. QA Result Model
# ======================================================================
class ContentQAResult(TypedDict):
    passed: bool
    score: float  # 0.0 - 1.0
    checked_items: List[str]
    errors: List[str]
    warnings: List[str]
    source_presence_verified: bool
    fact_consistency_verified: bool
    unsupported_claims: List[str]
    format_adherence: bool
    cta_verified: bool
    asset_requirements_verified: bool


# ======================================================================
# 5. Generated Content Master Model
# ======================================================================
class GeneratedContent(TypedDict):
    content_id: str
    project_id: str
    research_ids: List[str]
    platform: Literal["instagram", "youtube", "blog"]
    content_type: Literal[
        "reels",
        "carousel",
        "post",
        "video_script",
        "blog_post"
    ]
    objective: str
    target_audience: str
    engagement_strategy: Dict[str, str]  # share, save, retention
    title: str
    hook: str
    body: str
    caption: str
    cta: str
    keywords: List[str]
    hashtags: List[str]
    structure: List[StructureBlock]
    visual_direction: str
    asset_requirements: List[Dict[str, Any]]
    source_traceability: List[SourceTraceability]
    qa_result: Optional[ContentQAResult]
    version: int
    parent_version_id: Optional[str]
    status: Literal[
        "DRAFT",
        "QA_PASSED",
        "QA_FAILED",
        "HUMAN_REVIEW",
        "APPROVED",
        "REVISION_REQUIRED",
        "REJECTED"
    ]
    created_at: str
    updated_at: str


# ======================================================================
# 6. Human Review Record Model
# ======================================================================
class HumanReviewRecord(TypedDict):
    review_id: str
    content_id: str
    status: Literal["PENDING", "APPROVED", "REVISION_REQUIRED", "REJECTED"]
    reviewer_notes: Optional[str]
    reviewed_at: Optional[str]


# ======================================================================
# 7. LangGraph Pipeline Execution State
# ======================================================================
class GenerationGraphState(TypedDict):
    # Execution Tracking
    run_id: str
    started_at: str
    completed_at: Optional[str]
    dry_run: bool
    resume_checkpoint_id: Optional[str]

    # Input Configuration
    research_data: Optional[Dict[str, Any]]  # Loaded ResearchIntelligence
    target_platform: Optional[str]           # "instagram", "youtube", "blog"
    target_content_type: Optional[str]       # "reels", "carousel", "post", etc.
    custom_objective: Optional[str]
    custom_audience: Optional[str]
    version: int

    # Pipeline Outputs
    content_brief: Optional[ContentBrief]
    resolved_objective: str
    resolved_audience: str
    resolved_platform: str
    resolved_content_type: str
    engagement_strategy: Dict[str, str]
    generated_content: Optional[GeneratedContent]
    qa_result: Optional[ContentQAResult]
    human_review_record: Optional[HumanReviewRecord]

    # Approval Gate Controls
    approval_status: Literal[
        "NOT_REQUIRED",
        "WAITING_FOR_APPROVAL",
        "APPROVAL_REQUIRED",
        "PENDING",
        "APPROVED",
        "REJECTED"
    ]
    approval_required: bool
    approved_by: Optional[str]
    approved_at: Optional[str]
    rejected_by: Optional[str]
    rejected_at: Optional[str]
    rejection_reason: Optional[str]
    approval_request_id: Optional[str]
    approval_version: int
    current_step: str
    status: str
    errors: List[str]
