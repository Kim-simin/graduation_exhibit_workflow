import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/art_snu_faculty.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's inspect each professor item in the table
# Look for <div class="tadiv_col tadiv_body">
items = html.split('<div class="tadiv_col tadiv_body">')[1:]
print(f"Total faculty blocks: {len(items)}")

professors = []
for item in items:
    # Stop before next section if any
    chunk = item.split('</div>\n\n\n\n\n')[0] if '</div>\n\n\n\n\n' in item else item[:3000]
    
    # Name from title
    name_m = re.search(r'title="([^"]+)"', chunk)
    name = name_m.group(1).strip() if name_m else ""
    if not name or name in ['Permalink', 'Homepage link', 'send a e-mail', 'CV PDF File']:
        # try find in text
        pass

    # Photo URL
    img_m = re.search(r"href=['\"]([^'\"]+\.(?:jpg|png|jpeg))['\"]", chunk)
    photo = img_m.group(1).strip() if img_m else ""
    
    # Text spans
    # <span class="job">...</span>, <span class="field">...</span>, etc.
    job_m = re.search(r'<span class="job">(.*?)</span>', chunk, re.DOTALL)
    job = re.sub(r'<[^>]+>', '', job_m.group(1)).strip() if job_m else "교수"
    
    field_m = re.search(r'<span class="field">(.*?)</span>', chunk, re.DOTALL)
    field = re.sub(r'<[^>]+>', '', field_m.group(1)).strip() if field_m else ""
    
    email_m = re.search(r'mailto:([^"\'>]+)', chunk)
    email = email_m.group(1).strip() if email_m else ""
    
    cv_m = re.search(r'href="([^"]+\.pdf)"', chunk)
    cv = cv_m.group(1).strip() if cv_m else ""
    
    web_m = re.search(r'href="([^"]+)"\s+title="Homepage link"', chunk)
    homepage = web_m.group(1).strip() if web_m else ""

    # Clean name
    clean_name = re.sub(r'Permalink to\s*', '', name).strip()

    if clean_name and clean_name not in ['Skip to content', 'SNU ART']:
        professors.append({
            "name": clean_name,
            "position": job or "교수",
            "field": field,
            "photo": photo,
            "email": email,
            "homepage": homepage,
            "cv": cv
        })

print(f"Extracted {len(professors)} professors from SNU Design official page:")
for p in professors:
    print(f"- {p['name']} ({p['position']}) | 분야: {p['field']} | {p['email']}")

with open('scripts/snu_extracted_faculty.json', 'w', encoding='utf-8') as out:
    json.dump(professors, out, ensure_ascii=False, indent=2)
