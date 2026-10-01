import urllib.request
import ssl
from bs4 import BeautifulSoup

def get_track_projects():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    tracks = [
        ("ux", "UX Design"),
        ("df", "Digital Fabrication"),
        ("bx", "BX Design")
    ]

    for track_val, track_label in tracks:
        url = f"https://swuid2025.com/projects?track={track_val}"
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        project_links = []
        for a in soup.find_all('a'):
            href = a.get('href', '')
            if '/project/' in href:
                text = a.get_text(strip=True)
                if (href, text) not in project_links:
                    project_links.append((href, text))
        
        print(f"\n=============================")
        print(f"Track: {track_label} (?track={track_val}) -> {len(project_links)} projects")
        print(f"=============================")
        for href, text in project_links:
            print(f"  {href} : {text}")

if __name__ == '__main__':
    get_track_projects()
