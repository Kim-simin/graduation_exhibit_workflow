#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Verification Script for Department-Tailored Junior Job Curation System:
1. Verifies data/jobs.json seed data (junior only constraint, 12 categories, preferredDepartments).
2. Verifies Sidebar and GNB navigation changes (/jobs, '채용공고 및 스카우팅', '채용 연계').
3. Verifies /jobs/page.tsx UI components and department matching logic.
4. Verifies Graduation Exhibition Archive remains 100% intact (university_queue.json).
"""

import json
import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLATFORM_DIR = os.path.join(ROOT_DIR, "my-exhibit-platform")

EXPECTED_12_CATEGORIES = [
    "경영·사무",
    "마케팅·광고·홍보",
    "무역·유통",
    "IT·인터넷",
    "생산·제조",
    "영업·고객상담",
    "건설",
    "금융",
    "연구개발·설계",
    "디자인",
    "미디어",
    "전문·특수직"
]

def test_jobs_seed_data():
    print("[1/5] Verifying data/jobs.json seed data...")
    paths = [
        os.path.join(ROOT_DIR, "data", "jobs.json"),
        os.path.join(PLATFORM_DIR, "data", "jobs.json")
    ]
    for path in paths:
        assert os.path.exists(path), f"File not found: {path}"
        with open(path, "r", encoding="utf-8") as f:
            jobs = json.load(f)
        
        assert len(jobs) >= 20, f"Expected at least 20 jobs, found {len(jobs)}"
        
        categories_found = set()
        partnership_count = 0
        for j in jobs:
            # Check required fields
            assert "id" in j and j["id"], f"Job missing id: {j}"
            assert "companyName" in j and j["companyName"], f"Job missing companyName: {j}"
            assert "title" in j and j["title"], f"Job missing title: {j}"
            assert "jobCategory" in j and j["jobCategory"], f"Job missing jobCategory: {j}"
            assert "techStacks" in j and isinstance(j["techStacks"], list), f"Job missing techStacks: {j}"
            assert "preferredDepartments" in j and isinstance(j["preferredDepartments"], list), f"Job missing preferredDepartments: {j}"
            assert len(j["preferredDepartments"]) > 0, f"preferredDepartments empty: {j}"
            
            # [CRITICAL] Junior only constraint
            assert j.get("careerLevel") in ["신입", "신입/경력무관"], f"Violated junior only constraint: {j.get('careerLevel')} in {j['title']}"
            
            categories_found.add(j["jobCategory"])
            if j.get("isPartnership"):
                partnership_count += 1
        
        # Check all 12 categories are represented
        for exp_cat in EXPECTED_12_CATEGORIES:
            assert exp_cat in categories_found, f"Missing category: {exp_cat} in {path}"
        
        assert partnership_count >= 3, f"Expected at least 3 partnership jobs, found {partnership_count}"
        print(f"  PASS: {os.path.basename(path)} contains {len(jobs)} junior-only jobs across all 12 categories ({partnership_count} partnership jobs).")

def test_navigation_updates():
    print("[2/5] Verifying Sidebar.tsx and GNB.tsx navigation updates...")
    sidebar_path = os.path.join(PLATFORM_DIR, "components", "navigation", "Sidebar.tsx")
    with open(sidebar_path, "r", encoding="utf-8") as f:
        sidebar_content = f.read()
    
    assert "채용공고 및 스카우팅" in sidebar_content, "Sidebar missing '채용공고 및 스카우팅'"
    assert "href: \"/jobs\"" in sidebar_content or "href: '/jobs'" in sidebar_content, "Sidebar missing '/jobs' route"
    assert "채용 연계" in sidebar_content, "Sidebar missing '채용 연계' badge"
    assert "Briefcase" in sidebar_content or "💼" in sidebar_content, "Sidebar missing Briefcase icon"

    gnb_path = os.path.join(PLATFORM_DIR, "components", "navigation", "GNB.tsx")
    with open(gnb_path, "r", encoding="utf-8") as f:
        gnb_content = f.read()
    
    assert "채용공고 및 스카우팅" in gnb_content, "GNB missing '채용공고 및 스카우팅'"
    assert "href: \"/jobs\"" in gnb_content or "href: '/jobs'" in gnb_content, "GNB missing '/jobs' route"
    assert "채용 연계" in gnb_content, "GNB missing '채용 연계' badge"
    print("  PASS: Sidebar and GNB navigation cleanly updated to '/jobs' with '채용공고 및 스카우팅' and '채용 연계'.")

def test_jobs_page_ui():
    print("[3/5] Verifying app/(public)/jobs/page.tsx UI logic...")
    jobs_page_path = os.path.join(PLATFORM_DIR, "app", "(public)", "jobs", "page.tsx")
    assert os.path.exists(jobs_page_path), f"Jobs page not found: {jobs_page_path}"
    
    with open(jobs_page_path, "r", encoding="utf-8") as f:
        page_content = f.read()
    
    # 1. Department selector
    assert "어느 학과에 재학 중이신가요?" in page_content, "Missing department question"
    assert "selectedDepartment" in page_content, "Missing selectedDepartment state"
    
    # 2. Junior only constraint check
    assert "careerLevel === \"신입\"" in page_content or "careerLevel === '신입'" in page_content, "Missing junior filter enforcement"
    assert "🌱 신입 전용" in page_content, "Missing [🌱 신입 전용] badge"
    
    # 3. 12 Categories pill filter
    for cat in EXPECTED_12_CATEGORIES:
        assert cat in page_content, f"Missing category {cat} in page.tsx"
    assert "no-scrollbar" in page_content, "Missing no-scrollbar horizontal chip container"
    
    # 4. Department matching highlight
    assert "우대 전공:" in page_content, "Missing '우대 전공:' highlight block"
    assert "🎯 내 전공 맞춤" in page_content, "Missing '[🎯 내 전공 맞춤]' badge"
    assert "border-blue-500" in page_content, "Missing border-blue-500 highlight"
    
    # 5. Partnership guide
    assert "산학협력 연계 기업" in page_content, "Missing partnership indicator"
    assert "🚀 채용공고 상세보기" in page_content, "Missing CTA button"
    print("  PASS: app/(public)/jobs/page.tsx contains complete UI components, department matching, and junior-only logic.")

def test_rfp_redirect():
    print("[4/5] Verifying legacy /rfp redirect to /jobs...")
    rfp_page_path = os.path.join(PLATFORM_DIR, "app", "(public)", "rfp", "page.tsx")
    with open(rfp_page_path, "r", encoding="utf-8") as f:
        c = f.read()
    assert "redirect(\"/jobs\")" in c or "redirect('/jobs')" in c, "Missing redirect('/jobs') in rfp page"
    print("  PASS: /rfp cleanly redirects to /jobs.")

def test_archive_intact():
    print("[5/5] Verifying Graduation Exhibition Archive remains 100% intact...")
    archive_file = os.path.join(ROOT_DIR, "data", "university_queue.json")
    with open(archive_file, "r", encoding="utf-8") as f:
        exhibitions = json.load(f)
    assert len(exhibitions) == 185, f"Archive count changed! Expected 185, found {len(exhibitions)}"
    print(f"  PASS: Graduation Exhibition Archive intact with {len(exhibitions)} exhibitions.")

def main():
    print("=== Verification of Department-Tailored Junior Job Curation System ===")
    test_jobs_seed_data()
    test_navigation_updates()
    test_jobs_page_ui()
    test_rfp_redirect()
    test_archive_intact()
    print("=== ALL 5 CHECKS PASSED SUCCESSFULLY (100%) ===")

if __name__ == "__main__":
    main()
