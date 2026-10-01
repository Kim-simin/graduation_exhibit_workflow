import asyncio
import os
import time
from playwright.async_api import async_playwright
from PIL import Image

async def capture_single(browser, pid, out_dir):
    url = f"https://swuid2025.com/project/{pid}"
    out_file = os.path.join(out_dir, f"artwork_{pid}_full.jpg")
    
    t0 = time.time()
    page = await browser.new_page(viewport={"width": 1200, "height": 900})
    try:
        await page.goto(url, wait_until="networkidle", timeout=35000)
        
        # Smooth scroll to bottom
        scroll_height = await page.evaluate("() => document.body.scrollHeight")
        step = 800
        for y in range(0, scroll_height + 4000, step):
            await page.evaluate(f"window.scrollTo(0, {y})")
            await page.wait_for_timeout(120)
            
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1000)
        
        main_el = await page.query_selector('main')
        if main_el:
            await main_el.screenshot(path=out_file, quality=80, type="jpeg")
        else:
            await page.screenshot(path=out_file, full_page=True, quality=80, type="jpeg")
            
        im = Image.open(out_file)
        elapsed = round(time.time() - t0, 1)
        print(f"PID {pid} SUCCESS: {im.size[0]}x{im.size[1]}, {round(os.path.getsize(out_file)/1024, 1)} KB in {elapsed}s")
        return True
    except Exception as e:
        print(f"PID {pid} ERROR: {e}")
        return False
    finally:
        await page.close()

async def main():
    out_dir = "my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
    os.makedirs(out_dir, exist_ok=True)
    
    test_pids = [1, 31, 41]
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        tasks = [capture_single(browser, pid, out_dir) for pid in test_pids]
        await asyncio.gather(*tasks)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
