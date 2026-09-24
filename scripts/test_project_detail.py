import urllib.request

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, resp.read().decode('utf-8', errors='replace')
    except Exception as e:
        return None, str(e)

status, content = fetch("https://dju26-design.co.kr/project/KANGSIN4")
print("Status:", status)
if status == 200:
    print("Content len:", len(content))
    # look for title or description
    import re
    meta_desc = re.findall(r'<meta[^>]*content="([^"]+)"', content)
    print("Meta content:", meta_desc[:5])
