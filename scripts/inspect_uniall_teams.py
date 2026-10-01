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

def inspect_uniall_teams():
    url = "https://uniall.nrf.re.kr/biz/bizteam/list.do"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    print("UniAll Teams HTML length:", len(html))
    # Look for list, ul, cards, select
    selects = soup.find_all("select")
    print("Selects:", [s.get("name") or s.get("id") for s in selects])
    cards = soup.find_all(class_=re.compile("card|item|biz|team|box", re.I))
    print("Cards/items:", len(cards))
    for c in cards[:5]:
        print("Card text:", c.get_text(" ", strip=True)[:150])

if __name__ == "__main__":
    inspect_uniall_teams()
