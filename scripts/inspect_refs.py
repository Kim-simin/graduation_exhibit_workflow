import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# Let's find matches for:
# (\w+):T[0-9a-fA-F]+,(https?://[^\n]+)
matches = re.findall(r'(\w+):T[0-9a-zA-Z]+,(https?://[^\n\r"]+)', stream)
print(f"Regex matches count: {len(matches)}")
for k, v in matches[:10]:
    print(f"Key: {k} -> URL: {v[:80]}")

# Also check for other format
matches2 = re.findall(r'(\w+):"(https?://[^"\n\r]+)"', stream)
print(f"Format 2 count: {len(matches2)}")
for k, v in matches2[:5]:
    print(f"Key2: {k} -> URL: {v[:80]}")
