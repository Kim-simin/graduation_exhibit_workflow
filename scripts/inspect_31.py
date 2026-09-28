import urllib.request
from bs4 import BeautifulSoup

def inspect_31():
    url = "https://swuid2025.com/project/31"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    
    # print text nodes
    for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'span']):
        text = tag.get_text(strip=True)
        if len(text) > 3 and "SWU" not in text and "Copyright" not in text:
            print(f"[{tag.name}] {text}")

if __name__ == '__main__':
    inspect_31()
