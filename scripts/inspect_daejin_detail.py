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

def inspect_main_advisors():
    html = fetch("https://dju26-design.co.kr/")
    print("=== Advisors Section in Main Page ===")
    advisors_block = re.findall(r'<span class="Advisors_advisor_item_category[^"]*">([^<]+)</span>\s*<span class="Advisors_advisor_item_name[^"]*">([^<]+)</span>', html)
    for cat, name in advisors_block:
        print(f"Category: {cat.strip()} | Advisor: {name.strip()}")

def inspect_projects():
    html = fetch("https://dju26-design.co.kr/project")
    print("\n=== Project Page Inspection ===")
    # Check for self.__next_f.push or similar Next.js 14 RSC data
    rsc_pushes = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html)
    print(f"RSC pushes found: {len(rsc_pushes)}")
    
    # Or check for Sanity CDN image links and project titles
    sanity_imgs = set(re.findall(r'https://cdn\.sanity\.io/images/[^"\'\s]+', html))
    print(f"Sanity images found: {len(sanity_imgs)}")
    for img in sorted(list(sanity_imgs))[:5]:
        print(" ", img)

    # Let's search for project titles and student names in html
    # Or search for project data pattern
    # Let's search for chunks of text or project cards
    titles = re.findall(r'class="ProjectCard_title[^"]*">([^<]+)</div>', html)
    print(f"ProjectCard titles found: {len(titles)}")
    if not titles:
        # Check general pattern
        print("Searching for project patterns...")
        for pattern in [r'"title":"([^"]+)"', r'"slug":"([^"]+)"', r'"studentName":"([^"]+)"', r'"name":"([^"]+)"']:
            m = re.findall(pattern, html)
            print(f"Pattern {pattern}: {len(m)} matches. Samples: {m[:5]}")

if __name__ == "__main__":
    inspect_main_advisors()
    inspect_projects()
