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

def inspect_iris_ajax():
    url = "https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    for s in soup.find_all("script"):
        txt = s.get_text()
        if "listBsnsAncm" in txt or "f_bsnsAncmListForm" in txt:
            print("Found function/template:")
            for line in txt.splitlines():
                if any(w in line for w in ["ajax", "url", "post", "data", "retrieve", "listBsnsAncm"]):
                    print("  ", line.strip()[:140])

if __name__ == "__main__":
    inspect_iris_ajax()
