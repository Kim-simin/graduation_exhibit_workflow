"""
scripts/test_manual_kku.py
Simulates manual_capture.py on KKU with the updated de-nesting and 3-way dedup.
"""
import sys
import os
import re
import urllib.parse
from urllib.parse import urljoin
import asyncio
from playwright.async_api import async_playwright

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def normalize_title(title: str) -> str:
    if not title:
        return ""
    return re.sub(r'[\s\W_]+', '', title).lower()

def normalize_url(url: str) -> str:
    if not url:
        return ""
    try:
        p = urllib.parse.urlparse(url)
        path = p.path.rstrip('/')
        return f"{p.scheme}://{p.netloc}{path}".lower()
    except Exception:
        return url.strip().lower()

def normalize_img_src(src: str, base_url: str) -> str:
    if not src:
        return ""
    try:
        abs_url = urllib.parse.urljoin(base_url, src)
        p = urllib.parse.urlparse(abs_url)
        if '/_next/image' in p.path and 'url=' in p.query:
            qs = urllib.parse.parse_qs(p.query)
            if 'url' in qs:
                abs_url = qs['url'][0]
                p = urllib.parse.urlparse(abs_url)
        return f"{p.scheme}://{p.netloc}{p.path}".strip().lower()
    except Exception:
        return src.strip().lower()

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

        # Scroll
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

        # 1. DOM de-nesting via attribute tagging in browser context
        marked_count = await page.evaluate("""() => {
            document.querySelectorAll('[data-gallery-card-target]').forEach(el => el.removeAttribute('data-gallery-card-target'));

            const raw = Array.from(document.querySelectorAll(
                'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article, a[href*="/works/"], a[href*="/project/"], ul[class*="work"] > li, div[class*="grid"] > div'
            ));

            const valid = raw.filter(el => {
                if (el.closest('header, nav, footer, .paging, .pagination, #header, #footer')) return false;
                const box = el.getBoundingClientRect();
                if (box.width < 50 || box.height < 50) return false;
                return true;
            });

            // De-nest: drop elements that are contained inside another candidate
            const topLevel = valid.filter(el => !valid.some(other => other !== el && other.contains(el)));
            topLevel.forEach((el, i) => {
                el.setAttribute('data-gallery-card-target', String(i));
            });
            return topLevel.length;
        }""")

        print(f"[*] Marked top-level de-nested elements: {marked_count}")
        if marked_count > 0:
            card_elements = await page.query_selector_all('[data-gallery-card-target]')
        else:
            card_elements = await page.query_selector_all(
                'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article, a[href*="/works/"], a[href*="/project/"]'
            )

        captured_items = []
        seen_titles = set()
        seen_images = set()
        seen_detail_urls = set()

        for idx, card in enumerate(card_elements):
            try:
                # Text extraction with textContent fallback
                raw_text = ((await card.inner_text()) or "").strip()
                if not raw_text:
                    raw_text = (await card.evaluate("el => (el.textContent || '').trim()") or "")
                
                lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
                is_fallback_title = False
                if lines:
                    title = lines[0]
                else:
                    is_fallback_title = True
                    title = f"작품 #{len(captured_items) + 1}"

                # Image extraction
                img_el = await card.query_selector('img')
                img_src = ""
                if img_el:
                    img_src = (await img_el.get_attribute('src') or await img_el.get_attribute('data-src') or "")
                else:
                    has_bg = await card.evaluate("""el => {
                        const style = window.getComputedStyle(el);
                        return !!(style.backgroundImage && style.backgroundImage !== 'none');
                    }""")
                    if not has_bg:
                        continue

                clean_img_key = normalize_img_src(img_src, page.url) if img_src else ""

                # Detail URL extraction
                href = await card.get_attribute('href')
                if not href:
                    ia = await card.query_selector('a')
                    if ia:
                        href = await ia.get_attribute('href')
                full_detail_url = urljoin(page.url, href) if href else page.url
                clean_url_key = normalize_url(full_detail_url) if (href and href != '#') else ""

                # 3-Way Deduplication
                norm_title = normalize_title(title)

                # Check 1: Image duplicate
                if clean_img_key and clean_img_key in seen_images:
                    continue

                # Check 2: Detail URL duplicate
                if clean_url_key and clean_url_key in seen_detail_urls and clean_url_key != normalize_url(page.url):
                    continue

                # Check 3: Title duplicate
                if not is_fallback_title:
                    if norm_title in seen_titles:
                        continue
                    if not is_valid_card_text(title, "건국대학교", "시각영상디자인학과") or len(title) > 60:
                        continue
                else:
                    if not clean_img_key:
                        continue

                # Register keys
                if not is_fallback_title and norm_title:
                    seen_titles.add(norm_title)
                if clean_img_key:
                    seen_images.add(clean_img_key)
                if clean_url_key and clean_url_key != normalize_url(page.url):
                    seen_detail_urls.add(clean_url_key)

                author = lines[1] if len(lines) > 1 and len(lines[1]) <= 25 and is_valid_card_text(lines[1], "건국대학교", "시각영상디자인학과") else "건국대학교 작가"

                captured_items.append({
                    "id": f"work-{len(captured_items)+1}",
                    "title": title,
                    "author": author,
                    "detail_url": full_detail_url,
                    "img_src": clean_img_key
                })
            except Exception:
                continue

        await page.evaluate("() => document.querySelectorAll('[data-gallery-card-target]').forEach(el => el.removeAttribute('data-gallery-card-target'))")

        print(f"\n[*] Total captured items: {len(captured_items)}")
        
        # Verify no duplicates exist in captured_items by detail_url or title
        titles = [x['title'] for x in captured_items]
        dupe_titles = [t for t in set(titles) if titles.count(t) > 1 and not t.startswith('작품 #')]
        print(f"[*] Duplicate titles: {dupe_titles}")

        imgs = [x['img_src'] for x in captured_items if x['img_src']]
        dupe_imgs = [i for i in set(imgs) if imgs.count(i) > 1]
        print(f"[*] Duplicate images: {dupe_imgs}")

        urls = [x['detail_url'] for x in captured_items if 'kku2026mid.com/project/' in x['detail_url']]
        dupe_urls = [u for u in set(urls) if urls.count(u) > 1]
        print(f"[*] Duplicate URLs: {dupe_urls}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
