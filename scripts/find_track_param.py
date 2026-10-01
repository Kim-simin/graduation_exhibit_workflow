import urllib.request
import ssl
import re

def search_track_param():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    url = "https://swuid2025.com/projects"
    html = urllib.request.urlopen(urllib.request.Request(url, headers=headers), context=ctx).read().decode('utf-8')
    scripts = re.findall(r'src="(/_next/static/[^"]+)"', html)
    
    for s in scripts:
        js_url = f"https://swuid2025.com{s}"
        js = urllib.request.urlopen(urllib.request.Request(js_url, headers=headers), context=ctx).read().decode('utf-8')
        if 'Digital Fabrication' in js or 'fabrication' in js.lower() or 'track=' in js:
            print(f"Match in {s}!")
            matches = re.findall(r'track=[a-zA-Z0-9_-]+', js)
            print("track param matches:", set(matches))
            # find surrounding text
            for idx in [m.start() for m in re.finditer(r'Digital Fabrication', js)]:
                print("Context:", js[max(0, idx-100):min(len(js), idx+100)])

if __name__ == '__main__':
    search_track_param()
