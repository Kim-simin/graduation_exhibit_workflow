import urllib.request

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

# Sanity URL with resize
url = "https://cdn.sanity.io/images/upy9gq1a/production/574a5b6722ab3c173ccf8cfa250ad9e2681051bd-1527x1628.png?w=600&auto=format"
req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
with urllib.request.urlopen(req) as resp:
    data = resp.read()
    print(f"Status: {resp.status}, size with ?w=600: {len(data)} bytes")
