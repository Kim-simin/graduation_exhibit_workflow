"""
STEP 8 — Content Generation Pipeline Runner
CLI and Python interface to execute the 12-node content generation workflow.
"""

import sys
import uuid
import argparse
from datetime import datetime
from typing import Dict, Any, Optional

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from langgraph.types import Command
from .graph import content_generation_app
from .state import GenerationGraphState


def run_content_generation(
    platform: str = "instagram",
    content_type: str = "reels",
    objective: Optional[str] = None,
    audience: Optional[str] = None,
    research_data: Optional[Dict[str, Any]] = None,
    dry_run: bool = False,
    version: int = 1,
    thread_id: Optional[str] = None,
) -> GenerationGraphState:
    """
    Executes the 12-Node Content Generation Workflow (STEP 8).
    Takes Research Intelligence and generates structured, QA-validated content.
    Halts at Approval Gate before STEP 9.
    """
    run_id = f"run-gen-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().isoformat()
    active_thread_id = thread_id or run_id

    initial_state: GenerationGraphState = {
        "run_id": run_id,
        "started_at": now_str,
        "completed_at": None,
        "dry_run": dry_run,
        "resume_checkpoint_id": None,
        "research_data": research_data,
        "target_platform": platform,
        "target_content_type": content_type,
        "custom_objective": objective,
        "custom_audience": audience,
        "version": version,
        "content_brief": None,
        "resolved_objective": "",
        "resolved_audience": "",
        "resolved_platform": "",
        "resolved_content_type": "",
        "engagement_strategy": {},
        "generated_content": None,
        "qa_result": None,
        "human_review_record": None,
        "approval_status": "WAITING_FOR_APPROVAL",
        "approval_required": True,
        "approved_by": None,
        "approved_at": None,
        "rejected_by": None,
        "rejected_at": None,
        "rejection_reason": None,
        "approval_request_id": None,
        "approval_version": version,
        "current_step": "START",
        "status": "INITIATED",
        "errors": [],
    }

    print("=" * 80)
    print(f"🎬 [STEP 8: Content Generation Pipeline] Run ID: {run_id}")
    print(f"⚙️ Config: Platform={platform} | Type={content_type} | DryRun={dry_run} | Ver={version}")
    print("=" * 80)

    config = {"configurable": {"thread_id": active_thread_id}}
    final_state = content_generation_app.invoke(initial_state, config=config)

    content = final_state.get("generated_content")
    qa = final_state.get("qa_result")

    print("\n" + "=" * 80)
    print("🏁 [Content Generation Workflow Finished - Approval Gate Reached]")
    print(f"- Run ID         : {final_state.get('run_id')}")
    print(f"- Approval State : {final_state.get('approval_status')}")
    if content:
        print(f"- Content ID     : {content.get('content_id')}")
        print(f"- Platform / Type: {content.get('platform').upper()} > {content.get('content_type').upper()}")
        print(f"- Title          : {content.get('title')}")
        print(f"- QA Passed      : {'✅ PASS' if qa and qa.get('passed') else '❌ FAIL'} (Score: {qa.get('score', 0) if qa else 0})")
        print(f"- Status         : {content.get('status')}")
        print(f"- Traceability   : {len(content.get('source_traceability', []))} 출처 근거 매핑 완료")
    print("=" * 80)

    return final_state


def resume_content_generation(
    thread_id: str,
    action: str = "APPROVE",
    reviewer: str = "admin",
    rejection_reason: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Resumes the interrupted content generation workflow from its checkpoint
    using Command(resume=decision).
    """
    config = {"configurable": {"thread_id": thread_id}}
    decision = {
        "action": action.upper(),
        "reviewer": reviewer,
        "rejection_reason": rejection_reason,
    }
    print(f"▶️ [Resuming Workflow] Thread: {thread_id} with Decision: {action}")
    resumed_state = content_generation_app.invoke(Command(resume=decision), config=config)
    return resumed_state


def main():
    parser = argparse.ArgumentParser(description="Content Generation Runner")
    parser.add_argument("--platform", default="instagram", choices=["instagram", "youtube", "blog"], help="Target platform")
    parser.add_argument("--type", default="reels", choices=["reels", "carousel", "post", "video_script", "blog_post"], help="Target content type")
    parser.add_argument("--objective", help="Custom content objective")
    parser.add_argument("--audience", help="Custom target audience")
    parser.add_argument("--version", type=int, default=1, help="Content version number")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode without disk persistence")
    args = parser.parse_args()

    run_content_generation(
        platform=args.platform,
        content_type=args.type,
        objective=args.objective,
        audience=args.audience,
        version=args.version,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
