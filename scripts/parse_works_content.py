import re
import json

with open('scripts/snu_works.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's inspect the Next.js RSC pushes or embedded JSON
pushes = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html)
print(f"Total pushes: {len(pushes)}")

full_stream = ""
for p in pushes:
    # unescape string
    try:
        u = p.encode('utf-8').decode('unicode_escape')
        full_stream += u
    except Exception as e:
        full_stream += p

print(f"Total full_stream length: {len(full_stream)}")
with open('scripts/snu_works_stream.txt', 'w', encoding='utf-8') as f:
    f.write(full_stream)

# Search for work data structures in full_stream or html
# Let's search for typical keys like "title", "author", "image", "category", "major", "slug", "id"
# Let's find JSON objects or arrays
work_chunks = re.findall(r'\{[^{}]*"title"[^{}]*\}', full_stream)
print(f"Found {len(work_chunks)} small title objects")

# Also look for any embedded script with JSON
json_scripts = re.findall(r'<script[^>]*type="application/json"[^>]*>(.*?)</script>', html)
print(f"Found {len(json_scripts)} application/json scripts")

# Let's search for some student names or project keywords
# We saw in snu_about: "정예원", "유용준", "탁로현", etc.
sample_matches = re.findall(r'"title":\s*"([^"]+)"', full_stream)
print(f"Found {len(sample_matches)} 'title' matches")
if sample_matches:
    print("Sample titles:", sample_matches[:10])

# Let's also look for image URLs
images = re.findall(r'https?://[^\s"\'<>]+\.(?:png|jpg|jpeg|webp)', full_stream)
print(f"Found {len(images)} image URLs. Unique: {len(set(images))}")
if images:
    print("Sample images:", list(set(images))[:5])
