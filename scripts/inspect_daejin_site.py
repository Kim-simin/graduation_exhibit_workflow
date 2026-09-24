import urllib.request
import re
import json
import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def main():
    print("=== 1. Fetching Main Page ===")
    main_html = fetch("https://dju26-design.co.kr/")
    print(f"Main length: {len(main_html)}")

    # Look for script tags, Next.js build manifests or data
    scripts = re.findall(r'<script[^>]*src="([^"]+)"', main_html)
    print("Scripts found:")
    for s in scripts[:10]:
        print(" ", s)

    # Check for rsc or buildId
    build_id_m = re.search(r'/_next/static/([^/]+)/_buildManifest.js', main_html)
    if build_id_m:
        print("Build ID:", build_id_m.group(1))

    # Look for professors in main_html
    print("\n=== Checking for 교수/지도교수/도움 주신 분들 in main ===")
    matches = re.findall(r'.{0,50}(?:교수|지도|디자인|Fe26|REINFORCE).{0,50}', main_html)
    for m in matches[:15]:
        print("  Match:", m.strip())

    # Look for project list or links
    print("\n=== 2. Fetching Project Page ===")
    proj_html = fetch("https://dju26-design.co.kr/project")
    print(f"Project HTML length: {len(proj_html)}")

    # Extract all links
    links = set(re.findall(r'href="([^"]+)"', proj_html))
    proj_links = [l for l in links if '/project' in l or '/designer' in l]
    print(f"Project/Designer links ({len(proj_links)}):")
    for l in sorted(proj_links)[:20]:
        print(" ", l)

    # Check for designer page
    print("\n=== 3. Fetching Designer Page ===")
    des_html = fetch("https://dju26-design.co.kr/designer")
    print(f"Designer HTML length: {len(des_html)}")
    des_links = [l for l in set(re.findall(r'href="([^"]+)"', des_html)) if '/designer/' in l or '/project/' in l]
    print(f"Links in designer page ({len(des_links)}):")
    for l in sorted(des_links)[:20]:
        print(" ", l)

if __name__ == "__main__":
    main()
