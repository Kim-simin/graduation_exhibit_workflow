#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_playwright_sources.py
Use Playwright (async/sync) to inspect client-rendered sources:
ZEUS, e-Tube, K-Startup, IRIS, NTIS.
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
    ("K-Startup", "https://www.k-startup.go.kr/"),
    ("IRIS", "https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do"),
    ("NTIS", "https://www.ntis.go.kr/rndgate/eg/un/ra/mng.do"),
]

async def inspect_target(page, name, url):
    print(f"\n--- Navigating to {name}: {url} ---")
    try:
        response = await page.goto(url, timeout=25000, wait_until="domcontentloaded")
        status = response.status if response else 0
        print(f"[{name}] HTTP status: {status}")
        await asyncio.sleep(2)  # wait for any client render
        
        title = await page.title()
        print(f"[{name}] Title: {title}")
        
        # Check text content sample
        text = await page.inner_text("body")
        print(f"[{name}] Body text length: {len(text)}")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        print(f"[{name}] Sample lines (first 10):", lines[:10])
        
        # Look for table or list items
        links = await page.eval_on_selector_all("a", "elements => elements.slice(0, 30).map(e => ({ text: e.innerText.trim(), href: e.href })).filter(e => e.text && e.href)")
        print(f"[{name}] Links sample (5):", links[:5])
        
    except Exception as e:
        print(f"[{name}] Error: {e}")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        for name, url in TARGETS:
            await inspect_target(page, name, url)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
