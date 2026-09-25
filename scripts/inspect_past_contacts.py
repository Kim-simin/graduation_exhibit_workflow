import requests
from bs4 import BeautifulSoup
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

headers = {"User-Agent": "Mozilla/5.0"}
contact_urls = [
    "http://sj-di.com/2024-propeller/contact",
    "http://sj-di.com/2023-peakpeak/contact",
    "http://sj-di.com/2022_main/contact_2022",
    "http://sj-di.com/2021_main/contact-2021",
    "http://sj-di.com/contact_2020",
    "http://sj-di.com/2024-propeller/info",
    "http://sj-di.com/2023-peakpeak/info"
]

for u in contact_urls:
    try:
        r = requests.get(u, headers=headers, timeout=10)
        r.encoding = 'utf-8'
        soup = BeautifulSoup(r.text, "html.parser")
        text = soup.get_text()
        print(f"=== {u} ===")
        for line in text.split("\n"):
            line = line.strip()
            if any(k in line for k in ["교수", "지도", "위원회", "위원장", "총괄", "FACULTY", "PROFESSOR"]):
                print(" ->", line)
    except Exception as e:
        print(f"Error {u}: {e}")
