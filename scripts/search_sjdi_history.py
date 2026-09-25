import requests
from bs4 import BeautifulSoup
import re

headers = {"User-Agent": "Mozilla/5.0"}
years = [
    "http://sj-di.com/2024-propeller",
    "http://sj-di.com/2023-peakpeak",
    "http://sj-di.com/2022_main",
    "http://sj-di.com/2021_main",
    "http://sj-di.com/2020_project",
    "http://sj-di.com/project-2018-2",
    "http://sj-di.com/2017_project"
]

for y_url in years:
    try:
        r = requests.get(y_url, headers=headers, timeout=10)
        r.encoding = 'utf-8'
        soup = BeautifulSoup(r.text, "html.parser")
        print(f"\n--- {y_url} ---")
        print("Title:", soup.title.string if soup.title else "")
        links = [a['href'] for a in soup.find_all("a", href=True)]
        info_links = [l for l in links if any(k in l.lower() for k in ["info", "about", "contact", "prof", "credit"])]
        print("Relevant links:", set(info_links))
        
        # Check text for 교수
        text = soup.get_text()
        for line in text.split("\n"):
            line = line.strip()
            if any(k in line for k in ["교수", "지도"]):
                print("Line match:", line[:100])
    except Exception as e:
        print(f"Error for {y_url}: {e}")
