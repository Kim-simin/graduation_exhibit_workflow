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
        await page.goto("https://www.zeus.go.kr/resv/organ/sortView", timeout=30000, wait_until="networkidle")
        
        rows = await page.eval_on_selector_all("table tbody tr", """
            elements => elements.map(r => {
                const cols = Array.from(r.querySelectorAll('td')).map(c => c.innerText.trim());
                const link = r.querySelector('a') ? r.querySelector('a').href : '';
                const onclick = r.querySelector('a') ? r.querySelector('a').getAttribute('onclick') : '';
                return { cols, link, onclick };
            })
        """)
        print(f"Total ZEUS table rows: {len(rows)}")
        for i, r in enumerate(rows):
            print(f"  [{i+1}] {r['cols']} | onclick={r['onclick']}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
