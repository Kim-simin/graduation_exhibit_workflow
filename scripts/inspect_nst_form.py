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

def inspect_form():
    url = "https://www.nst.re.kr/www/selectBbsNttList.do?bbsNo=19&key=61"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    form = soup.find("form")
    if form:
        print("Form action:", form.get("action"))
        print("Form method:", form.get("method"))
        inputs = form.find_all(["input", "select"])
        for inp in inputs:
            print("Input:", inp.get("name"), inp.get("type"), inp.get("value"))

if __name__ == "__main__":
    inspect_form()
