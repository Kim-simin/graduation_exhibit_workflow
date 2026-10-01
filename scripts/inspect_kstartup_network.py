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
        
        # Track ajax requests
        requests = []
        page.on("request", lambda r: requests.append(r.url) if any(k in r.url for k in ["api", "json", "list", "select", "pbanc", "ajax", "do"]) else None)
        
        await page.goto("https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do", timeout=30000, wait_until="networkidle")
        await asyncio.sleep(2)
        
        print("Network requests captured:")
        for r in requests:
            print("  ", r)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
