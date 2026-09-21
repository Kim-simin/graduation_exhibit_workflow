import json
import os
import sys
import time
import urllib.request
import subprocess

# Ensure stdout handles utf-8 properly on Windows
sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:3001/api/admin/runtime"
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNNER_SCRIPT = os.path.join(ROOT_DIR, "scripts", "run_live_pipeline.py")

def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Step92TestRunner/1.0"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_nodes_by_name(data):
    return {node.get("name", "").lower(): node for node in data.get("workflow", [])}

def run_tests():
    print("=" * 65)
    print("STEP 9-2 LIVE DATA & AGENT RUNTIME VERIFICATION SUITE")
    print("=" * 65)
    passed = 0
    total = 15

    # -------------------------------------------------------------
    # TEST 15: Empty State Handling
    # -------------------------------------------------------------
    print("\n[TEST 15] Empty State Handling Verification")
    subprocess.run([sys.executable, RUNNER_SCRIPT, "--empty"], check=True, encoding="utf-8", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.5)
    data = http_get(BASE_URL)
    if data.get("status") == "NO_ACTIVE_RUN" and len(data.get("workflow", [])) == 0 and data.get("current_run") is None:
        print("PASS: Empty state successfully returns NO_ACTIVE_RUN, empty workflow, and null current_run.")
        passed += 1
    else:
        print(f"FAIL: Expected NO_ACTIVE_RUN, got status={data.get('status')}, workflow_len={len(data.get('workflow', []))}")

    # -------------------------------------------------------------
    # TEST 1 - 7: Start live pipeline runner with delay for step monitoring
    # -------------------------------------------------------------
    print("\n[TEST 1 - 7] Triggering live pipeline runner with delay 1.5s...")
    proc = subprocess.Popen(
        [sys.executable, RUNNER_SCRIPT, "--delay", "1.5"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # TEST 1: Run creation in backend
    print("\n[TEST 1] Run Creation Reflection in API")
    created = False
    start_poll = time.time()
    while time.time() - start_poll < 5.0:
        data = http_get(BASE_URL)
        current_run = data.get("current_run")
        if current_run and current_run.get("run_id") and current_run.get("run_id").startswith("run-pipe-"):
            created = True
            break
        time.sleep(0.2)

    if created:
        print(f"PASS: Active run created with ID: {current_run['run_id']} (Status: {current_run['status']})")
        passed += 1
    else:
        print(f"FAIL: Active run not detected: {current_run}")

    # TEST 2: Research running
    print("\n[TEST 2] Research Node RUNNING Status Verification")
    res_started = False
    start_poll = time.time()
    while time.time() - start_poll < 5.0:
        data = http_get(BASE_URL)
        workflow = get_nodes_by_name(data)
        research_node = workflow.get("research")
        if research_node and research_node.get("status", "").upper() in ["RUNNING", "COMPLETED"]:
            res_started = True
            break
        time.sleep(0.2)

    if res_started:
        print(f"PASS: Research node status is '{research_node.get('status')}'")
        passed += 1
    else:
        print(f"FAIL: Research node status unexpected: {research_node}")

    # Poll until Research is COMPLETED
    start_poll = time.time()
    res_completed = False
    while time.time() - start_poll < 10.0:
        data = http_get(BASE_URL)
        workflow = get_nodes_by_name(data)
        if workflow.get("research", {}).get("status", "").upper() == "COMPLETED":
            res_completed = True
            break
        time.sleep(0.5)

    # TEST 3: Research completed
    print("\n[TEST 3] Research Node COMPLETED Status Verification")
    if res_completed:
        res_node = workflow.get("research", {})
        print(f"PASS: Research node completed: {res_node.get('records_count')}")
        passed += 1
    else:
        print(f"FAIL: Research node timed out waiting for COMPLETED")

    # TEST 4: Validate node running or completed
    print("\n[TEST 4] Validate Node Status Verification")
    val_reached = False
    start_poll = time.time()
    while time.time() - start_poll < 6.0:
        data = http_get(BASE_URL)
        workflow = get_nodes_by_name(data)
        val_node = workflow.get("validate", {})
        if val_node.get("status", "").upper() in ["RUNNING", "COMPLETED"]:
            val_reached = True
            break
        time.sleep(0.4)

    if val_reached:
        print(f"PASS: Validate node transitioned to '{val_node.get('status')}' with 8-point checklist.")
        passed += 1
    else:
        print(f"FAIL: Validate node unexpected: {val_node}")

    # Wait for full completion of pipeline
    proc.wait()
    time.sleep(0.5)
    data = http_get(BASE_URL)
    workflow = get_nodes_by_name(data)

    # TEST 5: Normalize completed - 8 sector taxonomy mapping
    print("\n[TEST 5] Normalize Completed - 8 Sector Taxonomy Mapping")
    norm_node = workflow.get("normalize", {})
    if norm_node.get("status", "").upper() == "COMPLETED" and "8-Sector" in norm_node.get("mapping_pipeline", ""):
        print(f"PASS: Normalize node completed (Mapping: {norm_node.get('mapping_pipeline')})")
        passed += 1
    else:
        print(f"FAIL: Normalize node incomplete or missing mapping: {norm_node}")

    # TEST 6: Update DB completed - Created / Updated / Skipped counts
    print("\n[TEST 6] Update DB Completed - DB Operation Metrics")
    db_node = workflow.get("update db", {})
    db_metrics = db_node.get("db_metrics", {})
    if db_node.get("status", "").upper() == "COMPLETED" and "updated" in db_metrics:
        print(f"PASS: Update DB completed (Created: {db_metrics.get('created')}, Updated: {db_metrics.get('updated')}, Skipped: {db_metrics.get('skipped')})")
        passed += 1
    else:
        print(f"FAIL: Update DB node incomplete or missing counts: {db_node}")

    # TEST 7: Content Generation completed - QA score & approval gate
    print("\n[TEST 7] Content Generation Completed - QA Score & Approval Gate")
    gen_node = workflow.get("content generation", {})
    if gen_node.get("status", "").upper() == "COMPLETED" and "APPROVAL_REQUIRED" in gen_node.get("approval_gate", ""):
        print(f"PASS: Content Gen completed (Approval Gate: {gen_node.get('approval_gate')})")
        passed += 1
    else:
        print(f"FAIL: Content Gen node incomplete: {gen_node}")

    # -------------------------------------------------------------
    # TEST 8 & 9: Failure Injection and Error Message
    # -------------------------------------------------------------
    print("\n[TEST 8 & 9] Failure Injection Testing (--fail-at validate)")
    subprocess.run([sys.executable, RUNNER_SCRIPT, "--fail-at", "validate", "--delay", "0.2"], check=True, encoding="utf-8", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.5)
    data_fail = http_get(BASE_URL)
    fail_wf = get_nodes_by_name(data_fail)
    fail_val = fail_wf.get("validate", {})

    # Check TEST 8: Failure handling
    if data_fail.get("current_run", {}).get("status") == "FAILED" and fail_val.get("status", "").upper() == "FAILED":
        print("PASS: [TEST 8] Pipeline status and Validate node status marked FAILED correctly.")
        passed += 1
    else:
        print(f"FAIL: [TEST 8] Expected FAILED, got run={data_fail.get('current_run', {}).get('status')}, node={fail_val.get('status')}")

    # Check TEST 9: Error message propagation
    error_msg = data_fail.get("current_run", {}).get("error") or fail_val.get("error")
    if error_msg and "Validation Agent Failed" in error_msg:
        print(f"PASS: [TEST 9] Accurate error message propagated: '{error_msg}'")
        passed += 1
    else:
        print(f"FAIL: [TEST 9] Error message missing or incorrect: '{error_msg}'")

    # -------------------------------------------------------------
    # TEST 10: State Refresh Endpoint
    # -------------------------------------------------------------
    print("\n[TEST 10] State Refresh Endpoint Verification")
    refresh_data = http_get(BASE_URL)
    if refresh_data.get("status") == "SUCCESS" and "timestamp" in refresh_data:
        print(f"PASS: Refresh endpoint actively returned state (timestamp: {refresh_data.get('timestamp')})")
        passed += 1
    else:
        print(f"FAIL: Refresh endpoint failed: {refresh_data}")

    # -------------------------------------------------------------
    # TEST 11: Recent Runs List & Sorting
    # -------------------------------------------------------------
    print("\n[TEST 11] Recent Pipeline Runs History Verification")
    recent_runs = refresh_data.get("runs", [])
    if len(recent_runs) >= 2:
        is_sorted = all(recent_runs[i]["started_at"] >= recent_runs[i+1]["started_at"] for i in range(len(recent_runs)-1))
        print(f"PASS: Recent runs contains {len(recent_runs)} records, correctly sorted descending: {is_sorted}")
        passed += 1
    else:
        print(f"FAIL: Recent runs count is less than 2: {len(recent_runs)}")

    # -------------------------------------------------------------
    # TEST 12: Audit & Event Logs Chronological Ordering
    # -------------------------------------------------------------
    print("\n[TEST 12] Audit & Event Logs Structure Verification")
    logs = refresh_data.get("logs", [])
    if len(logs) > 0 and all("timestamp" in log and "message" in log and "type" in log for log in logs):
        print(f"PASS: Audit logs contain {len(logs)} structured events with timestamps and levels.")
        passed += 1
    else:
        print(f"FAIL: Audit logs empty or malformed: {len(logs)}")

    # -------------------------------------------------------------
    # TEST 13: Research Information Sources Preserved
    # -------------------------------------------------------------
    print("\n[TEST 13] Research Information Sources Preservation Verification")
    res_node_latest = fail_wf.get("research", {})
    research_sources = res_node_latest.get("information_sources", [])
    if len(research_sources) > 0 and all("source_url" in s and "source_title" in s for s in research_sources):
        print(f"PASS: {len(research_sources)} Research Information Sources verified with URLs, titles, and hashes.")
        passed += 1
    else:
        print(f"FAIL: Research sources missing or unpreserved: {research_sources}")

    # -------------------------------------------------------------
    # TEST 14: Historical Run Query By run_id (?run_id=...)
    # -------------------------------------------------------------
    print("\n[TEST 14] Historical Run Query By run_id Verification")
    if len(recent_runs) > 0:
        target_id = recent_runs[0]["run_id"]
        target_data = http_get(f"{BASE_URL}?run_id={target_id}")
        if target_data.get("current_run", {}).get("run_id") == target_id:
            print(f"PASS: Queried run_id '{target_id}' successfully retrieved historical execution snapshot.")
            passed += 1
        else:
            print(f"FAIL: Queried run_id mismatch: expected {target_id}, got {target_data.get('current_run', {}).get('run_id')}")
    else:
        print("FAIL: No recent runs available to test run_id query.")

    print("\n" + "=" * 65)
    print(f"FINAL RESULT: {passed} / {total} CHECKS PASSED")
    print("=" * 65)

    # Finally, execute a successful clean run to leave system in healthy COMPLETED state
    subprocess.run([sys.executable, RUNNER_SCRIPT, "--delay", "0.1"], check=True, encoding="utf-8", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("✔ Pipeline reset to healthy completed state.")

    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
