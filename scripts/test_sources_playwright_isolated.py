#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_sources_playwright_isolated.py
Test loading ZEUS, e-Tube, K-Startup, IRIS, NTIS in isolated Playwright pages.
"""

import sys
import json
import asyncio
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TARGETS = [
    ("ZEUS", "https://www.zeus.go.kr/resv/organ/sortView"),
    ("e-Tube", "https://www.etube.re.kr/"),
    ("K-Startup", "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"),
    ("IRIS", "https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do"),
    ("NTIS_announcements", "https://www.ntis.go.kr/rndgate/eg/un/ra/mng.do"),
]

async def scrape_target(browser, name, url):
    print(f"\n================== [{name}] ==================")
    context = await browser.new_context(
        ignore_https_errors=True,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )
    page = await context.new_page()
    try:
        resp = await page.goto(url, timeout=25000, wait_until="networkidle")
        status = resp.status if resp else 0
        print(f"[{name}] HTTP status: {status}")
        await asyncio.sleep(2)
        
        title = await page.title()
        print(f"[{name}] Title: {title}")
        
        # Get visible cards / items
        text = await page.inner_text("body")
        print(f"[{name}] Text length: {len(text)}")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for l in lines[:15]:
            print(f"  [{name}] {l}")
            
    except Exception as e:
        print(f"[{name}] Error: {e}")
    finally:
        await context.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, url in TARGETS:
            await scrape_target(browser, name, url)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
