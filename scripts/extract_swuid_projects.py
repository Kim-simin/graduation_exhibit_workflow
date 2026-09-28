import urllib.request
import urllib.parse
import json
import re
from bs4 import BeautifulSoup

def extract_projects():
    base_url = "https://swuid2025.com"
    
    for pid in range(31, 41):
        url = f"{base_url}/project/{pid}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            html = urllib.request.urlopen(req).read().decode('utf-8')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            continue

        soup = BeautifulSoup(html, 'html.parser')
        
        # Check __NEXT_DATA__
        next_data_script = soup.find('script', id='__NEXT_DATA__')
        project_data = {}
        if next_data_script and next_data_script.string:
            try:
                data = json.loads(next_data_script.string)
                page_props = data.get('props', {}).get('pageProps', {})
                project_data = page_props
            except Exception as e:
                print("JSON parse error:", e)
        
        # Get cloudinary banner / detail images
        imgs = []
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if 'cloudinary.com' in src:
                match = re.search(r'url=([^&]+)', src)
                if match:
                    clean_src = urllib.parse.unquote(match.group(1))
                    if clean_src not in imgs:
                        imgs.append(clean_src)
                else:
                    if src not in imgs:
                        imgs.append(src)

        print(f"\n--- Project {pid} ---")
        if isinstance(project_data, dict):
            print("Project data:", json.dumps(project_data, ensure_ascii=False)[:300])
        print("Images found:", len(imgs))
        if imgs:
            print("Banner:", imgs[0])
            if len(imgs) > 1:
                print("Detail 1:", imgs[1])

if __name__ == '__main__':
    extract_projects()
