#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_nst_markup.py
Test scraping of NST recruitment board markup and links.
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

url = "https://www.nst.re.kr/www/selectBbsNttList.do?bbsNo=19&key=61&pageIndex=1"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
    html = resp.read().decode("utf-8", errors="replace")

soup = BeautifulSoup(html, "html.parser")
table = soup.find("table")
if not table:
    print("No table found")
    sys.exit(0)

rows = table.find_all("tr")[1:5]
for i, r in enumerate(rows):
    cols = [c.get_text(strip=True) for c in r.find_all("td")]
    a = r.find("a")
    href = a.get("href") if a else None
    onclick = a.get("onclick") if a else None
    print(f"Row {i}: cols={cols[:3]}")
    print(f"  href: {href}, onclick: {onclick}")
