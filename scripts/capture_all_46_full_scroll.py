import asyncio
import os
import sys
import json
import time
from playwright.async_api import async_playwright
from PIL import Image

async def capture_project(browser, sem, pid, out_dir):
    async with sem:
        url = f"https://swuid2025.com/project/{pid}"
        out_file = os.path.join(out_dir, f"artwork_{pid}_full.jpg")
        
        # Check if already captured and valid (> 100KB)
        if os.path.exists(out_file) and os.path.getsize(out_file) > 100000:
            print(f"PID {pid} already exists ({round(os.path.getsize(out_file)/1024, 1)} KB), skipping.")
            return True

        t0 = time.time()
        page = await browser.new_page(viewport={"width": 1200, "height": 900})
        try:
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            except Exception as nav_e:
                print(f"PID {pid} nav retry: {nav_e}")
                await page.goto(url, wait_until="load", timeout=20000)

            await page.wait_for_timeout(1000)

            # Smooth scroll to bottom to load all lazy images
            scroll_height = await page.evaluate("() => document.body.scrollHeight")
            step = 900
            for y in range(0, scroll_height + 5000, step):
                await page.evaluate(f"window.scrollTo(0, {y})")
                await page.wait_for_timeout(120)
                
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1500)
            
            main_el = await page.query_selector('main')
            if main_el:
                await main_el.screenshot(path=out_file, quality=80, type="jpeg")
            else:
                await page.screenshot(path=out_file, full_page=True, quality=80, type="jpeg")
                
            im = Image.open(out_file)
            elapsed = round(time.time() - t0, 1)
            print(f"PID {pid}/46 SUCCESS: {im.size[0]}x{im.size[1]}, {round(os.path.getsize(out_file)/1024, 1)} KB in {elapsed}s")
            return True
        except Exception as e:
            print(f"PID {pid}/46 ERROR: {e}")
            return False
        finally:
            await page.close()

async def run_all_captures():
    out_dir = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
    os.makedirs(out_dir, exist_ok=True)
    
    sem = asyncio.Semaphore(3)
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        tasks = [capture_project(browser, sem, pid, out_dir) for pid in range(1, 47)]
        results = await asyncio.gather(*tasks)
        await browser.close()

    success_count = sum(1 for r in results if r)
    print(f"\nAll {success_count}/46 projects captured successfully!")

    # Verify that all 46 files exist
    missing = []
    for pid in range(1, 47):
        target_img = os.path.join(out_dir, f"artwork_{pid}_full.jpg")
        if not os.path.exists(target_img) or os.path.getsize(target_img) < 50000:
            missing.append(pid)

    if missing:
        print(f"WARNING: Missing or incomplete images for PIDs: {missing}")
    else:
        print("PERFECT: All 46 full-scroll images exist and are valid!")

    # Now update database records
    target_files = [
        "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json",
        "c:/Users/graduation_exhibit_workflow/data/university_queue.json"
    ]

    for tf in target_files:
        if not os.path.exists(tf):
            continue
        with open(tf, 'r', encoding='utf-8') as f:
            queue = json.load(f)

        orig_len = len(queue)
        for q in queue:
            if q.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과":
                for idx, art in enumerate(q.get('artworks', [])):
                    pid = idx + 1
                    full_rel = f"uploads/UNIV-2025-서울여자대학교-산업디자인학과/artwork_{pid}_full.jpg"
                    art['image'] = full_rel
                    art['thumbnail'] = full_rel
                break

        with open(tf, 'w', encoding='utf-8') as f:
            json.dump(queue, f, ensure_ascii=False, indent=2)

        # Verification
        with open(tf, 'r', encoding='utf-8') as f:
            verified = json.load(f)
            assert len(verified) == orig_len
            swu = next(x for x in verified if x.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과")
            assert len(swu['artworks']) == 46
            for idx, a in enumerate(swu['artworks']):
                assert a['image'] == f"uploads/UNIV-2025-서울여자대학교-산업디자인학과/artwork_{idx+1}_full.jpg"
                assert a['department'] in ['DIGITAL FABRICATION과', 'UX DESIGN과', 'BX DESIGN과']

        print(f"Verified and updated {tf} successfully!")

if __name__ == '__main__':
    asyncio.run(run_all_captures())
