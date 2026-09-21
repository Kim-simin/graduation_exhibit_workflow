"""
STEP 8 — Content Generation LangGraph Assembly
Connects 12 nodes in exact sequence:
START
→ ResearchLoader
→ ContentCompressor
→ ObjectiveSelector
→ AudienceSelector
→ PlatformSelector
→ ContentTypeSelector
→ EngagementStrategy
→ ContentGenerator
→ ContentQA
→ HumanReview
→ VersioningPersistence
→ ApprovalGate
→ END
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import GenerationGraphState
from .nodes import (
    node_research_loader,
    node_content_compressor,
    node_objective_selector,
    node_audience_selector,
    node_platform_selector,
    node_content_type_selector,
    node_engagement_strategy,
    node_content_generator,
    node_content_qa,
    node_human_review,
    node_versioning_persistence,
    node_approval_gate,
)


def build_content_generation_graph(checkpointer=None):
    """
    Assembles and compiles the 12-Node Content Generation StateGraph.
    Supports checkpointing via MemorySaver for resumption and time-travel.
    """
    graph = StateGraph(GenerationGraphState)

    # 12개 노드 등록
    graph.add_node("research_loader", node_research_loader)
    graph.add_node("content_compressor", node_content_compressor)
    graph.add_node("objective_selector", node_objective_selector)
    graph.add_node("audience_selector", node_audience_selector)
    graph.add_node("platform_selector", node_platform_selector)
    graph.add_node("content_type_selector", node_content_type_selector)
    graph.add_node("engagement_strategy", node_engagement_strategy)
    graph.add_node("content_generator", node_content_generator)
    graph.add_node("content_qa", node_content_qa)
    graph.add_node("human_review", node_human_review)
    graph.add_node("versioning_persistence", node_versioning_persistence)
    graph.add_node("approval_gate", node_approval_gate)

    # 순차 파이프라인 엣지 연결
    graph.set_entry_point("research_loader")
    graph.add_edge("research_loader", "content_compressor")
    graph.add_edge("content_compressor", "objective_selector")
    graph.add_edge("objective_selector", "audience_selector")
    graph.add_edge("audience_selector", "platform_selector")
    graph.add_edge("platform_selector", "content_type_selector")
    graph.add_edge("content_type_selector", "engagement_strategy")
    graph.add_edge("engagement_strategy", "content_generator")
    graph.add_edge("content_generator", "content_qa")
    graph.add_edge("content_qa", "human_review")
    graph.add_edge("human_review", "versioning_persistence")
    graph.add_edge("versioning_persistence", "approval_gate")
    graph.add_edge("approval_gate", END)

    cp = checkpointer if checkpointer is not None else MemorySaver()
    return graph.compile(checkpointer=cp)


content_generation_app = build_content_generation_graph()
