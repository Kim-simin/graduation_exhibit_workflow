#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/inspect_all_other_sources.py
Inspect the data representation of UniAll, NTIS, IRIS, ZEUS, e-Tube, K-Startup.
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

def test_uniall_teams():
    url = "https://uniall.nrf.re.kr/biz/bizteam/list.do"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== UniAll Teams ===")
    tables = soup.find_all("table")
    print(f"Tables: {len(tables)}")
    for t in tables[:1]:
        rows = t.find_all("tr")
        print(f"Rows: {len(rows)}")
        for r in rows[:6]:
            cols = [c.get_text(strip=True) for c in r.find_all(["th", "td"])]
            print("  Team row:", cols)

def test_iris():
    url = "https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== IRIS Announcements ===")
    # Look for table or board list
    table = soup.find("table")
    if table:
        for r in table.find_all("tr")[:6]:
            print("  IRIS row:", [c.get_text(strip=True) for c in r.find_all(["th", "td"])])
    else:
        # Check list items or script data
        items = soup.find_all(class_=re.compile("item|list|ancm|board", re.I))
        print(f"IRIS items matching: {len(items)}")

def test_ntis():
    url = "https://www.ntis.go.kr/rndgate/eg/un/ra/mng.do"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== NTIS Announcements ===")
    table = soup.find("table")
    if table:
        for r in table.find_all("tr")[:6]:
            print("  NTIS row:", [c.get_text(strip=True) for c in r.find_all(["th", "td"])])
    else:
        print("No table in NTIS announcements HTML, checking divs...")

def test_zeus():
    url = "https://www.zeus.go.kr/resv/organ/sortView"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== ZEUS Facilities ===")
    # Find links or items
    for a in soup.find_all("a", href=re.compile("organ|equip|resv", re.I))[:10]:
        print("  ZEUS link:", a.get_text(strip=True), "->", a.get("href"))

def test_kstartup():
    url = "https://www.k-startup.go.kr/"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== K-Startup ===")
    # Check notice links
    for a in soup.find_all("a")[:30]:
        text = a.get_text(strip=True)
        href = a.get("href", "")
        if any(w in text for w in ["모집", "사업", "공고", "선정", "지원", "스타트업", "경진대회"]):
            print("  K-Startup link:", text, "->", href)

if __name__ == "__main__":
    test_uniall_teams()
    test_iris()
    test_ntis()
    test_zeus()
    test_kstartup()
