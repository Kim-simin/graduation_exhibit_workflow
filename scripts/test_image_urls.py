import urllib.request
import ssl

def test_image_urls():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    test_urls = [
        ("banner.png", "https://res.cloudinary.com/dnlzsjt9c/image/upload/w_1920,c_limit,q_auto,f_auto/swuid2025/project/1/banner.png"),
        ("thumbnail", "https://res.cloudinary.com/dnlzsjt9c/image/upload/w_1200,h_1200,c_fill,q_auto,f_auto/swuid2025/project/1/thumbnail"),
        ("detail 1", "https://res.cloudinary.com/dnlzsjt9c/image/upload/c_limit,w_1920,q_auto,f_auto/swuid2025/project/1/detail/1")
    ]

    for name, u in test_urls:
        try:
            req = urllib.request.Request(u, headers=headers)
            with urllib.request.urlopen(req, context=ctx) as resp:
                data = resp.read()
                print(f"{name}: SUCCESS ({len(data)} bytes, Content-Type: {resp.headers.get('Content-Type')})")
        except Exception as e:
            print(f"{name}: FAILED ({e})")

if __name__ == '__main__':
    test_image_urls()
