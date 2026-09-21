import os
import json
import urllib.request
import urllib.error
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def audit_file(rel_path):
    path = os.path.join(ROOT_DIR, rel_path)
    if not os.path.exists(path):
        print(f"File not found: {rel_path}")
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    sources = []
    for item in data:
        item_id = item.get("id")
        for src in item.get("information_sources", []):
            sources.append((rel_path, item_id, src))
    return sources

def main():
    files = [
        "data/professors.json",
        "data/rfp.json",
        "data/brand_assets.json",
        "data/mentors.json"
    ]
    all_sources = []
    for f in files:
        s = audit_file(f)
        all_sources.extend(s)
        print(f"{f}: {len(s)} sources found")

    print(f"\nTotal collected sources: {len(all_sources)}")
    print("-" * 60)
    
    unique_urls = {}
    for rel_path, item_id, src in all_sources:
        url = src.get("source_url") or src.get("url") or ""
        title = src.get("source_title") or ""
        status = src.get("verification_status")
        domain = src.get("source_domain")
        unique_urls[url] = {
            "title": title,
            "entity_id": item_id,
            "file": rel_path,
            "status": status,
            "domain": domain
        }

    print(f"Unique URLs: {len(unique_urls)}")
    for url, info in unique_urls.items():
        print(f"[{info['file']}] [{info['entity_id']}] {url} -> {info['title']}")

if __name__ == "__main__":
    main()
