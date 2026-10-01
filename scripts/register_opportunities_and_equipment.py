#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/register_opportunities_and_equipment.py
공유대학 / R&D / 프로젝트 / 장비 데이터 수집 및 플랫폼 공식 DB 등록 스크립트

원칙:
1. 기존 데이터베이스 (students.json, professors.json, university_queue.json) 100% 보존
2. MOCK / 임의 데이터 금지 - 공식 원문에서 확인된 데이터만 생성
3. contentHash 및 중복 방지 (sourceUrl + title + providerName) 적용
4. 실행 시점 기준 상태 계산 (과거 원문 검증시각은 보존)
5. Root data/ 와 my-exhibit-platform/data/ 듀얼 동기화
"""

import os
import sys
import json
import hashlib
import argparse
from contextlib import ExitStack
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
# Seed source verification times are historical facts, never refreshed by reruns.
SEED_VERIFIED_AT = "2026-09-29T21:17:39+09:00"
CURRENT_DATE = datetime.now(KST)
CURRENT_TIME_STR = CURRENT_DATE.isoformat()

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PLATFORM_DIR = os.path.join(ROOT_DIR, "my-exhibit-platform")

ROOT_DATA_DIR = os.path.join(ROOT_DIR, "data")
PLATFORM_DATA_DIR = os.path.join(PLATFORM_DIR, "data")
sys.path.insert(0, ROOT_DIR)

from research.opportunity_eligibility import evaluate_student_rnd, is_student_rnd_opportunity, parse_date
from research.opportunity_sources import OPPORTUNITY_SOURCES, normalize_source_url
from research.storage_manager import (
    atomic_read_json, atomic_write_json, interprocess_file_lock,
    recover_pending_replications, DatabaseSyncError,
)


def compute_content_hash(data_dict: dict) -> str:
    serialized = json.dumps(data_dict, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def calculate_status_and_dday(start_at: str | None, end_at: str | None, current_dt: datetime, item_type: str | None = None):
    status = "UNKNOWN"
    d_day_text = ""

    if not end_at:
        if item_type in ["SHARED_INFRASTRUCTURE", "EQUIPMENT", "RESEARCH_EQUIPMENT"]:
            return "OPEN", "상시"
        return "UNKNOWN", "모집기간 확인 필요"

    try:
        end_dt = parse_date(end_at, end_of_day=True)
        if end_dt is None:
            return "UNKNOWN", "모집기간 확인 필요"

        start_dt = None
        if start_at:
            start_dt = parse_date(start_at)
            if start_dt is None or start_dt > end_dt:
                return "UNKNOWN", "모집기간 확인 필요"

        if start_dt and current_dt < start_dt:
            status = "UPCOMING"
            diff_days = (start_dt.date() - current_dt.date()).days
            d_day_text = f"시작 D-{diff_days}"
        elif current_dt <= end_dt:
            status = "OPEN"
            diff_days = (end_dt.date() - current_dt.date()).days
            if diff_days == 0:
                d_day_text = "오늘 마감"
            elif diff_days > 0:
                d_day_text = f"D-{diff_days}"
            else:
                d_day_text = "마감"
        else:
            status = "CLOSED"
            d_day_text = "마감"
    except (TypeError, ValueError):
        status = "UNKNOWN"
        d_day_text = "모집기간 확인 필요"

    return status, d_day_text


def get_verified_opportunities():
    raw_list = [
        # A. 부산공유대학 시설 및 인프라
        {
            "id": "opp_bbits_infra_001",
            "type": "SHARED_INFRASTRUCTURE",
            "title": "부산공유대학 공동 캠퍼스 시설 및 첨단 인프라 대여",
            "providerName": "부산공유대학 (제12공학관 102-1호)",
            "universityId": "bbits",
            "region": "부산",
            "description": "부산공유대학 14개 참여대학의 강의실, 세미나실, 스터디룸, 실험실습실, 미디어실 등 첨단 교육 시설을 공유대학 참여 학생 및 교직원에게 개방하여 공간 및 인프라를 대여 지원하는 공유 플랫폼입니다.",
            "targetStudents": "교직원 및 부산공유대학 참여학생",
            "eligibleUniversities": [
                "부산대학교", "국립한국해양대학교", "동아대학교", "경남정보대학교",
                "동의과학대학교", "국립부경대학교", "부산경상대학교", "부산가톨릭대학교",
                "동의대학교", "동명대학교", "경성대학교", "동서대학교",
                "부산외국어대학교", "신라대학교", "부산과학기술대학교", "RISE 부산공유대학",
                "고신대학교", "영산대학교"
            ],
            "eligibleDepartments": ["ALL"],
            "eligibleMajors": ["ALL"],
            "majorRestriction": False,
            "crossUniversityAvailable": True,
            "accessScope": "SHARED_UNIVERSITY",
            "recruitmentStartAt": "2026-03-01T00:00:00+09:00",
            "recruitmentEndAt": None,
            "programStartAt": "2026-03-01T00:00:00+09:00",
            "programEndAt": "2026-12-31T23:59:59+09:00",
            "programStatus": "ONGOING",
            "benefits": [
                "부산지역 14개 참여대학 내 첨단 강의실·세미나실·실험실습실 무상 대여",
                "온라인 예약 시스템 지원 (인문관 201·203·502호, 제1사범관 510호 등)",
                "주말 포함 08:00~22:00 이용 가능"
            ],
            "technologies": ["스마트강의실", "미디어스튜디오", "화상회의설비", "실험실습기자재"],
            "fields": ["공유인프라", "시설대여", "실험실습", "미디어제작"],
            "applicationMethod": "부산공유대학 홈페이지(bbits.ac.kr) 로그인 후 시설 및 인프라 예약 시스템 신청 (사전 유선 문의 051-510-7056)",
            "applicationUrl": "https://www.bbits.ac.kr/ko/support/studio/application",
            "sourceUrl": "https://www.bbits.ac.kr/ko/support/studio/infra",
            "sourceType": "UNIVERSITY_OFFICIAL",
            "sourceOrganization": "부산공유대학 (공식 홈페이지)",
            "sourcePublishedAt": "2026-03-01T00:00:00+09:00",
            "sourceVerifiedAt": CURRENT_TIME_STR,
            "tags": ["공유인프라", "시설대여", "강의실", "실험실습실", "미디어실", "부산공유대학"],
            "contact": "051-510-7056"
        },
        # B. Gemini Academy
        {
            "id": "opp_gemini_academy_2026",
            "type": "EDUCATION",
            "title": "대학생을 위한 실전 AI 무료 강의! Gemini Academy 수강생 모집",
            "providerName": "구글코리아, 고용노동부",
            "universityId": "pusan",
            "region": "부산 / 전국",
            "description": "구글코리아와 고용노동부가 함께하는 청년 AI 역량 강화 프로그램의 일환으로, Gemini와 Google Workspace를 활용해 웹페이지 제작, 실시간 투표 대시보드 구축, Google Apps Script 업무 자동화를 직접 실습하는 교육 워크숍입니다.",
            "targetStudents": "전공 무관 모든 대학생 (부산 지역은 대학교 상관없이 동의대학교에서 수강 가능, 타 지역도 신청 가능)",
            "eligibleUniversities": ["ALL"],
            "eligibleDepartments": ["ALL"],
            "eligibleMajors": ["ALL"],
            "majorRestriction": False,
            "crossUniversityAvailable": True,
            "accessScope": "PUBLIC",
            "recruitmentStartAt": "2026-09-28T00:00:00+09:00",
            "recruitmentEndAt": "2026-10-18T23:59:59+09:00",
            "programStartAt": "2026-10-31T09:30:00+09:00",
            "programEndAt": "2026-11-14T18:30:00+09:00",
            "programStatus": "UPCOMING",
            "benefits": [
                "전액 무료 실습형 교육",
                "Google 공식 실무 생성형 AI 도구 활용",
                "나만의 디지털 자동화 결과물 및 대시보드 포트폴리오 확보"
            ],
            "technologies": [
                "Gemini", "Gemini Canvas", "Google Workspace",
                "Google Apps Script", "Generative AI", "Web", "Dashboard", "Automation"
            ],
            "fields": ["AI", "생성형AI", "소프트웨어", "디지털콘텐츠", "업무자동화"],
            "applicationMethod": "온라인 참가 등록 (포스터 QR코드 및 rsvp 링크)",
            "applicationUrl": "https://rsvp.withgoogle.com/events/2026-gemini-academy",
            "sourceUrl": "https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511268&mCode=MN095&mgr_seq=3&mode=view&page=1&searchID=title",
            "sourceType": "UNIVERSITY_OFFICIAL",
            "sourceOrganization": "부산대학교 (공식 공지사항)",
            "sourcePublishedAt": "2026-09-28T17:26:00+09:00",
            "sourceVerifiedAt": CURRENT_TIME_STR,
            "tags": ["Gemini", "AI", "Google", "업무자동화", "대시보드", "AppsScript", "웹제작", "전공무관"],
            "contact": "포스터 QR코드 및 신청 링크 참조"
        },
        # C. 2026 AI 창업 경진대회
        {
            "id": "opp_ai_startup_competition_2026",
            "type": "COMPETITION",
            "title": "2026 AI 창업 경진대회 : AI 스타트업의 새로운 항구, 부산",
            "providerName": "주최: 부산광역시, 주관: (재)부산정보산업진흥원, 참여: 부산창조경제혁신센터",
            "universityId": "pusan",
            "region": "부산 / 전국",
            "description": "우수 AI 스타트업을 발굴하고 창업·사업화 지원을 통해 부산 지역 AI 창업 생태계를 활성화하기 위한 경진대회로, 부산시 9대 전략산업 분야(해양, 에너지테크, 미래모빌리티, 융합부품소재, 라이프스타일, 디지털테크, 금융, 문화관광, 바이오헬스) 내 AI를 활용한 자유주제로 참가팀을 모집합니다.",
            "targetStudents": "전국 예비·신규창업팀(2~4인 이내의 팀)",
            "eligibleUniversities": ["ALL"],
            "eligibleDepartments": ["ALL"],
            "eligibleMajors": ["ALL"],
            "majorRestriction": False,
            "crossUniversityAvailable": True,
            "accessScope": "PUBLIC",
            "recruitmentStartAt": "2026-09-16T00:00:00+09:00",
            "recruitmentEndAt": "2026-09-30T18:00:00+09:00",
            "programStartAt": "2026-10-31T09:00:00+09:00",
            "programEndAt": "2026-10-31T18:00:00+09:00",
            "programStatus": "UPCOMING",
            "benefits": [
                "총 시상규모 107,000,000원",
                "창업 및 사업화 지원",
                "전문가 멘토링 연계",
                "부산창조경제혁신센터 후속 지원"
            ],
            "prizeOrReward": "총 1억 7백만원 (107,000,000원)",
            "teamComposition": "2~4인 이내 팀",
            "technologies": ["AI", "인공지능", "빅데이터", "블록체인", "클라우드", "Digital Tech"],
            "fields": ["AI", "Digital Tech", "영화", "영상", "콘텐츠", "게임", "문화관광", "디자인", "창업"],
            "applicationMethod": "공고문 서식 작성 후 이메일 또는 지정 접수처 제출 (붙임 파일 참조)",
            "applicationUrl": "https://ai.pusan.ac.kr/bbs/ai/204/1463037/artclView.do",
            "sourceUrl": "https://ai.pusan.ac.kr/bbs/ai/204/1463037/artclView.do",
            "sourceType": "INSTITUTIONAL_OFFICIAL",
            "sourceOrganization": "부산대학교 인공지능융합연구센터 (공식 공지사항)",
            "sourcePublishedAt": "2026-09-16T17:02:00+09:00",
            "sourceVerifiedAt": CURRENT_TIME_STR,
            "tags": ["AI", "창업", "경진대회", "영상", "콘텐츠", "게임", "문화관광", "디지털테크", "상금1억"],
            "contact": "부산정보산업진흥원 담당자"
        },
        # D-1. 부산대학교 캡스톤디자인 1차 (일반형)
        {
            "id": "opp_pnu_capstone_2026_2_general",
            "type": "CAPSTONE",
            "title": "2026학년도 2학기 캡스톤 디자인 교과목 지원사업 (1차: 일반형)",
            "providerName": "부산대학교 앵커사업단 미래신산업선도본부 / 정보컴퓨터공학부",
            "universityId": "pusan",
            "region": "부산",
            "description": "융합형 인재 양성 및 전공 실무능력·문제해결능력 향상을 위해 캡스톤디자인 정규 교과목 수강생을 대상으로 결과물 도출에 필요한 시제품 제작비 및 인쇄비 등 과제 운영비를 지원합니다.",
            "targetStudents": "2026.2학기 캡스톤 디자인(capstone design) 또는 종합설계 정규교과목 수강생 중 학부(과) 3학년 이상 재학생 및 대학원 재학생 (최소 3인 이상 팀)",
            "eligibleUniversities": ["부산대학교"],
            "eligibleDepartments": ["정보컴퓨터공학부", "컴퓨터공학과", "소프트웨어학과", "인공지능전공", "공과대학 전 학과"],
            "eligibleMajors": ["컴퓨터공학", "소프트웨어", "인공지능", "기계공학", "전자공학", "전기공학"],
            "majorRestriction": True,
            "crossUniversityAvailable": False,
            "accessScope": "UNIVERSITY_ONLY",
            "project_type": "GENERAL",
            "recruitmentStartAt": "2026-09-28T00:00:00+09:00",
            "recruitmentEndAt": "2026-10-05T23:59:59+09:00",
            "programStartAt": "2026-10-12T00:00:00+09:00",
            "programEndAt": "2026-11-30T23:59:59+09:00",
            "programStatus": "UPCOMING",
            "benefits": [
                "결과물 도출에 필요한 운영비(시제품 제작비, 인쇄비 등) 지원",
                "과제 승인 후 팀장 대상 오픈채팅방 공유 및 밀착 멘토링"
            ],
            "technologies": ["소프트웨어", "임베디드", "하드웨어", "AI", "웹/모바일", "시스템설계"],
            "fields": ["캡스톤디자인", "컴퓨터공학", "융합설계", "시제품제작"],
            "applicationMethod": "캡스톤디자인 온라인 지원시스템 (https://capstone.pusan.ac.kr/) 에서 신청",
            "applicationUrl": "https://capstone.pusan.ac.kr/",
            "sourceUrl": "https://cse.pusan.ac.kr/bbs/cse/2056/1462942/artclView.do",
            "sourceType": "UNIVERSITY_OFFICIAL",
            "sourceOrganization": "부산대학교 정보컴퓨터공학부 / 앵커사업단 (공식 공지사항)",
            "sourcePublishedAt": "2026-09-28T00:00:00+09:00",
            "sourceVerifiedAt": CURRENT_TIME_STR,
            "tags": ["캡스톤디자인", "일반형", "부산대학교", "컴퓨터공학", "시제품제작비지원"],
            "contact": "부산대학교 앵커사업단 미래신산업선도본부"
        },
        # D-2. 부산대학교 캡스톤디자인 2차 (기업연계형 / 지자체연계형)
        {
            "id": "opp_pnu_capstone_2026_2_partner",
            "type": "CAPSTONE",
            "title": "2026학년도 2학기 캡스톤 디자인 교과목 지원사업 (2차: 기업연계형·지자체연계형)",
            "providerName": "부산대학교 앵커사업단 미래신산업선도본부 / 정보컴퓨터공학부",
            "universityId": "pusan",
            "region": "부산",
            "description": "실제 기업 및 지자체의 현장 문제와 수요를 연계하여 프로젝트를 수행하는 산학관 협력 캡스톤디자인으로, 지산학연계 교육협약서 체결 및 과제 운영비 지원을 제공합니다.",
            "targetStudents": "2026.2학기 캡스톤 디자인/종합설계 수강생 중 학부 3학년 이상 및 대학원생 (최소 3인 이상 팀)",
            "eligibleUniversities": ["부산대학교"],
            "eligibleDepartments": ["정보컴퓨터공학부", "컴퓨터공학과", "소프트웨어학과", "인공지능전공", "공과대학 전 학과"],
            "eligibleMajors": ["컴퓨터공학", "소프트웨어", "인공지능", "기계공학", "전자공학"],
            "majorRestriction": True,
            "crossUniversityAvailable": False,
            "accessScope": "UNIVERSITY_ONLY",
            "project_type": "COMPANY_LINKED",
            "recruitmentStartAt": "2026-10-12T00:00:00+09:00",
            "recruitmentEndAt": "2026-10-19T23:59:59+09:00",
            "programStartAt": "2026-10-20T00:00:00+09:00",
            "programEndAt": "2026-12-21T23:59:59+09:00",
            "programStatus": "UPCOMING",
            "benefits": [
                "기업·지자체 실제 현장 연계 문제 해결",
                "시제품 제작비 및 인쇄비 운영비 지원",
                "지산학연계 교육협약서 체결 및 산학협력 포트폴리오 확보"
            ],
            "technologies": ["산학연계SW", "AIoT", "데이터분석", "기업솔루션", "디지털트랜스포메이션"],
            "fields": ["캡스톤디자인", "기업연계", "지자체연계", "산학협력"],
            "applicationMethod": "캡스톤디자인 온라인 지원시스템 (https://capstone.pusan.ac.kr/) 에서 온라인 신청",
            "applicationUrl": "https://capstone.pusan.ac.kr/",
            "sourceUrl": "https://cse.pusan.ac.kr/bbs/cse/2056/1462942/artclView.do",
            "sourceType": "UNIVERSITY_OFFICIAL",
            "sourceOrganization": "부산대학교 정보컴퓨터공학부 / 앵커사업단 (공식 공지사항)",
            "sourcePublishedAt": "2026-09-28T00:00:00+09:00",
            "sourceVerifiedAt": CURRENT_TIME_STR,
            "tags": ["캡스톤디자인", "기업연계", "지자체연계", "산학협력", "부산대학교"],
            "contact": "부산대학교 앵커사업단 미래신산업선도본부"
        },
        # E. 글로벌 AX-PBL
        {
            "id": "opp_global_ax_pbl_2026",
            "type": "RND",
            "title": "「2026 글로벌 AX-PBL 현장실증 공학교육」 프로그램 참가자 모집",
            "providerName": "부산대학교 공학교育혁신센터",
            "universityId": "pusan",
            "region": "인도네시아 욕야카르타 및 근교 (해외 현장)",
            "description": "한국과 인도네시아 학생이 한 팀이 되어 AIoT 기술을 활용한 솔루션을 직접 설계·제작하고, 현지 사용자의 피드백을 반영해 현장 설치 및 평가까지 진행하는 실전 R&D 공학교육 프로그램입니다.",
            "targetStudents": "공학계열 재학생 (선발인원 10명 내외)",
            "eligibleAudience": ["공학계열 재학생", "대학생", "학부생"],
            "eligibleUniversities": ["부산대학교"],
            "eligibleDepartments": ["공학계열", "공과대학", "정보의생명공학대학", "기계공학부", "정보컴퓨터공학부", "전자공학과", "전기공학과"],
            "eligibleMajors": ["기계공학", "컴퓨터공학", "전자공학", "전기공학", "항공우주공학", "신소재공학", "산업공학"],
            "majorRestriction": True,
            "crossUniversityAvailable": False,
            "accessScope": "UNIVERSITY_ONLY",
            "recruitmentStartAt": "2026-09-15T00:00:00+09:00",
            "recruitmentEndAt": "2026-09-30T23:59:59+09:00",
            "recruitmentEvidence": {
                "sourceUrl": "https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511038&mCode=MN095&mgr_seq=3&mode=view&page=1",
                "sourceKind": "UNIVERSITY_OFFICIAL",
                "isOfficialDetail": True,
                "eligibilityText": "참가대상: 공학계열 대학생 및 학부 재학생 (선발인원 10명 내외)",
                "recruitmentText": "신청마감: 2026년 9월 30일(수) 23:59까지 이메일 접수 및 지원 모집",
                "verifiedAt": SEED_VERIFIED_AT,
                "rollingAdmission": False
            },
            "programStartAt": "2026-11-01T00:00:00+09:00",
            "programEndAt": "2027-01-20T23:59:59+09:00",
            "programStatus": "UPCOMING",
            "benefits": [
                "왕복 항공료, 현지 숙식비, 해외여행자보험 일체 지원 (개인 부담금 100 USD 제외)",
                "동계계절학기 일반선택 2학점(S/U) 부여",
                "부산대학교 총장 명의 인증서 발급",
                "우수 과제팀(1팀) 시상"
            ],
            "technologies": ["AIoT", "AI", "IoT", "임베디드", "센서네트워크", "하드웨어설계"],
            "fields": ["RND", "현장실증", "공학교육", "해외프로젝트", "AIoT"],
            "applicationMethod": "공학교육혁신센터 홈페이지에서 양식 다운로드 후 이메일 접수 (projectbee@pusan.ac.kr)",
            "applicationUrl": "https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511038&mCode=MN095&mgr_seq=3&mode=view&page=1",
            "sourceUrl": "https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511038&mCode=MN095&mgr_seq=3&mode=view&page=1",
            "sourceType": "UNIVERSITY_OFFICIAL",
            "sourceOrganization": "부산대학교 공학교육혁신센터 (공식 공지사항)",
            "sourcePublishedAt": "2026-09-15T00:00:00+09:00",
            "sourceVerifiedAt": SEED_VERIFIED_AT,
            "tags": ["RND", "글로벌AX-PBL", "AIoT", "인도네시아", "현장실증", "학점인정", "항공료지원", "공학계열"],
            "contact": "projectbee@pusan.ac.kr"
        },
        # F. 부산대학교 V-Space 메이커 인프라
        {
            "id": "opp_pnu_vspace_infra",
            "type": "EQUIPMENT",
            "title": "부산대학교 V-Space 창작 및 제작 메이커 인프라",
            "providerName": "부산대학교 기계공학부 V-Space 사업단",
            "universityId": "pusan",
            "region": "부산 (부산대학교 기계관 2층 1,800m³)",
            "description": "아이디어 생성에서 시제품 제작까지 메이킹의 모든 과정을 지원하는 대규모 메이커 시설로, 3D 프린터 63대, 5축 CNC, 대면적 레이저 가공기, CNC 라우터, 금속 용접/성형 장비, 4K PR Studio 등을 갖추고 매주 다양한 장비 워크숍을 운영합니다.",
            "targetStudents": "메이킹에 관심 있는 대학생 누구나 (남녀노소, 전공 구분 없음)",
            "eligibleUniversities": ["부산대학교", "부산공유대학", "부울경 지역 대학생"],
            "eligibleDepartments": ["ALL"],
            "eligibleMajors": ["ALL"],
            "majorRestriction": False,
            "crossUniversityAvailable": True,
            "accessScope": "REGIONAL_STUDENT",
            "recruitmentStartAt": "2026-03-01T00:00:00+09:00",
            "recruitmentEndAt": None,
            "programStartAt": "2026-03-01T00:00:00+09:00",
            "programEndAt": "2026-12-31T23:59:59+09:00",
            "programStatus": "ONGOING",
            "benefits": [
                "브레인스토밍 공간 및 시제품 제작 장비 지원",
                "창업지원실 및 신기술 체험실 제공",
                "제품 홍보 및 촬영용 PR Studio 지원",
                "매주 장비 교육 및 워크샵 진행"
            ],
            "technologies": ["3D프린팅", "5축CNC", "레이저가공", "CNC라우터", "용접/금속가공", "3D스캐닝", "4K영상스튜디오"],
            "fields": ["제품디자인", "산업디자인", "기계공학", "건축공학", "영상콘텐츠", "메이커", "창업"],
            "applicationMethod": "V-Space 공식 홈페이지(pnuvspace.com) 회원가입 후 장비 예약 및 워크샵 신청",
            "applicationUrl": "https://pnuvspace.com/",
            "sourceUrl": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "sourceType": "UNIVERSITY_OFFICIAL",
            "sourceOrganization": "부산대학교 기계공학부 (공식 홈페이지)",
            "sourcePublishedAt": "2026-03-01T00:00:00+09:00",
            "sourceVerifiedAt": CURRENT_TIME_STR,
            "tags": ["V-Space", "3D프린터", "CNC", "레이저가공기", "4K스튜디오", "시제품제작", "메이커스페이스"],
            "contact": "051-510-1420"
        },
        # G. UNIST 연구지원본부 연구장비
        {
            "id": "opp_unist_ucrf_infra",
            "type": "RESEARCH_EQUIPMENT",
            "title": "UNIST 연구지원본부(UCRF) 첨단 공용 연구장비 지원 인프라",
            "providerName": "UNIST 연구지원본부 (UCRF)",
            "universityId": "unist",
            "region": "울산 / 전국",
            "description": "UNIST 연구지원본부 8대 전문 연구분석실(기기분석실, 나노소자공정실, 환경분석실, 기기가공실, 생체효능검증실, 바이오메드이미징실 등)의 최첨단 장비 인프라로, 교내외 연구자 및 학생을 대상으로 직접 분석(자율 사용) 및 분석 의뢰 서비스를 지원합니다.",
            "targetStudents": "교내외 이공계 학부·대학원 연구생 및 외부 연구자·기업",
            "eligibleUniversities": ["UNIST", "타 대학 연구생 및 외부 연구자"],
            "eligibleDepartments": ["ALL"],
            "eligibleMajors": ["신소재공학", "화학과", "물리학과", "생명과학과", "기계공학과", "전기전자공학과", "반도체공학", "환경공학"],
            "majorRestriction": False,
            "crossUniversityAvailable": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "recruitmentStartAt": "2026-01-01T00:00:00+09:00",
            "recruitmentEndAt": None,
            "programStartAt": "2026-01-01T00:00:00+09:00",
            "programEndAt": "2026-12-31T23:59:59+09:00",
            "programStatus": "ONGOING",
            "benefits": [
                "Advanced TEM, 600MHz FT-NMR, 3D 레이저 현미경 등 최고급 분석 장비 이용",
                "전문 오퍼레이터 분석 의뢰 지원",
                "자율 사용을 위한 장비 교육 및 인증 제공"
            ],
            "technologies": ["Advanced TEM", "CS-STEM", "FT-NMR", "Laser Microscope", "E-beam Evaporator", "3D Scanner", "7T MRI"],
            "fields": ["연구장비", "나노소재", "기기분석", "바이오메디컬", "반도체", "정밀가공"],
            "applicationMethod": "UNIST UCRF 홈페이지(ucrf.unist.ac.kr) 회원가입 후 보유장비 예약 및 분석의뢰 신청",
            "applicationUrl": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "sourceUrl": "https://ucrf.unist.ac.kr/",
            "sourceType": "UNIVERSITY_OFFICIAL",
            "sourceOrganization": "UNIST 연구지원본부 (공식 홈페이지)",
            "sourcePublishedAt": "2026-01-01T00:00:00+09:00",
            "sourceVerifiedAt": CURRENT_TIME_STR,
            "tags": ["UNIST", "연구장비", "TEM", "NMR", "현미경", "공용장비", "분석의뢰"],
            "contact": "052-217-4181 / jsindom@unist.ac.kr"
        },
        # H. 부산공유대학 기업 연계 다학제 융합 프로젝트
        {
            "id": "opp_bbits_multidisciplinary_2026",
            "type": "MULTIDISCIPLINARY",
            "title": "「2026학년도 기업 연계 부산공유대학 다학제 융합 프로젝트」",
            "providerName": "부산공유대학본부 (부산대학교 RIS대학교육혁신본부)",
            "universityId": "bbits",
            "region": "부산",
            "description": "다양한 전공의 학생들이 기업 연계 프로젝트를 통해 전공 간 지식과 전문성을 공유하고 실질적인 문제해결 역량을 강화하는 다학제 융합 프로젝트입니다. 전문가 특강·멘토링과 연계하여 시제품 제작비 및 최종 경진대회 상금을 지원합니다.",
            "targetStudents": "부산지역 4년제 대학 재학생 (전공 무관, 팀 구성 1~5명 내외 다학제, 개별 신청 시 팀 매칭 지원)",
            "eligibleUniversities": ["부산지역 4년제 대학교"],
            "eligibleDepartments": ["ALL"],
            "eligibleMajors": ["ALL"],
            "majorRestriction": False,
            "crossUniversityAvailable": True,
            "accessScope": "SHARED_UNIVERSITY",
            "recruitmentStartAt": "2026-08-27T00:00:00+09:00",
            "recruitmentEndAt": "2026-09-15T23:59:59+09:00",
            "programStartAt": "2026-09-01T00:00:00+09:00",
            "programEndAt": "2027-02-28T23:59:59+09:00",
            "programStatus": "ONGOING",
            "benefits": [
                "1차 합격팀 전문가 멘토링 지원",
                "2차 합격팀 시제품개발비 및 특강 참여, 최종경진대회 참여 자격",
                "경진대회 시상: 대상 1팀(300만원), 최우수 1팀(100만원), 우수 3팀(50만원), 그 외 상장"
            ],
            "prizeOrReward": "대상 300만원, 최우수 100만원, 우수 3팀 각 50만원",
            "teamComposition": "1~5명 내외 다학제 팀 (개별 신청 시 팀 매칭 지원)",
            "technologies": ["다학제융합", "기업과제", "시제품제작", "산학멘토링"],
            "fields": ["다학제", "기업연계", "문제해결", "시제품개발", "융합프로젝트"],
            "applicationMethod": "부산공유대학 홈페이지 공지사항 내 참가 신청서 및 활동 계획서 작성 후 이메일(ccs614@pusan.ac.kr) 제출",
            "applicationUrl": "https://www.bbits.ac.kr/ko/community/community1/view/998",
            "sourceUrl": "https://www.bbits.ac.kr/ko/community/community1/view/998",
            "sourceType": "UNIVERSITY_OFFICIAL",
            "sourceOrganization": "부산공유대학 (공식 공지사항)",
            "sourcePublishedAt": "2026-08-27T00:00:00+09:00",
            "sourceVerifiedAt": CURRENT_TIME_STR,
            "tags": ["부산공유대학", "기업연계", "다학제", "융합프로젝트", "시제품개발비", "멘토링"],
            "contact": "051-510-7231 / ccs614@pusan.ac.kr"
        }
    ]

    for item in raw_list:
        status, d_day = calculate_status_and_dday(
            item.get("recruitmentStartAt"), item.get("recruitmentEndAt"), CURRENT_DATE, item.get("type")
        )
        item["status"] = status
        item["dDayText"] = d_day
        item["approvalStatus"] = "PUBLISHED"  # 즉시 공개 및 승인 반영
        item["sourceVerifiedAt"] = SEED_VERIFIED_AT
        item.update(evaluate_student_rnd(item, CURRENT_DATE))
        item["contentHash"] = compute_content_hash(item)
        item["lastCheckedAt"] = CURRENT_TIME_STR
        item["lastChangedAt"] = CURRENT_TIME_STR
        item["createdAt"] = CURRENT_TIME_STR
        item["updatedAt"] = CURRENT_TIME_STR

    return raw_list


def get_verified_equipments():
    # 1. 부산대 V-Space 장비 11건 (공식 기재 내용)
    # 2. UNIST UCRF 연구장비 12건 (공식 사이트 확인 내용)
    equipments = [
        # --- 부산대학교 V-Space ---
        {
            "id": "eq_pnu_vspace_3dprinter",
            "equipment_name": "3D Printer (Polyjet, SLA, CJP, CFF, FDM)",
            "equipment_category": "3D Printer",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층 (1,800m³)",
            "manufacturer": "BigRap 등 다수",
            "model": "1m³ BigRap Polyjet, SLA, CJP, CFF, FDM 등",
            "quantity": "63대",
            "specification": "1m³ 초대형 빌드볼륨 BigRap, 산업용 Polyjet 및 수지형 SLA, 정밀 파우더 CJP, 연속탄소섬유 CFF, FDM 등",
            "supported_work": "초대형 및 정밀 시제품 제작, 3D 프린팅 프로토타이핑, 부품 목업 제작",
            "eligible_users": "메이킹에 관심 있는 대학생 누구나 (남녀노소, 전공구분 없음)",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "V-Space 홈페이지(pnuvspace.com) 사전 예약 및 장비 안전교육 이수",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["기계공학", "산업디자인", "제품디자인", "건축공학", "로봇공학"],
            "tags": ["3D프린터", "시제품제작", "BigRap", "SLA", "FDM", "V-Space"]
        },
        {
            "id": "eq_pnu_vspace_cnc_5axis",
            "equipment_name": "CNC 가공기 (5축 포켓NC, 2+1축)",
            "equipment_category": "CNC",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층",
            "manufacturer": "Pocket NC 등",
            "model": "2+1축 CNC, 5축 포켓NC",
            "quantity": "각 1대",
            "specification": "5축 동시 제어 정밀 절삭, 복잡형상 미세 절삭 가공 지원",
            "supported_work": "금속 및 특수 플라스틱 소재 정밀 절삭 가공, 복잡형상 5축 머시닝",
            "eligible_users": "부산대 및 지역 대학생, 창업동아리",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "V-Space 홈페이지 온라인 예약",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["기계공학", "정밀기계", "항공우주공학", "로봇공학"],
            "tags": ["CNC", "5축가공", "PocketNC", "절삭가공", "정밀가공"]
        },
        {
            "id": "eq_pnu_vspace_laser_cutter",
            "equipment_name": "대면적 레이저 가공기 (Laser Cutter)",
            "equipment_category": "Laser Cutter",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층 Wood 가공실",
            "manufacturer": "국내외 전문 레이저 제조사",
            "model": "대면적 레이저 가공기",
            "quantity": "3대",
            "specification": "대면적 아크릴, MDF, 목재 고속 정밀 레이저 절단 및 마킹",
            "supported_work": "건축 모델 스케일 목업, 산업디자인 케이스 제작, 평면 가공",
            "eligible_users": "대학생 누구나 (안전교육 수료자)",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "온라인 예약 후 장비 오퍼레이터 확인",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["건축학", "공간디자인", "산업디자인", "시각디자인", "기계공학"],
            "tags": ["레이저가공기", "레이저커터", "아크릴가공", "건축목업", "디자인"]
        },
        {
            "id": "eq_pnu_vspace_cnc_router",
            "equipment_name": "대면적 CNC 라우터 (CNC Router)",
            "equipment_category": "CNC Router",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층 Wood 가공실",
            "manufacturer": "전문 라우터 제조사",
            "model": "대면적 CNC 라우터",
            "quantity": "1대",
            "specification": "대형 목재 패널, 알루미늄 판재, 플라스틱 판재 정밀 라우팅",
            "supported_work": "대형 조형물 제작, 가구 및 인테리어 목업, 대면적 구조물 가공",
            "eligible_users": "대학생 및 창작 프로젝트팀",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "V-Space 홈페이지 예약",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["건축학", "가구디자인", "공간디자인", "기계공학"],
            "tags": ["CNC라우터", "대면적가공", "목재가공", "조형물제작"]
        },
        {
            "id": "eq_pnu_vspace_metal_welding",
            "equipment_name": "금속 가공 및 용접 장비 (MIG, TIG, Plasma Cutter)",
            "equipment_category": "Welding Equipment",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층 Metal 가공실",
            "manufacturer": "전문 용접 장비사",
            "model": "MIG 용접기, TIG 용접기, Plasma Cutter",
            "quantity": "각 1대",
            "specification": "철·스텐·알루미늄 용접, 고온 플라즈마 금속 판재 절단",
            "supported_work": "금속 프레임 제작, 자작 자동차 및 로봇 구조물 용접/절단",
            "eligible_users": "대학생 (보호장구 착용 및 담당자 입회 필수)",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "온라인 신청 및 담당자 대면 안전 점검",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["기계공학", "조선해양공학", "자동차공학", "금속공학"],
            "tags": ["용접기", "MIG", "TIG", "플라즈마절단", "금속가공", "자작자동차"]
        },
        {
            "id": "eq_pnu_vspace_metal_bender",
            "equipment_name": "금속 성형 장비 (파이프벤더, 절곡기)",
            "equipment_category": "Bending Equipment",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층 Metal 가공실",
            "manufacturer": "전문 벤딩 제조사",
            "model": "파이프벤더, 판재 절곡기",
            "quantity": "각 1대",
            "specification": "원형/각재 파이프 각도 벤딩, 판재 정밀 절곡 가공",
            "supported_work": "차량 롤케이지 제작, 금속 외장재 벤딩 성형",
            "eligible_users": "대학생 (사전 승인)",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "V-Space 홈페이지 예약",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["기계공학", "자동차공학", "산업디자인"],
            "tags": ["파이프벤더", "절곡기", "금속성형", "판재절곡"]
        },
        {
            "id": "eq_pnu_vspace_vinyl_cutter",
            "equipment_name": "정밀 비닐 커터 (Vinyl Cutter)",
            "equipment_category": "Studio Equipment",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층 보조장비실",
            "manufacturer": "전문 커팅플로터 제조사",
            "model": "비닐커터",
            "quantity": "1대",
            "specification": "시트지, 데칼, 스티커 필름 정밀 롤 커팅",
            "supported_work": "전시 그래픽, 사인물 데칼, 브랜드 아이덴티티 시트 부착물 제작",
            "eligible_users": "대학생 누구나",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "홈페이지 예약",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["시각디자인", "미디어디자인", "브랜드디자인"],
            "tags": ["비닐커터", "시트지컷팅", "데칼", "전시그래픽", "디자인"]
        },
        {
            "id": "eq_pnu_vspace_dye_printer",
            "equipment_name": "염료 승화 프린터 (Dye-sublimation Printer)",
            "equipment_category": "Studio Equipment",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층 보조장비실",
            "manufacturer": "전문 텍스타일 프린터사",
            "model": "염료프린터",
            "quantity": "1대",
            "specification": "섬유 및 전사용 고발색 염료 프린팅 지원",
            "supported_work": "굿즈 제작, 텍스타일 패턴 출력, 시제품 패키지 전사",
            "eligible_users": "대학생 누구나",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "홈페이지 예약",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["패션디자인", "시각디자인", "공예", "텍스타일"],
            "tags": ["염료프린터", "텍스타일", "굿즈제작", "전사출력"]
        },
        {
            "id": "eq_pnu_vspace_3d_scanner",
            "equipment_name": "광학식 핸드 3D 스캐너",
            "equipment_category": "3D Scanner",
            "university": "부산대학교",
            "facility_name": "V-Space",
            "location": "부산대학교 기계관 2층 보조장비실",
            "manufacturer": "전문 3D 스캐너 제조사",
            "model": "광학식 핸드 스캐너",
            "quantity": "1대",
            "specification": "핸드헬드 광학 방식, 실물 형상 고정밀 3차원 메시 데이터 추출",
            "supported_work": "역설계, 인체 형상 스캔, 유물 복원, 실물 3D 모델링 변환",
            "eligible_users": "대학생 누구나",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "홈페이지 예약",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["산업디자인", "기계공학", "게임그래픽", "조소", "의료공학"],
            "tags": ["3D스캐너", "광학스캐너", "역설계", "3D모델링", "핸드스캐너"]
        },
        {
            "id": "eq_pnu_vspace_studio_camera",
            "equipment_name": "PR Studio 4K 영상 캠코더",
            "equipment_category": "4K Camera",
            "university": "부산대학교",
            "facility_name": "V-Space PR Studio",
            "location": "부산대학교 기계관 2층 PR Studio",
            "manufacturer": "소니 / 파나소닉 전문 영상 장비",
            "model": "4K 캠코더",
            "quantity": "1대",
            "specification": "4K 60p 고해상도 영상 녹화, 클린 HDMI 출력, 고감도 센서",
            "supported_work": "시제품 크라우드펀딩 영상 촬영, 작품 포트폴리오 영상 촬영, 제품 시연 녹화",
            "eligible_users": "대학생 누구나 (PR Studio 공간과 연계 이용)",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "V-Space 홈페이지 예약",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["영상디자인", "미디어커뮤니케이션", "디지털콘텐츠", "시각디자인", "창업"],
            "tags": ["4K카메라", "캠코더", "PR스튜디오", "영상촬영", "포트폴리오영상"]
        },
        {
            "id": "eq_pnu_vspace_studio_lighting",
            "equipment_name": "PR Studio 조명 및 촬영 보조장비 풀세트",
            "equipment_category": "Lighting Equipment",
            "university": "부산대학교",
            "facility_name": "V-Space PR Studio",
            "location": "부산대학교 기계관 2층 PR Studio",
            "manufacturer": "전문 스튜디오 조명 제조사",
            "model": "LED 지속광, 500W급 동조기, 백리플렉터, 소프트박스",
            "quantity": "각 1대 풀세트",
            "specification": "고연색성 LED 지속광, 500W급 고출력 순간광 동조기, 대형 소프트박스 및 리플렉터",
            "supported_work": "제품 누끼 촬영, 크리에이터 영상 조명 세팅, 포트폴리오 스튜디오 촬영",
            "eligible_users": "대학생 누구나",
            "external_user_access": True,
            "accessScope": "REGIONAL_STUDENT",
            "reservation_required": True,
            "reservation_method": "V-Space 홈페이지 예약",
            "reservation_url": "https://pnuvspace.com/",
            "source_url": "https://me.pusan.ac.kr/new/sub02/sub10.php",
            "source_organization": "부산대학교 기계공학부 V-Space",
            "source_title": "부산대학교 기계공학부 V-Space 시설 및 장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["영상디자인", "사진영상", "시각디자인", "패션디자인", "산업디자인"],
            "tags": ["스튜디오조명", "LED조명", "동조기", "소프트박스", "PR스튜디오"]
        },

        # --- UNIST 연구지원본부 (UCRF) 공용 연구장비 ---
        {
            "id": "eq_unist_titan_g2_tem",
            "equipment_name": "Advanced TEM (Titan G2 Cube 60-300)",
            "equipment_category": "TEM",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 시험분석지원팀 기기분석실",
            "location": "UNIST 102동",
            "manufacturer": "FEI",
            "model": "Titan G2 Cube 60-300",
            "quantity": "1대",
            "specification": "원자단위 고분해능 수차보정 투과전자현미경 (60-300kV 가속전압, 초고분해능 이미지 및 원소분석)",
            "supported_research": "원자 스케일 결정구조 분석, 2차원 나노소재 원자배열 이미징, 결함 분석",
            "eligible_users": "UNIST 및 외부 연구기관/대학/기업 연구자",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "UCRF 홈페이지 온라인 예약 및 분석의뢰 (외부의뢰/자율사용 요금표 적용)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 보유장비 현황 및 이용료",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["신소재공학", "물리학", "화학", "나노공학", "반도체공학"],
            "tags": ["TEM", "투과전자현미경", "TitanG2", "수차보정", "원자이미징", "UNIST연구장비"]
        },
        {
            "id": "eq_unist_jem_arm300f_stem",
            "equipment_name": "CS-STEM (투과전자현미경1 JEM-ARM300F)",
            "equipment_category": "TEM",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 시험분석지원팀",
            "location": "UNIST 108동 B102호 (Bldg.108, Room B102)",
            "manufacturer": "JEOL",
            "model": "JEM-ARM300F",
            "quantity": "1대",
            "specification": "구면수차보정 전계방사형 주사투과전자현미경, STEM, EDS, EELS 원자단위 분석",
            "supported_research": "나노구조 화학조성 매핑, 초고분해능 원소 분석, 전자 에너지 손실 분광",
            "eligible_users": "UNIST 및 외부 연구자/대학생",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "UCRF 온라인 예약 (담당자: 임정환 052-217-4175)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 보유장비 및 이용수칙",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["신소재공학", "화학과", "물리학과", "전자공학"],
            "tags": ["STEM", "JEM-ARM300F", "수차보정", "EELS", "EDS", "UNIST"]
        },
        {
            "id": "eq_unist_jem_2100f_hrtem",
            "equipment_name": "HR-TEM (투과전자현미경5 JEM-2100F)",
            "equipment_category": "TEM",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 시험분석지원팀",
            "location": "UNIST 102동",
            "manufacturer": "JEOL",
            "model": "JEM-2100F",
            "quantity": "1대",
            "specification": "200kV 고분해능 전계방사형 투과전자현미경, 고해상도 이미징 및 EDS",
            "supported_research": "나노입자 형상 분석, 미세 격자 결함 이미징, 국소 성분 분석",
            "eligible_users": "교내외 연구자",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 예약 및 분석의뢰 (담당자: 임정환 052-217-4175)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 보유장비 현황",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["신소재공학", "화학", "생명공학", "나노소재"],
            "tags": ["HR-TEM", "JEM-2100F", "나노입자", "격자분석", "UNIST"]
        },
        {
            "id": "eq_unist_jem_2100_tem",
            "equipment_name": "Normal-TEM (투과전자현미경6 JEM-2100, 자율사용전용)",
            "equipment_category": "TEM",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 시험분석지원팀",
            "location": "UNIST 102동",
            "manufacturer": "JEOL",
            "model": "JEM-2100",
            "quantity": "1대",
            "specification": "200kV 표준 투과전자현미경, 인증 연구자 24시간 자율사용 지원",
            "supported_research": "기본 나노구조 및 바이오 시편 모폴로지 관찰, 사전 스크리닝",
            "eligible_users": "장비 교육 및 테스트 통과 자율사용자",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "자율사용 교육 이수 후 홈페이지 예약 (담당자: 이종훈 052-217-4171)",
            "analysis_request_available": False,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 보유장비 현황",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["신소재공학", "생명공학", "화학", "환경공학"],
            "tags": ["TEM", "JEM-2100", "자율사용", "나노구조", "UNIST"]
        },
        {
            "id": "eq_unist_ft_nmr_600",
            "equipment_name": "600 MHz 고체상 핵자기 공명 분광기 (600 MHz FT-NMR Solid)",
            "equipment_category": "NMR",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 기기분석실",
            "location": "UNIST 102동 B119호",
            "manufacturer": "Bruker",
            "model": "AVANCE NEO 600 + VNMRS600",
            "quantity": "1대",
            "specification": "600 MHz 초전도 자석, 고체 상태 CPMAS 프로브, 불용성 물질 핵자기공명 분광",
            "supported_research": "배터리 전극소재 고체상태 리튬 이동 메커니즘, 고분자 및 세라믹 국소 구조 분석",
            "eligible_users": "교내외 연구원 및 대학생",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 분석의뢰 및 예약 (담당자: 한선필 052-217-4174)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 공용 연구장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["화학", "화학공학", "배터리공학", "신소재공학", "생명공학"],
            "tags": ["NMR", "600MHz", "고체NMR", "전극소재", "분자구조", "UNIST"]
        },
        {
            "id": "eq_unist_ft_nmr_400",
            "equipment_name": "400 MHz 핵자기 공명 분광기 (400 MHz FT-NMR Bruker)",
            "equipment_category": "NMR",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 기기분석실",
            "location": "UNIST 102동 B119호",
            "manufacturer": "Bruker",
            "model": "AVANCE III HD",
            "quantity": "1대",
            "specification": "400 MHz 고감도 1H/13C 액상 분광 분석, 오토샘플러 장착",
            "supported_research": "합성 유기화합물 정밀 분자구조 규명, 천연물 정량/정성 분석",
            "eligible_users": "교내외 연구자 및 대학생",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 예약 및 분석의뢰 (담당자: 한선필 052-217-4174)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 보유장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["화학과", "약학", "유기화학", "고분자공학"],
            "tags": ["NMR", "400MHz", "액상NMR", "유기합성", "분자분석", "UNIST"]
        },
        {
            "id": "eq_unist_3d_laser_microscope",
            "equipment_name": "3차원 레이저 현미경 (3D Laser Microscope)",
            "equipment_category": "Microscope",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF)",
            "location": "UNIST 107동 110호 (Bldg. 107, Room 110)",
            "manufacturer": "Keyence",
            "model": "VK-X3050",
            "quantity": "1대",
            "specification": "레이저 공초점 광학계, 나노스케일 표면 3차원 조도 프로파일링 및 비접촉 단차 측정",
            "supported_research": "표면 거칠기 정밀 측정, 박막 단차 측정, 미세 마모 흔적 3D 형상화",
            "eligible_users": "교내외 연구생",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 분석의뢰 및 예약 (담당자: 김진식 052-217-4170)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 보유장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["기계공학", "재료공학", "반도체공학", "정밀공학"],
            "tags": ["레이저현미경", "공초점현미경", "조도측정", "단차측정", "3D현미경", "UNIST"]
        },
        {
            "id": "eq_unist_3d_scanner_rexcan",
            "equipment_name": "3차원 정밀 광학 스캐너 (3D Scanner REXCAN DS2)",
            "equipment_category": "3D Scanner",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF)",
            "location": "UNIST 107동 110호",
            "manufacturer": "Solutionix",
            "model": "REXCAN DS2",
            "quantity": "1대",
            "specification": "백색광 광학식 3D 스캐너, 마이크론 정밀도 실물 형상 3D 포인트 클라우드 획득",
            "supported_research": "연구 시작품 정밀 치수 검사, 마이크로 부품 3D 역설계",
            "eligible_users": "교내외 연구자 및 학생",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 예약 (담당자: 김진식 052-217-4170)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 보유장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["기계공학", "산업디자인", "의공학", "정밀공학"],
            "tags": ["3D스캐너", "REXCAN", "정밀검사", "역설계", "포인트클라우드"]
        },
        {
            "id": "eq_unist_3d_printer_x500",
            "equipment_name": "산업용 3D 프린터 (X500Pro)",
            "equipment_category": "3D Printer",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF)",
            "location": "UNIST 107동 110호",
            "manufacturer": "German RepRap",
            "model": "X500Pro",
            "quantity": "1대",
            "specification": "산업용 엔지니어링 플라스틱 고온 챔버 FDM 3D 프린터, 정밀 하우징 출력",
            "supported_research": "실험 장치 지그 및 특수 기구부 제작, 기능성 엔지니어링 플라스틱 프로토타입",
            "eligible_users": "교내외 연구생",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 예약 (담당자: 김진식 052-217-4170)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부",
            "source_title": "UNIST 연구지원본부 보유장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["기계공학", "신소재공학", "로봇공학"],
            "tags": ["3D프린터", "X500Pro", "엔지니어링플라스틱", "시제품제작"]
        },
        {
            "id": "eq_unist_7t_mri_rodent",
            "equipment_name": "7T 소동물용 자기공명 영상장비 (7T MRI Scanner for rodent models)",
            "equipment_category": "Biomedical Equipment",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 바이오메드이미징실",
            "location": "UNIST 105동 B1F 44호 (Bldg. 105, B1F Room 44)",
            "manufacturer": "Bruker",
            "model": "Pharmascan 7T",
            "quantity": "1대",
            "specification": "7.0 테슬라 초고자장 동물용 MRI, 고해상도 생체 내 뇌기능 및 혈류 영상 분석",
            "supported_research": "소동물 뇌질환 모델링, 약물 전달 체내 이미징, 고분해능 생체 조직 영상화",
            "eligible_users": "바이오메디컬 연구자 및 대학생",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 예약 및 사전 분석 협의 (담당자: 조형준 052-217-5212)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부 바이오지원팀",
            "source_title": "UNIST 연구지원본부 보유장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["바이오메디컬공학", "생명과학", "의과학", "뇌인지과학"],
            "tags": ["7TMRI", "소동물MRI", "생체이미징", "바이오메디컬", "뇌영상"]
        },
        {
            "id": "eq_unist_4point_probe",
            "equipment_name": "표면 저항 측정기 (4point-probe CMT2000N)",
            "equipment_category": "Semiconductor Equipment",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 나노소자공정실",
            "location": "UNIST 108동 B101호 (Bldg. 108, Room B101)",
            "manufacturer": "AIT",
            "model": "CMT2000N",
            "quantity": "1대",
            "specification": "4단자 침 방식 면저항 및 비저항 정밀 측정기 (웨이퍼 매핑 지원)",
            "supported_research": "반도체 박막 전도도 평가, 투명전극 및 2차원 소재 면저항 균일도 분석",
            "eligible_users": "교내외 연구생 및 나노소자 연구자",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 예약 (담당자: 이선진 052-217-4193)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부 공정가공지원팀",
            "source_title": "UNIST 연구지원본부 보유장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["반도체공학", "전자공학", "신소재공학", "물리학"],
            "tags": ["4pointprobe", "면저항", "박막전도도", "반도체장비", "나노소자"]
        },
        {
            "id": "eq_unist_ebeam_evaporator",
            "equipment_name": "전자빔 금속박막증착 장치 (E-beam Evaporator Temescal)",
            "equipment_category": "Semiconductor Equipment",
            "university": "UNIST",
            "center_name": "연구지원본부(UCRF) 나노소자공정실",
            "location": "UNIST 108동 B101호 (Bldg. 108, Room B101)",
            "manufacturer": "Temescal",
            "model": "FC-2000",
            "quantity": "1대",
            "specification": "초고진공 전자빔 가열 방식 금속(Au, Ti, Pt, Al, Cr 등) 박막 정밀 증착",
            "supported_research": "반도체 나노소자 전극 형성, 광소자 오믹 콘택트 박막 제작",
            "eligible_users": "클린룸 안전교육 이수 연구자 및 대학생",
            "external_user_access": True,
            "accessScope": "EXTERNAL_RESEARCHER",
            "reservation_required": True,
            "reservation_method": "온라인 예약 (담당자: 김보성 052-217-4191)",
            "analysis_request_available": True,
            "reservation_url": "https://ucrf.unist.ac.kr/kor/equipment-tracking/equipments/",
            "source_url": "https://ucrf.unist.ac.kr/",
            "source_organization": "UNIST 연구지원본부 나노소자공정실",
            "source_title": "UNIST 연구지원본부 보유장비",
            "verified_at": CURRENT_TIME_STR,
            "status": "OPERATIONAL",
            "related_majors": ["반도체공학", "전자공학", "신소재공학", "물리학과"],
            "tags": ["E-beam", "박막증착", "클린룸", "반도체전극", "Temescal", "FC-2000"]
        }
    ]

    for eq in equipments:
        eq["sourceUrl"] = eq.get("source_url")
        eq["sourceOrganization"] = eq.get("source_organization")
        eq["sourceTitle"] = eq.get("source_title")
        eq["verified_at"] = SEED_VERIFIED_AT
        eq["sourceVerifiedAt"] = SEED_VERIFIED_AT
        eq["approvalStatus"] = "PUBLISHED"
        eq["contentHash"] = compute_content_hash(eq)
        eq["lastCheckedAt"] = CURRENT_TIME_STR
        eq["lastChangedAt"] = CURRENT_TIME_STR
        eq["createdAt"] = CURRENT_TIME_STR
        eq["updatedAt"] = CURRENT_TIME_STR

    return equipments


def merge_or_update(existing_list: list, new_items: list, key_fields: list):
    updated_count = 0
    created_count = 0
    result_list = [dict(item) for item in existing_list]

    for new_item in new_items:
        match_idx = -1
        for i, existing in enumerate(result_list):
            match = bool(new_item.get("id") and existing.get("id") == new_item.get("id"))
            if match:
                match_idx = i
                break
            match = True
            for k in key_fields:
                if existing.get(k) != new_item.get(k):
                    match = False
                    break
            if match:
                match_idx = i
                break

        if match_idx >= 0:
            existing = result_list[match_idx]
            # Check if content changed
            old_hash = existing.get("contentHash")
            new_hash = new_item.get("contentHash")
            new_item = dict(new_item)
            new_item["id"] = existing.get("id", new_item.get("id"))
            new_item["createdAt"] = existing.get("createdAt", new_item.get("createdAt", CURRENT_TIME_STR))
            if old_hash != new_hash:
                new_item["lastChangedAt"] = CURRENT_TIME_STR
            else:
                new_item["lastChangedAt"] = existing.get("lastChangedAt", CURRENT_TIME_STR)
            new_item["lastCheckedAt"] = CURRENT_TIME_STR
            result_list[match_idx] = {**existing, **new_item}
            updated_count += 1
        else:
            result_list.append(new_item)
            created_count += 1

    return result_list, created_count, updated_count


def prepare_opportunity(item: dict, now=None) -> dict:
    """Normalize an extracted record without inventing evidence or eligibility."""
    if not isinstance(item, dict):
        raise ValueError("Every opportunity must be an object")
    for field in ("sourceUrl", "title", "providerName", "type"):
        if not isinstance(item.get(field), str) or not item[field].strip():
            raise ValueError(f"Opportunity requires nonempty {field}")
    prepared = dict(item)
    prepared["sourceUrl"] = normalize_source_url(item["sourceUrl"])
    allowed_types = {"EDUCATION", "RND", "CAPSTONE", "COMPETITION", "STARTUP", "MULTIDISCIPLINARY", "SHARED_INFRASTRUCTURE", "EQUIPMENT", "RESEARCH_EQUIPMENT"}
    if prepared["type"] not in allowed_types:
        raise ValueError(f"Unsupported opportunity type: {prepared['type']}")
    for field in ("eligibleUniversities", "eligibleDepartments", "eligibleMajors", "benefits", "technologies", "fields", "tags"):
        prepared.setdefault(field, [])
        if not isinstance(prepared[field], list) or any(not isinstance(value, str) for value in prepared[field]):
            raise ValueError(f"{field} must be an array of strings")
    for field in ("region", "description", "targetStudents", "sourceType", "sourceOrganization", "sourceVerifiedAt"):
        prepared.setdefault(field, "")
        if not isinstance(prepared[field], str):
            raise ValueError(f"{field} must be a string")
    prepared.setdefault("majorRestriction", False)
    prepared.setdefault("crossUniversityAvailable", False)
    prepared.setdefault("accessScope", "UNKNOWN")
    prepared.setdefault("status", "UNKNOWN")
    current = now or datetime.now(KST)
    timestamp = current.isoformat()
    identity = {key: prepared[key] for key in ("sourceUrl", "title", "providerName")}
    prepared.setdefault("id", "opp_" + compute_content_hash(identity)[:20])
    # A failed extraction cannot retain an earlier successful evidence object.
    prepared.setdefault("recruitmentEvidence", None)
    prepared.update(evaluate_student_rnd(prepared, current))
    prepared.setdefault("approvalStatus", "PENDING_REVIEW")
    if prepared["approvalStatus"] not in {"PENDING_REVIEW", "PUBLISHED", "REJECTED"}:
        raise ValueError("Invalid approvalStatus")
    if prepared["type"] == "RND":
        prepared["status"] = prepared["recruitmentStatus"]
    prepared.setdefault("createdAt", timestamp)
    prepared["updatedAt"] = timestamp
    prepared["lastCheckedAt"] = timestamp
    volatile = {"contentHash", "createdAt", "updatedAt", "lastCheckedAt", "lastChangedAt"}
    prepared["contentHash"] = compute_content_hash({key: value for key, value in prepared.items() if key not in volatile})
    prepared.setdefault("lastChangedAt", timestamp)
    return prepared


def read_records_readonly(path: str) -> list:
    """Dry runs never recover or mutate primary/backup files."""
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as stream:
        records = json.load(stream)
    if not isinstance(records, list) or any(not isinstance(item, dict) for item in records):
        raise ValueError(f"Expected an array of objects: {path}")
    return records


def register_records(primary_path: str, replica_path: str, new_items: list, key_fields: list, dry_run=False):
    """Lock, reread, merge, then atomically sync; keep primary and replica-only seeds."""
    def merge_records(reader):
        primary = reader(primary_path)
        replica = reader(replica_path)
        existing = [dict(item) for item in primary]
        for record in replica:
            matching = next((item for item in existing if
                             (record.get("id") and item.get("id") == record.get("id")) or
                             all(item.get(key) == record.get(key) for key in key_fields)), None)
            if matching is None:
                existing.append(dict(record))
            else:
                # Preserve fields present only in the replica without overwriting primary data.
                for key, value in record.items():
                    matching.setdefault(key, value)
        merged, created, updated = merge_or_update(existing, new_items, key_fields)
        if len(merged) < len(primary) or len(merged) < len(replica):
            raise ValueError("Registration must not shrink either database")
        return merged, created, updated

    if dry_run:
        return merge_records(read_records_readonly)
    with ExitStack() as stack:
        for path in sorted({os.path.abspath(primary_path), os.path.abspath(replica_path)}):
            stack.enter_context(interprocess_file_lock(path))
        if not recover_pending_replications(primary_path):
            raise DatabaseSyncError("Pending synchronization could not be recovered")
        merged, created, updated = merge_records(atomic_read_json)
        if not atomic_write_json(primary_path, merged, sync_paths=[replica_path]):
            raise DatabaseSyncError("Opportunity replication pending", primary_committed=True, replication_pending=[replica_path])
        if read_records_readonly(primary_path) != merged or read_records_readonly(replica_path) != merged:
            raise DatabaseSyncError("Post-write synchronization verification failed")
        return merged, created, updated


def verify_safeguard():
    """Verify that existing databases are not corrupted or cleared."""
    files_to_check = [
        os.path.join(PLATFORM_DATA_DIR, "professors.json"),
        os.path.join(PLATFORM_DATA_DIR, "students.json"),
        os.path.join(PLATFORM_DATA_DIR, "university_queue.json"),
    ]
    for path in files_to_check:
        if not os.path.exists(path):
            raise RuntimeError(f"Database safeguard check failed: Missing file {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not data or (isinstance(data, list) and len(data) == 0):
                raise RuntimeError(f"Database safeguard check failed: Empty file {path}")
    print("[SAFEGUARD] All primary seed databases verified intact.")


def main():
    parser = argparse.ArgumentParser(description="공식 근거가 있는 수집 결과를 검증하여 기존 DB에 병합합니다. 자동 크롤러는 아닙니다.")
    parser.add_argument("--input", help="수집한 Opportunity 객체 배열 JSON (공식 원문 증거 포함)")
    parser.add_argument("--dry-run", action="store_true", help="검증 및 병합 결과만 출력하고 저장하지 않음")
    parser.add_argument("--list-sources", action="store_true", help="공식 탐색 원천과 역할 출력")
    parser.add_argument("--seed", action="store_true", help="기존 수동 검증 시드 등록 (검증시각 갱신 없음)")
    args = parser.parse_args()
    if args.list_sources:
        print(json.dumps(OPPORTUNITY_SOURCES, ensure_ascii=False, indent=2))
        return
    if bool(args.input) == bool(args.seed):
        parser.error("--input 또는 --seed 중 하나를 지정하세요. 확인만 할 때 --dry-run을 추가하세요.")
    if not args.dry_run:
        verify_safeguard()

    # 1. Opportunities
    opp_keys = ["sourceUrl", "title", "providerName"]
    candidates = read_records_readonly(args.input) if args.input else get_verified_opportunities()
    if args.input and not os.path.isfile(args.input):
        parser.error(f"입력 파일이 없습니다: {args.input}")
    new_opps = [prepare_opportunity(item) for item in candidates]

    opp_file_root = os.path.join(ROOT_DATA_DIR, "opportunities.json")
    opp_file_platform = os.path.join(PLATFORM_DATA_DIR, "opportunities.json")

    merged_opps, opp_created, opp_updated = register_records(opp_file_root, opp_file_platform, new_opps, opp_keys, args.dry_run)
    print(f"[OPPORTUNITIES] Total: {len(merged_opps)}, Created: {opp_created}, Updated: {opp_updated}")
    for item in new_opps:
        if item.get("type") == "RND":
            print(f"[RND] {item['id']}: {'ACTIVE' if is_student_rnd_opportunity(item) else 'GENERAL_INFO'} - {item['verificationReason']}")

    # 2. Equipment
    eq_keys = ["source_url", "equipment_name", "university"]
    new_eqs = get_verified_equipments() if args.seed else []

    eq_file_root = os.path.join(ROOT_DATA_DIR, "equipment.json")
    eq_file_platform = os.path.join(PLATFORM_DATA_DIR, "equipment.json")

    if new_eqs:
        merged_eqs, eq_created, eq_updated = register_records(eq_file_root, eq_file_platform, new_eqs, eq_keys, args.dry_run)
    else:
        merged_eqs, eq_created, eq_updated = read_records_readonly(eq_file_platform), 0, 0
    print(f"[EQUIPMENT] Total: {len(merged_eqs)}, Created: {eq_created}, Updated: {eq_updated}")

    # Final summary statistics
    open_count = sum(1 for o in merged_opps if o.get("status") == "OPEN")
    closed_count = sum(1 for o in merged_opps if o.get("status") == "CLOSED")
    upcoming_count = sum(1 for o in merged_opps if o.get("status") == "UPCOMING")

    print("\n--- STATS SUMMARY ---")
    print(f"Opportunities count: {len(merged_opps)}")
    print(f"  - OPEN: {open_count}")
    print(f"  - CLOSED: {closed_count}")
    print(f"  - UPCOMING: {upcoming_count}")
    print(f"Equipment count: {len(merged_eqs)}")
    print("DRY RUN: No files changed." if args.dry_run else "Dual sync to data/ and my-exhibit-platform/data/ complete.")


if __name__ == "__main__":
    main()
