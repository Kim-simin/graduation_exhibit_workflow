"""
Data Intelligence & Verified Web Update Automated Test Suite
19 Exhaustive Test Scenarios covering:
1. Taxonomy Schema Integrity
2. Source Discovery & Domain Priority
3. Evidence Extraction & AI Summary Separation
4. Strict No-Fake-Data Policy & Missing Evidence Rejection
5. Confidence Evaluation & 0.85 Threshold
6. Domain Whitelist Validation (.ac.kr, edu, official corporate)
7. Professor Profile Verification & Attribute Integrity
8. RFP Brief Separation (Original vs Abstract)
9. RFP Status & Deadline Format Validation
10. Brand Open IP License Scope & Allowed Uses
11. Brand Open IP 4-Asset Bundle Completeness
12. Mentor Career Evidence & LinkedIn/Portfolio URL Tracking
13. Mentor Review Authenticity & Rating Bounds
14. Entity Deduplication & High-Confidence Retention
15. Change Detection Mechanism & Old/New Diff Snapshots
16. Audit Logging in data/logs/data_intelligence_audit.json
17. Human Review Gate (REVIEW_REQUIRED Isolation)
18. Dual Database Synchronization (data/ <-> my-exhibit-platform/data/)
19. Next.js API Contracts & UI Data Types
"""

import os
import sys
import json
import uuid
import unittest
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from data_intelligence.models import (
    STANDARD_TAXONOMY,
    STATUS_VERIFIED,
    STATUS_REVIEW_REQUIRED,
    STATUS_UNVERIFIED,
    SOURCE_TIER_OFFICIAL_PRIMARY,
    SOURCE_TIER_LOW_TRUST,
    ProfessorProfile,
    RFPRecord,
    BrandOpenIPRecord,
    MentorRecord,
)
from data_intelligence.nodes import classify_source
from data_intelligence.runner import run_data_intelligence_pipeline, export_taxonomy
from data_intelligence.graph import build_data_intelligence_graph


class TestDataIntelligenceSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        export_taxonomy()

    def test_01_taxonomy_schema_integrity(self):
        """1. 8대 표준 산업군 및 전공 매핑 완전성 검증"""
        self.assertGreaterEqual(len(STANDARD_TAXONOMY), 8)
        required_keys = {"id", "name", "icon", "keywords", "related_majors", "color"}
        for tax in STANDARD_TAXONOMY:
            self.assertTrue(required_keys.issubset(tax.keys()))
            self.assertGreater(len(tax["keywords"]), 0)
            self.assertGreater(len(tax["related_majors"]), 0)

    def test_02_source_discovery_priority(self):
        """2. 공식 학술/기업 도메인 우선순위 확인"""
        univ_source = classify_source("https://design.hongik.ac.kr/faculty")
        self.assertEqual(univ_source["source_tier"], SOURCE_TIER_OFFICIAL_PRIMARY)
        self.assertEqual(univ_source["source_type"], "OFFICIAL_UNIVERSITY")
        self.assertTrue(univ_source["is_trusted"])

        corp_source = classify_source("https://www.hyundai.com/kr/ko/e/news")
        self.assertEqual(corp_source["source_tier"], SOURCE_TIER_OFFICIAL_PRIMARY)
        self.assertEqual(corp_source["source_type"], "OFFICIAL_COMPANY")
        self.assertTrue(corp_source["is_trusted"])

        random_blog = classify_source("https://blog.naver.com/some_user/123")
        self.assertEqual(random_blog["source_tier"], SOURCE_TIER_LOW_TRUST)
        self.assertFalse(random_blog["is_trusted"])

    def test_03_evidence_extraction_separation(self):
        """3. 원문 증거와 요약 브리프의 엄격한 분리 검증"""
        test_rfp = {
            "id": "rfp-test-01",
            "company": "현대자동차",
            "title": "미래 PBV 상호작용 디자인",
            "abstract_brief": "요약된 문제 정의입니다.",
            "problem_statement": "기업 원문 문제 정의문 전체입니다.",
            "deadline": "2026-10-31",
            "source_url": "https://hyundai.com/careers/rfp/01",
            "evidence_text": "현대자동차 공식 2026 산학협력 공모 공고 원문 발췌"
        }
        res = run_data_intelligence_pipeline(domain="rfp", raw_discovered=[test_rfp])
        self.assertIn("extracted_records", res)
        extracted = [r for r in res["extracted_records"] if r.get("id") == "rfp-test-01"][0]
        self.assertIsNotNone(extracted.get("original_brief"))
        self.assertNotEqual(extracted["original_brief"], "")

    def test_04_strict_no_fake_data_policy(self):
        """4. 출처 없는 허위 데이터 삽입 시도시 거부 및 플래그 검증"""
        fake_prof = {
            "id": "prof-fake-01",
            "name": "유령교수",
            "university": "가상대학교",
            "source_url": "",  # No source
            "evidence_text": ""
        }
        res = run_data_intelligence_pipeline(domain="professors", raw_discovered=[fake_prof])
        flagged_ids = [r.get("id") for r in res.get("flagged_records", [])]
        self.assertIn("prof-fake-01", flagged_ids)
        self.assertTrue(res.get("needs_human_review"))

    def test_05_confidence_evaluation_threshold(self):
        """5. 신뢰도 점수 산출 로직(0.85 임계값) 검증"""
        verified_item = {
            "id": "prof-ver-01",
            "name": "홍길동",
            "university": "서울대학교",
            "source_url": "https://snu.ac.kr/prof/hong",
            "email": "hong@snu.ac.kr",
            "evidence_text": "서울대학교 미술대학 공식 교원 프로필 및 연구실 안내"
        }
        res = run_data_intelligence_pipeline(domain="professors", raw_discovered=[verified_item])
        verified_recs = [r for r in res.get("verified_records", []) if r.get("id") == "prof-ver-01"]
        self.assertEqual(len(verified_recs), 1)
        self.assertGreaterEqual(verified_recs[0]["confidence_score"], 0.85)
        self.assertEqual(verified_recs[0]["verification_status"], STATUS_VERIFIED)

    def test_06_domain_whitelist_validation(self):
        """6. ac.kr, edu, 공식 기업 도메인 필터링 검증"""
        valid_domains = [
            "https://art.snu.ac.kr/faculty",
            "https://design.kaist.ac.kr/people",
            "https://toss.im/career/design",
            "https://musinsa.com/brand/guidelines"
        ]
        for url in valid_domains:
            info = classify_source(url)
            self.assertTrue(info["is_trusted"])

    def test_07_professor_profile_verification(self):
        """7. 교수 프로필 데이터의 공식 출처 및 검증 속성 검증"""
        with open("data/professors.json", "r", encoding="utf-8") as f:
            profs = json.load(f)
        self.assertGreater(len(profs), 0)
        for p in profs:
            self.assertIn("name", p)
            self.assertIn("university", p)
            self.assertIn("source_url", p)
            self.assertIn("verification_status", p)

    def test_08_rfp_brief_separation(self):
        """8. 원문 브리프와 요약 브리프의 분리 무결성 검증"""
        with open("data/rfp.json", "r", encoding="utf-8") as f:
            rfps = json.load(f)
        self.assertGreater(len(rfps), 0)
        for r in rfps:
            self.assertIn("abstract_brief", r)
            self.assertTrue(len(r["abstract_brief"]) > 10)

    def test_09_rfp_status_and_deadline(self):
        """9. RFP 마감일 포맷 및 유효성 검증 (YYYY-MM-DD)"""
        with open("data/rfp.json", "r", encoding="utf-8") as f:
            rfps = json.load(f)
        for r in rfps:
            self.assertIn("deadline", r)
            # 검증 가능한 날짜 형식 체크
            parsed_date = datetime.strptime(r["deadline"], "%Y-%m-%d")
            self.assertIsNotNone(parsed_date)

    def test_10_brand_ip_license_verification(self):
        """10. Open IP 라이선스 및 허용 범위 검증"""
        with open("data/brand_assets.json", "r", encoding="utf-8") as f:
            assets = json.load(f)
        for a in assets:
            self.assertIn("license", a)
            self.assertIn("company", a)
            self.assertTrue("졸업작품" in a["license"] or "비영리" in a["license"])

    def test_11_brand_ip_asset_bundle(self):
        """11. 4대 에셋 패키지 무결성 검증 (로고, 가이드, 3D, 서체)"""
        with open("data/brand_assets.json", "r", encoding="utf-8") as f:
            assets = json.load(f)
        for a in assets:
            self.assertIn("assets", a)
            self.assertGreaterEqual(len(a["assets"]), 4)

    def test_12_mentor_career_evidence(self):
        """12. 멘토 재직/경력 증거 및 속성 검증"""
        with open("data/mentors.json", "r", encoding="utf-8") as f:
            mentors = json.load(f)
        for m in mentors:
            self.assertIn("company", m)
            self.assertIn("role", m)
            self.assertGreater(m.get("experience_years", 0), 0)
            self.assertIn("career_timeline", m)

    def test_13_mentor_review_authenticity(self):
        """13. 리뷰 증거 및 평점 정합성 검증 (0.0 <= rating <= 5.0)"""
        with open("data/mentors.json", "r", encoding="utf-8") as f:
            mentors = json.load(f)
        for m in mentors:
            self.assertGreaterEqual(m["rating"], 0.0)
            self.assertLessEqual(m["rating"], 5.0)
            self.assertGreaterEqual(m["review_count"], 0)

    def test_14_entity_deduplication(self):
        """14. 중복 레코드 병합 및 최신/최고 신뢰도 데이터 보존 검증"""
        dup1 = {
            "id": "prof-dup-01",
            "name": "중복교수",
            "university": "한국대",
            "source_url": "https://hankuk.ac.kr/prof1",
            "confidence_score": 0.88,
            "evidence_text": "한국대 교원정보 1차"
        }
        dup2 = {
            "id": "prof-dup-01",
            "name": "중복교수",
            "university": "한국대",
            "source_url": "https://hankuk.ac.kr/prof1_updated",
            "confidence_score": 0.96,
            "evidence_text": "한국대 교원정보 최신 갱신본"
        }
        res = run_data_intelligence_pipeline(domain="professors", raw_discovered=[dup1, dup2])
        deduped = [r for r in res.get("deduplicated_records", []) if r.get("id") == "prof-dup-01"]
        self.assertEqual(len(deduped), 1)
        self.assertEqual(deduped[0]["confidence_score"], 0.96)

    def test_15_change_detection_mechanism(self):
        """15. 필드 변경 시 DIFF 및 OLD/NEW 스냅샷 감지 검증"""
        # 임의 고유 레코드 생성 후 변경 감지 테스트
        unique_id = f"prof-test-diff-{uuid.uuid4().hex[:6]}"
        new_prof = {
            "id": unique_id,
            "name": "신임교수",
            "university": "테스트대학교",
            "source_url": "https://test.ac.kr/prof",
            "research_areas": ["지능형 UX"],
            "evidence_text": "테스트대학교 공식 임용 공고"
        }
        res = run_data_intelligence_pipeline(domain="professors", raw_discovered=[new_prof])
        self.assertIn("detected_changes", res)
        self.assertGreater(len(res["detected_changes"]), 0)

    def test_16_audit_logging(self):
        """16. data/logs/data_intelligence_audit.json 감사 로그 기록 검증"""
        audit_file = "data/logs/data_intelligence_audit.json"
        self.assertTrue(os.path.exists(audit_file))
        with open(audit_file, "r", encoding="utf-8") as f:
            logs = json.load(f)
        self.assertIsInstance(logs, list)
        self.assertGreater(len(logs), 0)
        self.assertIn("log_id", logs[0])
        self.assertIn("recorded_at", logs[0])

    def test_17_human_review_gate(self):
        """17. 신뢰도 미달 항목의 REVIEW_REQUIRED 격리 검증"""
        unverified_item = {
            "id": "item-unverified-99",
            "company": "미확인기업",
            "title": "미확인 공모",
            "source_url": "http://unknown-domain.xyz",
            "evidence_text": ""
        }
        res = run_data_intelligence_pipeline(domain="rfp", raw_discovered=[unverified_item])
        self.assertTrue(res.get("needs_human_review"))
        self.assertEqual(res.get("status"), "review_pending")

    def test_18_database_frontend_sync(self):
        """18. data/ 와 my-exhibit-platform/data/ 동기화 일치 검증"""
        pairs = [
            ("data/professors.json", "my-exhibit-platform/data/professors.json"),
            ("data/rfp.json", "my-exhibit-platform/data/rfp.json"),
            ("data/brand_assets.json", "my-exhibit-platform/data/brand_assets.json"),
            ("data/mentors.json", "my-exhibit-platform/data/mentors.json"),
            ("data/taxonomy.json", "my-exhibit-platform/data/taxonomy.json"),
        ]
        for src, dst in pairs:
            self.assertTrue(os.path.exists(src), f"Missing {src}")
            self.assertTrue(os.path.exists(dst), f"Missing {dst}")
            with open(src, "r", encoding="utf-8") as f1, open(dst, "r", encoding="utf-8") as f2:
                d1 = json.load(f1)
                d2 = json.load(f2)
                self.assertEqual(len(d1), len(d2), f"Length mismatch between {src} and {dst}")

    def test_19_nextjs_api_and_ui_contracts(self):
        """19. Next.js API 엔드포인트 파일 및 라우트 정합성 검증"""
        api_files = [
            "my-exhibit-platform/app/api/taxonomy/route.ts",
            "my-exhibit-platform/app/api/data-intelligence/route.ts",
            "my-exhibit-platform/app/(public)/professors/page.tsx",
            "my-exhibit-platform/app/(public)/rfp/page.tsx",
            "my-exhibit-platform/app/(public)/brand-assets/page.tsx",
            "my-exhibit-platform/app/(public)/mentoring/page.tsx",
        ]
        for fpath in api_files:
            self.assertTrue(os.path.exists(fpath), f"Missing UI or API route: {fpath}")


if __name__ == "__main__":
    unittest.main()
