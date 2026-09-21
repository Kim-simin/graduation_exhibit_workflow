"""
Data Intelligence LangGraph Construction
Connects 11 sequential and conditional nodes:
START
-> Source Discovery
-> Extraction
-> Normalization
-> Entity Matching
-> Evidence Collection
-> Verification
-> Deduplication
-> Change Detection
-> Database Update
-> Audit Logging
-> Human Review Gate
-> END
"""

from typing import Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver

from .state import DataIntelligenceState
from .nodes import (
    node_source_discovery,
    node_extraction,
    node_normalization,
    node_entity_matching,
    node_evidence_collection,
    node_verification,
    node_deduplication,
    node_change_detection,
    node_database_update,
    node_audit_logging,
    node_human_review_gate,
)

def build_data_intelligence_graph(checkpointer: Optional[BaseCheckpointSaver] = None):
    """Data Intelligence 11-Node StateGraph 구축 및 컴파일"""
    workflow = StateGraph(DataIntelligenceState)

    # 1. 노드 등록
    workflow.add_node("source_discovery", node_source_discovery)
    workflow.add_node("extraction", node_extraction)
    workflow.add_node("normalization", node_normalization)
    workflow.add_node("entity_matching", node_entity_matching)
    workflow.add_node("evidence_collection", node_evidence_collection)
    workflow.add_node("verification", node_verification)
    workflow.add_node("deduplication", node_deduplication)
    workflow.add_node("change_detection", node_change_detection)
    workflow.add_node("database_update", node_database_update)
    workflow.add_node("audit_logging", node_audit_logging)
    workflow.add_node("human_review_gate", node_human_review_gate)

    # 2. 엣지 연결
    workflow.set_entry_point("source_discovery")
    workflow.add_edge("source_discovery", "extraction")
    workflow.add_edge("extraction", "normalization")
    workflow.add_edge("normalization", "entity_matching")
    workflow.add_edge("entity_matching", "evidence_collection")
    workflow.add_edge("evidence_collection", "verification")
    workflow.add_edge("verification", "deduplication")
    workflow.add_edge("deduplication", "change_detection")
    workflow.add_edge("change_detection", "database_update")
    workflow.add_edge("database_update", "audit_logging")
    workflow.add_edge("audit_logging", "human_review_gate")
    workflow.add_edge("human_review_gate", END)

    if checkpointer:
        return workflow.compile(checkpointer=checkpointer)
    return workflow.compile()

app = build_data_intelligence_graph()
