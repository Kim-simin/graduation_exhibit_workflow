"""Run with py -3 scripts/test_student_rnd_pipeline.py. Never touches live DBs."""

import copy
import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from research.opportunity_eligibility import evaluate_student_rnd, is_student_rnd_opportunity
from research.opportunity_sources import OPPORTUNITY_SOURCES, normalize_source_url
from scripts.register_opportunities_and_equipment import prepare_opportunity, register_records

NOW = datetime.fromisoformat("2026-09-29T12:00:00+09:00")


def candidate():
    return {
        "type": "RND", "title": "테스트 학생 연구 모집", "providerName": "테스트 기관",
        "sourceUrl": "https://www.ntis.go.kr/project/detail?id=fixture", "approvalStatus": "PUBLISHED",
        "eligibleAudience": ["학부생"], "recruitmentStartAt": "2026-09-01", "recruitmentEndAt": "2026-10-01",
        "recruitmentEvidence": {
            "sourceUrl": "https://school.krict.re.kr/prog/jobOffer/kor/sub04_04_02/view.do?id=fixture",
            "sourceKind": "RESEARCH_INSTITUTE_OFFICIAL", "isOfficialDetail": True,
            "eligibilityText": "지원자격: 학부생 재학생", "recruitmentText": "학생 연구인턴 접수 및 모집",
            "verifiedAt": "2026-09-29T09:00:00+09:00", "rollingAdmission": False,
        },
    }


def deep_merge(base, patch):
    result = copy.deepcopy(base)
    for key, value in patch.items():
        result[key] = deep_merge(result[key], value) if isinstance(value, dict) and isinstance(result.get(key), dict) else copy.deepcopy(value)
    return result


class StudentRecruitmentTests(unittest.TestCase):
    def test_official_open_undergraduate_and_discovery_separation(self):
        item = candidate()
        self.assertTrue(is_student_rnd_opportunity(item, NOW))
        del item["recruitmentEvidence"]
        item["studentParticipationVerified"] = item["officialSourceVerified"] = True
        self.assertFalse(is_student_rnd_opportunity(item, NOW))

    def test_source_registry_and_url_cleanup(self):
        self.assertEqual(len(OPPORTUNITY_SOURCES), 12)
        self.assertEqual(normalize_source_url("https://www.nst.re.kr/www/selectBbsNttView.do?nttNo=42&utm_source=test&bbsNo=19"),
                         "https://www.nst.re.kr/www/selectBbsNttView.do?nttNo=42&bbsNo=19")
        for bad in ("[https://www.nst.re.kr](https://www.nst.re.kr)", "https://a.ac.kr/https://b.ac.kr/", "javascript:alert(1)"):
            with self.assertRaises(ValueError):
                normalize_source_url(bad)

    def test_unsafe_and_nonstudent_cases_never_publish(self):
        cases = [
            {"recruitmentEvidence": {"sourceUrl": "https://www.ntis.go.kr/project/detail?id=1", "sourceKind": "NST"}},
            {"recruitmentEvidence": {"sourceUrl": "https://www.nst.re.kr/www/selectBbsNttList.do?bbsNo=19&key=61", "sourceKind": "NST"}},
            {"recruitmentEvidence": {"eligibilityText": "석사 및 박사과정 대학원생만 모집"}},
            {"recruitmentEvidence": {"eligibilityText": "연구인턴 모집"}},
            {"recruitmentEvidence": {"eligibilityText": "학부생은 지원할 수 없습니다"}},
            {"recruitmentEvidence": {"eligibilityText": "학부생 모집하지 않음"}},
            {"recruitmentEvidence": {"eligibilityText": "학부생 지원 불가능"}},
            {"recruitmentEvidence": {"eligibilityText": ["학부생"]}},
            {"recruitmentEvidence": {"recruitmentText": ["모집"]}},
            {"recruitmentEndAt": "invalid"}, {"recruitmentEndAt": "2026-02-30"},
            {"recruitmentStartAt": None, "recruitmentEndAt": None},
            {"recruitmentEndAt": "2026-09-28"}, {"status": "CLOSED"},
            {"type": "SHARED_INFRASTRUCTURE"}, {"approvalStatus": "PENDING_REVIEW"},
        ]
        for patch in cases:
            with self.subTest(patch=patch):
                self.assertFalse(is_student_rnd_opportunity(deep_merge(candidate(), patch), NOW))

    def test_rolling_requires_recent_explicit_evidence(self):
        item = deep_merge(candidate(), {"recruitmentEndAt": None, "recruitmentEvidence": {"rollingAdmission": True, "recruitmentText": "학생 연구인턴 상시 모집"}})
        self.assertTrue(is_student_rnd_opportunity(item, NOW))
        item["recruitmentEvidence"]["verifiedAt"] = "2026-08-01T00:00:00+09:00"
        self.assertFalse(is_student_rnd_opportunity(item, NOW))

    def test_shared_frontend_backend_fixtures(self):
        fixture_path = ROOT / "scripts" / "fixtures" / "student_rnd_cases.json"
        if not fixture_path.exists():
            self.skipTest("Shared fixtures not available")
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
        now = datetime.fromisoformat(fixture["now"].replace("Z", "+00:00"))
        for case in fixture["cases"]:
            with self.subTest(name=case["name"]):
                item = deep_merge(fixture["base"], case.get("patch", {}))
                result = evaluate_student_rnd(item, now)
                self.assertEqual(is_student_rnd_opportunity(item, now), case["expectedActive"])
                for expected_key, result_key in (("expectedStatus", "recruitmentStatus"), ("expectedStudent", "studentParticipationVerified"), ("expectedOfficial", "officialSourceVerified")):
                    if expected_key in case:
                        self.assertEqual(result[result_key], case[expected_key])

    def test_upsert_preserves_seeds_ids_fields_and_both_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            primary, replica = (Path(directory) / "root.json", Path(directory) / "platform.json")
            primary_seed = {"id": "primary-seed", "sourceUrl": "https://a.ac.kr/seed", "title": "seed", "providerName": "a", "custom": "preserve"}
            replica_seed = {"id": "replica-seed", "sourceUrl": "https://b.ac.kr/seed", "title": "seed2", "providerName": "b"}
            primary.write_text(json.dumps([primary_seed]), encoding="utf-8")
            replica.write_text(json.dumps([replica_seed]), encoding="utf-8")
            keys = ["sourceUrl", "title", "providerName"]
            new = prepare_opportunity(candidate(), NOW)
            merged, created, _ = register_records(str(primary), str(replica), [new], keys)
            self.assertEqual((len(merged), created), (3, 1))
            merged, created, _ = register_records(str(primary), str(replica), [prepare_opportunity(candidate(), NOW)], keys)
            self.assertEqual((len(merged), created), (3, 0))
            self.assertEqual(merged[0], primary_seed)
            self.assertEqual(json.loads(primary.read_text(encoding="utf-8")), json.loads(replica.read_text(encoding="utf-8")))
            before = primary.read_bytes(), replica.read_bytes()
            register_records(str(primary), str(replica), [new], keys, dry_run=True)
            self.assertEqual(before, (primary.read_bytes(), replica.read_bytes()))

    def test_corrupt_input_does_not_replace_existing_primary(self):
        with tempfile.TemporaryDirectory() as directory:
            primary, replica = (Path(directory) / "root.json", Path(directory) / "platform.json")
            primary.write_text("broken-json", encoding="utf-8")
            replica.write_text("[]", encoding="utf-8")
            with self.assertRaises(Exception):
                register_records(str(primary), str(replica), [prepare_opportunity(candidate(), NOW)], ["sourceUrl", "title", "providerName"])
            self.assertEqual(primary.read_text(), "broken-json")


if __name__ == "__main__":
    unittest.main(verbosity=2)
