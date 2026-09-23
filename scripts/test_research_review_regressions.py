"""Offline review probes; all database mutations use disposable temporary files."""
import json
import multiprocessing as mp
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from research import storage_manager as storage
from research.curriculum_professor_researcher import CurriculumProfessorResearcher


def concurrent_writer(path, barrier, card_id):
    barrier.wait(timeout=15)
    storage.upsert_exhibition_card(path, {"id": card_id})


def main():
    results = []

    def check(label, safe, observed):
        results.append(safe)
        print(f"{'PASS' if safe else 'FAIL'} | {label} | {observed}", flush=True)

    with tempfile.TemporaryDirectory(prefix="research_review_") as directory:
        root = Path(directory)
        db = root / "empty.json"
        db.write_text("", encoding="utf-8")
        Path(str(db) + ".bak").write_text('[{"id":"existing"}]', encoding="utf-8")
        storage.upsert_exhibition_card(str(db), {"id": "new"})
        rows = storage.atomic_read_json(str(db))
        check("empty file preserves backup records", any(x["id"] == "existing" for x in rows), rows)

        db = root / "source.json"
        sync = root / "platform.json"
        storage.atomic_write_json(str(db), [{"id": "old"}], [str(sync)])
        original_replace = storage.os.replace

        def fail_sync(source, target):
            if str(target) == str(sync):
                raise OSError("simulated sync failure")
            return original_replace(source, target)

        with patch.object(storage.os, "replace", fail_sync):
            success = storage.atomic_write_json(str(db), [{"id": "new"}], [str(sync)])
        check("sync failure cannot report success", not success,
              {"returned": success, "root": storage.atomic_read_json(str(db)), "platform": storage.atomic_read_json(str(sync))})

        db = root / "legacy.json"
        card = {"university": "Test University", "department": "CS", "year": "2026"}
        storage.atomic_write_json(str(db), [dict(card, id="legacy-123")])
        storage.upsert_exhibition_card(str(db), dict(card))
        rows = storage.atomic_read_json(str(db))
        check("legacy identity reused", len(rows) == 1, [x["id"] for x in rows])

        researcher = CurriculumProfessorResearcher(allow_mock=False)
        faculty = researcher.research_faculty_for_department("건국대학교", "시각영상디자인학과")
        check("no verified faculty without fetched evidence", not any(p["is_verified"] for p in faculty),
              {"returned": len(faculty), "verified": sum(p["is_verified"] for p in faculty)})
        faculty = researcher.research_faculty_for_department(
            "건국대학교", "시각영상디자인학과",
            student_works=[{"title": "Example", "raw_text": "초청 강연: Professor 맹형균"}])
        relations = [s["relation_type"] for p in faculty for s in p["student_submissions"]]
        check("guest professor mention is not supervision", "PROFESSOR_SUPERVISED_PROJECT" not in relations, relations)

        db = root / "concurrent.json"
        storage.atomic_write_json(str(db), [{"id": "seed"}])
        ctx = mp.get_context("spawn")
        barrier = ctx.Barrier(2)
        workers = [ctx.Process(target=concurrent_writer, args=(str(db), barrier, f"writer-{i}")) for i in range(2)]
        for worker in workers:
            worker.start()
        for worker in workers:
            worker.join(timeout=25)
            if worker.is_alive():
                worker.terminate()
                worker.join()
        if any(w.exitcode != 0 for w in workers):
            raise RuntimeError(f"Concurrency probe did not complete: {[w.exitcode for w in workers]}")
        rows = storage.atomic_read_json(str(db))
        check("cross-process updates both retained", len(rows) == 3, [x["id"] for x in rows])
    print(f"SUMMARY: {sum(results)}/{len(results)} safety checks passed")
    return 0 if all(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
