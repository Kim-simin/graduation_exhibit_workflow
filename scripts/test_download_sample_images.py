import os
import sys
import json
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

dest_dir = 'my-exhibit-platform/public/captures/UNIV-2025-서울대학교-디자인과'
os.makedirs(dest_dir, exist_ok=True)

with open('scripts/snu_projects_clean_urls.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

for i in range(3):
    p = projects[i]
    url = p['thumbnailUrl']
    filename = f"test_{i+1}.jpg"
    path = os.path.join(dest_dir, filename)
    print(f"Testing download {i+1}: {p['nameKo']} ({url[:60]}...)")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp, open(path, 'wb') as f_out:
        f_out.write(resp.read())
    print(f"Success! Saved to {path}, size: {os.path.getsize(path)} bytes")
