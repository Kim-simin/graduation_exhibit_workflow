import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# Let's find every pattern like:
# <ref_id>:T<hex>,<url>
# where <url> starts with https://hhhyejaaa.notion.site/image/
# and ends with &cache=v2
matches = re.findall(r'([0-9a-fA-F]+):T[0-9a-zA-Z]+,(https://hhhyejaaa\.notion\.site/image/.*?(?:&cache=v2|\.png|\.jpg|\.webp|\.jpeg))(?=[0-9a-fA-F]+:|\n|\r|\]|\}|$)', stream)

print(f"Matched {len(matches)} with lookahead delimiter!")

ref_map = {}
for k, url in matches:
    # Ensure URL strictly cuts off at &cache=v2
    if '&cache=v2' in url:
        url = url.split('&cache=v2')[0] + '&cache=v2'
    ref_map[f"${k}"] = url

print(f"Total clean refs in map: {len(ref_map)}")
for k in list(ref_map.keys())[:5]:
    print(f"{k} length {len(ref_map[k])}: {ref_map[k][:70]}...{ref_map[k][-20:]}")

# Now load projects
with open('scripts/snu_projects_final.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

for p in projects:
    t = p.get('thumbnailUrl', '')
    # If t is in ref_map
    if t in ref_map:
        p['thumbnailUrl'] = ref_map[t]
    elif t.startswith('http') and '&cache=v2' in t:
        p['thumbnailUrl'] = t.split('&cache=v2')[0] + '&cache=v2'

valid_urls = [p['thumbnailUrl'] for p in projects if p['thumbnailUrl'].startswith('http')]
print(f"Valid clean URLs: {len(valid_urls)} / {len(projects)}")
if valid_urls:
    print("Sample valid URL 0 length:", len(valid_urls[0]))
    print("Sample valid URL 0:", valid_urls[0][:100], "...", valid_urls[0][-30:])

with open('scripts/snu_projects_clean_urls.json', 'w', encoding='utf-8') as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)

print("Saved to scripts/snu_projects_clean_urls.json")
