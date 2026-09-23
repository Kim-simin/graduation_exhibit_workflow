"""
scripts/test_ddg_api.py
Test keyless API search via DuckDuckGo lite / html or Tavily/Serp.
"""
import urllib.request
import urllib.parse
import json
import re

def test_ddg(query: str):
    # DuckDuckGo HTML/API endpoint
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            html = resp.read().decode('utf-8')
            links = re.findall(r'href="(https?://[^"&]+)"', html)
            print(f"DDG found {len(links)} raw links")
            clean_links = [l for l in links if 'duckduckgo' not in l]
            print(f"Sample clean links: {clean_links[:5]}")
            return clean_links
    except Exception as e:
        print(f"DDG error: {e}")
        return []

if __name__ == "__main__":
    test_ddg("건국대학교 시각영상디자인학과 졸업전시회 2026")
