import urllib.request
import re
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

# Common Daejin department URLs:
# e.g. https://www.daejin.ac.kr/contents/vvd/cor/faculty.html or similar
# Let's search daejin site or search engine
urls_to_try = [
    "https://www.daejin.ac.kr/dju/index.do",
    "https://www.daejin.ac.kr/vvd/index.do",
    "https://vvd.daejin.ac.kr",
    "https://www.daejin.ac.kr/vvd/sub01_03.do",
    "https://www.daejin.ac.kr/dju/1118/subview.do",
    "https://www.daejin.ac.kr/dju/1119/subview.do",
    "https://www.daejin.ac.kr/dju/1120/subview.do"
]

for u in urls_to_try:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"URL {u}: status {resp.status}, len {len(resp.read())}")
    except Exception as e:
        print(f"URL {u}: failed ({e})")
