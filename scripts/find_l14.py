import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# Search for $L14
matches = [m.start() for m in re.finditer(r'\$L14', stream)]
print(f"Found {len(matches)} matches for $L14")
for m in matches:
    print(stream[max(0, m-50):min(len(stream), m+2000)])
