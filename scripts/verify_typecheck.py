#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
scripts/verify_typecheck.py
TypeScript 타입스크립트 유효성 검증 스크립트
"""

import subprocess
import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PLATFORM_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform"))

print(f"Running TypeScript check in {PLATFORM_DIR}...")
res = subprocess.run(["npx.cmd", "tsc", "--noEmit"], cwd=PLATFORM_DIR, capture_output=True, text=True)

if res.returncode == 0:
    print("[PASS] ✅ TypeScript typecheck passed successfully without errors!")
    sys.exit(0)
else:
    print(f"[FAIL] ❌ TypeScript errors found (code: {res.returncode}):")
    print(res.stdout)
    print(res.stderr)
    sys.exit(res.returncode)
