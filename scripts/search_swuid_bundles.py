import urllib.request
import re

def search_bundles():
    url = "https://swuid2025.com/"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    scripts = re.findall(r'src="(/_next/static/[^"]+)"', html)
    print("Scripts:", scripts)
    
    for s in scripts:
        js_url = f"https://swuid2025.com{s}"
        js_req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
        js = urllib.request.urlopen(js_req).read().decode('utf-8')
        # look for image extensions: .png, .jpg, .webp, .svg
        images = set(re.findall(r'["\'](/images/[^"\']+\.(?:png|jpg|jpeg|webp|svg))["\']', js))
        if images:
            print(f"Found in {s}:", images)
            
        cloudinary = set(re.findall(r'https://res\.cloudinary\.com/[^"\']+', js))
        if cloudinary:
            print(f"Cloudinary in {s}:", list(cloudinary)[:5])

if __name__ == '__main__':
    search_bundles()
