#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_nst_eligibility_check.py
Verify eligibility check on real NST item.
"""

import os
import sys
from datetime import datetime, timezone, timedelta

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

KST = timezone(timedelta(hours=9))
NOW = datetime.now(KST)

from research.opportunity_eligibility import evaluate_student_rnd, is_student_rnd_opportunity

sample_item = {
    "type": "RND",
    "title": "[한국에너지기술연구원] 2026년도 학생연구원(학부생) 채용 공고",
    "providerName": "한국에너지기술연구원",
    "approvalStatus": "PUBLISHED",
    "sourceUrl": "https://www.nst.re.kr/www/selectBbsNttView.do?key=61&bbsNo=19&nttNo=52276",
    "eligibleAudience": ["대학생", "학부생", "학생연구원"],
    "recruitmentStartAt": "2026-09-29T09:00:00+09:00",
    "recruitmentEndAt": "2026-10-13T18:00:00+09:00",
    "recruitmentEvidence": {
        "sourceUrl": "https://www.kier.re.kr/board/view?linkId=262688&menuId=MENU00459",
        "sourceKind": "RESEARCH_INSTITUTE_OFFICIAL",
        "isOfficialDetail": True,
        "eligibilityText": "지원자격: 에너지·화공·기계 전공 대학생 및 학부생",
        "recruitmentText": "원서 접수 및 지원 모집: 2026. 9. 29. ~ 10. 13.",
        "verifiedAt": NOW.isoformat(),
        "rollingAdmission": False
    }
}

res = evaluate_student_rnd(sample_item, NOW)
print("evaluate_student_rnd result:", res)
active = is_student_rnd_opportunity(sample_item, NOW)
print("is_student_rnd_opportunity:", active)
