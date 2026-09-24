import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's inspect each push individually from snu_works.html
pushes = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html)
print(f"Pushes: {len(pushes)}")

refs = {}
for i, p in enumerate(pushes):
    # Unescape
    try:
        p_clean = p.encode('utf-8').decode('unicode_escape')
    except:
        p_clean = p
    
    # Check if this push contains a ref definition like XX:T...,URL
    # In Next.js, a push chunk often starts with:
    # "15:T81d,https://..." or contains "\n16:T82c,https://..."
    for m in re.finditer(r'([0-9a-fA-F]+):T[0-9a-zA-Z]+,(https://hhhyejaaa\.notion\.site/image/[^"\s]+)', p_clean):
        ref_id = m.group(1)
        url = m.group(2)
        # trim any trailing next token if attached
        # URL usually ends before a newline or another ref
        if '\n' in url:
            url = url.split('\n')[0]
        # or if another ref like 17:T is appended
        m_next = re.search(r'([0-9a-fA-F]+):T[0-9a-zA-Z]+,', url)
        if m_next:
            url = url[:m_next.start()]
        refs[f"${ref_id}"] = url

print(f"Found {len(refs)} refs from individual pushes!")
for k in list(refs.keys())[:10]:
    print(k, "->", refs[k][:80])

with open('scripts/snu_refs.json', 'w', encoding='utf-8') as f:
    json.dump(refs, f, ensure_ascii=False, indent=2)
