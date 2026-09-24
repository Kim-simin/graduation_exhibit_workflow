import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/art_snu_faculty.html', 'r', encoding='utf-8') as f:
    html = f.read()

items = html.split('<div class="tadiv_col tadiv_body">')[1:]
for i, item in enumerate(items[:3]):
    print(f"=== BLOCK {i} ===")
    spans = re.findall(r'<span[^>]*>(.*?)</span>', item, re.DOTALL)
    for s in spans:
        clean = re.sub(r'<[^>]+>', ' ', s).strip()
        if clean:
            print("  SPAN:", clean)
