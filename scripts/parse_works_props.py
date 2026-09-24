import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# Search for WorksClient reference
# e.g., $L... with WorksClient
m = re.search(r'WorksClient', stream)
if m:
    pos = m.start()
    print("Found WorksClient at", pos)
    # look back and forward
    print("Around WorksClient:")
    print(stream[max(0, pos-200):min(len(stream), pos+500)])

# Look for large JSON object/array in stream
# Usually in Next.js RSC, there is a root component call like:
# ["$","$L14",null,{"works":[...],...}]
matches = re.finditer(r'\["\$","\$L', stream)
for match in matches:
    idx = match.start()
    snippet = stream[idx:idx+300]
    if 'WorksClient' in snippet or 'works' in snippet or 'data' in snippet or 'projects' in snippet:
        print("Found component call:", snippet[:150])
