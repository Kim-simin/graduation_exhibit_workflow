import urllib.request
import urllib.parse
import json
from pathlib import Path
prof_path = Path("my-exhibit-platform/data/professors.json")
with open(prof_path, "r", encoding="utf-8") as f:
    profs = json.load(f)

first_id = profs[0]["id"] if profs else "1"
endpoints = ["/", "/professors", f"/professors/{urllib.parse.quote(first_id)}"]

for ep in endpoints:
    url = f"http://localhost:3000{ep}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            print(f"[{resp.status} OK] {url} -> Content length: {len(resp.read())}")
    except urllib.error.HTTPError as he:
        print(f"[{he.code} HTTP] {url} -> {he.reason}")
    except Exception as e:
        print(f"[ERR] {url} -> {e}")
