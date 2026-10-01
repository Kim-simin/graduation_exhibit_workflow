#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import asyncio
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to NTIS announcements...")
        await page.goto("https://www.ntis.go.kr/rndgate/eg/un/ra/mng.do", timeout=30000, wait_until="networkidle")
        
        # Look for notice table
        rows = await page.eval_on_selector_all("table tbody tr", """
            elements => elements.map(r => {
                const cols = Array.from(r.querySelectorAll('td, th')).map(c => c.innerText.trim());
                const link = r.querySelector('a') ? r.querySelector('a').href : '';
                return { cols, link };
            }).filter(r => r.cols.length > 2)
        """)
        print(f"NTIS announcement rows: {len(rows)}")
        for i, r in enumerate(rows[:10]):
            print(f"  [{i+1}] {r['cols']} | {r['link']}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
