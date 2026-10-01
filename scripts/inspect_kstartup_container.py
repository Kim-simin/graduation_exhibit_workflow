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
        
        # Look for container
        container = await page.eval_on_selector("#container", "el => el ? el.innerText : 'NO CONTAINER'")
        print("Container length:", len(container))
        lines = [l.strip() for l in container.splitlines() if l.strip()]
        for l in lines[:40]:
            print("  ", l)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
