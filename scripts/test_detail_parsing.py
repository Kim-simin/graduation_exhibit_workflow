import urllib.request
import ssl
import json
from bs4 import BeautifulSoup

def test_project_page():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    for pid in [1, 35, 41]:
        url = f"https://swuid2025.com/project/{pid}"
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        h1 = soup.find('h1')
        title = h1.get_text(strip=True) if h1 else ""

        # Let's see all text in body or main
        # Find designer container
        designer_heading = soup.find(lambda tag: tag.name in ['h2', 'h3', 'h4', 'span', 'p'] and 'Designer' in tag.get_text())
        designer_text = ""
        if designer_heading:
            parent = designer_heading.parent
            designer_text = parent.get_text(separator=" // ", strip=True)

        paragraphs = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)]
        
        print(f"PID {pid}:")
        print("  Title:", title)
        print("  Designer text:", designer_text)
        print("  P count:", len(paragraphs))
        for i, p in enumerate(paragraphs):
            print(f"    P{i}: {p[:100]}")

if __name__ == '__main__':
    test_project_page()
