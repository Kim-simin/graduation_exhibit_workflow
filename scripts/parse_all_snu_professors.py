import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/art_snu_faculty.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all <div class="tadiv_col tadiv_body"> ... </div>
body_blocks = re.findall(r'<div class="tadiv_col tadiv_body">(.*?)</div>\s*</div>', html, re.DOTALL)
print(f"Found {len(body_blocks)} faculty body blocks!")

faculty_list = []
for block in body_blocks:
    # Image
    img_m = re.search(r"href=['\"]([^'\"]+)['\"]\s+title=['\"]([^'\"]+)['\"]", block)
    name = img_m.group(2).strip() if img_m else ""
    img_url = img_m.group(1).strip() if img_m else ""
    
    # Text spans
    # Extract text from spans
    spans = re.findall(r'<span[^>]*>(.*?)</span>', block, re.DOTALL)
    clean_spans = [re.sub(r'<[^>]+>', ' ', s).strip() for s in spans if s.strip()]
    
    faculty_list.append({
        "name": name,
        "image": img_url,
        "raw_spans": clean_spans,
        "raw_text": re.sub(r'<[^>]+>', ' ', block).strip()
    })

print(f"Parsed {len(faculty_list)} faculty members:")
for f in faculty_list:
    print(f["name"], "->", " | ".join(f["raw_spans"][:4]))

with open('scripts/snu_official_faculty.json', 'w', encoding='utf-8') as out:
    json.dump(faculty_list, out, ensure_ascii=False, indent=2)
