#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import ssl
import urllib.request
from bs4 import BeautifulSoup

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

def inspect_detail():
    url = "https://www.nst.re.kr/www/selectBbsNttView.do?key=61&bbsNo=19&nttNo=52276"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    print(f"Detail tables: {len(tables)}")
    for t in tables:
        print("Table class:", t.get("class"))
        for tr in t.find_all("tr"):
            th = [c.get_text(strip=True) for c in tr.find_all("th")]
            td = [c.get_text(strip=True) for c in tr.find_all("td")]
            print(f"  {th} : {td}")
    
    # Check attached files and links
    for a in soup.find_all("a"):
        href = a.get("href", "")
        text = a.get_text(strip=True)
        if any(w in text.lower() or w in href.lower() for w in ["down", "file", "http", "view", "채용", "공고", "바로가기", "접수"]):
            print("Link:", text, "->", href)

if __name__ == "__main__":
    inspect_detail()
