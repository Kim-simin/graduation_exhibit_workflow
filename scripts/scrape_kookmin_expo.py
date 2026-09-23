"""
scripts/scrape_kookmin_expo.py
Investigates and extracts student artworks and details from https://expo.cs.kookmin.ac.kr/
"""

import sys
import re
import os
import json
import urllib.request
import urllib.parse
from html.parser import HTMLParser

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "https://expo.cs.kookmin.ac.kr"

def fetch_html(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8', errors='replace')

def explore():
    print(f"[*] Fetching Capstone page: {BASE_URL}/capstone")
    capstone_html = fetch_html(f"{BASE_URL}/capstone")
    
    # 1. Search for buttons or elements with team data
    team_elements = re.findall(r'<[^>]+data-(?:team|project|id|modal)[^>]*>', capstone_html)
    print(f"    Found {len(team_elements)} elements with data attributes: {team_elements[:5]}")

    # Search for all buttons in capstone_html
    buttons = re.findall(r'<button[^>]*>(.*?)</button>', capstone_html, re.DOTALL)
    print(f"    Found {len(buttons)} button elements.")
    for b in buttons[:5]:
        print(f"    Btn: {b[:80].strip()}")

    # 2. Fetch TeamModal JS
    modal_js_url = f"{BASE_URL}/_astro/TeamModal.astro_astro_type_script_index_0_lang.BHVMas6p.js"
    print(f"\n[*] Fetching TeamModal script: {modal_js_url}")
    modal_js = fetch_html(modal_js_url)
    with open("scripts/scratch_team_modal.js", "w", encoding="utf-8") as f:
        f.write(modal_js)
    print(f"    Saved TeamModal script ({len(modal_js)} bytes) to scripts/scratch_team_modal.js")

    # Search for data structures or endpoints in modal_js
    print(f"    Searching keywords in modal_js...")
    for kw in ["teams", "fetch", "poster", "members", "title", "api", "json", "data", "summary"]:
        matches = [m.start() for m in re.finditer(kw, modal_js, re.IGNORECASE)]
        print(f"    Keyword '{kw}': {len(matches)} matches")

    # Let's inspect any JSON-like array or object in capstone_html or modal_js
    # Look for inline scripts in capstone_html
    inline_scripts = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', capstone_html, re.DOTALL)
    for idx, sc in enumerate(inline_scripts):
        if "team" in sc.lower() or "krip" in sc.lower() or "fitplus" in sc.lower():
            print(f"    [!] Inline script #{idx} matches team data! Length: {len(sc)}")
            with open(f"scripts/scratch_inline_script_{idx}.js", "w", encoding="utf-8") as f:
                f.write(sc)

    # Also check AWS-Day
    print(f"\n[*] Fetching AWS-Day page: {BASE_URL}/aws-day")
    aws_html = fetch_html(f"{BASE_URL}/aws-day")
    aws_inline_scripts = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', aws_html, re.DOTALL)
    for idx, sc in enumerate(aws_inline_scripts):
        if "team" in sc.lower():
            print(f"    [!] AWS inline script #{idx} matches team data! Length: {len(sc)}")
            with open(f"scripts/scratch_aws_inline_script_{idx}.js", "w", encoding="utf-8") as f:
                f.write(sc)

if __name__ == "__main__":
    explore()
