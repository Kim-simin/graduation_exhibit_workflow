import json
import io
import sys
from collections import Counter
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

snu_card = next((c for c in queue if c.get("id") == "UNIV-2025-서울대학교-디자인과-snu-design"), None)
if not snu_card:
    print("SNU card not found!")
    sys.exit(1)

artworks = snu_card.get("artworks", [])
print(f"Total SNU artworks: {len(artworks)}")

tags = []
for a in artworks:
    title = a.get("title", "")
    match = re.match(r'\[(.*?)\]', title)
    if match:
        tags.append(match.group(1).upper())
    else:
        tags.append("NO_TAG")

counts = Counter(tags)
print("\nTags distribution:")
for tag, count in counts.most_common():
    print(f" - [{tag}]: {count} items")

print("\nSample titles by tag:")
for tag in counts.keys():
    samples = [a['title'] for a in artworks if a['title'].startswith(f"[{tag}]") or (tag == "NO_TAG" and not a['title'].startswith("["))][:2]
    print(f"[{tag}]: {samples}")
