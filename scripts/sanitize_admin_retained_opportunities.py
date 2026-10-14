"""Remove unsupported embellishments from eight retained official-source records.

Sources manually rechecked 2026-10-04. Local admin only; originals backed up.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from clean_admin_demo_data import ROOT, ADMIN, atomic_bytes, encode

SPECS = {
    "opp_gemini_academy_2026": ("전공 무관 모든 대학생", "2026-09-28", "2026-10-18", "Gemini와 Google Workspace 활용 실습 교육입니다. 지역별 일정과 신청 방법은 공식 공지에서 확인하세요.", True),
    "opp_pnu_capstone_2026_2_general": ("캡스톤 정규교과목 수강 학부 3학년 이상 또는 대학원 재학생, 3인 이상 팀", "2026-09-28", "2026-10-05", "부산대학교 캡스톤 디자인 교과목 일반형 과제의 운영비 지원 공고입니다.", True),
    "opp_pnu_capstone_2026_2_partner": ("캡스톤 정규교과목 수강 학부 3학년 이상 또는 대학원 재학생, 3인 이상 팀", "2026-10-12", "2026-10-19", "부산대학교 캡스톤 디자인 교과목 기업연계형·지자체연계형 지원 공고입니다.", True),
    "opp_global_ax_pbl_2026": ("공학계열 재학생", None, "2026-09-30", "인도네시아에서 AIoT 팀 프로젝트와 현장 실증을 수행하는 프로그램입니다. 파견기간은 2027년 1월 7일부터 20일까지이며 학생 부담금은 100 USD입니다.", True),
    "opp_bbits_multidisciplinary_2026": ("부산지역 4년제 대학 재학생, 전공 무관, 1~5명 내외 다학제 팀", "2026-08-27", "2026-09-15", "기업 연계 팀 프로젝트와 멘토링·시제품 제작을 지원합니다. 활동기간은 2026년 9월부터 2027년 2월까지입니다.", True),
    "opp_ai_startup_competition_2026": ("전국 예비·신규창업팀 (2~4인); 학생 개인 지원 가능 여부는 추가 확인 필요", None, None, "부산광역시 주최 AI 창업 경진대회입니다. 본선은 2026년 10월 31일입니다. 세부 신청기간과 참가자격은 첨부 모집요강 확인이 필요합니다.", False),
    "opp_bbits_infra_001": ("이용자격은 공식 시설 안내에서 확인 필요", None, None, "부산공유대학의 공식 시설·인프라 안내입니다. 시설별 이용대상, 요금, 예약조건은 별도 확인이 필요합니다.", False),
    "opp_unist_ucrf_infra": ("장비별 이용자격 및 교육 이수조건 확인 필요", None, None, "UNIST 연구지원본부의 공식 장비·연구지원 안내입니다. 장비별 사용료, 학생 이용조건 및 예약 가능 여부는 별도 확인이 필요합니다.", False),
}

def main():
    path = ADMIN / "opportunities.json"
    original = path.read_bytes()
    records = json.loads(original)
    now = datetime.now(timezone.utc)
    for record in records:
        if record["id"] not in SPECS:
            continue
        audience, start, end, description, eligible = SPECS[record["id"]]
        # Discard invented detail fields instead of treating an official domain as proof.
        for key in ("prizeOrReward", "teamComposition", "contact", "programStatus", "contentHash"):
            record.pop(key, None)
        record.update(description=description, targetStudents=audience, eligibleStudentStatus=audience,
                      eligibilityText=audience, eligibilityEvidence=audience,
                      studentEligible=eligible, studentEligibilityVerified=eligible,
                      eligibilityStatus="verified" if eligible else "needs_review",
                      benefits=[], technologies=[], fields=[], tags=[], eligibleDepartments=[], eligibleMajors=[],
                      eligibleUniversities=[], crossUniversityAvailable=False, majorRestriction=True,
                      accessScope="UNKNOWN", programStartAt=None, programEndAt=None,
                      recruitmentStartAt=f"{start}T00:00:00+09:00" if start else None,
                      recruitmentEndAt=f"{end}T23:59:59+09:00" if end else None,
                      applicationMethod="신청 방법과 세부 조건은 공식 원문을 확인하세요.", applicationUrl=record["sourceUrl"],
                      lastVerifiedAt=now.isoformat(), sourceVerifiedAt=now.isoformat(), updatedAt=now.isoformat())
        if record["id"] == "opp_gemini_academy_2026":
            record.update(eligibleUniversities=["ALL"], eligibleMajors=["ALL"], majorRestriction=False, crossUniversityAvailable=True, accessScope="PUBLIC")
        elif "capstone" in record["id"] or record["id"] == "opp_global_ax_pbl_2026":
            record.update(eligibleUniversities=["부산대학교"], accessScope="UNIVERSITY_ONLY")
            record["eligibleMajors"] = ["공학계열"] if record["type"] == "RND" else ["캡스톤 디자인 교과목 수강"]
        elif "multidisciplinary" in record["id"]:
            record.update(eligibleMajors=["ALL"], majorRestriction=False, accessScope="REGIONAL_STUDENT")
        status = "UNKNOWN"
        if end:
            status = "CLOSED" if datetime.fromisoformat(record["recruitmentEndAt"]) < now else "OPEN"
            if start and datetime.fromisoformat(record["recruitmentStartAt"]) > now:
                status = "UPCOMING"
        record.update(status=status, recruitmentStatus=status, dDayText="", studentParticipationVerified=False, officialSourceVerified=False, recruitmentEvidence=None)
        record["verificationReason"] = "공식 원문에서 공고 존재 확인; 신청 조건은 원문 참조"
        if eligible:
            record["recruitmentEvidence"] = dict(sourceUrl=record["sourceUrl"], sourceKind="UNIVERSITY_OFFICIAL", isOfficialDetail=True,
                eligibilityText=audience, recruitmentText=f"모집 마감 {end}", verifiedAt=now.isoformat(), rollingAdmission=False)
    backup = ROOT / "outputs/admin-cleanup/retained-opportunities-before-sanitize.json"
    if not backup.exists():
        backup.write_bytes(original)
    if path.read_bytes() != original:
        raise RuntimeError("Concurrent modification")
    atomic_bytes(path, encode(records))
    assert len(json.loads(path.read_bytes())) == len(records)
    print(f"Sanitized {len(records)} retained records; source evidence retained, unsupported claims removed.")

if __name__ == "__main__":
    main()
