import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/art_snu_faculty.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's find faculty cards or sections
# Let's search for 안성모 and see surrounding html
idx = html.find('안성모')
if idx != -1:
    print("--- Surrounding 안성모 ---")
    print(html[max(0, idx-300):min(len(html), idx+600)])

# Let's find all professor cards
# Often in WordPress or SNU site it has:
# <div class="...faculty..."> or <li class="...faculty...">
# Let's extract all Korean names around faculty sections
