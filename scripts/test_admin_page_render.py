import sys
import requests

def test_admin():
    url = "http://localhost:3000/admin"
    print(f"Fetching {url}...")
    try:
        res = requests.get(url, timeout=15)
        print(f"Status Code: {res.status_code}")
        if res.status_code != 200:
            print("Failed to load /admin page")
            return False
        
        content = res.text
        checks = [
            "admin-url-input",
            "졸업전시회 링크(URL) 삽입",
            "AI 정보만 채우기",
            "AI 자동 인식",
            "리서치 대상 파라미터 구성",
            "대상 대학교",
            "대상 학과",
            "대상 연도",
            "8대 표준 산업군"
        ]
        
        all_passed = True
        for c in checks:
            if c in content:
                print(f"  [PASS] Found: '{c}'")
            else:
                print(f"  [FAIL] Missing: '{c}'")
                all_passed = False
                
        return all_passed
    except Exception as e:
        print(f"Error fetching admin page: {e}")
        return False

if __name__ == "__main__":
    passed = test_admin()
    sys.exit(0 if passed else 1)
