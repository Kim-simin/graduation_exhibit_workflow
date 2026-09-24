import json
import os
import re
import ssl
import urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def main():
    print("=== 1. Fetching all 274 works from WordPress REST API ===")
    all_works = []
    page = 1
    while True:
        url = f"https://hongiksidi.com/gs/2025-admin/wp-json/wp/v2/works2025?per_page=100&page={page}"
        print(f"Fetching page {page}...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, context=ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not data:
                    break
                all_works.extend(data)
                total_pages = int(resp.headers.get("X-WP-TotalPages", 1))
                print(f"  Got {len(data)} works. Total collected: {len(all_works)} / pages {total_pages}")
                if page >= total_pages:
                    break
                page += 1
        except Exception as e:
            print(f"  Page {page} finished or error: {e}")
            break

    print(f"Total works fetched: {len(all_works)}")
    with open("scripts/hongik_all_works.json", "w", encoding="utf-8") as f:
        json.dump(all_works, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
