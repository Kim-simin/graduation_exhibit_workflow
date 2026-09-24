import re
import json

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# Look for patterns like work items, author, title, thumbnail, category, etc.
# In Next.js RSC, objects often look like:
# {"id":"...","title":"...","author":"...",...} or [...,{"title":...}]
# Let's search for objects with "id" and "title" or "author" or "designer"
print("Stream length:", len(stream))

# Let's search for occurrences of Korean keys or common fields
for keyword in ["title", "name", "author", "designer", "category", "major", "thumbnail", "cover"]:
    count = len(re.findall(f'"{keyword}"', stream))
    print(f'"{keyword}": {count}')

# Let's find JSON-like chunks
# Let's look for large JSON arrays or objects
# Search for something like: "id":"
id_matches = [m.start() for m in re.finditer(r'"id":\s*"', stream)]
print(f'Found {len(id_matches)} "id": occurrences')

if id_matches:
    # Print around the first few
    for idx in id_matches[:5]:
        snippet = stream[max(0, idx-50):min(len(stream), idx+300)]
        print("--- Snippet ---")
        print(snippet.replace('\n', ' '))
