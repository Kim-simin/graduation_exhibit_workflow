import urllib.request
import re
import json
import sys

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode('utf-8', errors='replace')

def main():
    proj_js_url = "https://dju26-design.co.kr/_next/static/chunks/app/project/page-cdd12c08a5b5a743.js"
    js_content = fetch(proj_js_url)
    print(f"JS Length: {len(js_content)}")
    with open("scripts/project_chunk.js", "w", encoding="utf-8") as f:
        f.write(js_content)

    # Search for strings or objects
    # Look for image URLs, project names, authors, etc.
    urls = set(re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp|gif|mp4)', js_content))
    print(f"Image URLs in JS ({len(urls)}):")
    for u in sorted(list(urls))[:15]:
        print("  ", u)

    # Let's search for korean strings
    korean_words = set(re.findall(r'[\uac00-\ud7a3]{2,}', js_content))
    print(f"Korean words found ({len(korean_words)}):")
    print("Sample:", list(korean_words)[:30])

if __name__ == "__main__":
    main()
