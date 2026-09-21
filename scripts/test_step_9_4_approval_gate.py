"""
scripts/test_step_9_4_approval_gate.py
STEP 9-4 — 관리자 승인 게이트 (Human-in-the-Loop) 15대 필수 테스트 검증 수트
Section 17 기준 15개 항목 전수 자동화 테스트
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, WORKSPACE_ROOT)

from scripts.run_live_pipeline import run_pipeline, read_json
from generation_graph.runner import run_content_generation, resume_content_generation

RUNTIME_PATH = os.path.join(WORKSPACE_ROOT, "data", "runtime_pipeline.json")
GEN_DB_PATH = os.path.join(WORKSPACE_ROOT, "data", "generated_contents.json")
AUDIT_LOG_PATH = os.path.join(WORKSPACE_ROOT, "data", "logs", "approval_audit_logs.json")
def detect_base_api_url():
    for port in [3000, 3001]:
        try:
            req = urllib.request.Request(f"http://localhost:{port}/api/admin/runtime")
            with urllib.request.urlopen(req, timeout=1) as resp:
                if resp.status == 200:
                    return f"http://localhost:{port}/api/admin"
        except Exception:
            pass
    return "http://localhost:3000/api/admin"

BASE_API_URL = detect_base_api_url()

class TestSuiteResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []

    def log(self, test_num: int, title: str, success: bool, detail: str = ""):
        if success:
            self.passed += 1
            status_text = "✅ PASS"
        else:
            self.failed += 1
            status_text = "❌ FAIL"
        entry = {
            "test_num": test_num,
            "title": title,
            "passed": success,
            "detail": detail
        }
        self.results.append(entry)
        print(f"[{status_text}] Test {test_num:02d}: {title}")
        if detail:
            print(f"       -> {detail}")

def http_post_json(url: str, payload: dict, headers: dict = None) -> tuple:
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.getcode()
            body = json.loads(resp.read().decode("utf-8"))
            return status_code, body
    except urllib.error.HTTPError as e:
        status_code = e.code
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"error": str(e)}
        return status_code, body
    except Exception as e:
        return 0, {"error": str(e)}

def http_get_json(url: str) -> tuple:
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.getcode()
            body = json.loads(resp.read().decode("utf-8"))
            return status_code, body
    except urllib.error.HTTPError as e:
        status_code = e.code
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"error": str(e)}
        return status_code, body
    except Exception as e:
        return 0, {"error": str(e)}

def run_all_tests():
    print("=" * 80)
    print("🧪 [STEP 9-4] 관리자 승인 게이트 (Human-in-the-Loop) 15대 필수 검증 수트 가동")
    print("=" * 80)

    suite = TestSuiteResults()

    # -------------------------------------------------------------
    # Test 1: Content Generation 완료 -> WAITING_FOR_APPROVAL
    # -------------------------------------------------------------
    state1 = run_pipeline(delay=0.05)
    t1_pass = (
        state1.get("status") == "WAITING_FOR_APPROVAL" and
        state1.get("approval_status") == "WAITING_FOR_APPROVAL" and
        state1.get("current_node") == "Human Approval" and
        len(state1.get("nodes", [])) >= 6 and
        state1["nodes"][5]["status"] == "WAITING_FOR_APPROVAL"
    )
    suite.log(
        1,
        "Content Gen 완료 -> WAITING_FOR_APPROVAL 일시 정지",
        t1_pass,
        f"Pipeline status={state1.get('status')}, Node 6 status={state1['nodes'][5]['status'] if len(state1.get('nodes', [])) >= 6 else 'Missing'}"
    )

    run_id = state1.get("run_id")
    target_content = state1["nodes"][5].get("target_content") or {}
    content_id = target_content.get("content_id", "cnt-9c33482d2b")

    # -------------------------------------------------------------
    # Test 7: 비관리자(일반 사용자) APPROVE 차단 (403 Forbidden)
    # (먼저 미승인 상태에서 권한 오류 테스트 수행)
    # -------------------------------------------------------------
    status_code, body = http_post_json(
        f"{BASE_API_URL}/approval",
        {"action": "APPROVE", "run_id": run_id, "content_id": content_id, "version": 1},
        headers={"x-admin-role": "user"}  # Non-admin
    )
    t7_pass = status_code == 403
    suite.log(
        7,
        "비관리자 APPROVE 호출 차단 (403 Forbidden)",
        t7_pass,
        f"Status: {status_code}, Response error: {body.get('error')}"
    )

    # -------------------------------------------------------------
    # Test 4: REJECT 시 rejectionReason 필수 검증 (400 Bad Request)
    # -------------------------------------------------------------
    status_code, body = http_post_json(
        f"{BASE_API_URL}/approval",
        {"action": "REJECT", "run_id": run_id, "content_id": content_id, "version": 1, "rejection_reason": ""},
        headers={"x-admin-role": "admin"}
    )
    t4_pass = status_code == 400 and "rejection_reason" in body.get("error", "")
    suite.log(
        4,
        "REJECT 시 rejectionReason 누락 시 400 Bad Request 반환",
        t4_pass,
        f"Status: {status_code}, Error msg: {body.get('error')}"
    )

    # -------------------------------------------------------------
    # Test 3: WAITING_FOR_APPROVAL -> REJECT
    # -------------------------------------------------------------
    reject_reason = "120cd/m2 조도 기준 인포그래픽 시인성 개선 및 헤드라인 강조 필요"
    status_code, body = http_post_json(
        f"{BASE_API_URL}/approval",
        {
            "action": "REJECT",
            "run_id": run_id,
            "content_id": content_id,
            "version": 1,
            "reviewer": "admin_qa_lead",
            "rejection_reason": reject_reason
        },
        headers={"x-admin-role": "admin"}
    )
    t3_pass = status_code == 200 and body.get("approval_status") == "REJECTED"
    suite.log(
        3,
        "WAITING_FOR_APPROVAL -> REJECT 정상 전이",
        t3_pass,
        f"Status: {status_code}, Result: {body.get('approval_status')}, Reason: {body.get('rejection_reason')}"
    )

    # -------------------------------------------------------------
    # Test 9: 반려 기록 DB 영구 저장
    # -------------------------------------------------------------
    gen_db = read_json(GEN_DB_PATH) or {}
    contents = gen_db.get("contents", [])
    rejected_item = next((c for c in contents if c.get("content_id") == content_id), None)
    t9_pass = (
        rejected_item is not None and
        rejected_item.get("status") == "REJECTED" and
        rejected_item.get("rejected_by") == "admin_qa_lead" and
        rejected_item.get("rejection_reason") == reject_reason
    )
    suite.log(
        9,
        "반려 기록 DB 영구 저장 (rejected_by, rejection_reason)",
        t9_pass,
        f"DB content status={rejected_item.get('status') if rejected_item else 'None'}, rejected_by={rejected_item.get('rejected_by') if rejected_item else 'None'}"
    )

    # -------------------------------------------------------------
    # Test 6: REJECTED 상태에서 APPROVE 거부 (409 Conflict)
    # -------------------------------------------------------------
    status_code, body = http_post_json(
        f"{BASE_API_URL}/approval",
        {"action": "APPROVE", "run_id": run_id, "content_id": content_id, "version": 1, "reviewer": "admin_master"},
        headers={"x-admin-role": "admin"}
    )
    t6_pass = status_code == 409
    suite.log(
        6,
        "REJECTED 상태에서 APPROVE 시도 시 409 Conflict 차단",
        t6_pass,
        f"Status: {status_code}, Conflict Error: {body.get('error')}"
    )

    # -------------------------------------------------------------
    # Test 11: Content Version 보존 (반려되어도 이전 버전 삭제/덮어쓰기 없음)
    # -------------------------------------------------------------
    initial_version_count = len(contents)
    t11_pass = initial_version_count > 0 and rejected_item.get("version") == 1
    suite.log(
        11,
        "Content Version 보존 (반려 시에도 v1 레코드 영구 보존)",
        t11_pass,
        f"Total contents count in DB: {initial_version_count}, Version: {rejected_item.get('version') if rejected_item else 'None'}"
    )

    # -------------------------------------------------------------
    # Test 2: 새 파이프라인 구동 후 WAITING_FOR_APPROVAL -> APPROVE
    # -------------------------------------------------------------
    state2 = run_pipeline(delay=0.05)
    run_id2 = state2.get("run_id")
    target_content2 = state2["nodes"][5].get("target_content") or {}
    content_id2 = target_content2.get("content_id", "cnt-9c33482d2b")

    status_code, body = http_post_json(
        f"{BASE_API_URL}/approval",
        {
            "action": "APPROVE",
            "run_id": run_id2,
            "content_id": content_id2,
            "version": 1,
            "reviewer": "admin_director"
        },
        headers={"x-admin-role": "admin"}
    )
    t2_pass = status_code == 200 and body.get("approval_status") == "APPROVED"
    suite.log(
        2,
        "WAITING_FOR_APPROVAL -> APPROVE 정상 전이",
        t2_pass,
        f"Status: {status_code}, Result: {body.get('approval_status')}, Reviewer: {body.get('reviewer')}"
    )

    # -------------------------------------------------------------
    # Test 8: 승인 기록 DB 영구 저장
    # -------------------------------------------------------------
    gen_db2 = read_json(GEN_DB_PATH) or {}
    contents2 = gen_db2.get("contents", [])
    approved_item = next((c for c in contents2 if c.get("content_id") == content_id2), None)
    t8_pass = (
        approved_item is not None and
        approved_item.get("status") == "APPROVED" and
        approved_item.get("approved_by") == "admin_director" and
        approved_item.get("approved_at") is not None
    )
    suite.log(
        8,
        "승인 기록 DB 영구 저장 (approved_by, approved_at)",
        t8_pass,
        f"DB content status={approved_item.get('status') if approved_item else 'None'}, approved_by={approved_item.get('approved_by') if approved_item else 'None'}"
    )

    # -------------------------------------------------------------
    # Test 5: APPROVED 상태에서 다시 APPROVE 중복 방지 (409 Conflict)
    # -------------------------------------------------------------
    status_code, body = http_post_json(
        f"{BASE_API_URL}/approval",
        {"action": "APPROVE", "run_id": run_id2, "content_id": content_id2, "version": 1, "reviewer": "admin_other"},
        headers={"x-admin-role": "admin"}
    )
    t5_pass = status_code == 409
    suite.log(
        5,
        "APPROVED 상태에서 재승인 시도 시 409 Conflict 차단",
        t5_pass,
        f"Status: {status_code}, Conflict Error: {body.get('error')}"
    )

    # -------------------------------------------------------------
    # Test 10: Audit Log 생성 검증
    # -------------------------------------------------------------
    audit_logs = read_json(AUDIT_LOG_PATH) or []
    has_approved_audit = any(a.get("action") == "CONTENT_APPROVED" for a in audit_logs)
    has_rejected_audit = any(a.get("action") == "CONTENT_REJECTED" for a in audit_logs)
    t10_pass = len(audit_logs) >= 2 and has_approved_audit and has_rejected_audit
    suite.log(
        10,
        "승인/반려 Audit Log 생성 (approval_audit_logs.json)",
        t10_pass,
        f"Total audit logs: {len(audit_logs)}, Has Approved: {has_approved_audit}, Has Rejected: {has_rejected_audit}"
    )

    # -------------------------------------------------------------
    # Test 12: Source Provenance 유지 (출처 및 URL 보존)
    # -------------------------------------------------------------
    traceability = approved_item.get("source_traceability", []) if approved_item else []
    valid_sources = [t for t in traceability if t.get("source_url") and t.get("claim")]
    t12_pass = len(traceability) >= 3 and len(valid_sources) >= 3
    suite.log(
        12,
        "Source Provenance 유지 (source_traceability 체인 보존)",
        t12_pass,
        f"Traceability records: {len(traceability)}, Valid source URLs: {len(valid_sources)}"
    )

    # -------------------------------------------------------------
    # Test 13: LangGraph checkpoint / resume 정상 동작
    # -------------------------------------------------------------
    lg_interrupted = run_content_generation(dry_run=True, version=1, thread_id="lg-thread-audit")
    lg_has_interrupt = "__interrupt__" in lg_interrupted or lg_interrupted.get("approval_status") == "WAITING_FOR_APPROVAL"
    lg_resumed = resume_content_generation("lg-thread-audit", action="APPROVE", reviewer="langgraph_admin")
    lg_resumed_pass = lg_resumed.get("approval_status") == "APPROVED" and lg_resumed.get("approved_by") == "langgraph_admin"
    t13_pass = lg_has_interrupt and lg_resumed_pass
    suite.log(
        13,
        "LangGraph interrupt() 및 Command(resume=...) 체크포인트 재개",
        t13_pass,
        f"Interrupt captured: {lg_has_interrupt}, Resumed approval status: {lg_resumed.get('approval_status')}"
    )

    # -------------------------------------------------------------
    # Test 14: 새로고침 후에도 실제 DB 상태 유지 (Runtime API 재조회)
    # -------------------------------------------------------------
    status_code, runtime_api_res = http_get_json(f"{BASE_API_URL}/runtime")
    t14_pass = (
        status_code == 200 and
        runtime_api_res.get("status") == "SUCCESS" and
        runtime_api_res.get("current_run", {}).get("approval_status") == "APPROVED" and
        len(runtime_api_res.get("workflow", [])) >= 6
    )
    suite.log(
        14,
        "브라우저 새로고침/재조회 시 DB 영속 상태 100% 일치",
        t14_pass,
        f"API status: {status_code}, Current Run approval_status: {runtime_api_res.get('current_run', {}).get('approval_status')}"
    )

    # -------------------------------------------------------------
    # Test 15: 기존 STEP 1~9-3 Regression Test
    # -------------------------------------------------------------
    research_node = next((n for n in runtime_api_res.get("workflow", []) if n.get("id") == "node-research"), {})
    info_sources = research_node.get("information_sources", [])
    valid_sources_count = len([s for s in info_sources if s.get("url_status") == "URL_VALID" or s.get("source_url")])
    t15_pass = len(info_sources) >= 20 and valid_sources_count >= 15
    suite.log(
        15,
        "기존 STEP 1~9-3 기능 Regression Test (Source Traceability 무손상)",
        t15_pass,
        f"Research sources count: {len(info_sources)}, Valid URLs: {valid_sources_count}"
    )

    # -------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------
    print("=" * 80)
    print(f"📊 [테스트 결과 종합] 총 15개 항목 중 {suite.passed}개 PASS / {suite.failed}개 FAIL")
    print("=" * 80)

    if suite.failed == 0:
        print("🎉 [STEP 9-4 Human-in-the-Loop 관리자 승인 게이트 테스트 100% 통과!]")
        return 0
    else:
        print(f"⚠️ 일부 테스트 실패: {suite.failed}건 실패")
        return 1

if __name__ == "__main__":
    code = run_all_tests()
    sys.exit(code)
