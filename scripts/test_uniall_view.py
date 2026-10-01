#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_uniall_view.py
Test fetching UniAll pbanc detail view.
"""

import ssl
import urllib.request
from bs4 import BeautifulSoup

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

url = "https://uniall.nrf.re.kr/biz/pbanc/view.do?pbancId=19"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
    html = resp.read().decode("utf-8", errors="replace")

soup = BeautifulSoup(html, "html.parser")
print("Title:", soup.title.string if soup.title else "")
for tr in soup.find_all("tr")[:6]:
    th = tr.find(["th", "dt"])
    td = tr.find(["td", "dd"])
    if th and td:
        print(f"[{th.get_text(strip=True)}] {td.get_text(strip=True)[:100]}")
