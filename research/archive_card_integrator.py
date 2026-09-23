"""
research/archive_card_integrator.py
Integrates research intelligence findings into the platform databases:
- Registers exhibition archive card into data/university_queue.json and syncs to platform.
- Registers 100% verified professors into data/professors.json.
- Quarantines unverified/review-needed faculty to data/unverified_professors.json.
- Strictly prevents mock data from entering any production files via canonical path checks.
- Propagates sync failures cleanly to callers.
"""
import os
import sys
import json
from typing import Dict, Any, List, Optional, Tuple

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add workspace and scripts paths
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)
scripts_dir = os.path.join(WORKSPACE_ROOT, "scripts")
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from category_mapper import get_standard_category
from .storage_manager import (
    upsert_exhibition_card,
    upsert_professor_card,
    generate_exhibition_card_id,
    canonical_path,
    DatabaseSyncError
)
from .curriculum_professor_researcher import (
    CurriculumProfessorResearcher,
    is_valid_academic_host_for_univ
)

class SecurityIsolationError(Exception):
    """Raised when mock or test execution attempts to access production database paths."""
    pass

ROOT_QUEUE_PATH = os.path.join(WORKSPACE_ROOT, "data", "university_queue.json")
PLATFORM_QUEUE_PATH = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "university_queue.json")
ROOT_PROFESSORS_PATH = os.path.join(WORKSPACE_ROOT, "data", "professors.json")
PLATFORM_PROFESSORS_PATH = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "professors.json")
ROOT_UNVERIFIED_PROF_PATH = os.path.join(WORKSPACE_ROOT, "data", "unverified_professors.json")

MOCK_QUEUE_PATH = os.path.join(WORKSPACE_ROOT, "data", "mock_isolated", "university_queue.json")
MOCK_PROFESSORS_PATH = os.path.join(WORKSPACE_ROOT, "data", "mock_isolated", "professors.json")
MOCK_UNVERIFIED_PROF_PATH = os.path.join(WORKSPACE_ROOT, "data", "mock_isolated", "unverified_professors.json")

ALL_PRODUCTION_PATHS = {
    canonical_path(ROOT_QUEUE_PATH),
    canonical_path(PLATFORM_QUEUE_PATH),
    canonical_path(ROOT_PROFESSORS_PATH),
    canonical_path(PLATFORM_PROFESSORS_PATH),
    canonical_path(ROOT_UNVERIFIED_PROF_PATH)
}

class ArchiveCardIntegrator:
    def __init__(
        self,
        queue_path: Optional[str] = None,
        sync_queue_path: Optional[str] = None,
        professors_path: Optional[str] = None,
        sync_professors_path: Optional[str] = None,
        unverified_professors_path: Optional[str] = None,
        allow_mock: bool = False
    ):
        self.allow_mock = allow_mock

        if allow_mock:
            # Default to isolated mock directory
            self.queue_path = queue_path or MOCK_QUEUE_PATH
            self.sync_queue_path = sync_queue_path
            self.professors_path = professors_path or MOCK_PROFESSORS_PATH
            self.sync_professors_path = sync_professors_path
            self.unverified_professors_path = unverified_professors_path or MOCK_UNVERIFIED_PROF_PATH
        else:
            # Default to production databases
            self.queue_path = queue_path or ROOT_QUEUE_PATH
            self.sync_queue_path = sync_queue_path if sync_queue_path is not None else PLATFORM_QUEUE_PATH
            self.professors_path = professors_path or ROOT_PROFESSORS_PATH
            self.sync_professors_path = sync_professors_path if sync_professors_path is not None else PLATFORM_PROFESSORS_PATH
            self.unverified_professors_path = unverified_professors_path or ROOT_UNVERIFIED_PROF_PATH

        # Strict Mock Isolation Check
        if self.allow_mock:
            for p_name, p_val in [
                ("queue_path", self.queue_path),
                ("sync_queue_path", self.sync_queue_path),
                ("professors_path", self.professors_path),
                ("sync_professors_path", self.sync_professors_path),
                ("unverified_professors_path", self.unverified_professors_path)
            ]:
                if p_val:
                    c_val = canonical_path(p_val)
                    if c_val in ALL_PRODUCTION_PATHS:
                        raise SecurityIsolationError(
                            f"[SECURITY BREACH] allow_mock=True cannot target production path for {p_name}: {p_val}"
                        )

        self.professor_researcher = CurriculumProfessorResearcher(allow_mock=allow_mock)

    def integrate_research_result(self, research_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Integrates a CONFIRMED or REVIEW research output.
        Returns detailed status including sync success/failure.
        """
        status = research_output.get("result_status", "NOT_FOUND")
        univ = research_output.get("university_name", "")
        dept = research_output.get("department_keyword", "")
        year = str(research_output.get("target_year", "2026"))

        if status not in ("CONFIRMED", "REVIEW"):
            return {
                "success": False,
                "status": status,
                "message": f"Research result status '{status}' cannot be registered as an exhibition card."
            }

        detail = research_output.get("detail", {})
        source_url = detail.get("source_url", "")
        confidence_score = detail.get("confidence_score", 0)

        # 1. Map to 10 standard categories
        standard_category = get_standard_category(dept)

        # 2. Set status based on review requirement
        if status == "REVIEW":
            card_status = "검토 필요"
            is_ready_for_crawler = False
        else:
            card_status = "대기 중"
            is_ready_for_crawler = True

        card_id = generate_exhibition_card_id(year, univ, dept)

        exhibition_card_payload = {
            "id": card_id,
            "category": standard_category,
            "university": univ,
            "department": dept,
            "year": year,
            "status": card_status,
            "target_url": source_url,
            "official_url": source_url,
            "scraped_url": source_url,
            "exhibition_title": f"{univ} {year}년 {dept} 졸업전시회",
            "exhibit_title": f"[{univ}] {year} {dept} 졸업전시회",
            "title": f"{univ} {year}년 {dept} 졸업전시회",
            "critic_score": confidence_score,
            "critic_feedback": f"Research Intelligence Agent 판정: {status} (신뢰도 {confidence_score}/100)",
            "curation_summary": {
                "headline": f"{univ} {dept} {year} 졸업작품전",
                "curation_intro": f"{year}년도 {univ} {dept} 졸업전시 아카이브입니다. {detail.get('reasoning', '')}",
                "inferred_industry_keywords": [standard_category, dept, f"{year}졸전"]
            },
            "artworks": [],
            "isUploaded": False,
            "isResearched": True
        }

        # 3. Register exhibition card with error propagation
        try:
            is_new_card, actual_card_id = upsert_exhibition_card(
                self.queue_path,
                exhibition_card_payload,
                sync_file=self.sync_queue_path
            )
            print(f"[*] [Exhibition Card] {'Created new' if is_new_card else 'Updated existing'} card: {actual_card_id} (Status: {card_status})", flush=True)
        except DatabaseSyncError as se:
            print(f"[ERROR] Card synchronization failed: {se}", flush=True)
            return {
                "success": False,
                "status": "SYNC_FAILED",
                "card_id": card_id,
                "message": str(se)
            }
        except Exception as e:
            return {
                "success": False,
                "status": "WRITE_FAILED",
                "card_id": card_id,
                "message": f"Storage write error: {e}"
            }

        # 4. Research faculty
        faculty_list = self.professor_researcher.research_faculty_for_department(
            university=univ,
            department=dept,
            official_source_url=source_url,
            student_works=[]
        )

        added_profs = []
        quarantined_profs = []

        for prof in faculty_list:
            # Unified 5-point verification check
            is_ver = prof.get("is_verified") is True
            is_stat_ver = prof.get("verification_status") == "VERIFIED"
            is_high_conf = prof.get("confidence_score", 0) >= 0.90
            prof_src = prof.get("official_profile_url") or prof.get("source_url", "")
            is_host_val, _ = is_valid_academic_host_for_univ(prof_src, univ)
            has_raw_proof = bool(prof.get("evidence_quote") or prof.get("source_title"))

            if is_ver and is_stat_ver and is_high_conf and is_host_val and has_raw_proof:
                # Target: Verified production database
                target_p_file = self.professors_path
                target_p_sync = self.sync_professors_path
                is_quarantine = False
            else:
                # Target: Quarantine unverified review repository
                target_p_file = self.unverified_professors_path
                target_p_sync = None
                is_quarantine = True

            try:
                is_new_p, p_id = upsert_professor_card(
                    target_p_file,
                    prof,
                    sync_file=target_p_sync
                )
                rec = {
                    "id": p_id,
                    "name": prof.get("name"),
                    "major_track": prof.get("major"),
                    "is_new": is_new_p,
                    "is_quarantine": is_quarantine
                }
                if is_quarantine:
                    quarantined_profs.append(rec)
                    print(f"[*] [Professor Quarantined] {prof.get('name')} ({p_id}) -> unverified_professors.json", flush=True)
                else:
                    added_profs.append(rec)
                    print(f"[*] [Professor Verified] {prof.get('name')} ({p_id}) -> professors.json", flush=True)
            except DatabaseSyncError as pse:
                print(f"[ERROR] Professor synchronization failed: {pse}", flush=True)
                return {
                    "success": False,
                    "status": "SYNC_FAILED",
                    "card_id": actual_card_id,
                    "message": f"Professor sync failed: {pse}"
                }

        return {
            "success": True,
            "card_id": actual_card_id,
            "is_new_exhibition_card": is_new_card,
            "card_status": card_status,
            "is_ready_for_crawler": is_ready_for_crawler,
            "standard_category": standard_category,
            "registered_professors": added_profs,
            "quarantined_professors": quarantined_profs
        }
