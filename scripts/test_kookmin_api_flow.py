import os
import sys
import json
import requests

def test_kookmin_flow():
    print("[1] Testing /api/cards/analyze-link for https://expo.cs.kookmin.ac.kr/ ...")
    api_url = "http://127.0.0.1:3000/api/cards/analyze-link"
    payload = {
        "url": "https://expo.cs.kookmin.ac.kr/",
        "year": "2026",
        "server_url": "http://127.0.0.1:8080"
    }

    try:
        res = requests.post(api_url, json=payload, timeout=30)
        print(f"    Status Code: {res.status_code}")
        if res.status_code != 200:
            print(f"    Failed response: {res.text}")
            return False
        
        data = res.json()
        if data.get("status") != "SUCCESS":
            print(f"    API returned non-success: {data}")
            return False

        card_data = data.get("data", {})
        univ = card_data.get("university")
        dept = card_data.get("department")
        cat = card_data.get("category")
        poster = card_data.get("posterPreview")
        artworks = card_data.get("artworks", [])

        print(f"    University: {univ}")
        print(f"    Department: {dept}")
        print(f"    Category: {cat}")
        print(f"    Poster: {poster}")
        print(f"    Artworks Count: {len(artworks)}")

        assert univ == "국민대학교", f"Expected 국민대학교, got {univ}"
        assert dept == "소프트웨어융합대학", f"Expected 소프트웨어융합대학, got {dept}"
        assert len(artworks) >= 50, f"Expected >= 50 artworks, got {len(artworks)}"
        assert "poster-2026" in poster or "poster" in poster, f"Expected poster image, got {poster}"

        # Sample first 3 artworks
        print("\n[2] Sample Student Artworks:")
        for w in artworks[:5]:
            print(f"    [{w['id']}] {w['title']} | 작가: {w['author']} | 역할: {w['role']}")
            print(f"         미리보기: {w['image']}")
            print(f"         상세URL: {w['detail_url']}")

        # 3. Test Professor Linking with these student works
        print("\n[3] Testing Professor Linking with extracted student artworks...")
        from scripts.link_department_professors import link_and_upsert_professors
        prof_res = link_and_upsert_professors(
            university=univ,
            department=dept,
            target_url="https://expo.cs.kookmin.ac.kr/",
            student_works=artworks
        )
        print(f"    Professor Linking Status: {prof_res.get('status')}")
        print(f"    Registered Professors Count: {prof_res.get('total_professors')}")
        for p in prof_res.get("registered_professors", []):
            print(f"      - {p['name']} ({p['title']}, {p['major']})")

        # 4. Verify in DB
        prof_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "professors.json"))
        with open(prof_db_path, "r", encoding="utf-8") as pf:
            db_profs = json.load(pf)
        kmu_profs = [p for p in db_profs if p.get("university") == "국민대학교"]
        print(f"\n[4] Confirmed {len(kmu_profs)} Kookmin University faculty members in professors.json")
        for kp in kmu_profs:
            subs = kp.get("student_submissions", [])
            print(f"    {kp['name']} 교수: {len(subs)}개 학생 작품 연계")

        print("\n[ALL TESTS PASSED SUCCESSFULLY!]")
        return True

    except Exception as e:
        print(f"[ERROR] Exception during test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_kookmin_flow()
    sys.exit(0 if success else 1)
