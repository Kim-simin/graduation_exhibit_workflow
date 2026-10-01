import urllib.request
import ssl
from bs4 import BeautifulSoup

def inspect_all_images():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    for pid in [1, 2, 31, 41]:
        url = f"https://swuid2025.com/project/{pid}"
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        imgs = [img.get('src') for img in soup.find_all('img') if img.get('src')]
        print(f"\nPID {pid} has {len(imgs)} images:")
        for idx, src in enumerate(imgs):
            print(f"  [{idx}] {src}")

if __name__ == '__main__':
    inspect_all_images()
