"""Merge officially researched notices into local admin; never restore removed demo IDs."""
import json
from datetime import datetime, timezone
from clean_admin_demo_data import ROOT, ADMIN, atomic_bytes, encode

def merge_records(existing, incoming):
    result = [dict(item) for item in existing]
    for item in incoming:
        index = next((i for i, old in enumerate(result) if old["id"] == item["id"]), None)
        if index is None:
            result.append(item)
        else:
            result[index] = {**result[index], **item, "createdAt": result[index].get("createdAt", item["createdAt"])}
    return result

def main():
    path = ADMIN / "opportunities.json"
    original = path.read_bytes()
    existing = json.loads(original)
    removed = json.loads((ADMIN / "removed_demo_content.json").read_text(encoding="utf-8"))
    removed_ids = {item["id"] for item in removed["opportunities"]}
    researched = json.loads((ROOT / "scripts/fixtures/industry_notices_2026_10_04.json").read_text(encoding="utf-8"))
    now = datetime.now(timezone.utc).isoformat()
    incoming = []
    for facts in researched:
        assert facts["id"] not in removed_ids
        item = dict(eligibleUniversities=[], eligibleDepartments=[], eligibleMajors=[],
            majorRestriction=True, crossUniversityAvailable=False, accessScope="UNKNOWN",
            recruitmentStartAt=None, recruitmentEndAt=None, programStartAt=None, programEndAt=None,
            benefits=[], technologies=[], fields=[], tags=[], sourceType="UNIVERSITY_OFFICIAL",
            createdAt=now, updatedAt=now, lastCheckedAt=now, lastVerifiedAt=now,
            approvalStatus="PUBLISHED", project_type="COMPANY_LINKED", studentParticipationVerified=False,
            eligibleAudience=[], dDayText="", applicationMethod="지원 주체와 절차를 공식 원문에서 확인하세요.")
        item.update(facts)
        rolling = item.pop("rolling", False)
        item["sourceOrganization"] = item["providerName"]
        item["sourceVerifiedAt"] = now if item["officialSourceVerified"] else ""
        item["officialSourceUrl"] = item["sourceUrl"]
        item["applicationUrl"] = item["sourceUrl"] if item["officialSourceVerified"] else None
        item["recruitmentStatus"] = item["status"]
        item["eligibleStudentStatus"] = item["targetStudents"]
        item["eligibilityText"] = item["targetStudents"]
        item["recruitmentEvidence"] = dict(sourceUrl=item["sourceUrl"], sourceKind="UNIVERSITY_OFFICIAL",
            isOfficialDetail=item["officialSourceVerified"], eligibilityText=item["eligibilityEvidence"],
            recruitmentText="기업 대상 상시 접수" if rolling else f"접수 일정: {item['recruitmentStartAt']} ~ {item['recruitmentEndAt']}",
            verifiedAt=now, rollingAdmission=rolling)
        if item["universityId"] == "hanyang_erica":
            item.update(eligibleUniversities=["한양대학교"], accessScope="UNIVERSITY_ONLY")
        elif item["universityId"] == "inje":
            item.update(eligibleUniversities=["인제대학교"], eligibleDepartments=["의생명공학과"], eligibleMajors=["의생명공학"], accessScope="UNIVERSITY_ONLY", approvalStatus="PENDING_REVIEW", recruitmentEvidence=None)
        incoming.append(item)
    # Re-use existing verified records instead of generating duplicate Challenge cards.
    for item in existing:
        if item["id"] in {"opp_pnu_capstone_2026_2_general", "opp_pnu_capstone_2026_2_partner", "opp_bbits_multidisciplinary_2026"}:
            updated = dict(item)
            updated["tags"] = list(dict.fromkeys(item.get("tags", []) + ["official-industry-notice", "기업연계 캡스톤" if "partner" in item["id"] else "학생 프로젝트"]))
            updated["officialSourceVerified"] = True
            updated["sourceVerifiedAt"] = now
            updated["updatedAt"] = now
            if "partner" in item["id"]:
                updated["project_type"] = "COMPANY_LINKED"
            incoming.append(updated)
    merged = merge_records(existing, incoming)
    assert len({item["id"] for item in merged}) == len(merged)
    assert {item["id"] for item in existing} <= {item["id"] for item in merged}
    assert len(merge_records(merged, incoming)) == len(merged)
    targets = {item["id"] for item in incoming}
    assert [item for item in merged if item["id"] not in targets] == [item for item in existing if item["id"] not in targets]
    backup = ROOT / "outputs/admin-cleanup/opportunities-before-official-research.json"
    if not backup.exists():
        backup.write_bytes(original)
    if path.read_bytes() != original:
        raise RuntimeError("Concurrent data modification; refusing to overwrite")
    atomic_bytes(path, encode(merged))
    assert json.loads(path.read_bytes()) == merged
    print(f"Admin opportunities: {len(existing)} -> {len(merged)}; {len(researched)} researched entries, 3 existing notices refreshed; unchanged records preserved.")

if __name__ == "__main__":
    main()
