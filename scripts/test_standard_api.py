#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/test_standard_api.py
Test standard opportunities API endpoint.
"""

import json
import urllib.request

url = "http://localhost:3000/api/opportunities"
try:
    with urllib.request.urlopen(url, timeout=10) as resp:
        status = resp.getcode()
        body = resp.read().decode("utf-8")
        data = json.loads(body)
        print(f"HTTP Status: {status}")
        print("Total returned:", len(data.get("opportunities", [])))
        print("Counts:", data.get("counts"))
except Exception as e:
    print(f"API Request Failed: {e}")
