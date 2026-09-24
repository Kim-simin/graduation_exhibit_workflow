import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/art_snu_faculty.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's search for "이장섭"
idx = html.find('이장섭')
print("Index of 이장섭:", idx)
if idx != -1:
    print("Around 이장섭:")
    print(html[idx-200:idx+400])

# Find all occurrences of class="tadiv_col
cols = re.findall(r'<div class="tadiv_col[^"]*">(.*?)</div>', html, re.DOTALL)
print(f"Total tadiv_col: {len(cols)}")

# Find all <a> with title= in the page
titles = re.findall(r'<a[^>]+title="([^"]+)"', html)
print("All titles:", titles)
