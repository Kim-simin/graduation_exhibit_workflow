import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# Let's inspect the pushes in snu_works.html more carefully.
# In parse_works_content.py we only took self.__next_f.push([1, "..."])
# What other pushes are there? self.__next_f.push([0, ...])?
with open('scripts/snu_works.html', 'r', encoding='utf-8') as f:
    html = f.read()

all_pushes = re.findall(r'self\.__next_f\.push\((.*?)\)', html, re.DOTALL)
print(f"Total all_pushes: {len(all_pushes)}")

# Let's find any Notion URLs or student project entries
# In Next.js RSC, sometimes data is passed in an array or object.
# Let's search for image URLs and the context around them
image_matches = [m.start() for m in re.finditer(r'https://hhhyejaaa\.notion\.site/image/', stream)]
print(f"Found {len(image_matches)} notion image matches in stream")

# Let's inspect around the first 5 notion images
samples = []
for idx in image_matches[:10]:
    start = max(0, idx - 200)
    end = min(len(stream), idx + 400)
    samples.append(stream[start:end])

with open('scripts/snu_image_contexts.txt', 'w', encoding='utf-8') as f:
    f.write("\n=====================================\n".join(samples))

print("Saved samples to scripts/snu_image_contexts.txt")
