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
        await page.goto("https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do", timeout=30000, wait_until="networkidle")
        
        links = await page.eval_on_selector_all("a", """
            elements => elements.map(e => ({ text: e.innerText.trim(), href: e.href }))
                .filter(e => e.href.includes('pbanc') || e.href.includes('detail') || e.href.includes('post') || e.href.includes('view') || e.href.includes('biz'))
        """)
        print(f"Filtered links count: {len(links)}")
        for l in links[:20]:
            print(f"  {l['text']} -> {l['href']}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
