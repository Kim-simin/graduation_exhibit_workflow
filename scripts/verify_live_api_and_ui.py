#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/verify_live_api_and_ui.py
Next.js 로컬 서버 (http://localhost:3000) 의 API 및 데이터 파이프라인 검증
"""

import sys
import json
import urllib.request
import urllib.error

def main():
    url = "http://localhost:3000/api/opportunities?mode=student_discovery"
    print(f"Requesting: {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "PipelineValidator/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.getcode()
            body = response.read().decode("utf-8")
            data = json.loads(body)
            print(f"Response status: {status_code}")
            
            discovery = data.get("data", {})
            active_rnd = discovery.get("activeRnD", [])
            print(f"activeRnD count: {len(active_rnd)}")
            for item in active_rnd:
                print(f" - Found item: {item.get('id')} | {item.get('title')} | status: {item.get('status')} | dDayText: {item.get('dDayText')}")
                print(f"   eligibilityText: {item.get('recruitmentEvidence', {}).get('eligibilityText')}")
                print(f"   recruitmentText: {item.get('recruitmentEvidence', {}).get('recruitmentText')}")
                print(f"   sourceUrl: {item.get('sourceUrl')}")
            
            if len(active_rnd) >= 1:
                print("SUCCESS: Live API includes at least 1 verified student R&D opportunity!")
            else:
                print("FAILURE: activeRnD is empty!")
                sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
