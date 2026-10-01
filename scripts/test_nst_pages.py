#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_nst_pages.py
Scrape latest NST pages (pages 1 to 5) and detail views.
"""

import sys
import ssl
import re
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")

def test_pages():
    base_url = "https://www.nst.re.kr/www/selectBbsNttList.do"
    all_notices = []
    
    for page in range(1, 4):
        params = {
            "bbsNo": "19",
            "key": "61",
            "pageIndex": str(page),
        }
        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        html = fetch(url)
        soup = BeautifulSoup(html, "html.parser")
        table = soup.find("table")
        if not table:
            continue
        rows = table.find_all("tr")[1:]
        for r in rows:
            cols = [c.get_text(strip=True) for c in r.find_all("td")]
            if len(cols) >= 5:
                num, inst, title, _, date = cols[0], cols[1], cols[2], cols[3], cols[4]
                a_tag = r.find("a")
                link = urllib.parse.urljoin(url, a_tag.get("href")) if a_tag else ""
                all_notices.append({
                    "num": num,
                    "inst": inst,
                    "title": title,
                    "date": date,
                    "link": link
                })
    print(f"Collected {len(all_notices)} notices across 3 pages.")
    for n in all_notices[:15]:
        print(f"[{n['num']}] [{n['inst']}] {n['title']} ({n['date']}) -> {n['link']}")
        
    # Check detail page of one notice
    if all_notices:
        first_link = all_notices[0]['link']
        print(f"\nFetching detail: {first_link}")
        dhtml = fetch(first_link)
        dsoup = BeautifulSoup(dhtml, "html.parser")
        content = dsoup.find(class_=re.compile("bbs-view|view|content|article", re.I))
        if content:
            print("Content sample:", content.get_text(" ", strip=True)[:400])

if __name__ == "__main__":
    test_pages()
