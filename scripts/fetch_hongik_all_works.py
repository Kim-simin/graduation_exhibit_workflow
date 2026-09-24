import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def check_wp_api():
    base_url = "https://hongiksidi.com/gs/2025-admin/wp-json/"
    req = urllib.request.Request(base_url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("WP API namespaces:", data.get("namespaces", []))
            print("WP API routes count:", len(data.get("routes", {})))
            routes = list(data.get("routes", {}).keys())
            for r in routes:
                if "work" in r or "project" in r or "class" in r:
                    print("  Route:", r)
    except Exception as e:
        print("WP API error:", e)

if __name__ == "__main__":
    check_wp_api()
