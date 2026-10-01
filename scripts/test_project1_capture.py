import asyncio
import os
from playwright.async_api import async_playwright
from PIL import Image

async def test_capture():
    out_dir = "scripts/test_captures"
    os.makedirs(out_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create page with 1200px width (standard presentation width)
        context = await browser.new_context(viewport={"width": 1200, "height": 900})
        page = await context.new_page()
        
        print("Navigating to https://swuid2025.com/project/1...")
        await page.goto("https://swuid2025.com/project/1", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        
        # Scroll down smoothly to trigger any lazy loading of images
        scroll_height = await page.evaluate("() => document.body.scrollHeight")
        print(f"Initial scrollHeight: {scroll_height}")
        
        for y in range(0, scroll_height, 600):
            await page.evaluate(f"window.scrollTo(0, {y})")
            await page.wait_for_timeout(200)
            
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1000)
        
        final_height = await page.evaluate("() => document.body.scrollHeight")
        print(f"Final scrollHeight after scrolling: {final_height}")
        
        # Take full page screenshot
        full_screenshot_path = os.path.join(out_dir, "project_1_fullpage.jpg")
        await page.screenshot(path=full_screenshot_path, full_page=True, quality=85, type="jpeg")
        print(f"Saved full page screenshot: {full_screenshot_path}")
        
        im = Image.open(full_screenshot_path)
        print("Screenshot size:", im.size)
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_capture())
