import urllib.request
import ssl
import json
from bs4 import BeautifulSoup

def inspect_projects():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    tracks = {
        'df': 'DIGITAL FABRICATION과',
        'ux': 'UX DESIGN과',
        'bx': 'BX DESIGN과'
    }

    results = {}

    for t, dept in tracks.items():
        url = f"https://swuid2025.com/projects?track={t}"
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        links = soup.find_all('a')
        project_cards = []
        for a in links:
            href = a.get('href', '')
            if '/project/' in href:
                card_text = a.get_text(separator=' | ', strip=True)
                img = a.find('img')
                img_src = img.get('src') if img else ''
                project_cards.append({
                    'href': href,
                    'text': card_text,
                    'img': img_src
                })
        
        # Deduplicate while preserving order
        seen = set()
        unique_cards = []
        for c in project_cards:
            if c['href'] not in seen:
                seen.add(c['href'])
                unique_cards.append(c)

        results[t] = {
            'department': dept,
            'count': len(unique_cards),
            'projects': unique_cards
        }

    with open('swu_tracks_overview.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("Saved swu_tracks_overview.json successfully!")
    for t, data in results.items():
        print(f"Track {t}: {data['count']} projects")

if __name__ == '__main__':
    inspect_projects()
