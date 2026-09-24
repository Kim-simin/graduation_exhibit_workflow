import sys
import re
import html
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/art_snu_faculty.html', 'r', encoding='utf-8') as f:
    page_html = f.read()

items = page_html.split('<div class="tadiv_col tadiv_body">')[1:]
print(f"Total faculty blocks: {len(items)}")

prof_list = []
for i, item in enumerate(items):
    # Name & Image
    img_m = re.search(r"href=['\"]([^'\"]+\.(?:jpg|png|jpeg))['\"]", item)
    photo = img_m.group(1).strip() if img_m else ""
    
    title_m = re.search(r'title="([^"]+)"', item)
    name = title_m.group(1).strip() if title_m else ""
    if not name or 'Permalink' in name:
        name_m = re.search(r'title="Permalink to ([^"]+)"', item)
        if name_m:
            name = name_m.group(1).strip()
    
    # Extract spans
    spans = re.findall(r'<span[^>]*>(.*?)</span>', item, re.DOTALL)
    clean_spans = [re.sub(r'<[^>]+>', ' ', s).strip() for s in spans if s.strip()]
    
    # Find email, office, homepage, cv
    email = ""
    office = ""
    homepage = ""
    cv = ""
    fields = []
    
    for s in clean_spans:
        decoded_s = html.unescape(s)
        if decoded_s.startswith('E '):
            email = decoded_s[2:].strip()
        elif decoded_s.startswith('O '):
            office = decoded_s[2:].strip()
        elif decoded_s.startswith('H '):
            homepage = decoded_s[2:].strip()
        elif decoded_s.startswith('C ') or decoded_s == 'Download':
            pass
        elif decoded_s != name:
            fields.append(decoded_s)
    
    # CV link
    cv_m = re.search(r'href="([^"]+\.pdf)"', item)
    if cv_m:
        cv = cv_m.group(1).strip()
    
    # Homepage link
    hp_m = re.search(r'href="([^"]+)"\s+title="Homepage link"', item)
    if hp_m:
        homepage = hp_m.group(1).strip()

    prof_list.append({
        "name": name,
        "photo": photo,
        "details": fields,
        "email": email,
        "office": office,
        "homepage": homepage,
        "cv": cv
    })

print("Parsed Professors:")
for p in prof_list:
    print(f"- {p['name']}: {p['details']} | Email: {p['email']} | HP: {p['homepage']}")

with open('scripts/snu_full_professors.json', 'w', encoding='utf-8') as f:
    json.dump(prof_list, f, ensure_ascii=False, indent=2)
