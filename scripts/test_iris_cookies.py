#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import ssl
import urllib.request
import urllib.parse
from http.cookiejar import CookieJar

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_iris_with_cookies():
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))
    
    # 1. First visit list page to establish session/cookies
    get_url = "https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do"
    req1 = urllib.request.Request(get_url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
    with opener.open(req1, timeout=15) as r1:
        print("Page 1 HTTP:", r1.getcode())
        
    # 2. Now call AJAX endpoint with cookies and Referer
    api_url = "https://www.iris.go.kr/contents/retrieveBsnsAncmBtinSituListView.do"
    data = {
        "pageIndex": "1",
        "bsnsAncmTap": "",
        "prgmId": "",
    }
    encoded = urllib.parse.urlencode(data).encode("utf-8")
    req2 = urllib.request.Request(api_url, data=encoded, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": get_url,
    })
    with opener.open(req2, timeout=15) as r2:
        txt = r2.read().decode("utf-8", errors="replace")
        print("API HTTP:", r2.getcode(), "Length:", len(txt))
        print("Sample:", txt[:400])

if __name__ == "__main__":
    test_iris_with_cookies()
