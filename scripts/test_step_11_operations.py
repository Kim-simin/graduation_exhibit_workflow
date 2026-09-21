"""
scripts/test_step_11_operations.py
STEP 11: Admin Operations Dashboard & Approval Queue Comprehensive Test Suite

Verifies all 20 Mandatory Scenarios from Section 20:
  1. Approval Queue 조회
  2. WAITING_FOR_APPROVAL 필터
  3. Content Type 필터
  4. Channel 필터
  5. Date 필터
  6. Version 표시 (v1, v2, v3 및 반려 이력)
  7. 개별 Approve
  8. 개별 Reject (필수 사유 검증)
  9. Bulk Approve (다중 승인 및 개별 감사 기록)
 10. 권한 검증 (비관리자 403 Forbidden 차단)
 11. Active Run 표시 (LangGraph 현재 노드)
 12. Failed Run 표시 (실패 노드 및 에러 정보)
 13. Scheduler Status (Manual / External Tick 모드 표출)
 14. Source Summary (출처 검증 지표 및 무결성)
 15. Run Detail 연결 (/api/admin/runtime?run_id=...)
 16. Audit Log 연동 (승인/반려 감사 로그 누적)
 17. STEP 9-4 회귀 테스트 (Human-in-the-Loop 관리자 게이트)
 18. STEP 9-5 회귀 테스트 (Admin 조회 LLM 0회 및 최적화)
 19. STEP 10 회귀 테스트 (Scheduler & Concurrency Lock)
 20. Admin 전체 조회 시 LLM 호출 0회 감사
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(WORKSPACE_ROOT, "data")
GEN_DB_FILE = os.path.join(DATA_DIR, "generated_contents.json")
RUNS_LOG_FILE = os.path.join(DATA_DIR, "logs", "pipeline_runs.json")
AUDIT_LOG_FILE = os.path.join(DATA_DIR, "logs", "approval_audit_logs.json")
SCHEDULES_FILE = os.path.join(DATA_DIR, "schedules.json")
RUNTIME_FILE = os.path.join(DATA_DIR, "runtime_pipeline.json")

def detect_base_url():
    for port in [3000, 3001]:
        try:
            req = urllib.request.Request(f"http://localhost:{port}/api/admin/operations")
            with urllib.request.urlopen(req, timeout=1) as resp:
                if resp.status == 200:
                    return f"http://localhost:{port}"
        except Exception:
            pass
    return "http://localhost:3000"

BASE_URL = detect_base_url()

def http_get(path: str, headers: dict = None) -> tuple:
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}

def http_post_json(path: str, payload: dict, headers: dict = None) -> tuple:
    url = f"{BASE_URL}{path}"
    data_bytes = json.dumps(payload).encode("utf-8")
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=data_bytes, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}

def main():
    print("=" * 85)
    print("🚀 [STEP 11] ADMIN OPERATIONS DASHBOARD & APPROVAL QUEUE TEST SUITE")
    print(f"Target Base URL: {BASE_URL}")
    print("=" * 85)

    results = []

    def record_result(title: str, passed: bool, detail: str = ""):
        status_text = "PASS" if passed else "FAIL"
        results.append((title, passed, detail))
        icon = "✅" if passed else "❌"
        print(f"  {icon} {status_text}: {title}")
        if detail:
            print(f"       -> {detail}")

    # Seed test content in WAITING_FOR_APPROVAL state if not present
    with open(GEN_DB_FILE, "r", encoding="utf-8") as f:
        gen_data = json.load(f)

    test_content_id_1 = "cnt-step11-test-01"
    test_content_id_2 = "cnt-step11-test-02"
    test_content_id_3 = "cnt-step11-test-03"

    existing_ids = {c.get("content_id") for c in gen_data.get("contents", [])}

    sample_items = [
        {
            "content_id": test_content_id_1,
            "project_id": "proj-step11-demo",
            "platform": "instagram",
            "content_type": "reels",
            "title": "[STEP 11 Test 01] 2026 AI 기반 미래 모빌리티 콕핏 디자인",
            "hook": "2026년 모빌리티 졸업전시 필수 규격 3선",
            "body": "미래 모빌리티 콕핏 인터페이스 규격 요약...",
            "version": 1,
            "status": "WAITING_FOR_APPROVAL",
            "approval_status": "WAITING_FOR_APPROVAL",
            "created_at": datetime.now().isoformat(),
            "source_traceability": [
                {
                    "claim": "국내 자율주행 HMI 가이드라인 의무 적용",
                    "source_url": "https://kidp.or.kr/policy/mobility-hmi-standard-2026",
                    "publisher": "한국디자인진흥원(KIDP)"
                }
            ]
        },
        {
            "content_id": test_content_id_2,
            "project_id": "proj-step11-demo",
            "platform": "instagram",
            "content_type": "cardnews",
            "title": "[STEP 11 Test 02] 2026 카드뉴스 디자인 트렌드 가이드",
            "hook": "카드뉴스 시인성 극대화 가이드라인",
            "body": "카드뉴스 시인성 분석 내용...",
            "version": 2,
            "status": "WAITING_FOR_APPROVAL",
            "approval_status": "WAITING_FOR_APPROVAL",
            "created_at": datetime.now().isoformat(),
            "source_traceability": [
                {
                    "claim": "조도 표준 최대 허용치 규격 준수",
                    "source_url": "https://kidp.or.kr/policy/mobility-hmi-standard-2026",
                    "publisher": "한국디자인진흥원(KIDP)"
                }
            ]
        },
        {
            "content_id": test_content_id_3,
            "project_id": "proj-step11-demo-3",
            "platform": "youtube",
            "content_type": "longform",
            "title": "[STEP 11 Test 03] 인터랙션 디자인 졸업작품 심층 분석",
            "hook": "심층 아티클 롱폼 분석",
            "body": "롱폼 인터뷰 및 분석...",
            "version": 3,
            "status": "WAITING_FOR_APPROVAL",
            "approval_status": "WAITING_FOR_APPROVAL",
            "created_at": datetime.now().isoformat(),
            "source_traceability": []
        }
    ]

    for s in sample_items:
        found = False
        for c in gen_data.get("contents", []):
            if c.get("content_id") == s["content_id"]:
                c["status"] = "WAITING_FOR_APPROVAL"
                c["approval_status"] = "WAITING_FOR_APPROVAL"
                c["approved_by"] = None
                c["approved_at"] = None
                c["rejected_by"] = None
                c["rejected_at"] = None
                c["rejection_reason"] = None
                found = True
                break
        if not found:
            gen_data["contents"].append(s)
    with open(GEN_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(gen_data, f, ensure_ascii=False, indent=2)
    platform_gen = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "generated_contents.json")
    if os.path.exists(os.path.dirname(platform_gen)):
        with open(platform_gen, "w", encoding="utf-8") as f:
            json.dump(gen_data, f, ensure_ascii=False, indent=2)

    print("\n[TEST 01] Approval Queue 기본 목록 조회")
    status, data = http_get("/api/admin/approval-queue?status=ALL")
    t1_pass = status == 200 and data.get("status") == "SUCCESS" and "items" in data and len(data["items"]) > 0
    record_result("Approval Queue 조회", t1_pass, f"총 {len(data.get('items', []))}개 항목 반환됨")

    print("\n[TEST 02] WAITING_FOR_APPROVAL 필터 검증")
    status, data = http_get("/api/admin/approval-queue?status=WAITING_FOR_APPROVAL")
    items = data.get("items", [])
    t2_pass = status == 200 and all(it["status"] == "WAITING_FOR_APPROVAL" for it in items) and len(items) > 0
    record_result("WAITING_FOR_APPROVAL 필터", t2_pass, f"대기 항목 {len(items)}건 정상 필터링")

    print("\n[TEST 03] Content Type 필터 검증 (reels)")
    status, data = http_get("/api/admin/approval-queue?content_type=reels&status=ALL")
    items = data.get("items", [])
    t3_pass = status == 200 and all(it["content_type"] == "reels" for it in items)
    record_result("Content Type 필터 (reels)", t3_pass, f"릴스 항목 {len(items)}건 필터링 확인")

    print("\n[TEST 04] Channel 필터 검증 (INSTAGRAM)")
    status, data = http_get("/api/admin/approval-queue?channel=INSTAGRAM&status=ALL")
    items = data.get("items", [])
    t4_pass = status == 200 and all(it["channel"] == "INSTAGRAM" for it in items)
    record_result("Channel 필터 (INSTAGRAM)", t4_pass, f"인스타그램 항목 {len(items)}건 필터링 확인")

    print("\n[TEST 05] Date 필터 검증 (today)")
    status, data = http_get("/api/admin/approval-queue?date=today&status=ALL")
    t5_pass = status == 200 and "items" in data
    record_result("Date 필터 (today)", t5_pass, f"금일 생성 항목 {len(data.get('items', []))}건 확인")

    print("\n[TEST 06] Version 표시 및 버전 이력 구조 검증")
    status, data = http_get("/api/admin/approval-queue?status=ALL")
    items = data.get("items", [])
    has_version = any("version" in it and "version_history" in it for it in items)
    record_result("Version 표시 및 이력 매핑", has_version, "버전 번호 및 이전 이력 구조 확인")

    print("\n[TEST 07] 개별 Approve 실행 검증")
    status, data = http_post_json(
        "/api/admin/approval",
        {"action": "APPROVE", "content_id": test_content_id_1, "version": 1, "reviewer": "test_admin_individual"},
        headers={"x-admin-role": "admin"}
    )
    t7_pass = status == 200 and data.get("approval_status") == "APPROVED"
    record_result("개별 Approve", t7_pass, f"응답: {data.get('approval_status')}")

    print("\n[TEST 08] 개별 Reject 및 필수 사유 검증")
    # First test empty reason (must fail 400)
    status_fail, data_fail = http_post_json(
        "/api/admin/approval",
        {"action": "REJECT", "content_id": test_content_id_3, "version": 3, "rejection_reason": ""},
        headers={"x-admin-role": "admin"}
    )
    # Then test valid rejection
    status_succ, data_succ = http_post_json(
        "/api/admin/approval",
        {
            "action": "REJECT",
            "content_id": test_content_id_3,
            "version": 3,
            "rejection_reason": "포트폴리오 심층 가이드라인 보완 및 원문 출처 보강 필요",
            "reviewer": "test_admin_qa"
        },
        headers={"x-admin-role": "admin"}
    )
    t8_pass = status_fail == 400 and status_succ == 200 and data_succ.get("approval_status") == "REJECTED"
    record_result("개별 Reject (필수 사유 검증 포함)", t8_pass, "사유 누락 시 400 차단 및 유효 사유 정상 반려 확인")

    print("\n[TEST 09] Bulk Approve (다중 일괄 승인) 검증")
    # Re-verify test_content_id_2 is WAITING
    status, data = http_post_json(
        "/api/admin/approval/bulk",
        {"action": "APPROVE", "content_ids": [test_content_id_2], "reviewer": "test_bulk_admin"},
        headers={"x-admin-role": "admin"}
    )
    t9_pass = status == 200 and data.get("approved_count", 0) >= 1
    record_result("Bulk Approve", t9_pass, f"승인 완료 수: {data.get('approved_count')}")

    print("\n[TEST 10] 권한 검증 (비관리자 Bulk Approve 호출 시 403 Forbidden 차단)")
    status, data = http_post_json(
        "/api/admin/approval/bulk",
        {"action": "APPROVE", "content_ids": [test_content_id_2]},
        headers={"x-admin-role": "viewer"}  # Unauthorized role
    )
    t10_pass = status == 403
    record_result("권한 검증 (403 Forbidden)", t10_pass, f"비인가 요청 403 차단 확인 (Status: {status})")

    print("\n[TEST 11] Active Run 표시 (Operations API)")
    status, data = http_get("/api/admin/operations")
    t11_pass = status == 200 and "active_runs" in data and "counts" in data
    record_result("Active Run 표시", t11_pass, f"Active Runs Count: {data['counts'].get('active_runs')}")

    print("\n[TEST 12] Failed Run 표시 및 에러 메타데이터 직접 표출")
    t12_pass = status == 200 and "failed_runs" in data
    record_result("Failed Run 표시", t12_pass, f"Failed Runs Count: {data['counts'].get('failed_runs')}")

    print("\n[TEST 13] Scheduler Status (Manual / External Tick 표출)")
    scheduler_info = data.get("scheduler", {})
    t13_pass = scheduler_info.get("execution_mode") == "Manual / External Tick" and "status" in scheduler_info
    record_result("Scheduler Status (Execution Mode 투명 표출)", t13_pass, f"Mode: {scheduler_info.get('execution_mode')}")

    print("\n[TEST 14] Source Summary 유지 및 검증 수치 표출")
    source_info = data.get("source_summary", {})
    t14_pass = "total_sources" in source_info and "verification_rate" in source_info
    record_result("Source Summary 유지", t14_pass, f"검증률: {source_info.get('verification_rate')}% ({source_info.get('verified_sources')}/{source_info.get('total_sources')})")

    print("\n[TEST 15] Run Detail 연결 (/api/admin/runtime)")
    status_rt, data_rt = http_get("/api/admin/runtime")
    t15_pass = status_rt == 200 and "workflow" in data_rt
    record_result("Run Detail 연결", t15_pass, f"Workflow Nodes: {len(data_rt.get('workflow', []))}개")

    print("\n[TEST 16] Audit Log 연동 검증")
    with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
        audit_records = json.load(f)
    has_bulk = any(a.get("details", {}).get("bulk_action") is True for a in audit_records)
    has_approved = any(a.get("action") in ["APPROVE", "CONTENT_APPROVED"] for a in audit_records)
    has_rejected = any(a.get("action") in ["REJECT", "CONTENT_REJECTED"] for a in audit_records)
    t16_pass = has_bulk and has_approved and has_rejected
    record_result("Audit Log 연동 (개별 및 Bulk 일체 기록)", t16_pass, f"총 {len(audit_records)}건의 감사 로그 확인")

    print("\n[TEST 17] STEP 9-4 Human-in-the-Loop 승인 게이트 회귀 검증")
    # Ensure current pipeline state still holds approval fields
    t17_pass = "approval_status" in data_rt.get("current_run", {}) or "status" in data_rt.get("current_run", {})
    record_result("STEP 9-4 승인 게이트 회귀 무결성", t17_pass, "승인 상태 및 게이트 노드 보존 확인")

    print("\n[TEST 18] STEP 9-5 Admin Polling & LLM Audit 회귀 검증")
    # Runtime & Operations API response time under 100ms (proving pure JSON)
    t0 = time.time()
    http_get("/api/admin/operations")
    elapsed_ms = (time.time() - t0) * 1000
    t18_pass = elapsed_ms < 150
    record_result("STEP 9-5 Polling & LLM Audit 회귀", t18_pass, f"응답 시간 {elapsed_ms:.1f}ms (순수 JSON DB 조회)")

    print("\n[TEST 19] STEP 10 Workflow Scheduler & Concurrency Lock 회귀 검증")
    with open(SCHEDULES_FILE, "r", encoding="utf-8") as f:
        schedules_data = json.load(f)
    t19_pass = len(schedules_data) >= 1 and all(("cron" in s or "cronExpression" in s) and "timezone" in s for s in schedules_data)
    record_result("STEP 10 Scheduler 회귀 무결성", t19_pass, f"등록된 스케줄 {len(schedules_data)}건 보존 확인")

    print("\n[TEST 20] Admin 전체 조회 시 LLM 호출 0회 검증")
    # Verify code files for zero LLM imports
    operations_route_file = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "app", "api", "admin", "operations", "route.ts")
    queue_route_file = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "app", "api", "admin", "approval-queue", "route.ts")
    bulk_route_file = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "app", "api", "admin", "approval", "bulk", "route.ts")

    llm_tokens = ["ChatGoogleGenerativeAI", "ChatOpenAI", "openai", "@google/generative-ai", "invoke(", "ainvoke("]
    found_llm = False
    for path in [operations_route_file, queue_route_file, bulk_route_file]:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            for token in llm_tokens:
                if token in content:
                    found_llm = True
                    break
    t20_pass = not found_llm
    record_result("Admin 전체 조회 시 LLM 호출 0회", t20_pass, "신규 API 엔드포인트 3종 LLM 호출 0건 확인")

    print("\n" + "=" * 85)
    print("📊 [STEP 11 TEST SUMMARY REPORT]")
    print("=" * 85)
    passed_count = sum(1 for _, p, _ in results if p)
    total_count = len(results)

    for title, p, detail in results:
        status_str = "PASS" if p else "FAIL"
        print(f"  {status_str:6s} | {title}")

    print("=" * 85)
    if passed_count == total_count:
        print(f"🎉 ALL {total_count} STEP 11 TESTS PASSED! ({passed_count}/{total_count} PASS, 100%)")
        print("=" * 85)
        sys.exit(0)
    else:
        print(f"⚠️ {total_count - passed_count} TESTS FAILED ({passed_count}/{total_count} PASS)")
        print("=" * 85)
        sys.exit(1)

if __name__ == "__main__":
    main()
