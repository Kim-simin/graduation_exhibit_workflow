"""
Student Eligibility Gate Processor
Audits all opportunities and applies strict student eligibility validation.
Categorizes items into:
- verified (studentParticipationVerified: true, studentEligible: true, eligibilityStatus: "verified")
- excluded (studentEligible: false, eligibilityStatus: "excluded", exclusionReason: "...")
- needs_review (eligibilityStatus: "needs_review", exclusionReason: "...")
Updates:
1. data/opportunities.json
2. admin/data/opportunities.json
3. web/data/published/opportunities.json
"""

import json
from pathlib import Path
from datetime import datetime, timezone

WORKSPACE = Path(__file__).resolve().parent.parent
FILES = [
    WORKSPACE / "data" / "opportunities.json",
    WORKSPACE / "admin" / "data" / "opportunities.json",
    WORKSPACE / "web" / "data" / "published" / "opportunities.json"
]

NOW_ISO = datetime.now(timezone.utc).isoformat()

VERIFIED_SPECS = {
    "opp_bbits_multidisciplinary_2026": {
        "applicantType": "undergraduate_student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "부산지역 4년제 대학 재학생",
        "eligibilityStatus": "verified",
        "eligibilityText": "지원자격: 부산지역 4년제 대학 재학생 (전공 무관, 팀 구성 1~5명 내외 다학제)",
        "eligibilityEvidence": "공식 공고 확인: 부산공유대학 참여 14개 대학 재학생 대상 기업 연계 다학제 융합 프로젝트 수강 및 시제품 제작 지원",
        "officialSourceUrl": "https://www.bbits.ac.kr/ko/community/community1/view/998",
    },
    "opp_global_ax_pbl_2026": {
        "applicantType": "undergraduate_student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "공학계열 재학생",
        "eligibilityStatus": "verified",
        "eligibilityText": "참가대상: 공학계열 대학생 및 학부 재학생 (선발인원 10명 내외)",
        "eligibilityEvidence": "공식 공고문 명시: 한국-인도네시아 공학계열 학부생 대상 AIoT 현장 실증 공학교육 참가자 모집",
        "officialSourceUrl": "https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511038&mCode=MN095&mgr_seq=3&mode=view&page=1",
    },
    "opp_pnu_capstone_2026_2_general": {
        "applicantType": "undergraduate_student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "학부 3학년 이상 재학생",
        "eligibilityStatus": "verified",
        "eligibilityText": "지원자격: 2026.2학기 캡스톤 디자인 정규 교과목 수강 학부 3학년 이상 재학생 (최소 3인 이상 팀)",
        "eligibilityEvidence": "공식 공고 확인: 캡스톤디자인 또는 종합설계 정규교과목 수강 재학생 팀 과제비 지원",
        "officialSourceUrl": "https://cse.pusan.ac.kr/bbs/cse/2056/1462942/artclView.do",
    },
    "opp_pnu_capstone_2026_2_partner": {
        "applicantType": "undergraduate_student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "학부 3학년 이상 재학생",
        "eligibilityStatus": "verified",
        "eligibilityText": "지원자격: 2026.2학기 캡스톤 디자인 정규 교과목 수강 학부 3학년 이상 재학생 (기업/지자체 연계형)",
        "eligibilityEvidence": "공식 공고 확인: 기업 및 지자체 연계 캡스톤디자인 수강 재학생 팀 지원",
        "officialSourceUrl": "https://cse.pusan.ac.kr/bbs/cse/2056/1462942/artclView.do",
    },
    "opp_gemini_academy_2026": {
        "applicantType": "undergraduate_student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "전국 대학생 (재학/휴학)",
        "eligibilityStatus": "verified",
        "eligibilityText": "모집대상: 전공 무관 모든 대학생 (부산 지역은 동의대학교에서 수강 가능, 타 지역도 신청 가능)",
        "eligibilityEvidence": "공식 공고 확인: 구글코리아·고용노동부 주관 전공 무관 모든 대학생 실전 AI 워크숍",
        "officialSourceUrl": "https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511268&mCode=MN095&mgr_seq=3&mode=view&page=1&searchID=title",
    },
    "opp_ai_startup_competition_2026": {
        "applicantType": "student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "전국 대학생 및 청년 예비창업팀",
        "eligibilityStatus": "verified",
        "eligibilityText": "참가대상: 전국 예비·신규창업팀(2~4인 이내의 팀)",
        "eligibilityEvidence": "공식 공고 확인: 전국 대학생 및 청년 예비창업팀(2~4인) 참가 가능 AI 창업 경진대회",
        "officialSourceUrl": "https://ai.pusan.ac.kr/bbs/ai/204/1463037/artclView.do",
    },
    "opp_bbits_infra_001": {
        "applicantType": "student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "부산공유대학 참여학생",
        "eligibilityStatus": "verified",
        "eligibilityEvidence": "공식 안내 확인: 부산공유대학 참여 14개 대학 재학생 대상 시설 대여 개방",
        "officialSourceUrl": "https://www.bbits.ac.kr/ko/support/studio/infra",
    },
    "opp_pnu_vspace_infra": {
        "applicantType": "student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "대학생 누구나",
        "eligibilityStatus": "verified",
        "eligibilityEvidence": "공식 안내 확인: 메이킹에 관심 있는 대학생 누구나 장비 이용 및 워크숍 지원",
        "officialSourceUrl": "https://me.pusan.ac.kr/new/sub02/sub10.php",
    },
    "opp_unist_ucrf_infra": {
        "applicantType": "student",
        "studentEligible": True,
        "studentEligibilityVerified": True,
        "eligibleStudentStatus": "이공계 학부·대학원 연구생",
        "eligibilityStatus": "verified",
        "eligibilityEvidence": "공식 안내 확인: 이공계 학부·대학원 연구생 첨단 공용 연구장비 지원",
        "officialSourceUrl": "https://ucrf.unist.ac.kr/",
    }
}

def determine_gate(opp):
    oid = opp.get("id", "")
    title = opp.get("title", "")
    desc = opp.get("description", "")
    target = opp.get("targetStudents", "")
    source_url = opp.get("sourceUrl", "")
    
    # 1. Known Verified
    if oid in VERIFIED_SPECS:
        spec = VERIFIED_SPECS[oid].copy()
        spec["lastVerifiedAt"] = NOW_ISO
        return spec
        
    # 2. NST Hiring notices
    if oid.startswith("opp_nst_"):
        # Postdoc or Researcher specific
        if "Post-doc" in title or "박사후" in title or "석사후" in title:
            return {
                "applicantType": "researcher",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "박사후/석사후 연구원 채용공고 (학부생 지원 불가)",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        if "위촉" in title:
            return {
                "applicantType": "researcher",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "위촉연구원 채용공고 (일반 학생 참여 프로젝트 아님)",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        if "석·박사학위과정생" in title or "연합대학원생" in title or "학생연구원" in title:
            return {
                "applicantType": "graduate_student",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "대학원 석·박사 학위과정생 모집공고 (학부생 지원 불가)",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        if "정규직" in title:
            return {
                "applicantType": "employee",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "정규직 채용공고",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        if "기간제" in title or "계약직" in title or "직원 채용" in title or "실무직" in title:
            return {
                "applicantType": "employee",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "계약직/기간제 직원 채용공고",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        return {
            "applicantType": "employee",
            "studentEligible": False,
            "studentEligibilityVerified": False,
            "eligibilityStatus": "excluded",
            "exclusionReason": "연구기관 채용공고",
            "officialSourceUrl": source_url,
            "lastVerifiedAt": NOW_ISO
        }
        
    # 3. NTIS Government R&D Programs (Institution/Faculty targeted)
    if oid.startswith("opp_ntis_"):
        if "혁신제품" in title or "규격추가" in title:
            return {
                "applicantType": "company",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "중소기업/법인 대상 혁신제품 규격 추가 모집",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        if "자율실험실" in title:
            return {
                "applicantType": "faculty",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "대학 전임교원(연구책임자) 대상 정부 과제 공모",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        return {
            "applicantType": "institution",
            "studentEligible": False,
            "studentEligibilityVerified": False,
            "eligibilityStatus": "excluded",
            "exclusionReason": "기관/연구단/기업 대상 정부 R&D 과제 공모 및 수요조사 (학생 직접 지원 불가)",
            "officialSourceUrl": source_url,
            "lastVerifiedAt": NOW_ISO
        }
        
    # 4. UniAll Pbanc (University grants/evaluations)
    if oid.startswith("opp_uniall_pbanc_"):
        return {
            "applicantType": "institution",
            "studentEligible": False,
            "studentEligibilityVerified": False,
            "eligibilityStatus": "excluded",
            "exclusionReason": "대학/산학협력단 기관 대상 정부 재정지원사업 공고 (학부생 직접 신청 불가)",
            "officialSourceUrl": source_url,
            "lastVerifiedAt": NOW_ISO
        }
        
    # 5. UniAll Team (Program Center Directories)
    if oid.startswith("opp_uniall_team_"):
        return {
            "applicantType": "institution",
            "studentEligible": False,
            "studentEligibilityVerified": False,
            "eligibilityStatus": "needs_review",
            "exclusionReason": "대학 사업단 디렉토리 정보 (개별 학생 직접 신청 프로젝트 공식 근거 확인 필요)",
            "officialSourceUrl": source_url,
            "lastVerifiedAt": NOW_ISO
        }
        
    # 6. K-Startup programs
    if oid.startswith("opp_ks_"):
        if "멤버십" in title or "SVC" in title:
            return {
                "applicantType": "startup",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "스타트업/창업기업 대상 입주 멤버십 모집 (법인/사업자 대상)",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        if "TIPS" in title or "팁스" in title:
            return {
                "applicantType": "startup",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "창업기업(법인) 대상 민간투자주도형 기술창업지원 (학부생 직접 참여 프로젝트 아님)",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        if "실리콘밸리" in title or "GTM" in title:
            return {
                "applicantType": "startup",
                "studentEligible": False,
                "studentEligibilityVerified": False,
                "eligibilityStatus": "excluded",
                "exclusionReason": "창업기업 대상 해외진출 지원사업 (법인/창업기업 대상)",
                "officialSourceUrl": source_url,
                "lastVerifiedAt": NOW_ISO
            }
        return {
            "applicantType": "unknown",
            "studentEligible": False,
            "studentEligibilityVerified": False,
            "eligibilityStatus": "needs_review",
            "exclusionReason": "중앙부처/지자체 창업지원사업 종합안내 (개별 지원 프로그램 아님)",
            "officialSourceUrl": source_url,
            "lastVerifiedAt": NOW_ISO
        }
        
    # Default fallback: needs_review
    return {
        "applicantType": "unknown",
        "studentEligible": False,
        "studentEligibilityVerified": False,
        "eligibilityStatus": "needs_review",
        "exclusionReason": "학생 직접 지원 자격 공식 근거 확인 필요",
        "officialSourceUrl": source_url,
        "lastVerifiedAt": NOW_ISO
    }

def process_all_files():
    for fpath in FILES:
        if not fpath.exists():
            print(f"Skipping {fpath} (does not exist)")
            continue
            
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        updated = []
        counts = {"verified": 0, "needs_review": 0, "excluded": 0}
        
        for item in data:
            gate_info = determine_gate(item)
            item.update(gate_info)
            status = gate_info["eligibilityStatus"]
            counts[status] = counts.get(status, 0) + 1
            updated.append(item)
            
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(updated, f, indent=2, ensure_ascii=False)
            
        print(f"Updated {fpath}: Total {len(updated)} items -> {counts}")

if __name__ == "__main__":
    process_all_files()
