"""
scripts/check_kku_cards.py
Find all candidate elements in test_kku_duplicate that contain the Click to Dive image.
"""
import sys
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        await page.goto("https://kku2026mid.com/project", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)

        card_elements = await page.query_selector_all(
            'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article, a[href*="/works/"], a[href*="/project/"], ul[class*="work"] > li, div[class*="grid"] > div'
        )

        print(f"Total elements: {len(card_elements)}")
        for idx, el in enumerate(card_elements):
            img = await el.query_selector('img')
            src = await img.get_attribute('src') if img else ""
            if '202023442' in src or '202120199' in src:
                tag = await el.evaluate("e => e.tagName")
                cls = await el.evaluate("e => e.className")
                text = (await el.inner_text() or "").strip()
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                href = await el.get_attribute('href')
                if not href:
                    ia = await el.query_selector('a')
                    href = await ia.get_attribute('href') if ia else None
                print(f"Match idx={idx}: tag={tag}, class='{cls}', href={href}, lines={lines}, src={src}")

        await b.close()

if __name__ == "__main__":
    asyncio.run(run())
