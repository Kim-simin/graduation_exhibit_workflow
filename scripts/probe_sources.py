#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/probe_sources.py
Probe the accessibility and HTML response of target government/academic sources.
"""

import sys
import ssl
import urllib.request
from urllib.error import HTTPError, URLError

SOURCES = [
    ("NST", "https://www.nst.re.kr/www/selectBbsNttList.do?bbsNo=19&key=61"),
    ("UniAll_teams", "https://uniall.nrf.re.kr/biz/bizteam/list.do"),
    ("UniAll_announcements", "https://uniall.nrf.re.kr/biz/pbanc/list.do"),
    ("NTIS_projects", "https://www.ntis.go.kr/ThSearchProjectList.do"),
    ("NTIS_announcements", "https://www.ntis.go.kr/rndgate/eg/un/ra/mng.do"),
    ("IRIS", "https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do"),
    ("ZEUS", "https://www.zeus.go.kr/resv/organ/sortView"),
    ("e-Tube", "https://www.etube.re.kr/"),
    ("K-Startup", "https://www.k-startup.go.kr/"),
]

def probe(name, url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            status = resp.getcode()
            charset = resp.headers.get_content_charset() or "utf-8"
            html = resp.read()
            text = html.decode(charset, errors="replace")
            print(f"[{name}] HTTP {status}, Length: {len(text)} chars, Final URL: {resp.geturl()}")
            return status, text
    except HTTPError as e:
        print(f"[{name}] HTTP Error {e.code}: {e.reason}")
        return e.code, ""
    except URLError as e:
        print(f"[{name}] URL Error: {e.reason}")
        return 0, ""
    except Exception as e:
        print(f"[{name}] Error: {e}")
        return 0, ""

def main():
    print("Probing 9 sources...")
    results = {}
    for name, url in SOURCES:
        status, text = probe(name, url)
        results[name] = {"status": status, "has_content": len(text) > 0, "sample": text[:300] if text else ""}
    print("Done probing.")

if __name__ == "__main__":
    main()
