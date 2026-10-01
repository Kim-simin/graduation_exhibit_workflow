#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import ssl
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

def inspect_js():
    url = "https://www.iris.go.kr/resources/js/contents/bsnsancm/bsnsAncmList.js"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    print("JS length:", len(text))
    for line in text.splitlines():
        if any(w in line for w in ["url", "ajax", "post", "data:"]):
            print("  ", line.strip()[:140])

if __name__ == "__main__":
    inspect_js()
