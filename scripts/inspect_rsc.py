import urllib.request
import re
import json
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
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode('utf-8', errors='replace')

def main():
    html = fetch("https://dju26-design.co.kr/project")
    # write part of html to scratch to inspect
    with open("scripts/project_sample.txt", "w", encoding="utf-8") as f:
        f.write(html[:50000])
    
    # search for image urls (png, jpg, webp, asset.)
    img_urls = set(re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp|gif|mp4)', html))
    print(f"Total image/video URLs: {len(img_urls)}")
    for u in sorted(list(img_urls))[:15]:
        print("  ", u)

    # Search for project links href="/project/..."
    project_links = set(re.findall(r'/project/([^"\'\s?]+)', html))
    print(f"Project subpaths: {len(project_links)}")
    for p in sorted(list(project_links))[:15]:
        print("  /project/" + p)

    # Also search for korean text chunks that might be titles
    # Let's inspect where the project items are rendered
    # Look for tags or classes
    classes = set(re.findall(r'class="([^"]+)"', html))
    proj_classes = [c for c in classes if 'proj' in c.lower() or 'card' in c.lower() or 'item' in c.lower() or 'list' in c.lower()]
    print(f"Matching classes ({len(proj_classes)}):", proj_classes[:10])

if __name__ == "__main__":
    main()
