"""
Content Research Automation Pipeline Runner (STEP 7)
CLI and Python interface to trigger the 12-node research workflow and legacy asset pipeline.
"""

import sys
import uuid
import argparse
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from .graph import content_research_app, content_app
from .state import ContentGraphState, ResearchScope


def run_content_research(
    scope: Optional[ResearchScope] = None,
    target_keywords: Optional[List[str]] = None,
    provider_mode: str = "mock",
    dry_run: bool = False,
    thread_id: Optional[str] = None,
) -> ContentGraphState:
    """
    Executes the 12-Node Content Research Automation Pipeline (STEP 7).
    Discovers, validates, normalizes, and structures Content Research Intelligence.
    Halts at Human Review / Approval Gate (strictly not executing STEP 8).
    """
    run_id = f"run-content-research-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().isoformat()
    active_thread_id = thread_id or run_id

    initial_state: ContentGraphState = {
        "run_id": run_id,
        "started_at": now_str,
        "completed_at": None,
        "provider_mode": provider_mode,
        "dry_run": dry_run,
        "resume_checkpoint_id": None,
        "scope": scope,
        "target_keywords": target_keywords or [],
        "discovered_sources": [],
        "collected_sources": [],
        "validated_sources": [],
        "failed_items": [],
        "raw_facts": [],
        "normalized_facts": [],
        "deduplicated_facts": [],
        "duplicates_removed": 0,
        "conflicts": [],
        "topic_keyword_data": None,
        "research_items": [],
        "opportunities": [],
        "research_intelligence": None,
        "research_report": None,
        "review_items": [],
        "human_review_required": False,
        "approval_status": "PENDING",
        "discovered_topics": [],
        "ranked_topics": [],
        "selected_topic": None,
        "researched_sources": [],
        "discovered_assets": [],
        "validated_assets": [],
        "ranked_assets": [],
        "downloaded_assets": [],
        "stored_assets": [],
        "errors": [],
        "status": "INITIATED",
        "current_step": "START",
        "summary": {},
    }

    print("=" * 75)
    print(f"🔬 [STEP 7: Content Research Automation] Run ID: {run_id}")
    print(f"⚙️ Config: Mode={provider_mode} | DryRun={dry_run} | ThreadID={active_thread_id}")
    print("=" * 75)

    config = {"configurable": {"thread_id": active_thread_id}}
    final_state = content_research_app.invoke(initial_state, config=config)

    intel = final_state.get("research_intelligence")
    run_log = intel["run_log"] if intel else {}

    print("\n" + "=" * 75)
    print("🏁 [Content Research Automation Finished - Approval Gate Reached]")
    print(f"- Run ID            : {final_state.get('run_id')}")
    print(f"- Pipeline Status   : {final_state.get('status')}")
    print(f"- Approval Status   : {final_state.get('approval_status')}")
    print(f"- Sources Processed : {run_log.get('sources_processed', 0)}건")
    print(f"- Facts Extracted   : {run_log.get('facts_extracted', 0)}건 (중복통합: {run_log.get('duplicates_removed', 0)}건)")
    print(f"- Conflicts Found   : {run_log.get('conflicts_found', 0)}건")
    print(f"- Opportunities     : {run_log.get('opportunities_found', 0)}건")
    print(f"- Review Items      : {len(final_state.get('review_items', []))}건")
    print("=" * 75)

    return final_state


def run_content_pipeline(
    target_keywords: Optional[List[str]] = None,
    provider_mode: str = "mock"
) -> ContentGraphState:
    """Legacy 10-node asset download pipeline runner for backward compatibility."""
    run_id = f"run-content-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().isoformat()

    initial_state: ContentGraphState = {
        "run_id": run_id,
        "started_at": now_str,
        "completed_at": None,
        "provider_mode": provider_mode,
        "dry_run": False,
        "resume_checkpoint_id": None,
        "scope": None,
        "target_keywords": target_keywords or [],
        "discovered_sources": [],
        "collected_sources": [],
        "validated_sources": [],
        "failed_items": [],
        "raw_facts": [],
        "normalized_facts": [],
        "deduplicated_facts": [],
        "duplicates_removed": 0,
        "conflicts": [],
        "topic_keyword_data": None,
        "research_items": [],
        "opportunities": [],
        "research_intelligence": None,
        "research_report": None,
        "review_items": [],
        "human_review_required": False,
        "approval_status": "PENDING",
        "discovered_topics": [],
        "ranked_topics": [],
        "selected_topic": None,
        "researched_sources": [],
        "discovered_assets": [],
        "validated_assets": [],
        "ranked_assets": [],
        "downloaded_assets": [],
        "stored_assets": [],
        "errors": [],
        "status": "INITIATED",
        "current_step": "START",
        "summary": {},
    }

    print("=" * 75)
    print(f"🎬 [Content Pipeline Execution] Run ID: {run_id}")
    print(f"⚙️ Provider Mode: {provider_mode} | Keywords: {target_keywords or '전체 트렌드'}")
    print("=" * 75)

    final_state = content_app.invoke(initial_state)

    print("\n" + "=" * 75)
    print("🏁 [Content Pipeline Execution Finished]")
    print(f"- Run ID       : {final_state.get('run_id')}")
    print(f"- Status       : {final_state.get('status')}")
    summary = final_state.get("summary", {})
    print(f"- 선정된 주제  : {summary.get('topic')}")
    print(f"- 검증된 소스  : {summary.get('sources_count')}건")
    print(f"- 수집된 에셋  : {summary.get('assets_total')}건")
    print(f"- 안전 다운로드: {summary.get('verified_downloaded')}건 (VERIFIED 라이선스)")
    print(f"- 격리 저장    : {summary.get('review_needed_quarantined')}건 (REVIEW_NEEDED 검토필요)")
    print("=" * 75)

    return final_state


def main():
    parser = argparse.ArgumentParser(description="Content Research Automation Runner")
    parser.add_argument("--action", default="research", choices=["research", "pipeline"], help="Action to run")
    parser.add_argument("--keywords", nargs="*", help="Target keywords")
    parser.add_argument("--mode", default="mock", choices=["mock", "live", "auto"], help="Provider mode")
    parser.add_argument("--dry-run", action="store_true", help="Perform dry run without file persistence")
    args = parser.parse_args()

    if args.action == "research":
        run_content_research(
            target_keywords=args.keywords,
            provider_mode=args.mode,
            dry_run=args.dry_run,
        )
    else:
        run_content_pipeline(
            target_keywords=args.keywords,
            provider_mode=args.mode,
        )


if __name__ == "__main__":
    main()
