"""
National Professor Intelligence Automation Runner
CLI and programmatic entrypoint for nationwide batch queue execution.
Supports dry-run, scope filtering, pagination, retry of failed jobs, and resume.
"""

import sys
import argparse
import json

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from .national_orchestrator import NationalProfessorOrchestrator


def main():
    parser = argparse.ArgumentParser(description="National Professor Queue Orchestrator Runner (STEP 6)")
    parser.add_argument(
        "--action",
        default="batch",
        choices=["batch", "retry", "reset", "status", "resume"],
        help="Orchestration action"
    )
    parser.add_argument("--batch-size", type=int, default=2, help="Number of universities to process per batch")
    parser.add_argument("--delay", type=float, default=0.5, help="Rate limit delay in seconds between queries")
    parser.add_argument("--mode", default="mock", choices=["mock", "live", "auto"], help="Search Provider mode")
    parser.add_argument("--page", type=int, default=1, help="Pagination page for status display")
    parser.add_argument("--page-size", type=int, default=10, help="Pagination page size")
    parser.add_argument("--univs", nargs="*", help="Optional specific universities to process in this run")
    parser.add_argument("--depts", nargs="*", help="Optional specific departments to filter")
    parser.add_argument("--prof", help="Optional specific professor name")
    parser.add_argument("--dry-run", action="store_true", help="Preview mode: discover targets without executing pipeline or DB write")
    parser.add_argument("--concurrency", type=int, default=2, help="Max concurrency limit")
    parser.add_argument("--entity-type", default="all", choices=["all", "university", "professor"], help="Target entity type for retry")
    args = parser.parse_args()

    orchestrator = NationalProfessorOrchestrator()

    if args.action == "reset":
        res = orchestrator.reset_queue()
        print(json.dumps(res, ensure_ascii=False, indent=2))
    elif args.action == "retry":
        res = orchestrator.retry_failed(provider_mode=args.mode, entity_type=args.entity_type)
        print(json.dumps(res, ensure_ascii=False, indent=2))
    elif args.action == "resume":
        res = orchestrator.resume_run(provider_mode=args.mode, batch_size=args.batch_size)
        print(json.dumps(res, ensure_ascii=False, indent=2))
    elif args.action == "status":
        res = orchestrator.get_summary(page=args.page, page_size=args.page_size)
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:  # batch
        res = orchestrator.invoke_batch(
            batch_size=args.batch_size,
            rate_limit_delay=args.delay,
            provider_mode=args.mode,
            target_univ_names=args.univs,
            target_dept_names=args.depts,
            target_prof_names=[args.prof] if args.prof else None,
            dry_run=args.dry_run,
            max_concurrency=args.concurrency
        )
        print(json.dumps(res, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
