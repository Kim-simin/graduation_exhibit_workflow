#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import ssl
import re
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

def inspect_bizteam():
    url = "https://uniall.nrf.re.kr/biz/bizteam/list.do"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    items = soup.find_all(class_="bizteam")
    print(f"Total bizteam items: {len(items)}")
    for i, it in enumerate(items[:10]):
        parent = it.find_parent("li") or it.find_parent("div")
        print(f"\n--- Item {i+1} ---")
        print("Raw text:", parent.get_text(" | ", strip=True) if parent else it.get_text(strip=True))
        links = parent.find_all("a") if parent else it.find_all("a")
        for a in links:
            print("Link:", a.get("href"), a.get("onclick"))

if __name__ == "__main__":
    inspect_bizteam()
