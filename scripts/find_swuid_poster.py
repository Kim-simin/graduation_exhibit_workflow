import urllib.request
import re
from bs4 import BeautifulSoup

def find_poster():
    for url in ["https://swuid2025.com/", "https://swuid2025.com/about"]:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # Look for all image sources, background-image urls, etc.
        print(f"=== Checking {url} ===")
        for img in soup.find_all('img'):
            print("img:", img.get('src'), img.get('alt'))
        
        # Check styles
        bg_urls = re.findall(r'url\((.*?)\)', html)
        for bg in bg_urls:
            print("bg:", bg)

if __name__ == '__main__':
    find_poster()
