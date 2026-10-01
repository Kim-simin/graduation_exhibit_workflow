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

def inspect_call():
    url = "https://www.iris.go.kr/resources/js/contents/bsnsancm/bsnsAncmList.js"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    idx = text.find("retrieveBsnsAncmBtinSituListView.do")
    if idx != -1:
        print("Function snippet around retrieveBsnsAncmBtinSituListView.do:")
        print(text[max(0, idx-300):min(len(text), idx+1200)])

if __name__ == "__main__":
    inspect_call()
