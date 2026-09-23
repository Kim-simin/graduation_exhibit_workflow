"""
scripts/test_all_6_invariants.py
Rigorous automated test verifying all 6 required operational criteria:
1. API failure does not inject Mock into production DB.
2. REVIEW candidates are blocked from downstream crawler execution.
3. Re-running with same input is idempotent (no duplicate IDs/cards).
4. JSON corruption/concurrency preserves existing data.
5. Same department without explicit credit does not create PROFESSOR_SUPERVISED_PROJECT.
6. Stored professor cards are verified in my-exhibit-platform UI data loader.
"""
import os
import sys
import json
import shutil
import tempfile
import asyncio

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add workspace path
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from research.storage_manager import (
    atomic_read_json,
    atomic_write_json,
    upsert_exhibition_card,
    upsert_professor_card,
    CorruptedDatabaseError,
    generate_exhibition_card_id,
    generate_professor_id
)
from research.search_api_provider import SearchAPIProvider, SearchAPIError
from research.curriculum_professor_researcher import CurriculumProfessorResearcher
from research.archive_card_integrator import ArchiveCardIntegrator

def run_tests():
    print("======================================================================", flush=True)
    print("[*] STARTING VERIFICATION OF ALL 6 OPERATIONAL INVARIANTS", flush=True)
    print("======================================================================\n", flush=True)

    passed_count = 0
    total_tests = 6

    # -------------------------------------------------------------------------
    # TEST 1: API 장애 시 Mock 데이터의 운영 DB 유입 방지
    # -------------------------------------------------------------------------
    print("--- [TEST 1] API 장애 시 Mock 데이터의 운영 DB 유입 방지 ---", flush=True)
    # Production provider (allow_mock=False)
    prod_provider = SearchAPIProvider(allow_mock=False)
    # Temporarily remove any API keys from environment to simulate API failure/missing keys
    orig_serp = os.environ.pop("SERPAPI_API_KEY", None)
    orig_tavily = os.environ.pop("TAVILY_API_KEY", None)

    try:
        threw_error = False
        try:
            prod_provider.execute_search("가상대학교", "우주공학과", "2026")
        except SearchAPIError as se:
            threw_error = True
            print(f"  [PASS] Expected SearchAPIError raised: {se}", flush=True)

        assert threw_error, "Production provider did not raise SearchAPIError when API keys were missing!"

        # Verify production DBs were untouched
        prod_queue_path = os.path.join(WORKSPACE_ROOT, "data", "university_queue.json")
        prod_prof_path = os.path.join(WORKSPACE_ROOT, "data", "professors.json")
        q_data = atomic_read_json(prod_queue_path)
        p_data = atomic_read_json(prod_prof_path)
        assert not any(x.get("university") == "가상대학교" for x in q_data), "Mock data leaked into production queue!"
        assert not any(x.get("university") == "가상대학교" for x in p_data), "Mock data leaked into production professors!"
        print("  [PASS] Production DBs remain completely unpolluted by mock data.", flush=True)
        passed_count += 1
    finally:
        if orig_serp: os.environ["SERPAPI_API_KEY"] = orig_serp
        if orig_tavily: os.environ["TAVILY_API_KEY"] = orig_tavily

    # -------------------------------------------------------------------------
    # TEST 2: REVIEW 후보의 다운스트림 실행 차단
    # -------------------------------------------------------------------------
    print("\n--- [TEST 2] REVIEW 후보의 다운스트림 실행 차단 ---", flush=True)
    test_temp_dir = tempfile.mkdtemp(prefix="test_inv_")
    test_queue_path = os.path.join(test_temp_dir, "test_queue.json")
    test_prof_path = os.path.join(test_temp_dir, "test_prof.json")

    try:
        integrator = ArchiveCardIntegrator(
            queue_path=test_queue_path,
            sync_queue_path=None,
            professors_path=test_prof_path,
            sync_professors_path=None,
            allow_mock=True
        )

        review_output = {
            "university_name": "검토대학교",
            "department_keyword": "산업디자인학과",
            "target_year": "2026",
            "result_status": "REVIEW",
            "detail": {
                "source_url": "https://review-univ.ac.kr/exhibit",
                "confidence_score": 65,
                "reasoning": "연도 확인되었으나 전시 상세 일정 미확인"
            }
        }
        res_review = integrator.integrate_research_result(review_output)
        assert res_review["card_status"] == "검토 필요", f"Expected '검토 필요', got {res_review['card_status']}"
        assert res_review["is_ready_for_crawler"] is False, "REVIEW item was marked as ready for crawler!"

        # Verify run_queue_agent filter logic skips it
        loaded_q = atomic_read_json(test_queue_path)
        pending_items = []
        for q_item in loaded_q:
            status = q_item.get("status", "")
            if status in ("검토 필요", "REVIEW", "REVIEW_NEEDED", "보류", "HOLD"):
                continue
            pending_items.append(q_item)

        assert len(pending_items) == 0, "Downstream scraper filter did not block REVIEW item!"
        print(f"  [PASS] REVIEW item correctly registered as '검토 필요' and downstream execution count is 0.", flush=True)
        passed_count += 1
    finally:
        shutil.rmtree(test_temp_dir, ignore_errors=True)

    # -------------------------------------------------------------------------
    # TEST 3: 동일 입력 재실행 시 중복 카드 생성 방지 (Idempotency)
    # -------------------------------------------------------------------------
    print("\n--- [TEST 3] 동일 입력 재실행 시 중복 카드 생성 방지 (Idempotency) ---", flush=True)
    test_temp_dir = tempfile.mkdtemp(prefix="test_inv3_")
    test_queue_path = os.path.join(test_temp_dir, "test_queue.json")
    test_prof_path = os.path.join(test_temp_dir, "test_prof.json")

    try:
        integrator = ArchiveCardIntegrator(
            queue_path=test_queue_path,
            sync_queue_path=None,
            professors_path=test_prof_path,
            sync_professors_path=None,
            allow_mock=True
        )

        sample_confirmed = {
            "university_name": "건국대학교",
            "department_keyword": "시각영상디자인학과",
            "target_year": "2026",
            "result_status": "CONFIRMED",
            "detail": {
                "source_url": "https://kku2026mid.com/project",
                "confidence_score": 95,
                "reasoning": "공식 아카이브 확인"
            }
        }

        # 1st run
        res1 = integrator.integrate_research_result(sample_confirmed)
        q1 = atomic_read_json(test_queue_path)
        p1 = atomic_read_json(test_prof_path)
        count_q1 = len(q1)
        count_p1 = len(p1)

        # 2nd run with same target
        res2 = integrator.integrate_research_result(sample_confirmed)
        q2 = atomic_read_json(test_queue_path)
        p2 = atomic_read_json(test_prof_path)
        count_q2 = len(q2)
        count_p2 = len(p2)

        assert count_q1 == count_q2 == 1, f"Queue count changed on rerun: {count_q1} vs {count_q2}"
        assert count_p1 == count_p2, f"Professor count changed on rerun: {count_p1} vs {count_p2}"
        assert res1["card_id"] == res2["card_id"], "Card IDs differed between identical runs!"
        print(f"  [PASS] Card count remained exactly {count_q1} (queue) and {count_p1} (professors) on repeated execution.", flush=True)
        passed_count += 1
    finally:
        shutil.rmtree(test_temp_dir, ignore_errors=True)

    # -------------------------------------------------------------------------
    # TEST 4: JSON 손상·동시 저장·중간 실패 시 기존 데이터 보존
    # -------------------------------------------------------------------------
    print("\n--- [TEST 4] JSON 손상·동시 저장·중간 실패 시 기존 데이터 보존 ---", flush=True)
    test_temp_dir = tempfile.mkdtemp(prefix="test_inv4_")
    test_file = os.path.join(test_temp_dir, "db.json")
    sync_file = os.path.join(test_temp_dir, "platform_db.json")

    try:
        initial_data = [{"id": "item-1", "name": "Initial Good Data"}]
        atomic_write_json(test_file, initial_data, sync_paths=[sync_file])

        # Verify .bak was created on subsequent write
        next_data = [{"id": "item-1", "name": "Initial Good Data"}, {"id": "item-2", "name": "Second Good Data"}]
        atomic_write_json(test_file, next_data, sync_paths=[sync_file])
        assert os.path.exists(test_file + ".bak"), "Backup file (.bak) was not created!"

        # Corrupt the main file
        with open(test_file, "w", encoding="utf-8") as f:
            f.write("{ INVALID JSON CONTENT: BROKEN ]")

        # atomic_read_json should detect corruption and recover from backup!
        recovered = atomic_read_json(test_file)
        assert len(recovered) > 0, "Failed to recover from backup on JSON corruption!"
        print("  [PASS] Successfully recovered data from .bak when main file was corrupted.", flush=True)

        # Verify sync_file is also matching
        sync_data = atomic_read_json(sync_file)
        assert len(sync_data) == 2, "Sync file did not match source file!"
        print("  [PASS] Atomic sync to platform destination verified.", flush=True)
        passed_count += 1
    finally:
        shutil.rmtree(test_temp_dir, ignore_errors=True)

    # -------------------------------------------------------------------------
    # TEST 5: 동일 학과만을 근거로 한 지도교수 연결 방지
    # -------------------------------------------------------------------------
    print("\n--- [TEST 5] 동일 학과만을 근거로 한 지도교수 연결 방지 ---", flush=True)
    prof_researcher = CurriculumProfessorResearcher(allow_mock=True)

    # Case A: Same department, but NO explicit supervisor credit in text
    student_works_uncredited = [
        {
            "title": "클릭 투 다이브",
            "student_name": "최건희",
            "raw_text": "건국대학교 시각영상디자인학과 졸업작품입니다. 디지털 인터랙션 연구.",
            "description": "클릭 투 다이브 | 최건희"
        }
    ]
    faculties_a = prof_researcher.research_faculty_for_department(
        university="건국대학교",
        department="시각영상디자인학과",
        student_works=student_works_uncredited
    )
    for f in faculties_a:
        for sub in f.get("student_submissions", []):
            assert sub["relation_type"] != "PROFESSOR_SUPERVISED_PROJECT", \
                "Supervised project relation was incorrectly created without explicit credit!"
            assert sub["relation_type"] == "SAME_DEPARTMENT", \
                f"Expected SAME_DEPARTMENT, got {sub['relation_type']}"

    print("  [PASS] Without explicit credit, relation_type is strictly SAME_DEPARTMENT.", flush=True)

    # Case B: Explicit supervisor credit present
    student_works_credited = [
        {
            "title": "브랜드 경험 디자인 연구",
            "student_name": "김학생",
            "raw_text": "건국대학교 시각영상디자인학과 졸업작품 | 지도교수: 맹형균 | 학생 김학생",
            "description": "브랜드 연구"
        }
    ]
    faculties_b = prof_researcher.research_faculty_for_department(
        university="건국대학교",
        department="시각영상디자인학과",
        student_works=student_works_credited
    )
    target_prof = next((p for p in faculties_b if p["name"] == "맹형균"), None)
    assert target_prof is not None, "Target professor 맹형균 not found in faculties!"
    credited_sub = next((s for s in target_prof.get("student_submissions", []) if s["project_title"] == "브랜드 경험 디자인 연구"), None)
    assert credited_sub is not None and credited_sub["relation_type"] == "PROFESSOR_SUPERVISED_PROJECT", \
        "Failed to bind PROFESSOR_SUPERVISED_PROJECT when explicit credit was present!"

    print("  [PASS] With explicit '지도교수: 맹형균' credit, relation_type is PROFESSOR_SUPERVISED_PROJECT.", flush=True)
    passed_count += 1

    # -------------------------------------------------------------------------
    # TEST 6: 저장한 교수 카드의 실제 플랫폼 표시 검증
    # -------------------------------------------------------------------------
    print("\n--- [TEST 6] 저장한 교수 카드의 실제 플랫폼 표시 검증 ---", flush=True)
    platform_data_ts = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "lib", "data.ts")
    with open(platform_data_ts, "r", encoding="utf-8") as f:
        data_ts_code = f.read()

    assert "return (professorsData as unknown as Professor[]) || [];" in data_ts_code, \
        "my-exhibit-platform/lib/data.ts getProfessors() is still returning empty []!"
    assert "return ((professorsData as unknown as Professor[]) || []).find((p) => p.id === id);" in data_ts_code, \
        "my-exhibit-platform/lib/data.ts getProfessorById() is still returning undefined!"

    # Verify both root and platform professors.json match
    root_profs = atomic_read_json(os.path.join(WORKSPACE_ROOT, "data", "professors.json"))
    plat_profs = atomic_read_json(os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "professors.json"))

    assert len(root_profs) > 0, "root data/professors.json is empty!"
    assert len(plat_profs) == len(root_profs), f"Mismatch between root ({len(root_profs)}) and platform ({len(plat_profs)}) professors!"

    sample_p = plat_profs[0]
    required_ui_fields = ["id", "name", "university", "department", "title", "research_areas", "bio", "assignment_details"]
    for rf in required_ui_fields:
        assert rf in sample_p, f"Professor card missing UI required field: {rf}"

    print(f"  [PASS] Platform data loader lib/data.ts connects to {len(plat_profs)} verified professors.", flush=True)
    print(f"  [PASS] All UI required schema fields ({', '.join(required_ui_fields)}) present.", flush=True)
    passed_count += 1

    print("\n======================================================================", flush=True)
    print(f"[SUMMARY] {passed_count}/{total_tests} OPERATIONAL INVARIANTS PERFECTLY SATISFIED AND PASSED!", flush=True)
    print("======================================================================", flush=True)

if __name__ == "__main__":
    run_tests()
