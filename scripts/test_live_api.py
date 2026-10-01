#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_live_api.py
Test live Next.js HTTP API endpoint.
"""

import sys
import json
import urllib.request

url = "http://localhost:3000/api/opportunities?mode=student_discovery"
try:
    with urllib.request.urlopen(url, timeout=10) as resp:
        status = resp.getcode()
        body = resp.read().decode("utf-8")
        data = json.loads(body)
        print(f"HTTP Status: {status}")
        print("Success:", data.get("success"))
        print("Meta:", data.get("meta"))
        d = data.get("data", {})
        print(f"activeRnD: {len(d.get('activeRnD', []))} items")
        print(f"availableResources: {len(d.get('availableResources', []))} items")
        print(f"recruitingProjects: {len(d.get('recruitingProjects', []))} items")
        for r in d.get("activeRnD", []):
            print(f"  - RnD: {r.get('id')} | {r.get('title')} ({r.get('providerName')}) | D-Day: {r.get('dDayText')}")
except Exception as e:
    print(f"API Request Failed: {e}")
