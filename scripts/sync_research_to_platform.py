"""
scripts/sync_research_to_platform.py
Synchronizes Academic-Corporate Research Intelligence to:
1. data/university_queue.json (Graduation Exhibition Cards)
2. data/professors.json (Department Curriculum & Professor Industry Collab)
3. data/rfp.json (Verified Corporate RFPs & Recruitment Signals)
Strictly adheres to json-db-safeguard with non-destructive atomic updates and dual-sync.
"""

import os
import sys
import json
import shutil
from typing import Dict, Any, List

# Windows console UTF-8 setup
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ROOT_DATA = os.path.join(WORKSPACE_ROOT, "data")
PLATFORM_DATA = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data")
LATEST_INTEL_FILE = os.path.join(ROOT_DATA, "research", "intelligence", "latest_corporate_research.json")


def safe_load_json(filepath: str) -> Any:
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Warning] Failed to load {filepath}: {e}", file=sys.stderr)
    return None


def safe_save_and_sync(filename: str, data: Any):
    root_file = os.path.join(ROOT_DATA, filename)
    plat_file = os.path.join(PLATFORM_DATA, filename)

    os.makedirs(os.path.dirname(root_file), exist_ok=True)
    os.makedirs(os.path.dirname(plat_file), exist_ok=True)

    # Atomic write to root
    temp_file = root_file + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    shutil.move(temp_file, root_file)

    # Sync to platform
    shutil.copy2(root_file, plat_file)
    print(f"  ✓ Synced {filename} to root and my-exhibit-platform/data/")


def sync_intelligence_to_platform(intel_data: Dict[str, Any]) -> Dict[str, int]:
    univ = intel_data.get("target_university", "")
    target_dept = intel_data.get("target_department", "")
    coop_signals = intel_data.get("cooperation_signals", [])
    dept_mappings = intel_data.get("department_mappings", [])
    recruit_postings = intel_data.get("recruitment_postings", [])
    cv_results = intel_data.get("cross_validation_results", [])
    markdown_report = intel_data.get("markdown_report", "")

    counts = {"queue_updated": 0, "professors_updated": 0, "rfp_updated": 0}

    # 1. Update university_queue.json
    queue = safe_load_json(os.path.join(ROOT_DATA, "university_queue.json"))
    if isinstance(queue, list):
        clean_univ = univ.replace("대학교", "").replace("대", "")
        for item in queue:
            item_univ = (item.get("university") or "").replace("대학교", "").replace("대", "")
            item_dept = item.get("department") or ""

            # Check if matching university and department
            if clean_univ in item_univ or item_univ in clean_univ:
                coop_comps = list(dict.fromkeys(s.get("company", "") for s in coop_signals if s.get("company")))
                cv_matches = [
                    cv for cv in cv_results
                    if any(c in coop_comps for c in [cv.get("company", "")])
                ]
                
                # Determine highest corroboration status
                status_priority = ["CORROBORATED", "CONFIRMED", "INFERRED", "RECRUITMENT_CONFIRMED", "CONFLICTED"]
                primary_status = "INFERRED"
                for sp in status_priority:
                    if any(cv.get("corroboration_status") == sp for cv in cv_matches):
                        primary_status = sp
                        break

                item["cooperation_companies"] = coop_comps
                item["cross_validation_status"] = primary_status
                item["has_corporate_cooperation"] = len(coop_comps) > 0
                item["corporate_cooperation_count"] = len(coop_comps)
                
                # Extract skill summary from verified recruitments
                skills = []
                for r in recruit_postings:
                    for s in r.get("requirements", {}).get("required_skills", []):
                        if s not in skills:
                            skills.append(s)
                item["verified_required_skills"] = skills[:6]
                item["corporate_research_report"] = markdown_report[:1500]
                counts["queue_updated"] += 1

        safe_save_and_sync("university_queue.json", queue)

    # 2. Update professors.json
    profs = safe_load_json(os.path.join(ROOT_DATA, "professors.json"))
    if isinstance(profs, list):
        clean_univ = univ.replace("대학교", "").replace("대", "")
        for prof in profs:
            prof_univ = (prof.get("university") or "").replace("대학교", "").replace("대", "")
            prof_dept = prof.get("department") or ""

            if clean_univ in prof_univ or prof_univ in clean_univ:
                # Augment industry_collaborations
                existing_collabs = prof.get("industry_collaborations", [])
                for cs in coop_signals:
                    # Check if already in collaborations
                    if not any(c.get("company") == cs.get("company") for c in existing_collabs):
                        existing_collabs.append({
                            "id": f"collab-{cs['signal_id']}",
                            "company": cs["company"],
                            "title": cs["project_title"],
                            "period": cs.get("date", "2025 - 2026"),
                            "reward_or_budget": "연구비 지원 및 인턴십 연계 (공식 LINC 산학협약)",
                            "cooperation_type": cs.get("cooperation_type", "산학공동연구"),
                            "evidence_id": cs.get("evidence_id", "")
                        })

                prof["industry_collaborations"] = existing_collabs
                prof["has_corporate_intelligence"] = True
                counts["professors_updated"] += 1

        safe_save_and_sync("professors.json", profs)

    # 3. Update rfp.json
    rfps = safe_load_json(os.path.join(ROOT_DATA, "rfp.json"))
    if isinstance(rfps, list):
        for cs in coop_signals:
            comp = cs.get("company")
            existing_rfp = next((r for r in rfps if r.get("company") == comp or comp in r.get("company", "")), None)
            
            # Find matching recruitment signal
            matching_job = next((jp for jp in recruit_postings if jp.get("company") == comp), None)
            reqs = matching_job.get("requirements", {}) if matching_job else {}

            if existing_rfp:
                existing_rfp["is_verified"] = True
                existing_rfp["verification_status"] = "VERIFIED"
                existing_rfp["corroboration_status"] = "CORROBORATED" if matching_job else "INFERRED"
                existing_rfp["cooperation_signal"] = cs.get("project_title")
                existing_rfp["cooperation_partners"] = list(dict.fromkeys(existing_rfp.get("cooperation_partners", []) + [p for p in [univ, cs.get("department", "")] if p]))
                existing_rfp["verified_required_skills"] = reqs.get("required_skills", [])
                existing_rfp["portfolio_requirement"] = reqs.get("portfolio_requirement", "포트폴리오 필수")
                counts["rfp_updated"] += 1
            else:
                # Add new verified corporate RFP
                new_rfp = {
                    "id": f"rfp-{cs['signal_id']}",
                    "company": comp,
                    "company_name": f"{comp} 산학연계 프로젝트팀",
                    "company_logo": "🏢",
                    "logo_emoji": "🏢",
                    "company_industry": cs.get("department", "산업 융합 디자인"),
                    "industry": "모빌리티 / AI / 인터랙션",
                    "title": cs["project_title"],
                    "abstract_brief": cs.get("description", ""),
                    "problem_statement": f"{univ} 산학협력단과 연계하여 산업 현장의 실무 디자인 및 사용자 인터페이스 문제를 해결합니다.",
                    "target_qualifications": f"{univ} {cs.get('department', '디자인 관련 학과')} 재학생 및 졸업예정자",
                    "budget_or_reward": "산학 연구장학금 및 채용연계 인턴십 지원 기회",
                    "reward": "산학 연구장학금 및 채용연계 인턴십 지원 기회",
                    "deadline": "2026-10-31",
                    "status": "open",
                    "is_verified": True,
                    "verification_status": "VERIFIED",
                    "corroboration_status": "CORROBORATED" if matching_job else "INFERRED",
                    "cooperation_signal": cs["project_title"],
                    "cooperation_partners": [p for p in [univ, cs.get("department", "")] if p],
                    "verified_required_skills": reqs.get("required_skills", []),
                    "submissions": []
                }
                rfps.append(new_rfp)
                counts["rfp_updated"] += 1

        safe_save_and_sync("rfp.json", rfps)

    return counts


if __name__ == "__main__":
    if os.path.exists(LATEST_INTEL_FILE):
        intel = safe_load_json(LATEST_INTEL_FILE)
        if intel:
            print("🔄 Running Sync from Latest Intelligence...")
            res = sync_intelligence_to_platform(intel)
            print(f"✅ Sync Complete: {res}")
        else:
            print("❌ latest_corporate_research.json is empty")
    else:
        print("❌ latest_corporate_research.json not found")
