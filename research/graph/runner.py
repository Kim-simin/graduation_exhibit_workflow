"""
research/graph/runner.py
CLI and Python interface to invoke the LangGraph Research & Crawl Automation Graph.
"""

import os
import sys
import uuid
import json
from datetime import datetime
from typing import Dict, Any, Optional

from .graph import build_research_graph
from .state import ResearchGraphState

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LOGS_DIR = os.path.join(WORKSPACE_ROOT, "data", "logs")
RESEARCH_LOG_FILE = os.path.join(LOGS_DIR, "research_runs.json")
PLATFORM_RESEARCH_LOG_FILE = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "logs", "research_runs.json")


def save_research_run(run_state: Dict[str, Any]):
    os.makedirs(LOGS_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(PLATFORM_RESEARCH_LOG_FILE), exist_ok=True)

    # Load existing runs
    runs = []
    if os.path.exists(RESEARCH_LOG_FILE):
        try:
            with open(RESEARCH_LOG_FILE, "r", encoding="utf-8") as f:
                runs = json.load(f)
        except Exception:
            runs = []

    # Insert latest at head
    runs = [r for r in runs if r.get("research_run_id") != run_state.get("research_run_id")]
    runs.insert(0, run_state)

    for p in [RESEARCH_LOG_FILE, PLATFORM_RESEARCH_LOG_FILE]:
        try:
            with open(p, "w", encoding="utf-8") as f:
                json.dump(runs[:50], f, ensure_ascii=False, indent=2)
        except Exception:
            pass


def run_research_pipeline(
    university: str = "홍익대학교",
    department: str = "시각디자인과",
    year: str = "2025",
    target_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the 7-node LangGraph Research & Crawl Pipeline.
    """
    run_id = f"run-res-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().isoformat()

    initial_state: ResearchGraphState = {
        "research_run_id": run_id,
        "target_university": university,
        "target_department": department,
        "target_year": year,
        "target_url": target_url,
        "discovered_sources": [],
        "crawl_result": None,
        "raw_evidence": [],
        "extracted_facts": [],
        "validated_facts": [],
        "conflicts": [],
        "entity_graph": None,
        "change_status": None,
        "current_step": "INITIATED",
        "status": "RUNNING",
        "errors": [],
        "started_at": now_str,
        "completed_at": None
    }

    graph = build_research_graph()
    final_state = graph.invoke(initial_state)

    # Save run record
    run_summary = {
        "research_run_id": final_state["research_run_id"],
        "target_university": final_state["target_university"],
        "target_department": final_state["target_department"],
        "target_year": final_state["target_year"],
        "target_url": final_state["target_url"],
        "status": final_state["status"],
        "sources_count": len(final_state.get("discovered_sources", [])),
        "evidence_count": len(final_state.get("raw_evidence", [])),
        "facts_count": len(final_state.get("validated_facts", [])),
        "conflicts_count": len(final_state.get("conflicts", [])),
        "artworks_count": len(final_state.get("entity_graph", {}).get("artworks", [])),
        "started_at": final_state["started_at"],
        "completed_at": final_state["completed_at"],
        "crawl_result": {
            "status": final_state.get("crawl_result", {}).get("status"),
            "final_url": final_state.get("crawl_result", {}).get("final_url"),
            "content_hash": final_state.get("crawl_result", {}).get("content_hash"),
            "status_code": final_state.get("crawl_result", {}).get("status_code"),
        } if final_state.get("crawl_result") else None
    }
    save_research_run(run_summary)

    return final_state
