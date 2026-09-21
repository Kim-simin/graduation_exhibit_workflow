"""
Data Intelligence Package
Verified Data Pipeline for Professors, Industry RFPs, Open IPs, and Mentors.
"""
from .models import (
    ProfessorProfile,
    RFPRecord,
    BrandOpenIPRecord,
    MentorRecord,
    AuditLogRecord,
    SourceEvidence,
    STANDARD_TAXONOMY,
    STATUS_VERIFIED,
    STATUS_REVIEW_REQUIRED,
    STATUS_UNVERIFIED,
)
from .graph import build_data_intelligence_graph, app
from .runner import run_data_intelligence_pipeline, export_taxonomy

__all__ = [
    "ProfessorProfile",
    "RFPRecord",
    "BrandOpenIPRecord",
    "MentorRecord",
    "AuditLogRecord",
    "SourceEvidence",
    "STANDARD_TAXONOMY",
    "STATUS_VERIFIED",
    "STATUS_REVIEW_REQUIRED",
    "STATUS_UNVERIFIED",
    "build_data_intelligence_graph",
    "run_data_intelligence_pipeline",
    "export_taxonomy",
    "app",
]
