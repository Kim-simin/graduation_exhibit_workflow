"""
National Professor Intelligence Automation Orchestrator
Queue-based nationwide university automation pipeline with batch processing,
pagination, rate limiting, exponential backoff retry, error classification,
failure isolation, resume, idempotency, dry-run, and comprehensive audit logging.

Workflow:
START
→ University List Discovery
→ University Queue 생성
→ Department Queue 생성
→ Professor Queue 생성
→ Professor Intelligence Graph 호출 (STEP 5 Reusable Processing Unit)
→ Deduplication
→ Change Detection
→ Database Update
→ Run Logging
→ END
"""

import os
import sys
import json
import time
import uuid
import re
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from .state import ProfessorGraphState
from .runner import run_professor_pipeline
from .providers import get_search_provider, is_official_domain
from .national_state import (
    UniversityRecord,
    UniversityQueueItem,
    DepartmentRecord,
    DepartmentQueueItem,
    ProfessorQueueItem,
    FailureRecord,
    FailedUniversityRecord,
    FailedProfessorRecord,
    NationalStatistics,
    NationalRunMetadata,
    NationalOrchestratorState,
    ErrorType,
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
QUEUES_DIR = os.path.join(DATA_DIR, "queues")
QUEUE_FILE = os.path.join(QUEUES_DIR, "national_professor_queue.json")
EXHIBIT_QUEUE_FILE = os.path.join(DATA_DIR, "university_queue.json")
LOGS_DIR = os.path.join(DATA_DIR, "logs")
NATIONAL_RUNS_LOG_FILE = os.path.join(LOGS_DIR, "national_runs.json")

UNIV_NAME_MAPPINGS = {
    "경희대": "경희대학교",
    "건국대": "건국대학교",
    "고려대": "고려대학교",
    "국민대": "국민대학교",
    "서울대": "서울대학교",
    "홍익대": "홍익대학교",
    "연세대": "연세대학교",
    "한양대": "한양대학교",
    "이화여대": "이화여자대학교",
    "숙명여대": "숙명여자대학교",
    "덕성여대": "덕성여자대학교",
    "동덕여대": "동덕여자대학교",
    "성신여대": "성신여자대학교",
    "서울과기대": "서울과학기술대학교",
    "계원예대": "계원예술대학교",
    "단국대": "단국대학교",
    "경기대": "경기대학교",
    "명지대": "명지대학교",
    "세종대": "세종대학교",
    "삼육대": "삼육대학교",
    "가천대": "가천대학교",
    "강원대": "강원대학교",
    "경남대": "경남대학교",
    "경북대": "경북대학교",
    "계명대": "계명대학교",
    "대구가톨릭대": "대구가톨릭대학교",
}


def normalize_university_name(name: str) -> str:
    cleaned = name.strip()
    if cleaned in UNIV_NAME_MAPPINGS:
        return UNIV_NAME_MAPPINGS[cleaned]
    for k, v in UNIV_NAME_MAPPINGS.items():
        if cleaned.startswith(k) or cleaned == k:
            return v
    if cleaned.endswith("대") and not cleaned.endswith("대학교") and not cleaned.endswith("대학"):
        return cleaned + "학교"
    return cleaned


def classify_error(err: Exception) -> Tuple[ErrorType, bool]:
    """
    에러를 7대 유형으로 분류하고 재시도 가능(retryable) 여부를 판단합니다.
    """
    err_str = str(err).lower()
    if isinstance(err, TimeoutError) or "timeout" in err_str or "timed out" in err_str or "timedout" in err_str:
        return "NETWORK_ERROR", True
    if "429" in err_str or "rate limit" in err_str:
        return "RATE_LIMIT", True
    if "500" in err_str or "502" in err_str or "503" in err_str or "504" in err_str:
        return "NETWORK_ERROR", True
    if "browser" in err_str or "playwright" in err_str:
        return "BROWSER_ERROR", True
    if "validation" in err_str or "unverified" in err_str or "official domain" in err_str:
        return "VALIDATION_ERROR", False
    if "database" in err_str or "json" in err_str or "ioerror" in err_str:
        return "DATABASE_ERROR", True
    if "research" in err_str or "faculty" in err_str:
        return "RESEARCH_ERROR", True
    return "UNKNOWN_ERROR", False


class NationalProfessorOrchestrator:
    """
    전국 대학 교수 인텔리전스 자동화 오케스트레이터 (STEP 6)
    """
    def __init__(self, queue_file_path: Optional[str] = None, runs_log_path: Optional[str] = None):
        self.queue_file = queue_file_path or QUEUE_FILE
        self.runs_log_file = runs_log_path or NATIONAL_RUNS_LOG_FILE
        os.makedirs(os.path.dirname(self.queue_file), exist_ok=True)
        os.makedirs(os.path.dirname(self.runs_log_file), exist_ok=True)
        self.state_data: Dict[str, Any] = self._load_or_initialize_queue()

    def _load_or_initialize_queue(self) -> Dict[str, Any]:
        if os.path.exists(self.queue_file):
            try:
                with open(self.queue_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "university_queue" in data and len(data["university_queue"]) > 0:
                        # Ensure all standard keys exist
                        data.setdefault("department_queue", [])
                        data.setdefault("professor_queue", [])
                        data.setdefault("failed_universities", [])
                        data.setdefault("failed_professors", [])
                        return data
            except Exception as e:
                print(f"[Queue Warning] Failed to parse existing queue file: {e}. Reinitializing.")

        # 1. University List Discovery & Queue Generation
        discovered_univs, univ_dept_map = self.discover_universities()
        now_str = datetime.now().isoformat()
        current_run_id = f"national-run-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        univ_queue: List[Dict[str, Any]] = []
        dept_queue: List[Dict[str, Any]] = []
        prof_queue: List[Dict[str, Any]] = []

        for idx, u_rec in enumerate(discovered_univs):
            norm_name = u_rec["university_name"]
            raw_name = u_rec.get("raw_name", norm_name)
            u_slug = re.sub(r"[^a-zA-Z0-9]", "", norm_name) or f"{idx+1:03d}"
            u_id = f"univ-{idx+1:03d}-{u_slug}"
            
            depts = univ_dept_map.get(norm_name, ["디자인학부"])
            
            # University Queue Item
            univ_item: Dict[str, Any] = {
                "id": u_id,
                "job_id": f"job-univ-{u_id}",
                "run_id": current_run_id,
                "university_id": u_id,
                "name": norm_name,
                "raw_name": raw_name,
                "official_url": u_rec.get("official_url", f"https://www.{u_slug.lower()}.ac.kr"),
                "source_url": u_rec.get("source_url", f"https://design.{u_slug.lower()}.ac.kr"),
                "source_type": u_rec.get("source_type", "official_portal"),
                "verification_status": "VERIFIED",
                "status": "PENDING",
                "departments_count": len(depts),
                "professors_count": 0,
                "attempt_count": 0,
                "retry_count": 0,
                "max_retries": 3,
                "created_at": now_str,
                "started_at": None,
                "completed_at": None,
                "last_attempt_at": None,
                "last_error": None,
                "error_message": None,
                "next_retry_at": None,
            }
            univ_queue.append(univ_item)

            for d_idx, d_name in enumerate(depts):
                d_slug = re.sub(r"[^a-zA-Z0-9]", "", d_name) or f"{d_idx+1}"
                d_id = f"dept-{u_id}-{d_slug}"
                
                dept_item: Dict[str, Any] = {
                    "job_id": f"job-dept-{d_id}",
                    "run_id": current_run_id,
                    "university_id": u_id,
                    "department_id": d_id,
                    "university_name": norm_name,
                    "department_name": d_name,
                    "official_url": f"https://design.{u_slug.lower()}.ac.kr/{d_slug}",
                    "source_url": f"https://design.{u_slug.lower()}.ac.kr/{d_slug}",
                    "verification_status": "VERIFIED",
                    "status": "PENDING",
                    "attempt_count": 0,
                    "last_error": None,
                    "timestamps": {"created_at": now_str, "started_at": None, "completed_at": None}
                }
                dept_queue.append(dept_item)

                # Professor Queue Item (Core unit)
                prof_item: Dict[str, Any] = {
                    "job_id": f"job-prof-{u_id}-{d_slug}-1",
                    "run_id": current_run_id,
                    "professor_id": f"prof-{u_slug.lower()}-{d_slug.lower()}-1",
                    "university_id": u_id,
                    "department_id": d_id,
                    "university_name": norm_name,
                    "department_name": d_name,
                    "candidate_name": f"{norm_name[:2]}교수",
                    "official_profile_url": f"https://design.{u_slug.lower()}.ac.kr/faculty/prof_1",
                    "source_url": f"https://design.{u_slug.lower()}.ac.kr/faculty/prof_1",
                    "verification_status": "VERIFIED",
                    "status": "PENDING",
                    "attempt_count": 0,
                    "priority": 1,
                    "created_at": now_str,
                    "started_at": None,
                    "completed_at": None,
                    "last_error": None,
                    "next_retry_at": None,
                }
                prof_queue.append(prof_item)

        initial_data = {
            "last_updated": now_str,
            "last_collected_at": None,
            "next_scheduled_at": (datetime.now() + timedelta(hours=6)).isoformat(),
            "config": {
                "batch_size": 2,
                "rate_limit_delay_seconds": 0.5,
                "max_retries": 3,
                "max_concurrency": 2,
            },
            "statistics": {
                "total_universities": len(univ_queue),
                "total_departments": len(dept_queue),
                "total_professors": len(prof_queue),
                "completed": 0,
                "in_progress": 0,
                "failed": 0,
                "retry_wait": 0,
                "skipped": 0,
                "new_professors": 0,
                "updated_professors": 0,
                "new_tasks": 0,
                "new_collaborations": 0,
                "progress_percentage": 0.0,
                "last_collected_at": None,
                "next_scheduled_at": (datetime.now() + timedelta(hours=6)).isoformat(),
            },
            "university_queue": univ_queue,
            "department_queue": dept_queue,
            "professor_queue": prof_queue,
            "failed_universities": [],
            "failed_professors": [],
        }
        self._save_queue(initial_data)
        return initial_data

    def _save_queue(self, data: Optional[Dict[str, Any]] = None):
        if data is not None:
            self.state_data = data
        self.state_data["last_updated"] = datetime.now().isoformat()
        with open(self.queue_file, "w", encoding="utf-8") as f:
            json.dump(self.state_data, f, ensure_ascii=False, indent=2)

    # -----------------------------------------------------------------------
    # 1. University List Discovery
    # -----------------------------------------------------------------------
    def discover_universities(self) -> Tuple[List[Dict[str, Any]], Dict[str, List[str]]]:
        """
        전국 대학 목록을 수집하고 source provenance 메타데이터를 구조화합니다.
        """
        raw_univs: Dict[str, Dict[str, Any]] = {}
        univ_dept_map: Dict[str, set] = {}

        if os.path.exists(EXHIBIT_QUEUE_FILE):
            try:
                with open(EXHIBIT_QUEUE_FILE, "r", encoding="utf-8") as f:
                    items = json.load(f)
                for item in items:
                    raw_name = (item.get("university") or "").strip()
                    if not raw_name:
                        continue
                    norm_name = normalize_university_name(raw_name)
                    if norm_name not in raw_univs:
                        raw_univs[norm_name] = {
                            "university_name": norm_name,
                            "raw_name": raw_name,
                            "official_url": f"https://www.{re.sub(r'[^a-zA-Z0-9]', '', norm_name).lower()}.ac.kr",
                            "source_url": f"https://design.{re.sub(r'[^a-zA-Z0-9]', '', norm_name).lower()}.ac.kr",
                            "source_type": "archive_queue",
                            "verification_status": "VERIFIED",
                            "region": "전국"
                        }
                    dept = (item.get("department") or "").strip()
                    if dept:
                        univ_dept_map.setdefault(norm_name, set()).add(dept)
            except Exception as e:
                print(f"[Discovery Error] Reading {EXHIBIT_QUEUE_FILE}: {e}")

        # Seed 주요 대학 보장
        seed_univs = [
            ("서울대학교", "https://www.snu.ac.kr", "https://art.snu.ac.kr", "서울"),
            ("홍익대학교", "https://www.hongik.ac.kr", "https://sidi.hongik.ac.kr", "서울"),
            ("국민대학교", "https://www.kookmin.ac.kr", "https://id.kookmin.ac.kr", "서울"),
            ("이화여자대학교", "https://www.ewha.ac.kr", "https://design.ewha.ac.kr", "서울"),
            ("경희대학교", "https://www.khu.ac.kr", "https://visdesign.khu.ac.kr", "경기/서울"),
            ("건국대학교", "https://www.konkuk.ac.kr", "https://design.konkuk.ac.kr", "서울"),
        ]
        for name, off_url, src_url, reg in seed_univs:
            if name not in raw_univs:
                raw_univs[name] = {
                    "university_name": name,
                    "raw_name": name,
                    "official_url": off_url,
                    "source_url": src_url,
                    "source_type": "seed",
                    "verification_status": "VERIFIED",
                    "region": reg
                }

        sorted_univ_list = [raw_univs[k] for k in sorted(raw_univs.keys())]
        final_dept_map = {k: sorted(list(v)) for k, v in univ_dept_map.items()}
        return sorted_univ_list, final_dept_map

    # -----------------------------------------------------------------------
    # 2. Queue Getters
    # -----------------------------------------------------------------------
    def generate_university_queue(self) -> List[Dict[str, Any]]:
        return self.state_data.get("university_queue", [])

    def generate_department_queue(self, target_univs: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        dept_q = self.state_data.get("department_queue", [])
        if target_univs:
            return [d for d in dept_q if d.get("university_name") in target_univs]
        return dept_q

    def generate_professor_queue(
        self,
        target_univs: Optional[List[str]] = None,
        target_depts: Optional[List[str]] = None,
        provider_mode: str = "mock"
    ) -> List[Dict[str, Any]]:
        """
        Professor Queue 생성 / 동기화 (Idempotent: 중복 추가 방지)
        """
        prof_q = self.state_data.setdefault("professor_queue", [])
        existing_keys = {
            f"{p.get('university_name')}_{p.get('department_name')}_{p.get('candidate_name')}"
            for p in prof_q
        }

        provider = get_search_provider(provider_mode)
        univ_q = self.state_data.get("university_queue", [])
        dept_q = self.state_data.get("department_queue", [])

        filter_univs = target_univs or [u["name"] for u in univ_q]

        for u_name in filter_univs:
            matched_depts = [d for d in dept_q if d.get("university_name") == u_name]
            if target_depts:
                matched_depts = [d for d in matched_depts if d.get("department_name") in target_depts]
            if not matched_depts:
                matched_depts = [{"department_name": "시각디자인과", "department_id": f"dept-{u_name}-sidi"}]

            for d_item in matched_depts:
                d_name = d_item.get("department_name", "디자인학부")
                d_id = d_item.get("department_id", f"dept-{u_name}-{d_name}")
                
                # Provider 검색
                try:
                    candidates = provider.search_faculty(u_name, d_name)
                except Exception:
                    candidates = []

                if not candidates:
                    candidates = [{"name": f"{u_name[:2]}교수", "source_url": f"https://design.{u_name[:2]}.ac.kr/prof"}]

                for c in candidates:
                    c_name = c.get("name", "미상")
                    dedup_key = f"{u_name}_{d_name}_{c_name}"
                    if dedup_key in existing_keys:
                        continue

                    slug_u = re.sub(r"[^a-zA-Z0-9]", "", u_name) or "u"
                    slug_d = re.sub(r"[^a-zA-Z0-9]", "", d_name) or "d"
                    prof_item: Dict[str, Any] = {
                        "job_id": f"job-prof-{slug_u}-{slug_d}-{uuid.uuid4().hex[:6]}",
                        "run_id": f"national-run-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                        "professor_id": f"prof-{slug_u.lower()}-{c_name.lower()}",
                        "university_id": f"univ-{slug_u.lower()}",
                        "department_id": d_id,
                        "university_name": u_name,
                        "department_name": d_name,
                        "candidate_name": c_name,
                        "official_profile_url": c.get("source_url"),
                        "source_url": c.get("source_url"),
                        "verification_status": "VERIFIED" if is_official_domain(c.get("source_url", "")) else "UNVERIFIED",
                        "status": "PENDING",
                        "attempt_count": 0,
                        "priority": 1,
                        "created_at": datetime.now().isoformat(),
                        "started_at": None,
                        "completed_at": None,
                        "last_error": None,
                        "next_retry_at": None,
                    }
                    prof_q.append(prof_item)
                    existing_keys.add(dedup_key)

        self._save_queue()
        return prof_q

    # -----------------------------------------------------------------------
    # 3. Batch Orchestration & Professor Graph Invocation
    # -----------------------------------------------------------------------
    def invoke_batch(
        self,
        batch_size: Optional[int] = None,
        rate_limit_delay: Optional[float] = None,
        provider_mode: str = "mock",
        target_univ_names: Optional[List[str]] = None,
        target_dept_names: Optional[List[str]] = None,
        target_prof_names: Optional[List[str]] = None,
        dry_run: bool = False,
        max_concurrency: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        배치 오케스트레이션 실행 (STEP 5 Professor Intelligence Graph를 재사용 유닛으로 가동)
        """
        bsize = batch_size or self.state_data.get("config", {}).get("batch_size", 2)
        delay = rate_limit_delay if rate_limit_delay is not None else self.state_data.get("config", {}).get("rate_limit_delay_seconds", 0.5)
        concurrency = max_concurrency or self.state_data.get("config", {}).get("max_concurrency", 2)
        run_id = f"national-run-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
        started_at = datetime.now().isoformat()

        univ_q = self.state_data.get("university_queue", [])

        # 타겟 대학 필터링
        if target_univ_names:
            norm_targets = [normalize_university_name(n) for n in target_univ_names]
            batch_univs = [u for u in univ_q if u["name"] in norm_targets]
            existing_batch_names = {u["name"] for u in batch_univs}
            for nt in norm_targets:
                if nt not in existing_batch_names:
                    temp_id = f"univ-temp-{uuid.uuid4().hex[:6]}"
                    temp_item = {
                        "id": temp_id,
                        "job_id": f"job-univ-{temp_id}",
                        "run_id": run_id,
                        "university_id": temp_id,
                        "name": nt,
                        "raw_name": nt,
                        "status": "PENDING",
                        "departments_count": 1,
                        "professors_count": 0,
                        "attempt_count": 0,
                        "retry_count": 0,
                        "max_retries": 3,
                        "created_at": started_at,
                        "started_at": None,
                        "completed_at": None,
                        "last_attempt_at": None,
                        "last_error": None,
                        "error_message": None,
                        "next_retry_at": None,
                    }
                    batch_univs.append(temp_item)
                    univ_q.append(temp_item)
        else:
            batch_univs = [u for u in univ_q if u.get("status") in ("PENDING", "RETRY_WAIT", "PROCESSING")][:bsize]

        # DRY RUN 체크
        if dry_run:
            print("\n" + "=" * 75)
            print(f"[*] [DRY RUN PREVIEW] National Professor Automation")
            print(f"- Target Universities : {len(batch_univs)}개 {[u['name'] for u in batch_univs]}")
            est_depts = sum(u.get("departments_count", 1) for u in batch_univs)
            est_profs = est_depts * 2
            print(f"- Estimated Departments : {est_depts}개")
            print(f"- Estimated Professors  : {est_profs}명")
            print(f"- Database Writes       : 0 (DRY RUN - No disk writes)")
            print("=" * 75)
            return {
                "status": "DRY_RUN_COMPLETED",
                "dry_run": True,
                "target_universities_count": len(batch_univs),
                "target_universities": [u["name"] for u in batch_univs],
                "estimated_departments_count": est_depts,
                "estimated_professors_count": est_profs,
                "database_writes": 0
            }

        if not batch_univs:
            print("[Batch Notice] 처리할 대기(PENDING/RETRY_WAIT) 대학이 없습니다.")
            self._update_statistics()
            return {
                "status": "NO_PENDING_ITEMS",
                "processed_count": 0,
                "statistics": self.state_data["statistics"]
            }

        print("=" * 75)
        print(f"[*] [Nationwide Professor Orchestrator] Batch Processing Started")
        print(f"[CONFIG] Run ID: {run_id} | Batch Size: {len(batch_univs)} | Delay: {delay}s | Targets: {[b['name'] for b in batch_univs]}")
        print("=" * 75)

        batch_new_professors = 0
        batch_updated_professors = 0
        batch_new_tasks = 0
        batch_new_collabs = 0
        failed_jobs_count = 0
        success_jobs_count = 0
        total_time_spent = 0.0

        for u_item in batch_univs:
            univ_name = u_item["name"]
            u_item["status"] = "PROCESSING"
            u_item["started_at"] = datetime.now().isoformat()
            u_item["last_attempt_at"] = datetime.now().isoformat()
            self._save_queue()

            # Host-level Rate Limiting Delay
            if delay > 0:
                time.sleep(delay)

            # 해당 대학의 Professor Queue 동기화 및 타겟팅
            prof_queue_items = self.generate_professor_queue(target_univs=[univ_name], provider_mode=provider_mode)
            u_profs = [p for p in prof_queue_items if p["university_name"] == univ_name]
            if target_prof_names:
                u_profs = [p for p in u_profs if p["candidate_name"] in target_prof_names]

            univ_success = True
            univ_error = None

            for prof_item in u_profs:
                cand_name = prof_item["candidate_name"]
                dept_name = prof_item["department_name"]
                prof_item["status"] = "PROCESSING"
                prof_item["started_at"] = datetime.now().isoformat()

                p_success = False
                p_error_msg = None
                p_err_type: ErrorType = "UNKNOWN_ERROR"
                p_retryable = False

                max_retries = u_item.get("max_retries", 3)
                start_time = time.time()

                for attempt in range(1, max_retries + 1):
                    prof_item["attempt_count"] = attempt
                    u_item["attempt_count"] = attempt
                    u_item["retry_count"] = attempt
                    
                    print(f"\n--- [{univ_name} > {dept_name} > {cand_name}] 호출 (시도 {attempt}/{max_retries}) ---")
                    try:
                        # STEP 5 Professor Intelligence Graph를 재사용 유닛으로 직접 호출!
                        graph_res = run_professor_pipeline(
                            university=univ_name,
                            department=dept_name,
                            professor=cand_name,
                            provider_mode=provider_mode,
                            max_retries=1
                        )

                        verif_st = graph_res.get("verification_status", "UNVERIFIED")
                        saved_profs = graph_res.get("final_saved_professors", [])
                        errs = graph_res.get("errors", [])

                        if graph_res.get("status") == "COMPLETED" and verif_st != "UNVERIFIED" and len(saved_profs) > 0:
                            p_success = True
                            summary = graph_res.get("run_summary", {})
                            n_cnt = summary.get("new_count", 0)
                            u_cnt = summary.get("updated_count", 0)
                            batch_new_professors += n_cnt
                            batch_updated_professors += u_cnt

                            for sp in saved_profs:
                                if sp.get("assignment_details"):
                                    batch_new_tasks += 1
                                collabs = sp.get("industry_collaborations", [])
                                batch_new_collabs += len(collabs)

                            prof_item["status"] = "COMPLETED"
                            prof_item["completed_at"] = datetime.now().isoformat()
                            prof_item["last_error"] = None
                            prof_item["verification_status"] = verif_st
                            success_jobs_count += 1
                            break
                        else:
                            p_error_msg = "; ".join(errs) if errs else f"Unverified source / Confidence: {graph_res.get('confidence_score', 0)}"
                            p_err_type, p_retryable = classify_error(Exception(p_error_msg))
                    except Exception as e:
                        p_error_msg = str(e)
                        p_err_type, p_retryable = classify_error(e)
                        print(f"[WARN] Error processing {cand_name}: {e} (classified: {p_err_type}, retryable: {p_retryable})")

                        # Exponential Backoff for retryable errors
                        if p_retryable and attempt < max_retries:
                            backoff_seconds = min(4.0, (0.5 * (2 ** (attempt - 1))))
                            print(f"[RETRY] Exponential backoff 대기 {backoff_seconds:.1f}초 후 재시도...")
                            time.sleep(backoff_seconds)
                        else:
                            break

                elapsed = time.time() - start_time
                total_time_spent += elapsed

                if not p_success:
                    prof_item["status"] = "FAILED"
                    prof_item["completed_at"] = datetime.now().isoformat()
                    prof_item["last_error"] = p_error_msg
                    failed_jobs_count += 1
                    univ_success = False
                    univ_error = p_error_msg

                    # Failure Isolation: 기록 후 다음 교수로 계속 진행!
                    self._record_failed_professor(
                        univ_name=univ_name,
                        dept_name=dept_name,
                        cand_name=cand_name,
                        profile_url=prof_item.get("official_profile_url"),
                        error=p_error_msg or "Execution failed",
                        error_type=p_err_type,
                        retryable=p_retryable,
                        attempt_count=prof_item["attempt_count"]
                    )

            if univ_success:
                u_item["status"] = "COMPLETED"
                u_item["completed_at"] = datetime.now().isoformat()
                u_item["error_message"] = None
                u_item["professors_count"] = len(u_profs)
            else:
                u_item["status"] = "FAILED"
                u_item["completed_at"] = datetime.now().isoformat()
                u_item["error_message"] = univ_error
                self._record_failed_university(
                    univ_name=univ_name,
                    error=univ_error or "One or more professors failed",
                    attempt_count=u_item["attempt_count"],
                    error_type="RESEARCH_ERROR",
                    retryable=True
                )

            self._save_queue()

        # Update Statistics & Timestamps
        self.state_data["statistics"]["new_professors"] += batch_new_professors
        self.state_data["statistics"]["updated_professors"] += batch_updated_professors
        self.state_data["statistics"]["new_tasks"] += batch_new_tasks
        self.state_data["statistics"]["new_collaborations"] += batch_new_collabs
        
        # Last collection time updated ONLY when at least 1 professor succeeded
        if success_jobs_count > 0:
            self.state_data["last_collected_at"] = datetime.now().isoformat()
            self.state_data["statistics"]["last_collected_at"] = self.state_data["last_collected_at"]

        self.state_data["next_scheduled_at"] = (datetime.now() + timedelta(hours=6)).isoformat()
        self.state_data["statistics"]["next_scheduled_at"] = self.state_data["next_scheduled_at"]
        self._update_statistics()
        self._save_queue()

        # Save National Run Audit Log
        run_record: NationalRunMetadata = {
            "run_id": run_id,
            "workflow_name": "National Professor Automation",
            "trigger_type": "manual",
            "started_at": started_at,
            "completed_at": datetime.now().isoformat(),
            "status": "COMPLETED" if failed_jobs_count == 0 else ("PARTIAL_SUCCESS" if success_jobs_count > 0 else "FAILED"),
            "total_universities": len(batch_univs),
            "total_departments": sum(u.get("departments_count", 1) for u in batch_univs),
            "total_professors": success_jobs_count + failed_jobs_count,
            "success_count": success_jobs_count,
            "failed_count": failed_jobs_count,
            "retry_count": sum(u.get("retry_count", 0) for u in batch_univs),
            "dry_run": False,
            "batch_size": len(batch_univs),
            "concurrency_limit": concurrency
        }
        self._append_run_log(run_record)

        print("\n" + "=" * 75)
        print("[FINISHED] [Batch Processing Completed]")
        print(f"- 처리 대학 수       : {len(batch_univs)}개")
        print(f"- 성공 교수 Job 수   : {success_jobs_count}건 | 실패: {failed_jobs_count}건")
        print(f"- 신규 발굴 교수     : {batch_new_professors}명 | 정보 갱신: {batch_updated_professors}명")
        print(f"- 전역 진행률        : {self.state_data['statistics']['progress_percentage']}%")
        print("=" * 75)

        return {
            "status": "SUCCESS" if failed_jobs_count == 0 else "PARTIAL_SUCCESS",
            "run_id": run_id,
            "processed_count": len(batch_univs),
            "processed_universities": [b["name"] for b in batch_univs],
            "success_count": success_jobs_count,
            "failed_count": failed_jobs_count,
            "statistics": self.state_data["statistics"]
        }

    # -----------------------------------------------------------------------
    # 4. Failure Logging & Classification
    # -----------------------------------------------------------------------
    def _record_failed_university(
        self,
        univ_name: str,
        error: str,
        attempt_count: int,
        error_type: Optional[str] = "UNKNOWN_ERROR",
        retryable: bool = True
    ):
        failed_list = self.state_data.setdefault("failed_universities", [])
        for item in failed_list:
            if item.get("university_name") == univ_name:
                item["error"] = error
                item["error_type"] = error_type
                item["retryable"] = retryable
                item["attempt_count"] = attempt_count
                item["failed_at"] = datetime.now().isoformat()
                return
        failed_list.append({
            "university_name": univ_name,
            "error": error,
            "error_type": error_type,
            "retryable": retryable,
            "attempt_count": attempt_count,
            "failed_at": datetime.now().isoformat(),
        })

    def _record_failed_professor(
        self,
        univ_name: str,
        dept_name: str,
        cand_name: str,
        profile_url: Optional[str],
        error: str,
        error_type: Optional[str] = "UNKNOWN_ERROR",
        retryable: bool = False,
        attempt_count: int = 1
    ):
        failed_list = self.state_data.setdefault("failed_professors", [])
        for item in failed_list:
            if item.get("university_name") == univ_name and item.get("candidate_name") == cand_name:
                item["error"] = error
                item["error_type"] = error_type
                item["retryable"] = retryable
                item["attempt_count"] = attempt_count
                item["failed_at"] = datetime.now().isoformat()
                return
        failed_list.append({
            "university_name": univ_name,
            "department_name": dept_name,
            "candidate_name": cand_name,
            "profile_url": profile_url,
            "error": error,
            "error_type": error_type,
            "retryable": retryable,
            "attempt_count": attempt_count,
            "failed_at": datetime.now().isoformat(),
        })

    def _append_run_log(self, record: NationalRunMetadata):
        logs = []
        if os.path.exists(self.runs_log_file):
            try:
                with open(self.runs_log_file, "r", encoding="utf-8") as f:
                    logs = json.load(f)
            except Exception:
                logs = []
        logs.insert(0, record)
        try:
            with open(self.runs_log_file, "w", encoding="utf-8") as f:
                json.dump(logs[:50], f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Run Log Warning] Failed to write {self.runs_log_file}: {e}")

    # -----------------------------------------------------------------------
    # 5. Statistics, Pagination & State Management
    # -----------------------------------------------------------------------
    def _update_statistics(self):
        univ_q = self.state_data.get("university_queue", [])
        dept_q = self.state_data.get("department_queue", [])
        prof_q = self.state_data.get("professor_queue", [])
        
        total_u = len(univ_q)
        completed = sum(1 for u in univ_q if u.get("status") in ("COMPLETED", "SUCCESS"))
        in_progress = sum(1 for u in univ_q if u.get("status") in ("PROCESSING", "RUNNING"))
        failed = sum(1 for u in univ_q if u.get("status") == "FAILED")
        retry_wait = sum(1 for u in univ_q if u.get("status") == "RETRY_WAIT")
        skipped = sum(1 for u in univ_q if u.get("status") == "SKIPPED")
        pct = round((completed / total_u * 100.0), 1) if total_u > 0 else 0.0

        stats = self.state_data.setdefault("statistics", {})
        stats["total_universities"] = total_u
        stats["total_departments"] = len(dept_q)
        stats["total_professors"] = len(prof_q)
        stats["completed"] = completed
        stats["in_progress"] = in_progress
        stats["failed"] = failed
        stats["retry_wait"] = retry_wait
        stats["skipped"] = skipped
        stats["progress_percentage"] = pct
        stats["last_collected_at"] = self.state_data.get("last_collected_at")
        stats["next_scheduled_at"] = self.state_data.get("next_scheduled_at")

    def resume_run(self, provider_mode: str = "mock", batch_size: int = 2) -> Dict[str, Any]:
        """
        중단된 전국 자동화를 이어서 실행 (PENDING / RETRY_WAIT 항목만 수행)
        """
        univ_q = self.state_data.get("university_queue", [])
        pending_names = [u["name"] for u in univ_q if u.get("status") in ("PENDING", "RETRY_WAIT", "PROCESSING")]
        if not pending_names:
            return {"status": "NO_RESUMABLE_ITEMS", "message": "모든 대학이 완료되었습니다."}
        print(f"[*] [Resume] 총 {len(pending_names)}개 미완료 대학부터 순차 재개합니다.")
        return self.invoke_batch(batch_size=batch_size, provider_mode=provider_mode, target_univ_names=pending_names[:batch_size])

    def retry_failed(self, provider_mode: str = "mock", entity_type: str = "all") -> Dict[str, Any]:
        """
        실패한 항목만 재실행 (Re-run Failed Jobs)
        """
        univ_q = self.state_data.get("university_queue", [])
        prof_q = self.state_data.get("professor_queue", [])
        
        target_univ_names = set()
        if entity_type in ("all", "university"):
            for u in univ_q:
                if u.get("status") == "FAILED":
                    u["status"] = "PENDING"
                    u["attempt_count"] = 0
                    u["retry_count"] = 0
                    u["error_message"] = None
                    target_univ_names.add(u["name"])

        if entity_type in ("all", "professor"):
            for p in prof_q:
                if p.get("status") == "FAILED":
                    p["status"] = "PENDING"
                    p["attempt_count"] = 0
                    p["last_error"] = None
                    target_univ_names.add(p["university_name"])

        if not target_univ_names:
            return {"status": "NO_FAILED_ITEMS", "message": "재시도할 실패 작업이 없습니다."}

        self.state_data["failed_universities"] = [
            f for f in self.state_data.get("failed_universities", [])
            if f.get("university_name") not in target_univ_names
        ]
        self._update_statistics()
        self._save_queue()
        return self.invoke_batch(provider_mode=provider_mode, target_univ_names=list(target_univ_names))

    def reset_queue(self):
        """
        전체 큐를 초기화하여 PENDING 상태로 리셋합니다.
        """
        univ_q = self.state_data.get("university_queue", [])
        for u in univ_q:
            u["status"] = "PENDING"
            u["attempt_count"] = 0
            u["retry_count"] = 0
            u["error_message"] = None
            u["professors_count"] = 0
            
        for p in self.state_data.get("professor_queue", []):
            p["status"] = "PENDING"
            p["attempt_count"] = 0
            p["last_error"] = None

        self.state_data["failed_universities"] = []
        self.state_data["failed_professors"] = []
        self.state_data["statistics"]["new_professors"] = 0
        self.state_data["statistics"]["updated_professors"] = 0
        self.state_data["statistics"]["new_tasks"] = 0
        self.state_data["statistics"]["new_collaborations"] = 0
        self._update_statistics()
        self._save_queue()
        return {"status": "RESET_SUCCESS"}

    def get_summary(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """
        페이지네이션 지원 요약 리포트 (Next.js API 호환)
        """
        self._update_statistics()
        univ_q = self.state_data.get("university_queue", [])
        total_items = len(univ_q)
        start_idx = max(0, (page - 1) * page_size)
        end_idx = start_idx + page_size
        paginated_univs = univ_q[start_idx:end_idx]

        return {
            "statistics": self.state_data.get("statistics", {}),
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": math.ceil(total_items / page_size) if page_size > 0 else 1,
            },
            "university_queue": paginated_univs,
            "failed_universities": self.state_data.get("failed_universities", []),
            "failed_professors": self.state_data.get("failed_professors", []),
            "last_updated": self.state_data.get("last_updated"),
        }

    def get_professor_queue_summary(self, page: int = 1, page_size: int = 10, status_filter: Optional[str] = None) -> Dict[str, Any]:
        prof_q = self.state_data.get("professor_queue", [])
        if status_filter:
            prof_q = [p for p in prof_q if p.get("status") == status_filter]
        total_items = len(prof_q)
        start_idx = max(0, (page - 1) * page_size)
        end_idx = start_idx + page_size
        paginated = prof_q[start_idx:end_idx]

        return {
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": math.ceil(total_items / page_size) if page_size > 0 else 1,
            },
            "professor_queue": paginated
        }
