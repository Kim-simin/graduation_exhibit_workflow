"""
Professor Intelligence Graph Runner
CLI and Python API to invoke the professor automation pipeline for Single-Target (1 Univ -> 1 Dept -> 1 Prof) MVP.
"""

import sys
import uuid
import argparse
from datetime import datetime
from typing import Dict, Any, Optional

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from langgraph.checkpoint.base import BaseCheckpointSaver
from .graph import build_professor_graph, app
from .state import ProfessorGraphState


def run_professor_pipeline(
    university: Optional[str] = None,
    department: Optional[str] = None,
    professor: Optional[str] = None,
    target_universities: Optional[list] = None,
    target_departments: Optional[list] = None,
    provider_mode: str = "mock",
    max_retries: int = 2,
    checkpointer: Optional[BaseCheckpointSaver] = None,
    thread_id: Optional[str] = None
) -> ProfessorGraphState:
    """
    Professor Intelligence Graph 실행기 함수 (MVP 단일 타겟 지원).
    """
    run_id = f"run-prof-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().isoformat()

    # 단일 타겟 결정
    u_target = university or (target_universities[0] if target_universities else "홍익대학교")
    d_target = department or (target_departments[0] if target_departments else "시각디자인과")
    p_target = professor

    initial_state: ProfessorGraphState = {
        "thread_id": thread_id or f"thread-{uuid.uuid4().hex[:8]}",
        "run_id": run_id,
        "started_at": now_str,
        "provider_mode": provider_mode,
        "university": u_target,
        "department": d_target,
        "professor": p_target,
        "target_universities": [u_target],
        "target_departments": [d_target],
        "raw_evidence": [],
        "normalized_data": {},
        "validation_results": [],
        "confidence_score": 0.0,
        "verification_status": "UNVERIFIED",
        "semester_data": {},
        "industry_collaboration": [],
        "student_matches": [],
        "deduplication_result": {},
        "change_detection_result": {},
        "database_result": {},
        "current_node": "START",
        "retry_count": 0,
        "max_retries": max_retries,
        "errors": [],
        "status": "INITIATED",
        "current_step": "START",
        "discovered_universities": [],
        "discovered_departments": [],
        "discovered_candidates": [],
        "validated_candidates": [],
        "unverified_candidates": [],
        "extracted_professors": [],
        "matched_professors": [],
        "deduplicated_professors": [],
        "change_report": {"new": [], "updated": [], "unchanged": []},
        "final_saved_professors": [],
        "run_summary": {}
    }

    print("=" * 70)
    print(f"[*] [Professor Intelligence Graph Execution] Run ID: {run_id}")
    print(f"[CONFIG] Provider Mode: {provider_mode} | Target: {u_target} > {d_target} > {p_target or '대표 교수'}")
    print("=" * 70)

    compiled_graph = build_professor_graph(checkpointer=checkpointer) if checkpointer else app
    config = {"configurable": {"thread_id": initial_state["thread_id"]}} if thread_id or checkpointer else None

    if config:
        final_state = compiled_graph.invoke(initial_state, config=config)
    else:
        final_state = compiled_graph.invoke(initial_state)

    print("\n" + "=" * 70)
    print("[FINISHED] [Execution Finished]")
    print(f"- Run ID       : {final_state.get('run_id')}")
    print(f"- Status       : {final_state.get('status')}")
    print(f"- University   : {final_state.get('university')}")
    print(f"- Department   : {final_state.get('department')}")
    print(f"- Professor    : {final_state.get('professor')}")
    print(f"- Confidence   : {final_state.get('confidence_score')}")
    print(f"- Verification : {final_state.get('verification_status')}")
    summary = final_state.get("run_summary", {})
    print(f"- 신규 발굴    : {summary.get('new_count')}명")
    print(f"- 변경 갱신    : {summary.get('updated_count')}명")
    print(f"- 기존 유지    : {summary.get('unchanged_count')}명")
    print(f"- 총 저장 DB   : {summary.get('total_saved')}명")
    print(f"- 출처 불량격리: {summary.get('unverified_count')}명")
    print("=" * 70)

    return final_state


def main():
    parser = argparse.ArgumentParser(description="Professor Intelligence Graph CLI Runner (MVP)")
    parser.add_argument("--univ", help="Target university (e.g. 홍익대학교)")
    parser.add_argument("--dept", help="Target department (e.g. 시각디자인과)")
    parser.add_argument("--prof", help="Target professor name (e.g. 강동원)")
    parser.add_argument("--mode", default="mock", choices=["mock", "live", "auto"], help="Search Provider mode")
    parser.add_argument("--retries", type=int, default=2, help="Max search retry attempts")
    args = parser.parse_args()

    run_professor_pipeline(
        university=args.univ,
        department=args.dept,
        professor=args.prof,
        provider_mode=args.mode,
        max_retries=args.retries
    )


if __name__ == "__main__":
    main()
