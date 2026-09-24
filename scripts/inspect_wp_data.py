import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def inspect_routes():
    # 1. Classroom
    url_cr = "https://hongiksidi.com/gs/2025-admin/wp-json/wp/v2/classroom?per_page=20"
    req_cr = urllib.request.Request(url_cr, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req_cr, context=ctx) as resp:
        cr_data = json.loads(resp.read().decode("utf-8"))
    print(f"Classroom count: {len(cr_data)}")
    with open("scripts/classroom_sample.json", "w", encoding="utf-8") as f:
        json.dump(cr_data, f, ensure_ascii=False, indent=2)

    # 2. Works2025
    url_w = "https://hongiksidi.com/gs/2025-admin/wp-json/wp/v2/works2025?per_page=2"
    req_w = urllib.request.Request(url_w, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req_w, context=ctx) as resp:
        # Check total headers
        total = resp.headers.get("X-WP-Total")
        total_pages = resp.headers.get("X-WP-TotalPages")
        print(f"Total works: {total}, Total pages: {total_pages}")
        w_data = json.loads(resp.read().decode("utf-8"))
    with open("scripts/works_sample.json", "w", encoding="utf-8") as f:
        json.dump(w_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    inspect_routes()
