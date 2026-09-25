import requests
from bs4 import BeautifulSoup
import sys
import io
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

urls = [
    "https://design.sejong.ac.kr/",
    "http://design.sejong.ac.kr/",
    "https://sejong.ac.kr/unilife/sub3_1.html", # potential faculty page
]

# Let's search faculty pages on design.sejong.ac.kr
try:
    r = requests.get("https://design.sejong.ac.kr/", headers=headers, verify=False, timeout=10)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, "html.parser")
    print("design.sejong.ac.kr status:", r.status_code)
    print("Title:", soup.title.string if soup.title else "")
    for a in soup.find_all("a", href=True):
        href = a['href']
        text = a.get_text(strip=True)
        if any(k in text for k in ["교수", "교원", "faculty", "professor", "소개"]):
            print(f"Faculty link: {text} -> {href}")
except Exception as e:
    print("Error fetching design.sejong.ac.kr:", e)
