import json
import re

with open('scripts/snu_about_clean.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Look for text in headings, paragraphs, and RSC pushes
texts = re.findall(r'<p[^>]*>(.*?)</p>', html, re.DOTALL)
clean_texts = [re.sub(r'<[^>]+>', '', t).strip() for t in texts if t.strip()]

# Look for Next.js RSC data
pushes = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html)
unescaped_pushes = []
for p in pushes:
    # unescape \", \n etc
    try:
        # replace double escapes
        u = p.encode('utf-8').decode('unicode_escape')
        unescaped_pushes.append(u)
    except:
        unescaped_pushes.append(p)

combined_rsc = "\n".join(unescaped_pushes)

data = {
    "paragraphs": clean_texts,
    "rsc_sample": combined_rsc[:2000]
}

with open('scripts/snu_about_parsed.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Parsed", len(clean_texts), "paragraphs. Wrote to scripts/snu_about_parsed.json")
