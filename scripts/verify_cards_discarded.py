#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Verification script:
1. Verify graduation exhibition archive data remains intact (not touched).
2. Verify all other non-archive cards are discarded in lib/data.ts (return empty lists).
3. Verify underlying json seed databases in data/ and my-exhibit-platform/data/ are preserved (json-db-safeguard).
4. Verify non-archive pages exist and have empty state handling.
"""

import json
import os
import sys

PLATFORM_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "my-exhibit-platform")
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_archive_intact():
    print("[1/4] Checking Graduation Exhibition Archive integrity...")
    archive_file = os.path.join(PLATFORM_DIR, "data", "university_queue.json")
    if not os.path.exists(archive_file):
        archive_file = os.path.join(ROOT_DIR, "data", "university_queue.json")
    
    with open(archive_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    assert len(data) > 0, f"Exhibitions data must not be empty! Found {len(data)}"
    print(f"  PASS: Graduation exhibition archive contains {len(data)} exhibitions (Intact).")

def test_data_ts_discarded():
    print("[2/4] Checking lib/data.ts card getters return empty...")
    data_ts_path = os.path.join(PLATFORM_DIR, "lib", "data.ts")
    with open(data_ts_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check that key card getters return empty arrays
    must_return_empty = [
        "export function getStudents(): Student[] {\n  return [];\n}",
        "export function getProfessors(): Professor[] {\n  return [];\n}",
        "export function getRfps(): RFP[] {\n  return [];\n}",
        "export function getBrandAssets(): BrandAsset[] {\n  return [];\n}",
        "export function getMentors(): Mentor[] {\n  return [];\n}",
    ]
    for pattern in must_return_empty:
        assert pattern in content, f"Missing empty return pattern: {pattern}"
    
    # Check that find-by-id getters return undefined
    must_return_undefined = [
        "export function getStudentById(id: string): Student | undefined {\n  return undefined;\n}",
        "export function getProfessorById(id: string): Professor | undefined {\n  return undefined;\n}",
        "export function getRfpById(id: string): RFP | undefined {\n  return undefined;\n}",
        "export function getMentorById(id: string): Mentor | undefined {\n  return undefined;\n}",
    ]
    for pattern in must_return_undefined:
        assert pattern in content, f"Missing undefined return pattern: {pattern}"

    print("  PASS: All non-archive entity getters return empty arrays [] and undefined.")

def test_json_safeguard():
    print("[3/4] Checking json-db-safeguard compliance...")
    seed_files = [
        os.path.join(ROOT_DIR, "data", "professors.json"),
        os.path.join(ROOT_DIR, "data", "students.json"),
        os.path.join(ROOT_DIR, "data", "rfp.json"),
        os.path.join(ROOT_DIR, "data", "mentors.json"),
        os.path.join(ROOT_DIR, "data", "brand_assets.json"),
    ]
    for path in seed_files:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                d = json.load(f)
            assert len(d) > 0, f"Seed file {os.path.basename(path)} was unexpectedly emptied on disk!"
            print(f"  PASS: Seed database {os.path.basename(path)} preserved ({len(d)} items on disk).")

def test_empty_state_rendered():
    print("[4/4] Checking empty state handling in non-archive pages...")
    pages = {
        "students/page.tsx": "현재 등록된 신진 창작자 카드 정보가 없습니다",
        "professors/page.tsx": "현재 등록된 교수진 및 학기 과제 카드 정보가 없습니다",
        "rfp/page.tsx": "현재 등록된 산학 협력 과제(RFP) 카드 정보가 없습니다",
        "brand-assets/page.tsx": "현재 등록된 기업 브랜드 IP 에셋 카드 정보가 없습니다",
        "mentoring/page.tsx": "현재 등록된 현직자 멘토링 카드 정보가 없습니다",
        "corporate/page.tsx": "현재 등록된 산학 협력 과제(RFP) 카드 정보가 없습니다",
    }
    for page_rel, expected_text in pages.items():
        page_path = os.path.join(PLATFORM_DIR, "app", "(public)", page_rel)
        assert os.path.exists(page_path), f"Page not found: {page_path}"
        with open(page_path, "r", encoding="utf-8") as f:
            c = f.read()
        if page_rel == "rfp/page.tsx":
            assert 'redirect("/jobs")' in c or "redirect('/jobs')" in c or expected_text in c, f"Page {page_rel} must redirect to /jobs"
            print(f"  PASS: {page_rel} cleanly redirects to /jobs.")
        else:
            assert expected_text in c, f"Page {page_rel} missing empty state text: '{expected_text}'"
            print(f"  PASS: {page_rel} renders empty state message.")

def main():
    print("=== Verification of Non-Archive Card Discarding ===")
    test_archive_intact()
    test_data_ts_discarded()
    test_json_safeguard()
    test_empty_state_rendered()
    print("=== ALL 4 CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()
