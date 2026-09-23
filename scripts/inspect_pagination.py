"""
scripts/inspect_pagination.py
Inspects the pagination structure and total articles on Incheon Univ graduation exhibit board.
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

TARGET_URL = "https://cse.inu.ac.kr/isis/13789/subview.do"

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=25000)
        await page.wait_for_timeout(2000)

        # 1. Total count text if any
        total_text = await page.evaluate("""() => {
            const els = document.querySelectorAll('.b-total, .total, .page-info, p, span, div');
            for (let el of els) {
                if ((el.innerText || '').includes('전체') || (el.innerText || '').includes('총') || (el.innerText || '').includes('건')) {
                    if (el.children.length <= 2 && el.innerText.length < 50) {
                        return el.innerText.trim();
                    }
                }
            }
            return null;
        }""")
        print(f"[*] Total count indicator: {total_text}")

        # 2. Inspect pagination container below table
        pager_info = await page.evaluate("""() => {
            const table = document.querySelector('table');
            let sibling = table ? table.nextElementSibling : null;
            const results = [];
            while (sibling) {
                results.push({
                    tag: sibling.tagName,
                    className: sibling.className,
                    html: sibling.outerHTML.substring(0, 500)
                });
                sibling = sibling.nextElementSibling;
            }

            // Also check all links containing page numbers or pagination classes
            const allLinks = Array.from(document.querySelectorAll('a'));
            const pagingLinks = allLinks.filter(a => {
                const href = a.getAttribute('href') || '';
                const onclick = a.getAttribute('onclick') || '';
                const t = a.innerText.trim();
                const cls = a.className || '';
                return /^(?:[1-9]|10|다음|이전|>|>>|<|<<)$/.test(t) || 
                       href.includes('page=') || href.includes('pageIndex') || 
                       onclick.includes('page') || onclick.includes('linkPage') ||
                       cls.includes('page') || cls.includes('paging');
            }).map(a => ({
                text: a.innerText.trim(),
                href: a.getAttribute('href'),
                className: a.className,
                title: a.getAttribute('title') || '',
                onclick: a.getAttribute('onclick') || '',
                outerHTML: a.outerHTML
            }));

            return {
                siblings: results,
                pagingLinks: pagingLinks
            };
        }""")
        print("[*] Table siblings:")
        for s in pager_info["siblings"]:
            print(f"  {s['tag']}.{s['className']}")
            print(f"    {s['html'][:200]}...")

        # Test complete link extraction across pages
        await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=25000)
        await page.wait_for_timeout(1500)

        all_collected_links = []
        page_num = 1

        while True:
            # Extract links on current page
            page_links = await page.evaluate("""() => {
                const links = [];
                const origin = window.location.origin;
                const rows = document.querySelectorAll('table tbody tr, .board-list tbody tr, ul[class*="board"] li, div[class*="list"] a');
                
                for (let r of rows) {
                    const a = r.tagName.toLowerCase() === 'a' ? r : r.querySelector('a');
                    if (!a) continue;
                    let href = a.getAttribute('href') || '';
                    const artclSeq = a.getAttribute('data-bbs-artcl-seq');
                    const fnctNo = a.getAttribute('data-fnct-no') || '3178';
                    const siteId = a.getAttribute('data-site-id') || 'isis';
                    
                    let resolved = '';
                    if (artclSeq) {
                        resolved = `${origin}/bbs/${siteId}/${fnctNo}/${artclSeq}/artclView.do`;
                    } else if (href.includes('artclView.do') || href.includes('view.do') || href.includes('/view/')) {
                        resolved = href.startsWith('http') ? href : origin + (href.startsWith('/') ? href : '/' + href);
                    }
                    
                    if (resolved) {
                        const titleHint = (a.innerText || r.innerText || '').trim();
                        links.push({ url: resolved, title_hint: titleHint });
                    }
                }
                return links;
            }""")

            print(f"[*] Page {page_num}: collected {len(page_links)} links")
            for item in page_links:
                if not any(x["url"] == item["url"] for x in all_collected_links):
                    all_collected_links.append(item)

            # Check next page button / link
            next_page_num = page_num + 1
            # Look for page number link: a with text of next_page_num, or href with next_page_num, or .next, ._listNext
            next_link = await page.query_selector(f"a[href*=\"page_link('{next_page_num}')\"], a[title*=\"{next_page_num}페이지\"], a._listNext, .pagination a.next, a:has-text(\">\")")
            
            if next_link and await next_link.is_visible():
                is_disabled = await next_link.evaluate("el => el.classList.contains('disabled') || el.disabled || el.getAttribute('href') === 'javascript:void(0);' || el.getAttribute('href') === '#' || el.classList.contains('_last') && el.innerText !== '다음'")
                # Make sure we don't click the same page or loop indefinitely
                href_attr = await next_link.get_attribute("href") or ""
                if f"'{next_page_num}'" in href_attr or f"page={next_page_num}" in href_attr or "next" in href_attr.lower():
                    print(f"[*] Clicking to next page ({next_page_num})...")
                    await next_link.click()
                    await page.wait_for_timeout(2000)
                    page_num = next_page_num
                    continue

            print(f"[*] No more next page found after page {page_num}.")
            break

        print(f"\n[TOTAL] Total unique links collected: {len(all_collected_links)}")
        for idx, it in enumerate(all_collected_links, start=1):
            print(f"  [{idx:2d}] {it['title_hint'][:40]} -> {it['url']}")

        await browser.close()

        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect())
