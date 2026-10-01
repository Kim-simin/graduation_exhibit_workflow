#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/inspect_markup.py
Inspect the HTML structure, table rows, links, and pagination of target sources.
"""

import re
import ssl
import json
import urllib.request
from bs4 import BeautifulSoup

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

def inspect_nst():
    url = "https://www.nst.re.kr/www/selectBbsNttList.do?bbsNo=19&key=61"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== NST ===")
    table = soup.find("table")
    if table:
        print("Found table class:", table.get("class"))
        rows = table.find_all("tr")
        print(f"Total rows: {len(rows)}")
        for r in rows[:6]:
            cols = [c.get_text(strip=True) for c in r.find_all(["th", "td"])]
            links = [a.get("href") for a in r.find_all("a")]
            print("Row:", cols, "Links:", links)
    pagination = soup.find(class_=re.compile("paging|pagination|page", re.I))
    if pagination:
        print("Paging links:", [a.get("href") for a in pagination.find_all("a")][:5])

def inspect_uniall_pbanc():
    url = "https://uniall.nrf.re.kr/biz/pbanc/list.do"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== UniAll Announcements ===")
    table = soup.find("table")
    if table:
        print("Found table class:", table.get("class"))
        rows = table.find_all("tr")
        print(f"Total rows: {len(rows)}")
        for r in rows[:6]:
            cols = [c.get_text(strip=True) for c in r.find_all(["th", "td"])]
            links = [a.get("href") for a in r.find_all("a")]
            print("Row:", cols, "Links:", links)

def inspect_zeus():
    url = "https://www.zeus.go.kr/resv/organ/sortView"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== ZEUS ===")
    items = soup.find_all(class_=re.compile("item|list|equip|box", re.I))
    print(f"Items found with item/list/equip/box: {len(items)}")
    tables = soup.find_all("table")
    print(f"Tables: {len(tables)}")
    for t in tables[:2]:
        for r in t.find_all("tr")[:4]:
            print("Row:", [c.get_text(strip=True) for c in r.find_all(["th", "td"])])

def inspect_kstartup():
    url = "https://www.k-startup.go.kr/"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    print("\n=== K-Startup ===")
    links = soup.find_all("a", href=re.compile("pbanc|notice|announcement|biz", re.I))
    print(f"Notice/pbanc links: {len(links)}")
    for l in links[:6]:
        print("Link:", l.get_text(strip=True), l.get("href"))

def main():
    inspect_nst()
    inspect_uniall_pbanc()
    inspect_zeus()
    inspect_kstartup()

if __name__ == "__main__":
    main()
