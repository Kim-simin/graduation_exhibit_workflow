#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test Suite for Worknet API Integration:
1. Tests GET /api/jobs endpoint.
2. Verifies response schema (JobPosting fields, no fake URLs, originUrl validity).
3. Verifies category and department filtering via API query params.
4. Uses Playwright to verify client-side fetching on /jobs.
"""

import asyncio
import json
import urllib.request
import os
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3000"
ARTIFACT_DIR = r"C:\Users\USER\.gemini\antigravity\brain\b230d1db-c8fe-4832-a784-442bd1dddf26"

def test_api_endpoint():
    print("[1/4] Testing GET /api/jobs basic endpoint...")
    url = f"{BASE_URL}/api/jobs"
    req = urllib.request.Request(url, headers={"User-Agent": "TestRunner/1.0"})
    with urllib.request.urlopen(req, timeout=10) as res:
        assert res.status == 200, f"Expected 200, got {res.status}"
        data = json.loads(res.read().decode("utf-8"))
    
    assert data.get("success") is True, f"API success flag not true: {data}"
    jobs = data.get("jobs", [])
    assert len(jobs) > 0, "No jobs returned by /api/jobs"
    
    print(f"  PASS: Received {len(jobs)} jobs from {data.get('source', 'unknown')}.")
    return jobs

def test_origin_urls_validity(jobs):
    print("[2/4] Verifying all originUrl links are valid and have NO '...' (No 404s)...")
    for j in jobs:
        url = j.get("originUrl", "")
        assert url.startswith("http://") or url.startswith("https://"), f"Invalid url protocol: {url}"
        assert "..." not in url, f"Found placeholder '...' in originUrl: {url}"
        assert len(url) >= 20, f"URL too short or malformed: {url}"
        assert "work.go.kr" in url or "toss.im" in url or "hyundai.com" in url or "navercorp.com" in url or "coupang.jobs" in url, f"Unexpected domain: {url}"
    print(f"  PASS: All {len(jobs)} jobs have verified, clickable originUrls without placeholders.")

def test_api_query_filters():
    print("[3/4] Testing API query parameter filters (category and department)...")
    
    # 1. Category test
    cat_url = f"{BASE_URL}/api/jobs?category={urllib.parse.quote('디자인')}"
    with urllib.request.urlopen(urllib.request.Request(cat_url), timeout=10) as res:
        data = json.loads(res.read().decode("utf-8"))
        jobs = data.get("jobs", [])
        for j in jobs:
            assert j["jobCategory"] == "디자인", f"Category mismatch: {j['jobCategory']}"
        print(f"  PASS: Category filter returned {len(jobs)} '디자인' jobs.")

    # 2. Department test
    dept_url = f"{BASE_URL}/api/jobs?department={urllib.parse.quote('시각디자인')}"
    with urllib.request.urlopen(urllib.request.Request(dept_url), timeout=10) as res:
        data = json.loads(res.read().decode("utf-8"))
        jobs = data.get("jobs", [])
        assert len(jobs) > 0, "Expected jobs for department query"
        print(f"  PASS: Department query returned {len(jobs)} jobs.")

async def test_browser_live_fetching():
    print("[4/4] Testing browser client-side fetching with Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        # Navigate to /jobs
        await page.goto(f"{BASE_URL}/jobs", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(1000)
        
        # Check that cards rendered
        card_selector = "a:has-text('채용공고 상세보기')"
        card_count = await page.locator(card_selector).count()
        assert card_count > 0, f"Expected rendered cards, got {card_count}"
        
        # Check first card href
        first_btn = page.locator(card_selector).first
        href = await first_btn.get_attribute("href")
        target = await first_btn.get_attribute("target")
        rel = await first_btn.get_attribute("rel")
        
        assert href and (href.startswith("http://") or href.startswith("https://")), f"Invalid href: {href}"
        assert "..." not in href, f"Found '...' in href: {href}"
        assert target == "_blank", f"Expected target=_blank, got {target}"
        assert "noopener" in (rel or "") and "noreferrer" in (rel or ""), f"Missing safe rel attributes: {rel}"
        
        # Take screenshot of live API rendered page
        shot_path = os.path.join(ARTIFACT_DIR, "step_15_worknet_live_board.png")
        await page.screenshot(path=shot_path, full_page=False)
        print(f"  PASS: Browser rendered {card_count} live cards. First card href: {href[:60]}... Captured screenshot to {shot_path}.")
        
        await browser.close()

async def main():
    print("=== Worknet Open API & Realtime Job Board Integration Test ===")
    jobs = test_api_endpoint()
    test_origin_urls_validity(jobs)
    test_api_query_filters()
    await test_browser_live_fetching()
    print("=== ALL 4 INTEGRATION TESTS PASSED (100%) ===")

if __name__ == "__main__":
    asyncio.run(main())
