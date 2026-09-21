"""
Content Research Automation LangGraph Assembly
Connects the 12 nodes in exact sequence for STEP 7:
START
→ Research Scope
→ Source Discovery
→ Source Collection
→ Source Validation
→ Fact Extraction
→ Normalization
→ Deduplication & Conflict Detection
→ Topic / Keyword Extraction
→ Opportunity Detection
→ Persistence
→ Research Report
→ Human Review (Approval Gate)
→ END

Also maintains legacy 10-node asset graph for backward compatibility.
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import ContentGraphState
from .nodes import (
    # STEP 7 12 Nodes
    node_research_scope,
    node_source_discovery,
    node_source_collection,
    node_source_validation,
    node_fact_extraction,
    node_normalization,
    node_deduplication,
    node_topic_keyword_extraction,
    node_opportunity_detection,
    node_persistence,
    node_research_report,
    node_human_review,
    # Legacy Nodes
    topic_discovery,
    topic_ranking,
    source_research,
    source_validation,
    asset_search,
    license_validation,
    asset_ranking,
    download,
    metadata_extraction,
    storage,
)


def build_content_research_graph(checkpointer=None):
    """
    STEP 7 12-Node Content Research Automation Graph.
    Supports checkpointing (MemorySaver) for state resumption and time travel.
    """
    graph = StateGraph(ContentGraphState)

    # 12개 노드 등록
    graph.add_node("research_scope", node_research_scope)
    graph.add_node("source_discovery", node_source_discovery)
    graph.add_node("source_collection", node_source_collection)
    graph.add_node("source_validation", node_source_validation)
    graph.add_node("fact_extraction", node_fact_extraction)
    graph.add_node("normalization", node_normalization)
    graph.add_node("deduplication", node_deduplication)
    graph.add_node("topic_keyword_extraction", node_topic_keyword_extraction)
    graph.add_node("opportunity_detection", node_opportunity_detection)
    graph.add_node("persistence", node_persistence)
    graph.add_node("research_report", node_research_report)
    graph.add_node("human_review", node_human_review)

    # 순차 엣지 연결
    graph.set_entry_point("research_scope")
    graph.add_edge("research_scope", "source_discovery")
    graph.add_edge("source_discovery", "source_collection")
    graph.add_edge("source_collection", "source_validation")
    graph.add_edge("source_validation", "fact_extraction")
    graph.add_edge("fact_extraction", "normalization")
    graph.add_edge("normalization", "deduplication")
    graph.add_edge("deduplication", "topic_keyword_extraction")
    graph.add_edge("topic_keyword_extraction", "opportunity_detection")
    graph.add_edge("opportunity_detection", "persistence")
    graph.add_edge("persistence", "research_report")
    graph.add_edge("research_report", "human_review")
    graph.add_edge("human_review", END)

    cp = checkpointer if checkpointer is not None else MemorySaver()
    return graph.compile(checkpointer=cp)


def build_content_graph():
    """Legacy 10-node asset download graph for backward compatibility."""
    graph = StateGraph(ContentGraphState)

    graph.add_node("topic_discovery", topic_discovery)
    graph.add_node("topic_ranking", topic_ranking)
    graph.add_node("source_research", source_research)
    graph.add_node("source_validation", source_validation)
    graph.add_node("asset_search", asset_search)
    graph.add_node("license_validation", license_validation)
    graph.add_node("asset_ranking", asset_ranking)
    graph.add_node("download", download)
    graph.add_node("metadata_extraction", metadata_extraction)
    graph.add_node("storage", storage)

    graph.set_entry_point("topic_discovery")
    graph.add_edge("topic_discovery", "topic_ranking")
    graph.add_edge("topic_ranking", "source_research")
    graph.add_edge("source_research", "source_validation")
    graph.add_edge("source_validation", "asset_search")
    graph.add_edge("asset_search", "license_validation")
    graph.add_edge("license_validation", "asset_ranking")
    graph.add_edge("asset_ranking", "download")
    graph.add_edge("download", "metadata_extraction")
    graph.add_edge("metadata_extraction", "storage")
    graph.add_edge("storage", END)

    return graph.compile()


content_research_app = build_content_research_graph()
content_app = build_content_graph()
