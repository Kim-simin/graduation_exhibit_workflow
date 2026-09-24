import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Search for "15:T" in html
idx = html.find('15:T')
print("Index of 15:T in html:", idx)
if idx != -1:
    print("Around 15:T:")
    print(html[idx-100:idx+300])

idx2 = html.find('16:T')
print("\nIndex of 16:T in html:", idx2)
if idx2 != -1:
    print("Around 16:T:")
    print(html[idx2-100:idx2+300])
