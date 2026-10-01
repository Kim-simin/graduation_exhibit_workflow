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
        
        # Check cards or lists
        items = await page.eval_on_selector_all("li, tr, .item, .box", """
            elements => elements.map(el => el.innerText.trim()).filter(t => t.includes('장비') || t.includes('연구') || t.includes('대학교') || t.includes('센터') || t.includes('건'))
        """)
        print(f"ZEUS matching items count: {len(items)}")
        for it in items[:15]:
            print("  --- ZEUS Item ---")
            print("  ", it.replace('\n', ' | ')[:160])
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
