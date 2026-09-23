"""
scripts/test_kku_duplicate.py
Simulate card extraction on KKU project page exactly as manual_capture.py does.
"""
import sys
import os
import asyncio
from urllib.parse import urljoin
from playwright.async_api import async_playwright

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def is_valid_card_text(text: str, univ: str = "건국대학교", dept: str = "시각영상디자인학과") -> bool:
    if not text:
        return False
    banned = ["전체보기", "메뉴", "닫기", "검색", "로그인", "회원가입", "공지사항", "소개", "학과소개", "오시는길", "사이트맵", "TOP", "NEXT", "PREV", "더보기"]
    if any(b.lower() == text.strip().lower() for b in banned):
        return False
    return True

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("[*] Navigating to KKU project page...")
        await page.goto("https://kku2026mid.com/project", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)

        # Scroll as in manual_capture
        await page.evaluate("""
            async () => {
                window.scrollTo(0, document.body.scrollHeight / 3);
                await new Promise(r => setTimeout(r, 600));
                window.scrollTo(0, (document.body.scrollHeight / 3) * 2);
                await new Promise(r => setTimeout(r, 600));
                window.scrollTo(0, document.body.scrollHeight);
                await new Promise(r => setTimeout(r, 600));
                window.scrollTo(0, 0);
            }
        """)
        await page.wait_for_timeout(1000)

        card_elements = await page.query_selector_all(
            'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article, a[href*="/works/"], a[href*="/project/"], ul[class*="work"] > li, div[class*="grid"] > div'
        )
        print(f"[*] Found {len(card_elements)} candidate elements")

        captured_items = []
        seen_titles = set()

        for idx, card in enumerate(card_elements):
            tag = await card.evaluate("el => el.tagName")
            cls = await card.evaluate("el => el.className")
            raw_text = ((await card.inner_text()) or "").strip()
            lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
            title = lines[0] if lines else f"작품 #{len(captured_items) + 1}"

            img_el = await card.query_selector('img')
            href = await card.get_attribute('href')
            if not href:
                inner_a = await card.query_selector('a')
                if inner_a:
                    href = await inner_a.get_attribute('href')
            
            img_src = ""
            if img_el:
                img_src = (await img_el.get_attribute('src') or "")

            is_target = ('Dive' in str(lines)) or (href and ('202023442/1' in href or '202120199/1' in href)) or ('작품 #' in title and '202023442' in str(href) or '202120199' in str(href))

            if is_target or idx < 10:
                print(f"Card #{idx}: tag={tag}, class='{cls[:30]}', href={href}, lines={lines}, title='{title}', img={bool(img_el)}")

            if len(title) > 60 or title in seen_titles or not is_valid_card_text(title):
                if is_target:
                    print(f"   -> SKIPPED: len>60={len(title)>60}, in seen_titles={title in seen_titles}, invalid={not is_valid_card_text(title)}")
                continue

            if not img_el:
                if is_target:
                    print(f"   -> SKIPPED: no img")
                continue

            seen_titles.add(title)
            captured_items.append({
                "idx": idx,
                "title": title,
                "lines": lines,
                "href": href,
                "img_src": img_src
            })
            if is_target:
                print(f"   -> CAPTURED as item #{len(captured_items)}: title='{title}', href={href}")

        print(f"\n[*] Total captured items: {len(captured_items)}")
        dive_items = [it for it in captured_items if 'Dive' in it['title'] or '202023442/1' in str(it['href']) or '202120199/1' in str(it['href'])]
        print(f"[*] Dive captured items: {dive_items}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
