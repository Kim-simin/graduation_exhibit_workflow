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

def inspect_uniall_body():
    url = "https://uniall.nrf.re.kr/biz/bizteam/list.do"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find(id=lambda x: x and "content" in x.lower()) or soup.find("main") or soup.find(class_=lambda x: x and "content" in x.lower())
    if main:
        print("Main id/class:", main.get("id"), main.get("class"))
        print("Main text sample:", main.get_text(" ", strip=True)[:1000])

if __name__ == "__main__":
    inspect_uniall_body()
