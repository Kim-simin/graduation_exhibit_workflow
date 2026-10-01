import urllib.request

def check_curriculum_page():
    url = "http://localhost:3000/curriculums"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode("utf-8")
            
        has_admin_text = "관리자 관제 시스템" in html
        print(f"[Verification] URL: {url}")
        print(f"[Verification] Contains '관리자 관제 시스템': {has_admin_text}")
        if not has_admin_text:
            print("[SUCCESS] '관리자 관제 시스템' is NOT visible in default HTML!")
        else:
            print("[WARNING] '관리자 관제 시스템' found in HTML")
            
    except Exception as e:
        print(f"[Error] Failed to fetch {url}: {e}")

if __name__ == "__main__":
    check_curriculum_page()
