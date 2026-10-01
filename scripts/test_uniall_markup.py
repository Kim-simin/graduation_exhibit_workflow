#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_uniall_markup.py
Test scraping of UniAll announcement board.
"""

import sys
import ssl
import urllib.request
from bs4 import BeautifulSoup

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

url = "https://uniall.nrf.re.kr/biz/pbanc/list.do"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
    html = resp.read().decode("utf-8", errors="replace")

soup = BeautifulSoup(html, "html.parser")
table = soup.find("table")
if table:
    rows = table.find_all("tr")
    print(f"UniAll table: {len(rows)} rows")
    for idx, r in enumerate(rows[:6]):
        cols = [c.get_text(strip=True) for c in r.find_all(["td", "th"])]
        a = r.find("a")
        print(f"Row {idx}: {cols}")
        if a:
            print(f"  a: text='{a.get_text(strip=True)}', href='{a.get('href')}', onclick='{a.get('onclick')}'")
else:
    print("No table found on UniAll")
