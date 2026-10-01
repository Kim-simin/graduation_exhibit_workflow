#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/inspect_kstartup_list.py
Extract active startup program notices from K-Startup.
"""

import sys
import json
import asyncio
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
        print(f"Navigating to {url}...")
        await page.goto(url, timeout=30000, wait_until="networkidle")
        await asyncio.sleep(2)
        
        # Look for notice cards
        cards = await page.eval_on_selector_all(".announcement-list li, .list-box li, .pbanc-list li, .notice-list li, .board-list tbody tr", """
            elements => elements.map(el => {
                const titleEl = el.querySelector('.tit, .title, a, td.title');
                const title = titleEl ? titleEl.innerText.trim() : '';
                const link = titleEl ? (titleEl.href || (titleEl.querySelector('a') ? titleEl.querySelector('a').href : '')) : '';
                const text = el.innerText.trim();
                return { title, link, text: text.substring(0, 200) };
            }).filter(e => e.title || e.text)
        """)
        print(f"Found {len(cards)} items on K-Startup")
        for i, c in enumerate(cards[:10]):
            print(f"\n[{i+1}] Title: {c['title']}")
            print(f"    Link: {c['link']}")
            print(f"    Snippet: {c['text'][:150]}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
