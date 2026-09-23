"""Offline follow-up review; all writes confined to a temporary directory."""
import builtins
import json
import os
import sys
import tempfile
import time
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from research import storage_manager as s
from research.archive_card_integrator import ArchiveCardIntegrator


def main():
    with tempfile.TemporaryDirectory(prefix="walkthrough_review_") as directory:
        base = Path(directory)
        db, replica = str(base / "queue.json"), str(base / "replica.json")
        integrator = ArchiveCardIntegrator(queue_path=db, sync_queue_path=replica,
            professors_path=str(base / "prof.json"), sync_professors_path=str(base / "prof_rep.json"),
            unverified_professors_path=str(base / "review.json"))
        result = {"university_name": "국민대학교", "department_keyword": "소프트웨어학부",
                  "target_year": "2026", "result_status": "CONFIRMED",
                  "detail": {"source_url": "https://expo.cs.kookmin.ac.kr/", "confidence_score": 90}}
        with patch.object(integrator.professor_researcher, "research_faculty_for_department", return_value=[]):
            first = integrator.integrate_research_result(result)
            s.update_exhibition_card_delta(db, first["card_id"], {"artworks": [{"title": "existing work"}], "isUploaded": True})
            integrator.integrate_research_result(result)
        row = s.atomic_read_json(db)[0]
        print("REREGISTER:", {"artworks": row["artworks"], "isUploaded": row["isUploaded"]})

        fake = {"name": "검증테스트", "university": "국민대학교", "department": "소프트웨어학부",
                "is_verified": True, "verification_status": "VERIFIED", "confidence_score": .95,
                "official_profile_url": "https://cs.kookmin.ac.kr/intro/professor",
                "source_url": "https://example.com/unverified", "source_title": "Title only"}
        with patch.object(integrator.professor_researcher, "research_faculty_for_department", return_value=[fake]):
            saved = integrator.integrate_research_result(result)
        print("NO_BODY_PROOF:", {"registered": len(saved["registered_professors"]), "quarantined": len(saved["quarantined_professors"])})

        original_open, original_replace = builtins.open, os.replace
        journal = s.get_journal_path(db)
        def fail_journal(path, mode="r", *args, **kwargs):
            if str(path) == journal and "w" in mode:
                raise OSError("simulated journal failure")
            return original_open(path, mode, *args, **kwargs)
        def fail_replica(source, target):
            if str(target) == replica:
                raise OSError("simulated replica failure")
            return original_replace(source, target)
        with patch("builtins.open", fail_journal), patch.object(s.os, "replace", fail_replica):
            success = s.atomic_write_json(db, [{"id": "new-value"}], [replica])
        print("WAL_FAILURE:", {"result": success, "primary_changed": s.atomic_read_json(db) == [{"id": "new-value"}], "journal_exists": os.path.exists(journal)})

        lock = s.canonical_path(db) + ".lock"
        Path(lock).write_text(f"{os.getpid()}\n{time.time()-40}\n", encoding="utf-8")
        os.utime(lock, (time.time()-40, time.time()-40))
        with s.interprocess_file_lock(db, timeout=1):
            print("LIVE_OWNER_LOCK: acquired despite existing lock belonging to live current PID")


if __name__ == "__main__":
    main()
