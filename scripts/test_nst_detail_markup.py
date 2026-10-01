#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_nst_detail_markup.py
Test fetching and parsing of NST detail page.
"""

import sys
import ssl
import urllib.request
import urllib.parse
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

url = "https://www.nst.re.kr/www/selectBbsNttView.do?key=61&bbsNo=19&nttNo=52276&searchCtgry=&searchCnd=all&searchKrwd=&integrDeptCode=&pageIndex=1"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
    html = resp.read().decode("utf-8", errors="replace")

soup = BeautifulSoup(html, "html.parser")
print("Title:", soup.title.string if soup.title else "No title")

# Find tables or text
for tr in soup.find_all("tr"):
    th = tr.find("th")
    td = tr.find("td")
    if th and td:
        print(f"[{th.get_text(strip=True)}] {td.get_text(strip=True)[:100]}")
        a = td.find("a")
        if a and a.get("href"):
            print(f"   -> Link: {a.get('href')}")
