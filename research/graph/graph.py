"""
research/graph/graph.py
LangGraph Research & Crawl Automation Graph.
Integrates Playwright, Local Qwen2.5-VL, Fact Validation, and Entity Resolution.
"""

from typing import Dict, Any, List
from datetime import datetime

from langgraph.graph import StateGraph, END
from .state import ResearchGraphState
from ..crawler.playwright_crawler import PlaywrightCrawler
from ..crawler.snapshot import find_cached_snapshot
from ..extraction.dom_extractor import extract_dom_structure
from ..extraction.metadata_extractor import extract_page_metadata
from ..extraction.evidence_extractor import build_evidence_bundle
from ..local_ai.qwen25vl import Qwen25VLAdapter
from ..validation.source_validator import SourceValidator
from ..validation.fact_validator import FactValidator
from ..validation.corroboration import CorroborationEngine
from ..validation.conflict_detector import ConflictDetector
from ..normalization.entity_resolver import EntityResolver
from ..change_detection.detector import ChangeDetector


def source_discovery_node(state: ResearchGraphState) -> Dict[str, Any]:
    """Resolves official candidate URLs for target university and department."""
    univ = state["target_university"]
    dept = state["target_department"]
    url = state.get("target_url")

    if not url:
        # Default known official academic portal for demonstration
        if "홍익" in univ:
            url = "https://sidi.hongik.ac.kr"
        elif "서울" in univ:
            url = "https://design.snu.ac.kr"
        else:
            url = "https://kidp.or.kr"

    tier, source_type = SourceValidator.classify_source_tier(url)
    sources = [{
        "url": url,
        "source_tier": tier,
        "source_type": source_type,
        "discovered_at": datetime.now().isoformat()
    }]

    return {
        "target_url": url,
        "discovered_sources": sources,
        "current_step": "SOURCE_DISCOVERY"
    }


def playwright_crawl_node(state: ResearchGraphState) -> Dict[str, Any]:
    """Executes headless browser crawl, captures snapshot and screenshot."""
    url = state["target_url"]
    crawler = PlaywrightCrawler()
    crawl_res = crawler.crawl_page(url=url, capture_screenshot=True, use_cache=True)

    errors = state.get("errors", [])
    if crawl_res["status"] not in ("SUCCESS", "BLOCKED"):
        errors.append(f"Crawl Error: {crawl_res.get('error')}")

    return {
        "crawl_result": crawl_res,
        "current_step": "PLAYWRIGHT_CRAWL",
        "errors": errors
    }


def dom_extraction_node(state: ResearchGraphState) -> Dict[str, Any]:
    """Extracts metadata, headings, and artwork candidates from crawled DOM."""
    crawl_res = state.get("crawl_result") or {}
    html = crawl_res.get("html_content") or ""
    url = crawl_res.get("final_url") or state["target_url"]
    content_hash = crawl_res.get("content_hash") or "hash-unknown"
    screenshot_path = crawl_res.get("metadata", {}).get("screenshot_path")

    dom_data = extract_dom_structure(html, base_url=url)
    meta_data = extract_page_metadata(html)

    bundle = build_evidence_bundle(
        url=url,
        source_id=f"src-{content_hash[:8]}",
        content_hash=content_hash,
        dom_data=dom_data,
        meta_data=meta_data,
        screenshot_path=screenshot_path
    )

    return {
        "raw_evidence": bundle["evidences"],
        "extracted_facts": bundle["facts"],
        "current_step": "DOM_EXTRACTION"
    }


def local_qwen_analysis_node(state: ResearchGraphState) -> Dict[str, Any]:
    """Probes local Qwen2.5-VL for visual confirmation and candidate enrichment."""
    crawl_res = state.get("crawl_result") or {}
    screenshot_path = crawl_res.get("metadata", {}).get("screenshot_path")
    text_sample = crawl_res.get("text_content") or ""
    valid_links = [l["url"] for l in crawl_res.get("links", [])]

    adapter = Qwen25VLAdapter()
    qwen_res = adapter.analyze_artwork_card(
        screenshot_path=screenshot_path,
        untrusted_text_context=text_sample,
        valid_dom_urls=valid_links
    )

    # Note model status in state
    qwen_status = qwen_res.get("status", "LOCAL_MODEL_UNAVAILABLE")

    return {
        "current_step": "QWEN_VISUAL_ANALYSIS"
    }


def fact_validation_node(state: ResearchGraphState) -> Dict[str, Any]:
    """Validates facts against evidence, applies corroboration and conflict detection."""
    raw_facts = state.get("extracted_facts", [])

    # 1. Fact Validation
    validated = FactValidator.validate_all_facts(raw_facts)

    # 2. Corroboration
    corroborated = CorroborationEngine.compute_corroboration(validated)

    # 3. Conflict Detection
    final_facts, conflicts = ConflictDetector.detect_conflicts(corroborated)

    return {
        "validated_facts": final_facts,
        "conflicts": conflicts,
        "current_step": "FACT_VALIDATION"
    }


def entity_resolution_node(state: ResearchGraphState) -> Dict[str, Any]:
    """Resolves facts and candidates into the linked Academic Entity Graph."""
    univ = state["target_university"]
    dept = state["target_department"]
    year = state["target_year"]
    url = state["target_url"]
    facts = state.get("validated_facts", [])
    crawl_res = state.get("crawl_result") or {}
    html = crawl_res.get("html_content") or ""

    dom_data = extract_dom_structure(html, base_url=url)
    artworks = dom_data.get("artwork_candidates", [])

    entity_graph = EntityResolver.resolve_entity_graph(
        university_name=univ,
        department_name=dept,
        exhibition_title=f"{univ} {dept} {year} 졸업작품전",
        exhibition_year=year,
        source_url=url,
        facts=facts,
        artworks_raw=artworks
    )

    return {
        "entity_graph": entity_graph,
        "current_step": "ENTITY_RESOLUTION"
    }


def change_detection_node(state: ResearchGraphState) -> Dict[str, Any]:
    """Assesses change status of the current page against stored evidence."""
    crawl_res = state.get("crawl_result") or {}
    current_hash = crawl_res.get("content_hash", "")
    cached = find_cached_snapshot(state["target_url"])
    stored_hash = cached.get("content_hash") if cached else None

    change_res = ChangeDetector.detect_change(current_hash, stored_hash)

    return {
        "change_status": change_res,
        "current_step": "CHANGE_DETECTION",
        "status": "COMPLETED",
        "completed_at": datetime.now().isoformat()
    }


def build_research_graph():
    """Builds and compiles the 7-node LangGraph Research workflow."""
    workflow = StateGraph(ResearchGraphState)

    workflow.add_node("source_discovery", source_discovery_node)
    workflow.add_node("playwright_crawl", playwright_crawl_node)
    workflow.add_node("dom_extraction", dom_extraction_node)
    workflow.add_node("local_qwen_analysis", local_qwen_analysis_node)
    workflow.add_node("fact_validation", fact_validation_node)
    workflow.add_node("entity_resolution", entity_resolution_node)
    workflow.add_node("change_detection", change_detection_node)

    workflow.set_entry_point("source_discovery")
    workflow.add_edge("source_discovery", "playwright_crawl")
    workflow.add_edge("playwright_crawl", "dom_extraction")
    workflow.add_edge("dom_extraction", "local_qwen_analysis")
    workflow.add_edge("local_qwen_analysis", "fact_validation")
    workflow.add_edge("fact_validation", "entity_resolution")
    workflow.add_edge("entity_resolution", "change_detection")
    workflow.add_edge("change_detection", END)

    return workflow.compile()
