#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_nst_and_uniall.py
Test NST and UniAll scrapers with keywords and pagination.
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

def test_nst_keywords():
    base_url = "https://www.nst.re.kr/www/selectBbsNttList.do"
    keywords = ["학생연구원", "학부연구생", "연구인턴", "학생인턴", "근로연구학생", "연수직", "인턴"]
    
    for kw in keywords:
        params = {
            "bbsNo": "19",
            "key": "61",
            "searchCnd": "all",
            "searchKrwd": kw,
            "pageIndex": "1",
        }
        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        html = fetch(url)
        soup = BeautifulSoup(html, "html.parser")
        table = soup.find("table")
        if not table:
            print(f"[NST keyword: {kw}] No table found")
            continue
        rows = table.find_all("tr")[1:]  # skip header
        print(f"\n[NST keyword: '{kw}'] - Found {len(rows)} rows on page 1")
        for r in rows[:5]:
            cols = [c.get_text(strip=True) for c in r.find_all("td")]
            if len(cols) >= 5:
                num, inst, title, _, date = cols[0], cols[1], cols[2], cols[3], cols[4]
                a_tag = r.find("a")
                link = urllib.parse.urljoin(url, a_tag.get("href")) if a_tag else ""
                print(f"  {num} | {inst} | {title} | {date} | {link}")

def test_uniall():
    url = "https://uniall.nrf.re.kr/biz/pbanc/list.do"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if table:
        rows = table.find_all("tr")[1:]
        print(f"\n[UniAll Announcements] - Found {len(rows)} rows")
        for r in rows[:5]:
            cols = [c.get_text(strip=True) for c in r.find_all("td")]
            a_tag = r.find("a")
            onclick = a_tag.get("onclick") if a_tag else ""
            href = a_tag.get("href") if a_tag else ""
            print(f"  {cols} | onclick={onclick} href={href}")

if __name__ == "__main__":
    test_nst_keywords()
    test_uniall()
