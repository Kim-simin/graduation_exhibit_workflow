import requests
from bs4 import BeautifulSoup
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

for u in ["http://sj-di.com/2024-propeller/contact", "http://sj-di.com/2024-propeller/info", "http://sj-di.com/contact_2020"]:
    r = requests.get(u, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, "html.parser")
    print(f"*** {u} ***")
    for s in soup.stripped_strings:
        print(s)
    print("*"*40)
