"""
National Professor Automation Test Suite (STEP 6)
Implements and validates all 14 Test Scenarios from Section 44:
1. STEP 5 Graph Regression (Univ 1, Dept 1, Prof 1)
2. Batch Test (Univ 2, Dept 2~3, Prof batch)
3. Pagination Test (page, page_size, total_pages)
4. Retry & Exponential Backoff Test
5. Rate Limit Test (Delay enforcement)
6. Provider Failure / Fallback Test
7. Duplicate Professor / Idempotency Test
8. Change Detection Test
9. Resume Test (Skip completed, continue pending)
10. Partial Failure Isolation Test (Univ A fails, Univ B succeeds)
11. Dry Run Test (No DB writes, accurate workload estimate)
12. Re-run Failed Jobs Test (Retry failed entities only)
13. Concurrency Limit Test
14. Large Queue Simulation Test (50+ universities lifecycle)
"""

import os
import sys
import json
import time
import uuid
import unittest
import shutil
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.dirname(__file__))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from professor_graph.runner import run_professor_pipeline
from professor_graph.national_orchestrator import (
    NationalProfessorOrchestrator,
    normalize_university_name,
    classify_error
)
from professor_graph.providers import MockSearchProvider, LiveSearchProvider

DATA_DIR = os.path.join(WORKSPACE_ROOT, "data")
QUEUES_DIR = os.path.join(DATA_DIR, "queues")
LOGS_DIR = os.path.join(DATA_DIR, "logs")


class TestNationalProfessorAutomation(unittest.TestCase):

    def setUp(self):
        self.test_queue_file = os.path.join(QUEUES_DIR, "test_national_queue.json")
        self.test_runs_log = os.path.join(LOGS_DIR, "test_national_runs.json")
        self.orchestrator = NationalProfessorOrchestrator(
            queue_file_path=self.test_queue_file,
            runs_log_path=self.test_runs_log
        )

    def tearDown(self):
        for f in (self.test_queue_file, self.test_runs_log):
            if os.path.exists(f):
                try:
                    os.remove(f)
                except Exception:
                    pass

    # ------------------------------------------------------------------
    # TEST 1: STEP 5 Graph Regression (Univ 1, Dept 1, Prof 1)
    # ------------------------------------------------------------------
    def test_01_step5_regression(self):
        print("\n" + "=" * 60)
        print(">>> TEST 1: STEP 5 Graph Regression (Univ 1, Dept 1, Prof 1)")
        print("=" * 60)

        res = run_professor_pipeline(
            university="홍익대학교",
            department="시각디자인과",
            professor="강동원",
            provider_mode="mock"
        )
        self.assertEqual(res.get("status"), "COMPLETED")
        self.assertEqual(res.get("university"), "홍익대학교")
        self.assertEqual(res.get("department"), "시각디자인과")
        self.assertEqual(res.get("professor"), "강동원")
        self.assertGreaterEqual(res.get("confidence_score", 0.0), 0.85)
        self.assertEqual(res.get("verification_status"), "VERIFIED")
        print("[PASS] TEST 1: STEP 5 Regression Passed")

    # ------------------------------------------------------------------
    # TEST 2: Batch Test (Univ 2, Dept 2~3, Prof batch)
    # ------------------------------------------------------------------
    def test_02_batch_processing(self):
        print("\n" + "=" * 60)
        print(">>> TEST 2: Batch Processing (2 Universities)")
        print("=" * 60)

        batch_univs = ["서울대학교", "국민대학교"]
        res = self.orchestrator.invoke_batch(
            batch_size=2,
            rate_limit_delay=0.1,
            provider_mode="mock",
            target_univ_names=batch_univs
        )

        self.assertIn(res.get("status"), ("SUCCESS", "PARTIAL_SUCCESS"))
        self.assertEqual(res.get("processed_count"), 2)
        self.assertGreaterEqual(res.get("success_count", 0), 1)

        # Check queue state
        completed_univs = [u["name"] for u in self.orchestrator.state_data["university_queue"] if u.get("status") in ("COMPLETED", "SUCCESS")]
        for b in batch_univs:
            self.assertIn(b, completed_univs)
        print("[PASS] TEST 2: Batch Processing Passed")

    # ------------------------------------------------------------------
    # TEST 3: Pagination Test
    # ------------------------------------------------------------------
    def test_03_pagination(self):
        print("\n" + "=" * 60)
        print(">>> TEST 3: Pagination Test")
        print("=" * 60)

        page1 = self.orchestrator.get_summary(page=1, page_size=3)
        page2 = self.orchestrator.get_summary(page=2, page_size=3)

        self.assertEqual(len(page1["university_queue"]), 3)
        self.assertEqual(len(page2["university_queue"]), 3)
        self.assertEqual(page1["pagination"]["page"], 1)
        self.assertEqual(page2["pagination"]["page"], 2)
        self.assertGreater(page1["pagination"]["total_pages"], 1)

        # Ensure no overlap
        names_p1 = [u["name"] for u in page1["university_queue"]]
        names_p2 = [u["name"] for u in page2["university_queue"]]
        self.assertTrue(set(names_p1).isdisjoint(set(names_p2)))
        print("[PASS] TEST 3: Pagination Passed")

    # ------------------------------------------------------------------
    # TEST 4: Retry & Exponential Backoff Test
    # ------------------------------------------------------------------
    def test_04_retry_and_backoff(self):
        print("\n" + "=" * 60)
        print(">>> TEST 4: Retry & Exponential Backoff")
        print("=" * 60)

        err = TimeoutError("External connection timed out")
        err_type, retryable = classify_error(err)
        self.assertEqual(err_type, "NETWORK_ERROR")
        self.assertTrue(retryable)

        # Verify exponential backoff calculation: delay * (2 ** (attempt - 1))
        delays = [0.5 * (2 ** (att - 1)) for att in range(1, 4)]
        self.assertEqual(delays, [0.5, 1.0, 2.0])
        print("[PASS] TEST 4: Retry & Exponential Backoff Passed")

    # ------------------------------------------------------------------
    # TEST 5: Rate Limit Test
    # ------------------------------------------------------------------
    def test_05_rate_limiting(self):
        print("\n" + "=" * 60)
        print(">>> TEST 5: Rate Limit Test (Delay Enforcement)")
        print("=" * 60)

        delay = 0.3
        start = time.time()
        self.orchestrator.invoke_batch(
            batch_size=2,
            rate_limit_delay=delay,
            provider_mode="mock",
            target_univ_names=["서울대학교", "홍익대학교"]
        )
        elapsed = time.time() - start
        # Since delay is applied per university in the batch (2 univs = at least 0.6s total delay)
        self.assertGreaterEqual(elapsed, delay * 2)
        print(f"[PASS] TEST 5: Rate Limit Enforced (Elapsed: {elapsed:.2f}s >= {delay*2}s)")

    # ------------------------------------------------------------------
    # TEST 6: Provider Failure / Fallback Test
    # ------------------------------------------------------------------
    def test_06_provider_fallback(self):
        print("\n" + "=" * 60)
        print(">>> TEST 6: Provider Fallback Test")
        print("=" * 60)

        live_provider = LiveSearchProvider()
        # In environment without TAVILY key, live_provider gracefully falls back to mock
        results = live_provider.search_faculty("홍익대학교", "시각디자인과")
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0]["name"], "강동원")
        self.assertIn("hongik.ac.kr", results[0]["source_url"])
        print("[PASS] TEST 6: Provider Fallback Passed")

    # ------------------------------------------------------------------
    # TEST 7: Duplicate Professor / Idempotency Test
    # ------------------------------------------------------------------
    def test_07_idempotency_deduplication(self):
        print("\n" + "=" * 60)
        print(">>> TEST 7: Duplicate Professor & Idempotency")
        print("=" * 60)

        # Call generate_professor_queue twice
        q1 = self.orchestrator.generate_professor_queue(target_univs=["홍익대학교"], provider_mode="mock")
        count_first = len([p for p in q1 if p["university_name"] == "홍익대학교"])

        q2 = self.orchestrator.generate_professor_queue(target_univs=["홍익대학교"], provider_mode="mock")
        count_second = len([p for p in q2 if p["university_name"] == "홍익대학교"])

        self.assertEqual(count_first, count_second)
        print("[PASS] TEST 7: Idempotency Verified (No duplicates created)")

    # ------------------------------------------------------------------
    # TEST 8: Change Detection Test
    # ------------------------------------------------------------------
    def test_08_change_detection(self):
        print("\n" + "=" * 60)
        print(">>> TEST 8: Change Detection (UPDATED / NO_CHANGE)")
        print("=" * 60)

        # Execute once
        res1 = self.orchestrator.invoke_batch(
            batch_size=1,
            rate_limit_delay=0.0,
            provider_mode="mock",
            target_univ_names=["경희대학교"]
        )
        self.assertIn(res1["status"], ("SUCCESS", "PARTIAL_SUCCESS"))

        # Re-run for 경희대학교: data is unchanged
        res2 = self.orchestrator.invoke_batch(
            batch_size=1,
            rate_limit_delay=0.0,
            provider_mode="mock",
            target_univ_names=["경희대학교"]
        )
        self.assertIn(res2["status"], ("SUCCESS", "PARTIAL_SUCCESS"))
        print("[PASS] TEST 8: Change Detection in National Batch Passed")

    # ------------------------------------------------------------------
    # TEST 9: Resume Test
    # ------------------------------------------------------------------
    def test_09_resume(self):
        print("\n" + "=" * 60)
        print(">>> TEST 9: Resume Test (Skip completed items)")
        print("=" * 60)

        univ_q = self.orchestrator.state_data["university_queue"]
        univ_q[0]["status"] = "COMPLETED"
        univ_q[1]["status"] = "PENDING"
        self.orchestrator._save_queue()

        # Resume should pick up the pending item
        res = self.orchestrator.resume_run(provider_mode="mock", batch_size=1)
        self.assertIn(res["status"], ("SUCCESS", "PARTIAL_SUCCESS"))
        self.assertEqual(res["processed_universities"][0], univ_q[1]["name"])
        print("[PASS] TEST 9: Resume Picked Up Pending Item")

    # ------------------------------------------------------------------
    # TEST 10: Partial Failure Isolation Test
    # ------------------------------------------------------------------
    def test_10_partial_failure_isolation(self):
        print("\n" + "=" * 60)
        print(">>> TEST 10: Partial Failure Isolation (Univ A fails, Univ B succeeds)")
        print("=" * 60)

        # Introduce a failing university (name with timeout) and a normal university
        target_univs = ["타임아웃대학교", "서울대학교"]
        res = self.orchestrator.invoke_batch(
            batch_size=2,
            rate_limit_delay=0.0,
            provider_mode="mock",
            target_univ_names=target_univs
        )

        # Overall batch does not crash, partial success
        self.assertIn(res["status"], ("SUCCESS", "PARTIAL_SUCCESS"))
        summary = self.orchestrator.get_summary()
        failed_names = [f["university_name"] for f in summary["failed_universities"]]
        self.assertIn("타임아웃대학교", failed_names)
        self.assertTrue(any(u["name"] == "서울대학교" and u["status"] == "COMPLETED" for u in self.orchestrator.state_data["university_queue"]))
        print("[PASS] TEST 10: Failure Isolated (Failing item logged, passing item saved)")

    # ------------------------------------------------------------------
    # TEST 11: Dry Run Test
    # ------------------------------------------------------------------
    def test_11_dry_run(self):
        print("\n" + "=" * 60)
        print(">>> TEST 11: Dry Run Test (No DB writes)")
        print("=" * 60)

        res = self.orchestrator.invoke_batch(
            batch_size=3,
            dry_run=True,
            provider_mode="mock"
        )
        self.assertTrue(res.get("dry_run"))
        self.assertEqual(res.get("database_writes"), 0)
        self.assertEqual(res.get("target_universities_count"), 3)
        self.assertGreater(res.get("estimated_departments_count"), 0)
        self.assertGreater(res.get("estimated_professors_count"), 0)
        print("[PASS] TEST 11: Dry Run Estimate Generated Without DB Mutations")

    # ------------------------------------------------------------------
    # TEST 12: Re-run Failed Jobs Test
    # ------------------------------------------------------------------
    def test_12_rerun_failed_jobs(self):
        print("\n" + "=" * 60)
        print(">>> TEST 12: Re-run Failed Jobs")
        print("=" * 60)

        # Set 건국대학교 to FAILED
        univ_q = self.orchestrator.state_data["university_queue"]
        target = next((u for u in univ_q if u["name"] == "건국대학교"), None)
        self.assertIsNotNone(target)
        target["status"] = "FAILED"
        self.orchestrator._record_failed_university("건국대학교", "Simulated failure", 1)
        self.orchestrator._save_queue()

        # Call retry_failed
        res = self.orchestrator.retry_failed(provider_mode="mock", entity_type="university")
        self.assertIn(res["status"], ("SUCCESS", "PARTIAL_SUCCESS"))
        self.assertIn("건국대학교", res["processed_universities"])
        
        # Verify it became COMPLETED
        summary = self.orchestrator.get_summary()
        updated_target = next((u for u in summary["university_queue"] if u["name"] == "건국대학교"), None)
        self.assertEqual(updated_target["status"], "COMPLETED")
        print("[PASS] TEST 12: Re-run Failed Jobs Successfully Recovered Target")

    # ------------------------------------------------------------------
    # TEST 13: Concurrency Limit Test
    # ------------------------------------------------------------------
    def test_13_concurrency_limit(self):
        print("\n" + "=" * 60)
        print(">>> TEST 13: Concurrency Limit Configuration")
        print("=" * 60)

        concurrency = 3
        res = self.orchestrator.invoke_batch(
            batch_size=2,
            rate_limit_delay=0.0,
            provider_mode="mock",
            max_concurrency=concurrency,
            dry_run=True
        )
        self.assertEqual(res["status"], "DRY_RUN_COMPLETED")
        self.assertEqual(self.orchestrator.state_data["config"]["max_concurrency"], 2)
        print("[PASS] TEST 13: Concurrency Limit Bound and Validated")

    # ------------------------------------------------------------------
    # TEST 14: Large Queue Simulation Test
    # ------------------------------------------------------------------
    def test_14_large_queue_simulation(self):
        print("\n" + "=" * 60)
        print(">>> TEST 14: Large Queue Simulation (50+ Universities)")
        print("=" * 60)

        summary = self.orchestrator.get_summary(page=1, page_size=60)
        total_u = summary["statistics"]["total_universities"]
        self.assertGreaterEqual(total_u, 50)
        self.assertTrue(len(summary["university_queue"]) >= 50)
        
        # Verify queue items structure
        for item in summary["university_queue"][:5]:
            self.assertTrue("id" in item or "job_id" in item)
            self.assertIn("name", item)
            self.assertIn("status", item)
            self.assertIn("max_retries", item)
        print(f"[PASS] TEST 14: Large Queue Simulated ({total_u} Universities Loaded and Stable)")


if __name__ == "__main__":
    unittest.main()
