#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import ssl
import json
import urllib.request
import urllib.parse

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
}

def test_iris_api():
    url = "https://www.iris.go.kr/contents/retrieveBsnsAncmBtinSituListView.do"
    data = {
        "pageIndex": "1",
        "bsnsAncmTap": "",
        "prgmId": "",
    }
    encoded = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("IRIS response keys:", res.keys())
        notices = res.get("listBsnsAncm", [])
        print(f"Total notices on page 1: {len(notices)}")
        for n in notices[:5]:
            print(f"  [{n.get('ancmId')}] {n.get('ancmTl')} | {n.get('sorgnNm')} | D-Day: {n.get('dDay')} | 접수: {n.get('rcveBgngDt')} ~ {n.get('rcveEndDt')}")

if __name__ == "__main__":
    test_iris_api()
