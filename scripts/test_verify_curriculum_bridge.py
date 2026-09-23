"""
scripts/test_verify_curriculum_bridge.py
Automated verification for the separation of concerns between:
1. Exhibition card queue (poster & graduation artworks only)
2. Department Curriculum & Professor archive (faculty, research tracks, lab, and linked submissions)
"""

import sys
import json
import urllib.request
import urllib.parse

def test_professors_api():
    url = "http://localhost:3000/api/professors?univ=" + urllib.parse.quote("인천대학교")
    print(f"[TEST 1] Querying Professors API: {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "TestClient/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        assert data.get("status") == "SUCCESS", f"Expected SUCCESS, got {data.get('status')}"
        professors = data.get("professors", [])
        assert len(professors) >= 2, f"Expected at least 2 professors, got {len(professors)}"
        
        prof_names = [p["name"] for p in professors]
        print(f"  -> Discovered professors: {prof_names}")
        assert "홍원기" in prof_names, "홍원기 교수 should be registered"
        assert "성미영" in prof_names, "성미영 교수 should be registered"

        for p in professors:
            if p["name"] in ["홍원기", "성미영"]:
                assert p.get("is_verified") is True, f"{p['name']} must be verified"
                assert p.get("verification_status") == "VERIFIED", f"{p['name']} verification_status must be VERIFIED"
                submissions = p.get("student_submissions", [])
                assert len(submissions) > 0, f"{p['name']} should have linked student submissions"
                print(f"  -> {p['name']} 교수: {p['major']}, 연구실: {p['lab_name']}, 연계 학생 제출물: {len(submissions)}건")
    print("  [PASS] Professors API verification passed!\n")

def test_exhibitions_api():
    url = "http://localhost:3000/api/exhibitions"
    print(f"[TEST 2] Querying Exhibitions API: {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "TestClient/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        exhibitions = data.get("exhibitions", [])
        inu_exhibit = next((e for e in exhibitions if "인천대" in e.get("university", "") and "컴퓨터" in e.get("department", "")), None)
        assert inu_exhibit is not None, "Incheon National University exhibition should exist"
        print(f"  -> Incheon exhibit ID: {inu_exhibit['id']}")
        print(f"  -> Poster Path: {inu_exhibit.get('posterPath')}")
        print(f"  -> Artworks Count: {len(inu_exhibit.get('artworks', []))}")
        assert len(inu_exhibit.get("artworks", [])) > 0, "Exhibition must have student artworks"
        assert inu_exhibit.get("posterPath"), "Exhibition must have posterPath"
    print("  [PASS] Exhibitions API verification passed!\n")

def test_separation_of_concerns():
    print("[TEST 3] Checking Separation of Concerns in university_queue.json ...")
    with open("data/university_queue.json", "r", encoding="utf-8") as f:
        queue = json.load(f)
    inu_card = next((c for c in queue if "인천대" in c.get("university", "") and "컴퓨터" in c.get("department", "")), None)
    assert inu_card is not None, "Incheon card must exist in university_queue.json"
    
    # Exhibition card should ONLY hold exhibition assets (artworks, poster_image, curation_summary)
    # It must NOT store faculty directories or professor objects directly
    assert "professors" not in inu_card, "Exhibition card should NOT have 'professors' array"
    assert "faculty" not in inu_card, "Exhibition card should NOT have 'faculty' field"
    assert "artworks" in inu_card, "Exhibition card MUST have 'artworks'"
    assert "poster_image" in inu_card, "Exhibition card MUST have 'poster_image'"
    print(f"  -> Queue card ID: {inu_card['id']}")
    print(f"  -> Poster Image: {inu_card.get('poster_image')}")
    print(f"  -> Artworks: {len(inu_card.get('artworks', []))} items (clean separation maintained)")
    print("  [PASS] Separation of concerns verified!\n")

def main():
    print("==================================================")
    print("  Curriculum Bridge & Separation of Concerns Test")
    print("==================================================\n")
    test_professors_api()
    test_exhibitions_api()
    test_separation_of_concerns()
    print("All verification tests passed successfully!")

if __name__ == "__main__":
    main()
