import urllib.request
import ssl
from bs4 import BeautifulSoup

def inspect_html():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    for pid in [1, 31, 41]:
        url = f"https://swuid2025.com/project/{pid}"
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        print(f"\n=================== Project {pid} ===================")
        for h in soup.find_all(['h1', 'h2', 'h3', 'h4']):
            print(f"[{h.name}] {h.get_text(strip=True)}")
        
        paragraphs = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)]
        print(f"Paragraphs count: {len(paragraphs)}")
        for idx, p in enumerate(paragraphs[:8]):
            print(f"  P{idx}: {p}")

        imgs = [img.get('src') for img in soup.find_all('img') if img.get('src')]
        print(f"Images count: {len(imgs)}")
        for idx, img in enumerate(imgs[:5]):
            print(f"  IMG{idx}: {img}")

if __name__ == '__main__':
    inspect_html()
