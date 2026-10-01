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

def inspect_uniall_after():
    url = "https://uniall.nrf.re.kr/biz/bizteam/list.do"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find(id="moveContent")
    text = main.get_text(" ", strip=True)
    idx = text.find("사업단 리스트") or text.find("검색") or 2000
    print("Length of main text:", len(text))
    print("Sample from 1500 to 3500:")
    print(text[1500:3500])

if __name__ == "__main__":
    inspect_uniall_after()
