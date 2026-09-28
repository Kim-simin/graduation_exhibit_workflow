import urllib.request
import re
import json
from bs4 import BeautifulSoup

def inspect_pages():
    for path in ["/about", "/project/31", "/project/32"]:
        url = f"https://swuid2025.com{path}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            html = urllib.request.urlopen(req).read().decode('utf-8')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            continue

        soup = BeautifulSoup(html, 'html.parser')
        imgs = [img.get('src') for img in soup.find_all('img') if img.get('src')]
        scripts = [s.string for s in soup.find_all('script') if s.string and '__NEXT_DATA__' in s.string or (s.get('id') == '__NEXT_DATA__')]

        print(f"\n=== Path: {path} ===")
        print("Images:")
        for img in imgs[:10]:
            print("  ", img)

        if scripts:
            print("Found __NEXT_DATA__!")
            # let's parse json
            next_data = soup.find('script', id='__NEXT_DATA__')
            if next_data and next_data.string:
                data = json.loads(next_data.string)
                print("pageProps keys:", list(data.get('props', {}).get('pageProps', {}).keys()))

if __name__ == '__main__':
    inspect_pages()
