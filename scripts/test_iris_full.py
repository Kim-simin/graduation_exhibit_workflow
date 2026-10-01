#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import ssl
import json
import urllib.request
import urllib.parse
from http.cookiejar import CookieJar

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def test_iris():
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))
    
    get_url = "https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do"
    req1 = urllib.request.Request(get_url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
    opener.open(req1, timeout=15)
    
    api_url = "https://www.iris.go.kr/contents/retrieveBsnsAncmBtinSituListView.do"
    data = {
        "pageIndex": "1",
        "bsnsAncmTap": "rcve_prg",
        "blngGovdSe": "all",
        "ancmTl": "",
        "bsnsAncmTl": "",
        "rcveDeFrom": "",
        "rcveDeTo": "",
        "prgmId": "",
    }
    encoded = urllib.parse.urlencode(data).encode("utf-8")
    req2 = urllib.request.Request(api_url, data=encoded, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Referer": get_url,
    })
    with opener.open(req2, timeout=15) as r2:
        raw = r2.read().decode("utf-8", errors="replace")
        try:
            res = json.loads(raw)
            print("Successfully loaded JSON from IRIS!")
            notices = res.get("listBsnsAncm", [])
            print(f"Total notices received: {len(notices)}")
            for n in notices[:5]:
                print(f"  [{n.get('ancmId')}] {n.get('ancmTl')} | {n.get('sorgnNm')} | 접수: {n.get('rcveBgngDt')} ~ {n.get('rcveEndDt')}")
        except Exception as e:
            print("Failed to parse JSON, first 300 chars:", raw[:300])

if __name__ == "__main__":
    test_iris()
