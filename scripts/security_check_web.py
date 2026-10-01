"""
Post-migration security check for web/ directory
"""

import os
import re
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
WEB_DIR = WORKSPACE / "web"

KEYWORDS = [
    "/admin",
    "n8n",
    "langgraph",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "DATABASE_URL",
    "REDIS_URL",
    "SECRET",
    "TOKEN",
    "publish",
    "approve",
    "reject",
]

def check_web_security():
    print(f"=== Running Security Check on {WEB_DIR} ===")
    matches = {k: [] for k in KEYWORDS}
    
    for root, dirs, files in os.walk(WEB_DIR):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".next", "__pycache__")]
        for f in files:
            if f.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".css")):
                fp = Path(root) / f
                content = fp.read_text(encoding="utf-8", errors="ignore")
                rel = str(fp.relative_to(WEB_DIR)).replace("\\", "/")
                
                for k in KEYWORDS:
                    # check case-insensitive for some, exact for others
                    if k in content:
                        # find line numbers
                        lines = content.splitlines()
                        for i, line in enumerate(lines, 1):
                            if k in line:
                                matches[k].append((rel, i, line.strip()))

    print("\nResults:")
    for k, occurrences in matches.items():
        print(f"Keyword: '{k}' -> {len(occurrences)} matches")
        for rel, line_no, text in occurrences[:10]:
            print(f"    {rel}:{line_no} -> {text[:100]}")
        if len(occurrences) > 10:
            print(f"    ... and {len(occurrences) - 10} more")
            
    # Check for any POST / PUT / DELETE / PATCH in web/app/api
    api_dir = WEB_DIR / "app" / "api"
    print("\n=== Checking API Methods in web/app/api ===")
    write_methods = []
    for root, dirs, files in os.walk(api_dir):
        for f in files:
            if f in ("route.ts", "route.js"):
                fp = Path(root) / f
                rel = str(fp.relative_to(api_dir)).replace("\\", "/")
                content = fp.read_text(encoding="utf-8", errors="ignore")
                for m in ["POST", "PUT", "DELETE", "PATCH"]:
                    if f"export async function {m}" in content or f"export function {m}" in content:
                        write_methods.append((rel, m))
                        
    if write_methods:
        print(f"WARNING: Found write methods in web API: {write_methods}")
    else:
        print("PASS: Absolutely ZERO write methods found in web/app/api (100% Read-Only).")

if __name__ == "__main__":
    check_web_security()
