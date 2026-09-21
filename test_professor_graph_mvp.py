import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
"""
Professor Intelligence Graph MVP Test Suite
Verifies all 8 Test Scenarios as required by STEP 5:
1. Normal E2E execution (1 Univ -> 1 Dept -> 1 Prof)
2. Unverified source handling (Non-official / missing source blocked from DB)
3. Deduplication (Same university+department+name merged)
4. Change Detection - UPDATED (Modified fields increment version and list diffs)
5. Change Detection - NO_CHANGE (Identical data preserves version without overwrite)
6. Provider Timeout & Retry (Simulated network timeout handled gracefully)
7. Mid-workflow failure handling (Graceful degradation on error)
8. Checkpoint resume (State persistence and thread_id resumption with MemorySaver)
"""

import os
import json
import uuid
import unittest
from datetime import datetime

from langgraph.checkpoint.memory import MemorySaver
from professor_graph.state import ProfessorGraphState
from professor_graph.graph import build_professor_graph, app
from professor_graph.runner import run_professor_pipeline
from professor_graph.nodes import (
    university_discovery,
    department_discovery,
    professor_discovery,
    official_source_validation,
    professor_information_extraction,
    semester_core_task_extraction,
    industry_collaboration_extraction,
    student_portfolio_matching,
    normalization,
    confidence_evaluation,
    deduplication,
    change_detection,
    database_update,
    run_logging
)

WORKSPACE_ROOT = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(WORKSPACE_ROOT, "data")
PLATFORM_DATA_DIR = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data")
LOGS_DIR = os.path.join(DATA_DIR, "logs")


class TestProfessorIntelligenceGraphMVP(unittest.TestCase):

    def setUp(self):
        # Backup or ensure clean state if needed
        self.professors_file = os.path.join(DATA_DIR, "professors.json")
        self.platform_professors_file = os.path.join(PLATFORM_DATA_DIR, "professors.json")
        self.runs_log_file = os.path.join(LOGS_DIR, "professor_runs.json")

    # ------------------------------------------------------------------
    # Test 1: Normal E2E execution (1 Univ -> 1 Dept -> 1 Prof)
    # ------------------------------------------------------------------
    def test_01_normal_e2e_execution(self):
        print("\n" + "=" * 60)
        print(">>> TEST 1: Normal E2E Execution (1 Univ -> 1 Dept -> 1 Prof)")
        print("=" * 60)

        result = run_professor_pipeline(
            university="홍익대학교",
            department="시각디자인과",
            professor="강동원",
            provider_mode="mock"
        )

        # 1. 14 node workflow completion
        self.assertEqual(result.get("status"), "COMPLETED")
        self.assertEqual(result.get("current_node"), "run_logging")

        # 2. Single target verification
        self.assertEqual(result.get("university"), "홍익대학교")
        self.assertEqual(result.get("department"), "시각디자인과")
        self.assertEqual(result.get("professor"), "강동원")

        # 3. Official Source Validation
        self.assertTrue(len(result.get("validated_candidates", [])) >= 1)
        val_cand = result["validated_candidates"][0]
        self.assertTrue(val_cand["is_official_domain"])
        self.assertIn("hongik.ac.kr", val_cand["source_url"])

        # 4. Profile Extraction
        self.assertTrue(len(result.get("extracted_professors", [])) >= 1)
        prof = result["extracted_professors"][0]
        self.assertEqual(prof["name"], "강동원")
        self.assertTrue(bool(prof.get("research_areas")))

        # 5. Semester Core Task & Industry Collaboration & Portfolio
        self.assertIsNotNone(result.get("semester_data"))
        self.assertTrue(len(result.get("industry_collaboration", [])) >= 1)
        self.assertTrue(len(result.get("student_matches", [])) >= 1)

        # 6. Normalization & Confidence Evaluation
        norm = result.get("normalized_data")
        self.assertIsNotNone(norm)
        self.assertEqual(norm.get("university"), "홍익대학교")

        score = result.get("confidence_score", 0.0)
        verif = result.get("verification_status")
        self.assertGreaterEqual(score, 0.85)
        self.assertEqual(verif, "VERIFIED")

        # 7. Database Update check
        db_res = result.get("database_result", {})
        self.assertTrue(db_res.get("persisted"))

        # Verify physical file update
        with open(self.professors_file, "r", encoding="utf-8") as f:
            all_profs = json.load(f)
        saved_names = [p["name"] for p in all_profs]
        self.assertIn("강동원", saved_names)

        # 8. Run log check
        summary = result.get("run_summary", {})
        self.assertEqual(summary.get("status"), "SUCCESS")
        self.assertTrue(os.path.exists(self.runs_log_file))

        print("[PASS] TEST 1 PASSED: 14 Nodes, Confidence >= 0.85, DB Saved, Logged.")

    # ------------------------------------------------------------------
    # Test 2: Unverified source handling
    # ------------------------------------------------------------------
    def test_02_unverified_source_handling(self):
        print("\n" + "=" * 60)
        print(">>> TEST 2: Unverified Source Handling (Blog / Non-official)")
        print("=" * 60)

        # Simulate candidate with non-official blog URL
        test_state: ProfessorGraphState = {
            "thread_id": "test-unverified-thread",
            "run_id": "test-unverified-run",
            "started_at": datetime.now().isoformat(),
            "provider_mode": "mock",
            "university": "미인증대학교",
            "department": "임의학과",
            "professor": "김가짜",
            "retry_count": 2, # max retries reached
            "max_retries": 2,
            "errors": [],
            "status": "INITIATED",
            "current_step": "START",
            "discovered_candidates": [{
                "candidate_id": "fake-cand-1",
                "name": "김가짜",
                "university": "미인증대학교",
                "department": "임의학과",
                "title": "강사",
                "source_url": "https://blog.naver.com/fake_prof_blog/123",
                "source_domain": "blog.naver.com",
                "is_official_domain": False,
                "evidence_text": "개인 블로그 글",
                "confidence_score": 0.2,
                "raw_data": {}
            }],
            "validated_candidates": [],
            "unverified_candidates": [],
            "extracted_professors": [],
            "matched_professors": [],
            "deduplicated_professors": [],
            "change_report": {"new": [], "updated": [], "unchanged": []},
            "final_saved_professors": [],
            "run_summary": {}
        }

        # Step 1: Validation
        val_res = official_source_validation(test_state)
        self.assertEqual(len(val_res["validated_candidates"]), 0)
        self.assertEqual(len(val_res["unverified_candidates"]), 1)
        self.assertEqual(val_res["verification_status"], "UNVERIFIED")

        # Step 2: Ensure database_update blocks unverified candidate
        test_state.update(val_res)
        test_state["final_saved_professors"] = val_res["unverified_candidates"]
        db_res = database_update(test_state)

        self.assertFalse(db_res["database_result"]["persisted"])
        self.assertEqual(db_res["database_result"]["reason"], "UNVERIFIED_STATUS_BLOCKED")

        print("[PASS] TEST 2 PASSED: Non-official domain strictly quarantined, DB persistence blocked.")

    # ------------------------------------------------------------------
    # Test 3: Deduplication
    # ------------------------------------------------------------------
    def test_03_deduplication(self):
        print("\n" + "=" * 60)
        print(">>> TEST 3: Deduplication (Merge duplicate records)")
        print("=" * 60)

        duplicate_state: ProfessorGraphState = {
            "matched_professors": [
                {
                    "id": "prof-hongik-kangdongwon-1",
                    "name": "강동원",
                    "university": "홍익대학교",
                    "department": "시각디자인과",
                    "confidence_score": 0.88,
                    "research_areas": ["UX 디자인"]
                },
                {
                    "id": "prof-hongik-kangdongwon-2",
                    "name": "강동원",
                    "university": "홍익대학교",
                    "department": "시각디자인과",
                    "confidence_score": 0.96, # Higher confidence
                    "research_areas": ["UX 디자인", "인터랙션 디자인"]
                }
            ]
        }

        res = deduplication(duplicate_state)
        deduped = res.get("deduplicated_professors", [])
        self.assertEqual(len(deduped), 1)
        self.assertEqual(deduped[0]["confidence_score"], 0.96)
        self.assertEqual(res["deduplication_result"]["duplicates_merged"], 1)

        print("[PASS] TEST 3 PASSED: Duplicate records resolved to highest confidence single record.")

    # ------------------------------------------------------------------
    # Test 4: Change Detection - UPDATED
    # ------------------------------------------------------------------
    def test_04_change_detection_updated(self):
        print("\n" + "=" * 60)
        print(">>> TEST 4: Change Detection - UPDATED (Increment version & diffs)")
        print("=" * 60)

        # Prepare a candidate that already exists in DB but has modified assignment
        incoming_candidate = {
            "id": "prof-hongik-kangdongwon",
            "name": "강동원",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "assignment_details": {
                "title": "2026학년도 2학기 혁신 디자인 캡스톤 (NEW)",
                "objective": "차세대 모빌리티 AI 인터페이스"
            },
            "research_areas": ["모빌리티 UX", "생성형 AI 디자인"],
            "version": 1
        }

        test_state: ProfessorGraphState = {
            "deduplicated_professors": [incoming_candidate]
        }

        res = change_detection(test_state)
        change_res = res.get("change_detection_result", {})
        
        self.assertEqual(change_res.get("status"), "UPDATED")
        self.assertIn("assignment_details", change_res.get("diff_fields", []))
        self.assertGreater(change_res.get("version"), 1)

        print(f"[PASS] TEST 4 PASSED: Detected UPDATED status, version={change_res.get('version')}, diff_fields={change_res.get('diff_fields')}")

    # ------------------------------------------------------------------
    # Test 5: Change Detection - NO_CHANGE
    # ------------------------------------------------------------------
    def test_05_change_detection_no_change(self):
        print("\n" + "=" * 60)
        print(">>> TEST 5: Change Detection - NO_CHANGE (Preserve version)")
        print("=" * 60)

        # Load existing record from DB
        with open(self.professors_file, "r", encoding="utf-8") as f:
            all_profs = json.load(f)
        
        target_prof = None
        for p in all_profs:
            if p.get("name") == "강동원" and p.get("university") == "홍익대학교":
                target_prof = dict(p)
                break
        
        self.assertIsNotNone(target_prof, "Existing professor required for test 5")

        test_state: ProfessorGraphState = {
            "deduplicated_professors": [target_prof]
        }

        res = change_detection(test_state)
        change_res = res.get("change_detection_result", {})

        self.assertEqual(change_res.get("status"), "NO_CHANGE")
        self.assertEqual(len(change_res.get("diff_fields", [])), 0)

        print("[PASS] TEST 5 PASSED: Detected NO_CHANGE status, preserved existing record intact.")

    # ------------------------------------------------------------------
    # Test 6: Provider Timeout & Retry
    # ------------------------------------------------------------------
    def test_06_provider_timeout_and_retry(self):
        print("\n" + "=" * 60)
        print(">>> TEST 6: Provider Timeout & Retry (Simulated timeout caught)")
        print("=" * 60)

        test_state: ProfessorGraphState = {
            "university": "홍익대학교",
            "department": "시각디자인과",
            "professor": "강동원",
            "simulate_timeout": True, # Triggers timeout
            "provider_mode": "mock",
            "retry_count": 0,
            "errors": []
        }

        res = professor_discovery(test_state)
        self.assertEqual(res.get("status"), "PROVIDER_TIMEOUT")
        self.assertEqual(res.get("retry_count"), 1)
        self.assertTrue(any("TimeoutError" in err for err in res.get("errors", [])))

        print("[PASS] TEST 6 PASSED: Simulated timeout properly trapped, retry_count incremented.")

    # ------------------------------------------------------------------
    # Test 7: Mid-workflow failure handling
    # ------------------------------------------------------------------
    def test_07_mid_workflow_failure_handling(self):
        print("\n" + "=" * 60)
        print(">>> TEST 7: Mid-workflow Failure Handling (Graceful degradation)")
        print("=" * 60)

        # Pass malformed state to normalization node
        malformed_state: ProfessorGraphState = {
            "matched_professors": [
                {
                    # missing name, department, url
                    "university": "홍익대",
                }
            ]
        }

        res = normalization(malformed_state)
        self.assertEqual(res.get("status"), "NORMALIZED")
        self.assertEqual(res["normalized_data"]["university"], "홍익대학교")

        print("[PASS] TEST 7 PASSED: Incomplete/malformed input normalized without raising unhandled exception.")

    # ------------------------------------------------------------------
    # Test 8: Checkpoint Resume (MemorySaver & thread_id)
    # ------------------------------------------------------------------
    def test_08_checkpoint_resume(self):
        print("\n" + "=" * 60)
        print(">>> TEST 8: Checkpoint Resume (LangGraph MemorySaver)")
        print("=" * 60)

        memory = MemorySaver()
        graph = build_professor_graph(checkpointer=memory)

        thread_id = f"test-thread-{uuid.uuid4().hex[:6]}"
        config = {"configurable": {"thread_id": thread_id}}

        initial_state: ProfessorGraphState = {
            "thread_id": thread_id,
            "run_id": f"run-chk-{uuid.uuid4().hex[:6]}",
            "started_at": datetime.now().isoformat(),
            "provider_mode": "mock",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "professor": "강동원",
            "retry_count": 0,
            "max_retries": 2,
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

        # First run with checkpointer
        final_state = graph.invoke(initial_state, config=config)
        self.assertEqual(final_state.get("status"), "COMPLETED")

        # Verify state can be retrieved from checkpoint
        saved_state = graph.get_state(config)
        self.assertIsNotNone(saved_state)
        self.assertEqual(saved_state.values.get("status"), "COMPLETED")
        self.assertEqual(saved_state.values.get("professor"), "강동원")

        print(f"[PASS] TEST 8 PASSED: State successfully persisted and verified via checkpointer (thread: {thread_id}).")


if __name__ == "__main__":
    unittest.main()
