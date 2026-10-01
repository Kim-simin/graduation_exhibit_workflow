import asyncio
import os
from playwright.async_api import async_playwright
from PIL import Image

async def test_main_capture():
    out_dir = "scripts/test_captures"
    os.makedirs(out_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1200, "height": 900})
        page = await context.new_page()
        
        await page.goto("https://swuid2025.com/project/1", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)
        
        # Scroll through the page
        scroll_height = await page.evaluate("() => document.body.scrollHeight")
        step = 800
        for y in range(0, scroll_height + 5000, step):
            await page.evaluate(f"window.scrollTo(0, {y})")
            await page.wait_for_timeout(150)
            
        # Ensure bottom is reached and all images loaded
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1500)
        
        main_el = await page.query_selector('main')
        if not main_el:
            print("Main element not found")
            return
            
        out_path = os.path.join(out_dir, "project_1_main.jpg")
        await main_el.screenshot(path=out_path, quality=85, type="jpeg")
        
        im = Image.open(out_path)
        print("Captured main element successfully!")
        print("Dimensions:", im.size)
        print("File size:", os.path.getsize(out_path), "bytes")
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_main_capture())
