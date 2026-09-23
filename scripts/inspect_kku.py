"""
scripts/inspect_kku.py
Inspects Konkuk University exhibition page DOM to find why duplicate scraping occurs.
Target: https://kku2026mid.com/
"""
import sys
import asyncio
from playwright.async_api import async_playwright

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

TARGET_URL = "https://kku2026mid.com/project"

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(2000)
        except Exception as e:
            print(f"[!] Goto error: {e}")

        # Check links
        links_data = await page.evaluate("""() => {
            const links = Array.from(document.querySelectorAll('a[href*="/project"], a[href*="/work"], a[href*="/piece"]'));
            return links.map((a, idx) => {
                const box = a.getBoundingClientRect();
                const img = a.querySelector('img');
                return {
                    idx: idx,
                    href: a.getAttribute('href'),
                    text: (a.innerText || '').trim().replace(/\\s+/g, ' '),
                    hasImg: !!img,
                    imgSrc: img ? img.getAttribute('src') : null,
                    width: box.width,
                    height: box.height,
                    parentTag: a.parentElement ? a.parentElement.tagName : null,
                    parentClass: a.parentElement ? a.parentElement.className : null
                };
            });
        }""")

        print(f"[*] Found {len(links_data)} link candidates on {page.url}:")
        for item in links_data[:20]:
            print(f"  #{item['idx']}: href={item['href']}, text='{item['text']}', hasImg={item['hasImg']}, box={item['width']}x{item['height']}")

        # Look specifically for 'Click to Dive'
        click_to_dive = [x for x in links_data if 'Click to Dive' in x['text'] or (x['href'] and 'dive' in x['href'].lower())]
        print(f"\n[*] Matching 'Click to Dive': {click_to_dive}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect())
