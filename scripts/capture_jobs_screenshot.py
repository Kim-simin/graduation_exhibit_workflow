#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Capture screenshot of /jobs page with default state and with department selected.
"""

import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\USER\.gemini\antigravity\brain\b230d1db-c8fe-4832-a784-442bd1dddf26"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        
        print("Navigating to http://localhost:3000/jobs...")
        try:
            await page.goto("http://localhost:3000/jobs", wait_until="networkidle", timeout=15000)
        except Exception as e:
            print(f"Direct navigation note: {e}")
            await page.goto("http://localhost:3000/jobs", timeout=15000)
        
        await page.wait_for_timeout(2000)
        
        # 1. Default screenshot
        shot1_path = os.path.join(ARTIFACT_DIR, "step_14_jobs_board_default.png")
        await page.screenshot(path=shot1_path, full_page=False)
        print(f"Captured default screenshot to {shot1_path}")
        
        # 2. Select department '시각디자인'
        select_elem = page.locator("select")
        if await select_elem.count() > 0:
            await select_elem.first.select_option("시각디자인")
            await page.wait_for_timeout(1000)
            shot2_path = os.path.join(ARTIFACT_DIR, "step_14_jobs_board_filtered.png")
            await page.screenshot(path=shot2_path, full_page=False)
            print(f"Captured department filtered screenshot to {shot2_path}")
        
        await browser.close()
        print("Browser verification completed successfully.")

if __name__ == "__main__":
    asyncio.run(run())
