"""
scripts/workflow_scheduler.py
STEP 10: Workflow Scheduler / Scheduled Automation Engine

Core Responsibilities:
1. Schedule evaluation using Cron in Asia/Seoul (KST) timezone
2. Concurrency lock to prevent duplicate runs
3. Trigger LangGraph / Live Pipeline (Research -> Validate -> Normalize -> Update DB -> Content Gen)
4. STRICT HALT at WAITING_FOR_APPROVAL (Never auto-approves or auto-publishes)
5. Audit logging (SCHEDULE_CREATED, SCHEDULE_TRIGGERED, SCHEDULE_SKIPPED, etc.)
6. Dry Run simulation
7. ZERO LLM calls in the scheduler engine itself
"""

import os
import sys
import json
import time
import uuid
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

try:
    from zoneinfo import ZoneInfo
    KST = ZoneInfo("Asia/Seoul")
except Exception:
    import datetime as dt
    KST = dt.timezone(dt.timedelta(hours=9))

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)
scripts_dir = os.path.join(WORKSPACE_ROOT, "scripts")
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)
DATA_DIR = os.path.join(WORKSPACE_ROOT, "data")
SCHEDULES_FILE = os.path.join(DATA_DIR, "schedules.json")
PLATFORM_SCHEDULES_FILE = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "schedules.json")
SCHEDULER_AUDIT_LOG_FILE = os.path.join(DATA_DIR, "logs", "scheduler_audit_logs.json")
PLATFORM_AUDIT_LOG_FILE = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "logs", "scheduler_audit_logs.json")
LOCK_FILE = os.path.join(DATA_DIR, ".scheduler_lock.json")
RUNTIME_FILE = os.path.join(DATA_DIR, "runtime_pipeline.json")
RUNS_LOG_FILE = os.path.join(DATA_DIR, "logs", "pipeline_runs.json")


def get_kst_now() -> datetime:
    """Returns current datetime in Asia/Seoul (KST)."""
    return datetime.now(KST)


def read_json_file(path: str) -> Any:
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def write_atomic_json(path: str, data: Any):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_path = f"{path}.tmp.{uuid.uuid4().hex[:6]}"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass
    os.rename(tmp_path, path)


def sync_dual_schedules(data: Any):
    write_atomic_json(SCHEDULES_FILE, data)
    try:
        write_atomic_json(PLATFORM_SCHEDULES_FILE, data)
    except Exception:
        pass


def sync_dual_audit_logs(data: Any):
    write_atomic_json(SCHEDULER_AUDIT_LOG_FILE, data)
    try:
        write_atomic_json(PLATFORM_AUDIT_LOG_FILE, data)
    except Exception:
        pass


# ==============================================================================
# Cron Evaluation Engine (Asia/Seoul)
# ==============================================================================
def parse_cron_field(field_str: str, min_val: int, max_val: int) -> set:
    """Parses a single cron field: '*', '*/n', '1,2,3', '1-5'."""
    field_str = field_str.strip()
    if field_str == "*":
        return set(range(min_val, max_val + 1))
    
    values = set()
    for part in field_str.split(","):
        part = part.strip()
        if "/" in part:
            sub, step_s = part.split("/", 1)
            step = int(step_s)
            start = min_val if sub == "*" else int(sub)
            values.update(range(start, max_val + 1, step))
        elif "-" in part:
            start_s, end_s = part.split("-", 1)
            values.update(range(int(start_s), int(end_s) + 1))
        else:
            values.add(int(part))
    return {v for v in values if min_val <= v <= max_val}


def parse_cron(cron_expr: str) -> Dict[str, set]:
    """Parses standard 5-part cron: 'min hour dom month dow'."""
    parts = cron_expr.strip().split()
    if len(parts) != 5:
        raise ValueError(f"Invalid cron expression: '{cron_expr}'. Expected 5 parts.")
    
    minutes = parse_cron_field(parts[0], 0, 59)
    hours = parse_cron_field(parts[1], 0, 23)
    doms = parse_cron_field(parts[2], 1, 31)
    months = parse_cron_field(parts[3], 1, 12)
    # Cron dow: 0=Sun, 1=Mon, ..., 6=Sat, 7=Sun
    dows_raw = parse_cron_field(parts[4], 0, 7)
    dows = {0 if d == 7 else d for d in dows_raw}
    
    return {
        "minutes": minutes,
        "hours": hours,
        "doms": doms,
        "months": months,
        "dows": dows,
    }


def compute_next_run(cron_expr: str, base_dt: Optional[datetime] = None) -> datetime:
    """Computes the next execution datetime in Asia/Seoul strictly after base_dt."""
    if base_dt is None:
        base_dt = get_kst_now()
    elif base_dt.tzinfo is None:
        base_dt = base_dt.replace(tzinfo=KST)

    cron = parse_cron(cron_expr)
    
    # Start candidate from next minute, zero out seconds & microseconds
    curr = base_dt.replace(second=0, microsecond=0) + timedelta(minutes=1)
    
    # Search forward up to 366 days
    for _ in range(366 * 24 * 60):
        # Python weekday: 0=Mon, ..., 6=Sun -> convert to cron dow: 0=Sun, 1=Mon, ..., 6=Sat
        py_wd = curr.weekday()
        cron_dow = (py_wd + 1) % 7
        
        if (curr.month in cron["months"] and
            curr.day in cron["doms"] and
            cron_dow in cron["dows"] and
            curr.hour in cron["hours"] and
            curr.minute in cron["minutes"]):
            return curr
        
        curr += timedelta(minutes=1)
        
    # Fallback to 24h later
    return base_dt + timedelta(days=1)


def is_schedule_due(schedule: Dict[str, Any], current_dt: Optional[datetime] = None) -> bool:
    """Checks whether an enabled schedule is due for execution."""
    if not schedule.get("enabled", False):
        return False
    
    if current_dt is None:
        current_dt = get_kst_now()
    elif current_dt.tzinfo is None:
        current_dt = current_dt.replace(tzinfo=KST)
        
    next_run_str = schedule.get("nextRunAt")
    if not next_run_str:
        return False
        
    try:
        next_run = datetime.fromisoformat(next_run_str)
        if next_run.tzinfo is None:
            next_run = next_run.replace(tzinfo=KST)
        return current_dt >= next_run
    except Exception:
        return False


# ==============================================================================
# Audit Logger
# ==============================================================================
def log_scheduler_event(
    event_type: str,
    schedule_id: str,
    actor_id: str = "scheduler",
    run_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    now_iso = get_kst_now().isoformat()
    event_id = f"sch-evt-{uuid.uuid4().hex[:8]}"
    entry = {
        "event_id": event_id,
        "event_type": event_type,
        "schedule_id": schedule_id,
        "actor_id": actor_id,
        "actor_role": "ADMIN" if actor_id != "scheduler" else "SYSTEM",
        "run_id": run_id,
        "timestamp": now_iso,
        "details": details or {},
    }
    
    logs = read_json_file(SCHEDULER_AUDIT_LOG_FILE) or []
    logs.insert(0, entry)
    sync_dual_audit_logs(logs[:100])
    return entry


# ==============================================================================
# Concurrency & Distributed Locking
# ==============================================================================
def acquire_concurrency_lock(schedule_id: str, run_id: str) -> bool:
    """Acquires lock if no pipeline is currently RUNNING or locked."""
    # 1. Check runtime_pipeline.json
    runtime_state = read_json_file(RUNTIME_FILE)
    if runtime_state and runtime_state.get("status") == "RUNNING":
        return False
        
    # 2. Check lock file
    if os.path.exists(LOCK_FILE):
        lock_data = read_json_file(LOCK_FILE)
        if lock_data:
            acquired_at_str = lock_data.get("acquired_at")
            if acquired_at_str:
                try:
                    acquired_at = datetime.fromisoformat(acquired_at_str)
                    if acquired_at.tzinfo is None:
                        acquired_at = acquired_at.replace(tzinfo=KST)
                    # If lock is older than 10 minutes, treat as stale
                    if (get_kst_now() - acquired_at).total_seconds() < 600:
                        return False
                except Exception:
                    pass

    # Acquire lock
    lock_info = {
        "lock_id": f"lck-{uuid.uuid4().hex[:6]}",
        "schedule_id": schedule_id,
        "run_id": run_id,
        "acquired_at": get_kst_now().isoformat(),
    }
    write_atomic_json(LOCK_FILE, lock_info)
    return True


def release_concurrency_lock():
    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
        except Exception:
            pass


# ==============================================================================
# Schedule Repository
# ==============================================================================
def load_all_schedules() -> List[Dict[str, Any]]:
    scheds = read_json_file(SCHEDULES_FILE) or read_json_file(PLATFORM_SCHEDULES_FILE) or []
    # Ensure nextRunAt is populated
    updated = False
    now = get_kst_now()
    for s in scheds:
        if not s.get("nextRunAt") and s.get("cronExpression"):
            try:
                nxt = compute_next_run(s["cronExpression"], now)
                s["nextRunAt"] = nxt.isoformat()
                updated = True
            except Exception:
                pass
    if updated:
        sync_dual_schedules(scheds)
    return scheds


def get_schedule_by_id(schedule_id: str) -> Optional[Dict[str, Any]]:
    scheds = load_all_schedules()
    return next((s for s in scheds if s.get("scheduleId") == schedule_id), None)


def save_schedule(schedule_data: Dict[str, Any]) -> Dict[str, Any]:
    scheds = load_all_schedules()
    now_iso = get_kst_now().isoformat()
    
    sid = schedule_data.get("scheduleId")
    if not sid:
        sid = f"sched-{uuid.uuid4().hex[:8]}"
        schedule_data["scheduleId"] = sid
        schedule_data["createdAt"] = now_iso
        
    schedule_data["updatedAt"] = now_iso
    schedule_data["timezone"] = "Asia/Seoul"
    
    # Calculate nextRunAt
    if schedule_data.get("cronExpression"):
        schedule_data["nextRunAt"] = compute_next_run(schedule_data["cronExpression"]).isoformat()
        
    idx = next((i for i, s in enumerate(scheds) if s.get("scheduleId") == sid), -1)
    if idx >= 0:
        scheds[idx] = schedule_data
        log_scheduler_event("SCHEDULE_UPDATED", sid, details=schedule_data)
    else:
        scheds.append(schedule_data)
        log_scheduler_event("SCHEDULE_CREATED", sid, details=schedule_data)
        
    sync_dual_schedules(scheds)
    return schedule_data


def toggle_schedule_state(schedule_id: str, enabled: bool, actor_id: str = "admin") -> Optional[Dict[str, Any]]:
    scheds = load_all_schedules()
    target = next((s for s in scheds if s.get("scheduleId") == schedule_id), None)
    if not target:
        return None
        
    target["enabled"] = enabled
    target["updatedAt"] = get_kst_now().isoformat()
    if enabled and target.get("cronExpression"):
        target["nextRunAt"] = compute_next_run(target["cronExpression"]).isoformat()
        
    event_type = "SCHEDULE_ENABLED" if enabled else "SCHEDULE_DISABLED"
    log_scheduler_event(event_type, schedule_id, actor_id=actor_id, details={"enabled": enabled})
    sync_dual_schedules(scheds)
    return target


# ==============================================================================
# Execution Engine (Strict WAITING_FOR_APPROVAL Halt & Concurrency Protection)
# ==============================================================================
def execute_scheduled_workflow(
    schedule_id: str,
    dry_run: bool = False,
    actor_id: str = "scheduler"
) -> Dict[str, Any]:
    """
    Executes the workflow pipeline triggered by a schedule.
    HALTS at WAITING_FOR_APPROVAL. Never auto-approves or auto-publishes.
    """
    schedule = get_schedule_by_id(schedule_id)
    if not schedule:
        return {"status": "FAILED", "error": f"Schedule '{schedule_id}' not found"}

    now_kst = get_kst_now()
    now_iso = now_kst.isoformat()
    run_id = f"run-sched-{schedule_id}-{int(time.time())}"
    scope = schedule.get("scope", {})

    # 1. Dry Run Handling (Section 15)
    if dry_run:
        plan = {
            "scheduleId": schedule_id,
            "name": schedule.get("name"),
            "planned_run_id": run_id,
            "scope": scope,
            "target_nodes": ["Research", "Validate", "Normalize", "Update DB", "Content Generation", "Human Approval"],
            "expected_terminal_state": "WAITING_FOR_APPROVAL",
            "dry_run": True,
            "simulated_at": now_iso,
        }
        log_scheduler_event("DRY_RUN_EXECUTED", schedule_id, actor_id=actor_id, run_id=run_id, details=plan)
        return {"status": "DRY_RUN_SUCCESS", "plan": plan}

    # 2. Concurrency & Duplicate Check (Section 6 & 20)
    lock_acquired = acquire_concurrency_lock(schedule_id, run_id)
    if not lock_acquired:
        log_scheduler_event(
            "SCHEDULE_SKIPPED",
            schedule_id,
            actor_id=actor_id,
            run_id=run_id,
            details={"reason": "ALREADY_RUNNING_OR_LOCKED"}
        )
        return {
            "status": "SKIPPED",
            "reason": "Another pipeline run is currently in progress. Duplicate execution prevented.",
            "code": 409,
        }

    try:
        log_scheduler_event("SCHEDULE_TRIGGERED", schedule_id, actor_id=actor_id, run_id=run_id)
        log_scheduler_event("WORKFLOW_RUN_CREATED", schedule_id, actor_id=actor_id, run_id=run_id)

        # 3. Trigger Live Pipeline Orchestrator (Section 5)
        try:
            from scripts.run_live_pipeline import run_pipeline
        except ImportError:
            from run_live_pipeline import run_pipeline

        platform = scope.get("platform", "INSTAGRAM")
        content_type = scope.get("content_type", "REELS")

        # Execute pipeline with minimal delay for background automation
        # Notice resume_action is None -> strictly stops at WAITING_FOR_APPROVAL!
        pipeline_result = run_pipeline(
            delay=0.2,
            platform=platform,
            content_type=content_type,
            resume_action=None,  # STRICT: Halts at WAITING_FOR_APPROVAL
        )

        final_status = pipeline_result.get("status", "UNKNOWN")
        assert final_status == "WAITING_FOR_APPROVAL", f"Workflow must halt at WAITING_FOR_APPROVAL, got {final_status}"

        # 4. Update Schedule metadata
        all_scheds = load_all_schedules()
        target = next((s for s in all_scheds if s.get("scheduleId") == schedule_id), None)
        if target:
            target["lastRunAt"] = now_iso
            target["lastRunStatus"] = "WAITING_FOR_APPROVAL"
            target["retryCount"] = 0
            if target.get("cronExpression"):
                target["nextRunAt"] = compute_next_run(target["cronExpression"], now_kst).isoformat()
            sync_dual_schedules(all_scheds)

        return {
            "status": "SUCCESS",
            "run_id": pipeline_result.get("run_id"),
            "pipeline_status": final_status,
            "current_node": pipeline_result.get("current_node"),
            "records": pipeline_result.get("records"),
            "message": "Workflow pipeline initiated successfully and halted at Human Approval Gate (WAITING_FOR_APPROVAL).",
        }

    except Exception as err:
        log_scheduler_event(
            "SCHEDULE_FAILED",
            schedule_id,
            actor_id=actor_id,
            run_id=run_id,
            details={"error": str(err)}
        )
        # Apply Retry Policy (Section 9)
        all_scheds = load_all_schedules()
        target = next((s for s in all_scheds if s.get("scheduleId") == schedule_id), None)
        if target:
            target["lastRunAt"] = now_iso
            target["retryCount"] = target.get("retryCount", 0) + 1
            max_att = target.get("maxAttempts", 3)
            if target["retryCount"] < max_att:
                target["lastRunStatus"] = "FAILED_RETRYING"
                target["nextRetryAt"] = (now_kst + timedelta(minutes=5)).isoformat()
            else:
                target["lastRunStatus"] = "FAILED"
                target["nextRetryAt"] = None
            sync_dual_schedules(all_scheds)

        return {"status": "FAILED", "error": str(err)}

    finally:
        release_concurrency_lock()


def tick_scheduler() -> List[Dict[str, Any]]:
    """Evaluates all enabled schedules and executes any that are due."""
    schedules = load_all_schedules()
    now_kst = get_kst_now()
    results = []
    
    for s in schedules:
        if is_schedule_due(s, now_kst):
            print(f"⏰ [Scheduler Tick] Schedule '{s.get('name')}' is due! Executing...")
            res = execute_scheduled_workflow(s["scheduleId"], dry_run=False, actor_id="scheduler")
            results.append({"scheduleId": s["scheduleId"], "result": res})
            
    return results


# ==============================================================================
# CLI Entrypoint
# ==============================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GRAD EXHIBIT PRO Workflow Scheduler Engine")
    parser.add_argument("--tick", action="store_true", help="Evaluate all schedules and execute due jobs")
    parser.add_argument("--run-schedule", type=str, help="Manually run a specific schedule by ID (Run Now)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate execution without mutating pipeline")
    parser.add_argument("--list", action="store_true", help="List all configured schedules and next run times")
    parser.add_argument("--toggle", type=str, help="Toggle schedule ID")
    parser.add_argument("--enable", action="store_true", help="Enable toggle")
    parser.add_argument("--disable", action="store_true", help="Disable toggle")
    args = parser.parse_args()

    if args.list:
        scheds = load_all_schedules()
        print("=" * 85)
        print(f"📅 CONFIGURED WORKFLOW SCHEDULES (Asia/Seoul Time: {get_kst_now().strftime('%Y-%m-%d %H:%M:%S KST')})")
        print("=" * 85)
        for s in scheds:
            status_icon = "🟢" if s.get("enabled") else "⚪"
            print(f"{status_icon} [{s.get('scheduleId')}] {s.get('name')}")
            print(f"   Cron: {s.get('cronExpression')} | Timezone: {s.get('timezone')} | Last Status: {s.get('lastRunStatus')}")
            print(f"   Next Run (KST): {s.get('nextRunAt') or 'N/A'}")
        print("=" * 85)

    elif args.toggle:
        enabled = not args.disable
        updated = toggle_schedule_state(args.toggle, enabled, actor_id="cli")
        print(f"Schedule '{args.toggle}' enabled={updated.get('enabled') if updated else 'NOT_FOUND'}")

    elif args.run_schedule:
        print(f"🚀 Manually triggering schedule '{args.run_schedule}' (DryRun={args.dry_run})...")
        res = execute_scheduled_workflow(args.run_schedule, dry_run=args.dry_run, actor_id="admin_cli")
        print("Execution Result:", json.dumps(res, ensure_ascii=False, indent=2))

    elif args.tick:
        res = tick_scheduler()
        print(f"Scheduler tick evaluated. Triggered {len(res)} jobs.")
    else:
        parser.print_help()
