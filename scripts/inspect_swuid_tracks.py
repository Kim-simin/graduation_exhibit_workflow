import urllib.request
import ssl
from bs4 import BeautifulSoup

def inspect_tracks():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    url = "https://swuid2025.com/projects"
    req = urllib.request.Request(url, headers=headers)
    html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    links = soup.find_all('a')
    print("=== Links on /projects ===")
    for a in links:
        href = a.get('href', '')
        text = a.get_text(strip=True)
        if 'track=' in href or 'project' in href:
            print(f"[{text}] -> {href}")

    # Check track queries
    track_queries = ['ux', 'digital', 'fabrication', 'digital-fabrication', 'digital_fabrication', 'bx', 'all']
    for t in track_queries:
        t_url = f"https://swuid2025.com/projects?track={t}"
        try:
            t_req = urllib.request.Request(t_url, headers=headers)
            t_html = urllib.request.urlopen(t_req, context=ctx).read().decode('utf-8')
            t_soup = BeautifulSoup(t_html, 'html.parser')
            p_links = [a.get('href') for a in t_soup.find_all('a') if '/project/' in a.get('href', '')]
            unique_p = list(dict.fromkeys(p_links))
            print(f"Track '{t}': {len(unique_p)} projects -> {unique_p}")
        except Exception as e:
            print(f"Track '{t}' error: {e}")

if __name__ == '__main__':
    inspect_tracks()
