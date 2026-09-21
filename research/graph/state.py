"""
research/graph/state.py
Typed state schema for LangGraph Research & Crawl Automation Graph.
"""

from typing import Dict, Any, List, Optional
from typing_extensions import TypedDict


class ResearchGraphState(TypedDict):
    research_run_id: str
    target_university: str
    target_department: str
    target_year: str
    target_url: Optional[str]
    discovered_sources: List[Dict[str, Any]]
    crawl_result: Optional[Dict[str, Any]]
    raw_evidence: List[Dict[str, Any]]
    extracted_facts: List[Dict[str, Any]]
    validated_facts: List[Dict[str, Any]]
    conflicts: List[Dict[str, Any]]
    entity_graph: Optional[Dict[str, Any]]
    change_status: Optional[Dict[str, Any]]
    current_step: str
    status: str
    errors: List[str]
    started_at: str
    completed_at: Optional[str]
