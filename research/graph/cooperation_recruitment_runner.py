"""
research/graph/cooperation_recruitment_runner.py
CLI and programmatic runner for the Academic-Corporate Cooperation & Recruitment Graph.
"""

import os
import sys
import uuid
import json
import argparse
from datetime import datetime
from typing import Dict, Any, Optional

from .cooperation_recruitment_graph import build_academic_corporate_graph
from ..schema import AcademicCorporateGraphState

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INTELLIGENCE_DIR = os.path.join(WORKSPACE_ROOT, "data", "research", "intelligence")
LOGS_DIR = os.path.join(WORKSPACE_ROOT, "data", "logs")
CORPORATE_LOG_FILE = os.path.join(LOGS_DIR, "corporate_research_runs.json")
PLATFORM_CORPORATE_LOG = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "logs", "corporate_research_runs.json")


def save_corporate_run(run_state: Dict[str, Any]):
    os.makedirs(LOGS_DIR, exist_ok=True)
    os.makedirs(INTELLIGENCE_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(PLATFORM_CORPORATE_LOG), exist_ok=True)

    # 1. Save individual full intelligence snapshot
    run_id = run_state.get("run_id", f"run-{uuid.uuid4().hex[:6]}")
    intel_file = os.path.join(INTELLIGENCE_DIR, f"corporate_intel_{run_id}.json")
    latest_file = os.path.join(INTELLIGENCE_DIR, "latest_corporate_research.json")

    clean_state = dict(run_state)
    for target in [intel_file, latest_file]:
        try:
            with open(target, "w", encoding="utf-8") as f:
                json.dump(clean_state, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Warning] Failed writing intel snapshot: {e}", file=sys.stderr)

    # 2. Append summary to corporate_research_runs.json
    runs = []
    if os.path.exists(CORPORATE_LOG_FILE):
        try:
            with open(CORPORATE_LOG_FILE, "r", encoding="utf-8") as f:
                runs = json.load(f)
        except Exception:
            runs = []

    summary = {
        "run_id": run_id,
        "target_university": run_state.get("target_university"),
        "target_department": run_state.get("target_department"),
        "graduation_exhibit_url": run_state.get("graduation_exhibit_url"),
        "status": run_state.get("status", "COMPLETED"),
        "cooperation_signals_count": len(run_state.get("cooperation_signals", [])),
        "expanded_companies_count": len(run_state.get("expanded_companies", [])),
        "department_mappings_count": len(run_state.get("department_mappings", [])),
        "recruitment_postings_count": len(run_state.get("recruitment_postings", [])),
        "talent_profiles_count": len(run_state.get("talent_profiles", [])),
        "cross_validation_results_count": len(run_state.get("cross_validation_results", [])),
        "evidences_count": len(run_state.get("evidences", [])),
        "sources_count": len(run_state.get("sources", [])),
        "started_at": run_state.get("started_at"),
        "completed_at": run_state.get("completed_at"),
        "errors": run_state.get("errors", [])
    }

    runs = [r for r in runs if r.get("run_id") != run_id]
    runs.insert(0, summary)

    for p in [CORPORATE_LOG_FILE, PLATFORM_CORPORATE_LOG]:
        try:
            with open(p, "w", encoding="utf-8") as f:
                json.dump(runs[:50], f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Warning] Failed writing corporate run log: {e}", file=sys.stderr)


def run_cooperation_recruitment_pipeline(
    university: str = "홍익대학교",
    department: Optional[str] = "시각디자인과",
    graduation_exhibit_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the 7-node Academic-Corporate Cooperation & Recruitment Graph.
    """
    run_id = f"run-corp-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().isoformat()

    initial_state: AcademicCorporateGraphState = {
        "run_id": run_id,
        "target_university": university,
        "target_department": department,
        "graduation_exhibit_url": graduation_exhibit_url,
        "current_step": "INITIATED",
        "cooperation_signals": [],
        "expanded_companies": [],
        "department_mappings": [],
        "recruitment_postings": [],
        "talent_profiles": [],
        "cross_validation_results": [],
        "markdown_report": "",
        "evidences": [],
        "sources": [],
        "errors": [],
        "status": "RUNNING",
        "started_at": now_str,
        "completed_at": None
    }

    graph = build_academic_corporate_graph()
    final_state = graph.invoke(initial_state)

    save_corporate_run(final_state)

    # Auto sync to platform DB (university_queue, professors, rfp)
    try:
        from scripts.sync_research_to_platform import sync_intelligence_to_platform
        sync_intelligence_to_platform(final_state)
    except Exception as e:
        print(f"[Warning] Auto-sync to platform failed: {e}", file=sys.stderr)

    return final_state


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Academic-Corporate Cooperation & Recruitment Research Pipeline")
    parser.add_argument("--univ", type=str, default="홍익대학교", help="Target University Name")
    parser.add_argument("--dept", type=str, default="시각디자인과", help="Target Department Name")
    parser.add_argument("--url", type=str, default=None, help="Graduation Exhibition URL")

    args = parser.parse_args()
    result = run_cooperation_recruitment_pipeline(
        university=args.univ,
        department=args.dept,
        graduation_exhibit_url=args.url
    )

    print("\n" + "=" * 60)
    print("🎓 RESEARCH PIPELINE COMPLETED")
    print(f"Run ID: {result['run_id']}")
    print(f"Cooperation Signals: {len(result['cooperation_signals'])}")
    print(f"Recruitment Postings: {len(result['recruitment_postings'])}")
    print(f"Cross Validation Pairs: {len(result['cross_validation_results'])}")
    print("=" * 60)
    print("\n" + result["markdown_report"][:800] + "\n...")
