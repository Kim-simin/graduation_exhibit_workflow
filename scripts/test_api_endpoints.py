"""
scripts/test_api_endpoints.py
Tests the Next.js API endpoints /api/jobs and /api/jobs/departments locally.
"""

import urllib.request
import json

def test_endpoints():
    base_url = "http://localhost:3000"

    print("1. Testing /api/jobs/departments ...")
    try:
        req = urllib.request.Request(f"{base_url}/api/jobs/departments")
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
            print(f"Status: {res.status}, Success: {data.get('success')}, Total Depts: {data.get('total')}")
            if data.get("departments"):
                sample = data["departments"][0]
                print(f"Sample dept: {sample.get('displayName')} ({sample.get('university')})")
    except Exception as e:
        print(f"Failed to fetch /api/jobs/departments: {e}")

    print("\n2. Testing /api/jobs (all) ...")
    try:
        req = urllib.request.Request(f"{base_url}/api/jobs")
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
            print(f"Status: {res.status}, Success: {data.get('success')}, Source: {data.get('source')}, Total: {data.get('total')}")
            for j in data.get("jobs", []):
                print(f"- [{j.get('verificationStatus')}] {j.get('companyName')} - {j.get('title')} ({j.get('majorPreferenceStatus')})")
                print(f"  Source URL: {j.get('sourceUrl')}")
                print(f"  SHA256: {j.get('contentHash')}")
    except Exception as e:
        print(f"Failed to fetch /api/jobs: {e}")

    print("\n3. Testing /api/jobs with non-matching filter (Empty State Verification) ...")
    try:
        req = urllib.request.Request(f"{base_url}/api/jobs?keyword=nonexistentqueryxyz999")
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
            print(f"Status: {res.status}, Success: {data.get('success')}, Total: {data.get('total')}, Jobs count: {len(data.get('jobs', []))}")
            assert data.get('total') == 0
            assert len(data.get('jobs', [])) == 0
            print("Empty state verification: SUCCESS (Zero mock fallback, returns empty list [])")
    except Exception as e:
        print(f"Failed to verify empty state: {e}")

if __name__ == "__main__":
    test_endpoints()
