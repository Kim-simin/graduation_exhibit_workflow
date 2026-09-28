import urllib.request
import re
import json
from bs4 import BeautifulSoup

def inspect_site():
    url = "https://swuid2025.com/"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return

    soup = BeautifulSoup(html, 'html.parser')
    imgs = [img.get('src') for img in soup.find_all('img') if img.get('src')]
    links = [a.get('href') for a in soup.find_all('a') if a.get('href')]

    print("=== Main Page Images ===")
    for img in imgs[:15]:
        print(img)

    print("\n=== Main Page Links ===")
    for l in links[:15]:
        print(l)

if __name__ == '__main__':
    inspect_site()
