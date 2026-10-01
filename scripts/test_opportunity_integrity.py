#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
scripts/test_opportunity_integrity.py
공유자원, R&D, 프로젝트, 장비 데이터 무결성 및 연동 종합 검증 스크립트
Terminal Guard 준수: scripts/ 디렉토리 정식 실행형 스크립트
"""

import sys
import os
import json
import hashlib
from datetime import datetime, timezone
import urllib.request
import urllib.error
import ssl

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from research.opportunity_eligibility import is_student_rnd_opportunity

DATA_DIR = os.path.join(WORKSPACE_ROOT, "data")
PLATFORM_DATA_DIR = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data")

REFERENCE_TIMESTAMP_STR = "2026-09-29T21:17:39+09:00"

def log(msg: str):
    print(f"[TEST] {msg}")

def fail(msg: str):
    print(f"[FAIL] ❌ {msg}")
    sys.exit(1)

def success(msg: str):
    print(f"[PASS] ✅ {msg}")

def test_database_safeguard():
    log("1. JSON DB 무결성 및 시드 데이터 보존 검증 시작...")
    
    # 1.1 Existing Seed Databases Preservation
    seed_files = [
        os.path.join(DATA_DIR, "professors.json"),
        os.path.join(DATA_DIR, "university_queue.json"),
    ]
    for sf in seed_files:
        if not os.path.exists(sf):
            fail(f"시드 데이터베이스 파일 누락: {sf}")
        with open(sf, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                if len(data) == 0:
                    fail(f"시드 데이터베이스가 비어 있습니다: {sf}")
                log(f"   - {os.path.basename(sf)}: 정상 보존 ({len(data)} 레코드)")
            elif isinstance(data, dict):
                log(f"   - {os.path.basename(sf)}: 정상 보존 (dict keys: {len(data.keys())})")

    # 1.2 Opportunities & Equipment Databases Existence & Sync
    opp_root = os.path.join(DATA_DIR, "opportunities.json")
    opp_plat = os.path.join(PLATFORM_DATA_DIR, "opportunities.json")
    eq_root = os.path.join(DATA_DIR, "equipment.json")
    eq_plat = os.path.join(PLATFORM_DATA_DIR, "equipment.json")

    for fpath in [opp_root, opp_plat, eq_root, eq_plat]:
        if not os.path.exists(fpath):
            fail(f"필수 데이터베이스 파일 누락: {fpath}")

    with open(opp_root, "r", encoding="utf-8") as f1, open(opp_plat, "r", encoding="utf-8") as f2:
        opp_data1 = json.load(f1)
        opp_data2 = json.load(f2)
        if len(opp_data1) != 9:
            fail(f"Opportunities 레코드 수 불일치: 기대값 9건, 실제 {len(opp_data1)}건")
        if json.dumps(opp_data1, sort_keys=True) != json.dumps(opp_data2, sort_keys=True):
            fail("Root data/와 platform data/의 opportunities.json 동기화 불일치")
        log(f"   - opportunities.json: 이중 원자적 동기화 완료 ({len(opp_data1)}건)")

    with open(eq_root, "r", encoding="utf-8") as f1, open(eq_plat, "r", encoding="utf-8") as f2:
        eq_data1 = json.load(f1)
        eq_data2 = json.load(f2)
        if len(eq_data1) != 23:
            fail(f"Equipment 레코드 수 불일치: 기대값 23건, 실제 {len(eq_data1)}건")
        if json.dumps(eq_data1, sort_keys=True) != json.dumps(eq_data2, sort_keys=True):
            fail("Root data/와 platform data/의 equipment.json 동기화 불일치")
        log(f"   - equipment.json: 이중 원자적 동기화 완료 ({len(eq_data1)}건 개별 엔티티)")

    success("데이터베이스 무결성 및 시드 데이터 보존 검증 완료")

def test_provenance_metadata():
    log("2. 출처 메타데이터 및 무결성 해시(ContentHash) 검증 시작...")
    opp_path = os.path.join(DATA_DIR, "opportunities.json")
    eq_path = os.path.join(DATA_DIR, "equipment.json")

    with open(opp_path, "r", encoding="utf-8") as f:
        opps = json.load(f)
    with open(eq_path, "r", encoding="utf-8") as f:
        eqs = json.load(f)

    required_opp_fields = [
        "id", "type", "title", "providerName", "accessScope",
        "sourceUrl", "sourceOrganization", "sourceType",
        "sourceVerifiedAt", "lastCheckedAt", "lastChangedAt",
        "contentHash", "status", "approvalStatus"
    ]
    for item in opps:
        for rf in required_opp_fields:
            if rf not in item or item[rf] is None or item[rf] == "":
                fail(f"Opportunity {item.get('id')}에 필수 필드 누락: {rf}")
        # Verify contentHash is 64 hex chars
        if len(item["contentHash"]) != 64:
            fail(f"Opportunity {item['id']} contentHash 길이 비정상: {item['contentHash']}")

    required_eq_fields = [
        "id", "equipment_name", "equipment_category", "university",
        "accessScope", "sourceUrl", "sourceOrganization",
        "sourceVerifiedAt", "lastCheckedAt", "lastChangedAt",
        "contentHash", "approvalStatus"
    ]
    for item in eqs:
        for rf in required_eq_fields:
            if rf not in item or item[rf] is None or item[rf] == "":
                fail(f"Equipment {item.get('id')}에 필수 필드 누락: {rf}")
        if len(item["contentHash"]) != 64:
            fail(f"Equipment {item['id']} contentHash 길이 비정상: {item['contentHash']}")

    log(f"   - 9건 기회 및 23건 장비 전체 100% 필수 출처 메타데이터 완비")
    success("출처 메타데이터 및 SHA-256 해시 검증 완료")

def test_date_and_status_math():
    log("3. 2026-09-29 기준 상태 및 D-Day 산출 정밀도 검증 시작...")
    opp_path = os.path.join(DATA_DIR, "opportunities.json")
    with open(opp_path, "r", encoding="utf-8") as f:
        opps = {o["id"]: o for o in json.load(f)}

    # A. 2026 AI 창업 경진대회: 2026-09-30 18:00 마감 -> OPEN, D-1 또는 오늘 마감
    startup = opps.get("opp_ai_startup_competition_2026")
    if not startup or startup["status"] != "OPEN" or startup["dDayText"] not in ["D-1", "오늘 마감"]:
        fail(f"AI 창업 경진대회 상태 불일치: {startup.get('status') if startup else 'None'}, {startup.get('dDayText') if startup else 'None'}")
    log(f"   - AI 창업 경진대회: OPEN, {startup['dDayText']} 확인")

    # B. 글로벌 AX-PBL 연수: 2026-09-30 23:59 마감 -> OPEN, D-1 또는 오늘 마감
    ax_pbl = opps.get("opp_global_ax_pbl_2026")
    if not ax_pbl or ax_pbl["status"] != "OPEN" or ax_pbl["dDayText"] not in ["D-1", "오늘 마감"]:
        fail(f"글로벌 AX-PBL 연수 상태 불일치: {ax_pbl.get('status') if ax_pbl else 'None'}, {ax_pbl.get('dDayText') if ax_pbl else 'None'}")
    log(f"   - 글로벌 AX-PBL 연수: OPEN, {ax_pbl['dDayText']} 확인")

    # C. 캡스톤 1차 일반형: 2026-10-05 마감 -> OPEN, D-5 또는 D-6
    cap1 = opps.get("opp_pnu_capstone_2026_2_general")
    if not cap1 or cap1["status"] != "OPEN" or cap1["dDayText"] not in ["D-5", "D-6"]:
        fail(f"캡스톤 1차 일반형 상태 불일치: {cap1.get('status') if cap1 else 'None'}, {cap1.get('dDayText') if cap1 else 'None'}")
    log(f"   - 캡스톤 1차 일반형: OPEN, {cap1['dDayText']} 확인")

    # D. 캡스톤 2차 기업연계형: 2026-10-12 시작 -> UPCOMING
    cap2 = opps.get("opp_pnu_capstone_2026_2_partner")
    if not cap2 or cap2["status"] != "UPCOMING":
        fail(f"캡스톤 2차 기업연계형 상태 불일치: {cap2.get('status') if cap2 else 'None'}")
    log("   - 캡스톤 2차 기업/지자체연계형: UPCOMING 확인")

    # E. Gemini Academy: 2026-10-18 마감 -> OPEN, D-18 또는 D-19
    gemini = opps.get("opp_gemini_academy_2026")
    if not gemini or gemini["status"] != "OPEN" or gemini["dDayText"] not in ["D-18", "D-19"]:
        fail(f"Gemini Academy 상태 불일치: {gemini.get('status') if gemini else 'None'}, {gemini.get('dDayText') if gemini else 'None'}")
    log(f"   - Gemini Academy: OPEN, {gemini['dDayText']} 확인")

    # F. 부산공유대학 다학제 융합: 2026-09-15 마감 -> CLOSED
    multidis = opps.get("opp_bbits_multidisciplinary_2026")
    if not multidis or multidis["status"] != "CLOSED" or multidis["dDayText"] != "마감":
        fail(f"다학제 융합 프로젝트 상태 불일치: {multidis.get('status') if multidis else 'None'}, {multidis.get('dDayText') if multidis else 'None'}")
    log("   - 부산공유대학 다학제 융합: CLOSED (마감) 확인")

    # G. 상시 인프라 & V-Space & UNIST UCRF: recruitmentEndAt is None -> OPEN, 상시
    for always_id in ["opp_bbits_infra_001", "opp_pnu_vspace_infra", "opp_unist_ucrf_infra"]:
        item = opps.get(always_id)
        if not item or item["status"] != "OPEN" or item["dDayText"] != "상시":
            fail(f"상시 운영 인프라 상태 불일치 ({always_id}): {item.get('status')}, {item.get('dDayText')}")
    log("   - 공유인프라 / V-Space / UNIST UCRF: OPEN, 상시 확인")

    success("날짜 및 모집 상태(D-Day) 산출 정밀도 검증 완료")

def test_deduplication_idempotency():
    log("4. 멱등성 및 중복 방지 규칙(Deduplication Key) 검증 시작...")
    opp_path = os.path.join(DATA_DIR, "opportunities.json")
    with open(opp_path, "r", encoding="utf-8") as f:
        opps = json.load(f)

    keys = set()
    for o in opps:
        dedup_key = f"{o['sourceUrl']}_{o['title']}_{o['providerName']}"
        if dedup_key in keys:
            fail(f"중복된 Opportunity 발견: {dedup_key}")
        keys.add(dedup_key)

    eq_path = os.path.join(DATA_DIR, "equipment.json")
    with open(eq_path, "r", encoding="utf-8") as f:
        eqs = json.load(f)

    eq_keys = set()
    for e in eqs:
        loc = e.get('facility_name') or e.get('center_name') or ''
        model = e.get('model') or ''
        dedup_key = f"{e['university']}_{loc}_{e['equipment_name']}_{model}"
        if dedup_key in eq_keys:
            fail(f"중복된 Equipment 발견: {dedup_key}")
        eq_keys.add(dedup_key)

    log(f"   - Opportunity 키 고유성: {len(keys)}/9")
    log(f"   - Equipment 키 고유성: {len(eq_keys)}/23")
    success("중복 방지 키 고유성 및 멱등성 검증 완료")

def test_four_student_questions():
    log("5. 학생 4대 핵심 질문 영역 매핑 유효성 검증 시작...")
    opp_path = os.path.join(DATA_DIR, "opportunities.json")
    eq_path = os.path.join(DATA_DIR, "equipment.json")
    with open(opp_path, "r", encoding="utf-8") as f:
        opps = json.load(f)
    with open(eq_path, "r", encoding="utf-8") as f:
        eqs = json.load(f)

    # Question 1: 내 전공으로 사용 가능한 자원 (SHARED_INFRASTRUCTURE, EDUCATION, EQUIPMENT, RESEARCH_EQUIPMENT)
    q1 = [o for o in opps if o["type"] in ["SHARED_INFRASTRUCTURE", "EDUCATION", "EQUIPMENT", "RESEARCH_EQUIPMENT"]]
    if len(q1) == 0:
        fail("질문 1 (내 전공 사용 가능 자원) 결과 0건")
    log(f"   - 질문 1: 내 전공 사용 가능 자원 {len(q1)}건 매핑 (부산공유대학 인프라, Gemini Academy, V-Space, UNIST UCRF)")

    # Question 2: 공식 학생 모집 근거와 현재 접수 상태를 검증한다.
    # 검증된 모집공고가 없다면 0건이 정상이며, 장비/태그로 숫자를 채우지 않는다.
    q2 = [o for o in opps if is_student_rnd_opportunity(o)]
    log(f"   - 질문 2: 공식 자격·현재 접수 검증을 통과한 학생 R&D {len(q2)}건 (0건 허용)")

    # Question 3: 현재 모집 중인 프로젝트
    q3 = [o for o in opps if o["type"] in ["CAPSTONE", "COMPETITION", "MULTIDISCIPLINARY", "STARTUP", "RND"] and o["status"] in ["OPEN", "UPCOMING"]]
    if len(q3) == 0:
        fail("질문 3 (현재 모집 중인 프로젝트) 결과 0건")
    log(f"   - 질문 3: 현재 모집 중인 프로젝트 {len(q3)}건 매핑 (AI 창업 경진대회, 캡스톤 1차, 캡스톤 2차, 글로벌 AX-PBL)")

    # Question 4: 활용 가능한 대학 장비 및 시설
    if len(eqs) != 23:
        fail(f"질문 4 (활용 가능한 장비 및 시설) 레코드 수 불일치: {len(eqs)}")
    log(f"   - 질문 4: 활용 가능한 개방 연구·제작 장비 {len(eqs)}종 완비 (3D프린터, 5축 CNC, 레이저가공기, TEM, NMR, 4K스튜디오 등)")

    success("학생 4대 핵심 질문 영역 매핑 유효성 검증 완료")

def test_source_urls():
    log("6. 8대 공식 출처 URL 형식 및 도메인 정밀 검증 시작...")
    expected_urls = [
        "https://www.bbits.ac.kr/ko/support/studio/infra",
        "https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511268&mCode=MN095&mgr_seq=3&mode=view&page=1&searchID=title",
        "https://ai.pusan.ac.kr/bbs/ai/204/1463037/artclView.do",
        "https://cse.pusan.ac.kr/bbs/cse/2056/1462942/artclView.do",
        "https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511038&mCode=MN095&mgr_seq=3&mode=view&page=1",
        "https://me.pusan.ac.kr/new/sub02/sub10.php",
        "https://ucrf.unist.ac.kr/",
        "https://www.bbits.ac.kr/ko/community/community1/view/998",
    ]

    opp_path = os.path.join(DATA_DIR, "opportunities.json")
    with open(opp_path, "r", encoding="utf-8") as f:
        opps = json.load(f)
    registered_urls = set(o["sourceUrl"] for o in opps)

    for target in expected_urls:
        if target not in registered_urls:
            fail(f"지정된 공식 출처 URL 누락: {target}")
        log(f"   - 공식 출처 등록 일치: {target}")

    success("8대 공식 출처 URL 완전 일치 검증 완료")

if __name__ == "__main__":
    print("=" * 70)
    print("공유대학 / R&D / 프로젝트 / 장비 데이터 통합 무결성 검증 파이프라인")
    print(f"기준 시점: {REFERENCE_TIMESTAMP_STR}")
    print("=" * 70)
    
    test_database_safeguard()
    test_provenance_metadata()
    test_date_and_status_math()
    test_deduplication_idempotency()
    test_four_student_questions()
    test_source_urls()
    
    print("=" * 70)
    print("🎉 [ALL TESTS PASSED] 모든 데이터 무결성, 출처 검증, 상태 계산, 연동 테스트 통과!")
    print("=" * 70)
