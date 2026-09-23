"""
scripts/inspect_kku_detail.py
Inspect the exact HTML of Click to Dive cards.
"""
import sys
import asyncio
from playwright.async_api import async_playwright

TARGET_URL = "https://kku2026mid.com/project"

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(2000)

        # Inspect elements matching /project/202023442/1 and /project/202120199/1
        res = await page.evaluate("""() => {
            const matches = Array.from(document.querySelectorAll('a[href*="202023442"], a[href*="202120199"]'));
            return matches.map(a => ({
                href: a.getAttribute('href'),
                innerText: a.innerText,
                innerHTML: a.innerHTML,
                parentHTML: a.parentElement ? a.parentElement.outerHTML.substring(0, 300) : ''
            }));
        }""")
        for idx, m in enumerate(res):
            print(f"=== Match {idx} ===")
            print(f"Href: {m['href']}")
            print(f"InnerText: {repr(m['innerText'])}")
            print(f"ParentHTML: {m['parentHTML']}")

        # Also inspect what candidate_elements did in manual_capture.py or run_queue_agent.py
        # Check all cards detected
        cards_res = await page.evaluate("""() => {
            const allLinks = Array.from(document.querySelectorAll('a[href*="/project/"]'));
            return allLinks.map(a => {
                const lines = (a.innerText || '').split('\\n').map(l => l.trim()).filter(Boolean);
                return {
                    href: a.getAttribute('href'),
                    lines: lines
                };
            });
        }""")
        print(f"\n[*] Total /project/ links: {len(cards_res)}")
        for c in cards_res:
            if 'Dive' in str(c['lines']) or '건희' in str(c['lines']):
                print(f"    -> {c}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect())
