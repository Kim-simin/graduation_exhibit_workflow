import urllib.request
import ssl
import json
from bs4 import BeautifulSoup

def inspect():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    for track in ['df', 'DF', 'digitalfabrication', 'DigitalFabrication']:
        t_url = f"https://swuid2025.com/projects?track={track}"
        try:
            req = urllib.request.Request(t_url, headers=headers)
            html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')
            p_links = [a.get('href') for a in soup.find_all('a') if '/project/' in a.get('href', '')]
            unique_p = list(dict.fromkeys(p_links))
            print(f"Track '{track}': {len(unique_p)} projects -> {unique_p[:5]} ... (total {len(unique_p)})")
        except Exception as e:
            print(f"Track '{track}' error: {e}")

if __name__ == '__main__':
    inspect()
