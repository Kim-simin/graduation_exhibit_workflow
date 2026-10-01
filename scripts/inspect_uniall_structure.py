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

def inspect_teams():
    url = "https://uniall.nrf.re.kr/biz/bizteam/list.do"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    
    # Look for list-item or team containers
    items = soup.find_all(class_=re.compile("team-list|bizteam|result|list_item|gallery", re.I))
    print("Matched containers:", len(items))
    for c in items[:5]:
        print("Container class:", c.get("class"))
        print("Text:", c.get_text(" ", strip=True)[:200])
        
    # Search for university mentions
    univ_tags = soup.find_all(string=re.compile("대학교|대학"))
    print("University text nodes:", len(univ_tags))
    for u in univ_tags[:10]:
        parent = u.parent
        print(f"Parent tag: {parent.name} class={parent.get('class')} | {u.strip()}")

if __name__ == "__main__":
    inspect_teams()
