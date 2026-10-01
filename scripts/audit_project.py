"""
Comprehensive project audit script for Admin / Public Web physical separation.
Inspects:
1. Routes in my-exhibit-platform/app
2. API routes and endpoints
3. Components and usages
4. Env vars referenced in my-exhibit-platform
5. Secret keys in .env (keys only)
6. Data files and public usage
"""

import os
import re
import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
PLATFORM = WORKSPACE / "my-exhibit-platform"

def audit_routes():
    app_dir = PLATFORM / "app"
    routes = []
    for root, dirs, files in os.walk(app_dir):
        for f in files:
            if f in ("page.tsx", "page.jsx", "page.js", "route.ts", "route.js"):
                rel_path = Path(root).relative_to(PLATFORM)
                routes.append(str(rel_path / f).replace("\\", "/"))
    return sorted(routes)

def audit_env_usage():
    env_usages = {}
    pattern = re.compile(r"process\.env\.([A-Z0-9_]+)")
    for root, dirs, files in os.walk(PLATFORM):
        if "node_modules" in root or ".next" in root:
            continue
        for f in files:
            if f.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs", ".json")):
                fp = Path(root) / f
                try:
                    content = fp.read_text(encoding="utf-8", errors="ignore")
                    matches = pattern.findall(content)
                    if matches:
                        rel = str(fp.relative_to(PLATFORM)).replace("\\", "/")
                        env_usages[rel] = sorted(list(set(matches)))
                except Exception as e:
                    pass
    return env_usages

def audit_root_env():
    root_env = WORKSPACE / ".env"
    keys = []
    if root_env.exists():
        for line in root_env.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key = line.split("=", 1)[0].strip()
                keys.append(key)
    return keys

def audit_api_details():
    api_dir = PLATFORM / "app" / "api"
    api_routes = {}
    for root, dirs, files in os.walk(api_dir):
        for f in files:
            if f in ("route.ts", "route.js"):
                fp = Path(root) / f
                rel = str(Path(root).relative_to(api_dir)).replace("\\", "/")
                content = fp.read_text(encoding="utf-8", errors="ignore")
                methods = []
                for m in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                    if f"export async function {m}" in content or f"export function {m}" in content:
                        methods.append(m)
                api_routes[f"/api/{rel}"] = {
                    "methods": methods,
                    "file": str(fp.relative_to(PLATFORM)).replace("\\", "/"),
                    "length": len(content)
                }
    return api_routes

def audit_components():
    comp_dir = PLATFORM / "components"
    comps = {}
    for root, dirs, files in os.walk(comp_dir):
        for f in files:
            if f.endswith((".tsx", ".jsx", ".ts", ".js")):
                fp = Path(root) / f
                rel = str(fp.relative_to(comp_dir)).replace("\\", "/")
                comps[rel] = {
                    "file": str(fp.relative_to(PLATFORM)).replace("\\", "/")
                }
    return comps

def audit_data_files():
    data_dir = PLATFORM / "data"
    data_files = []
    if data_dir.exists():
        for root, dirs, files in os.walk(data_dir):
            for f in files:
                fp = Path(root) / f
                data_files.append(str(fp.relative_to(data_dir)).replace("\\", "/"))
    return sorted(data_files)

def main():
    report = {
        "routes": audit_routes(),
        "api_routes": audit_api_details(),
        "env_usages": audit_env_usage(),
        "root_env_keys": audit_root_env(),
        "components": audit_components(),
        "data_files": audit_data_files()
    }
    
    out_file = WORKSPACE / "audit_result.json"
    out_file.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Audit completed. Written to {out_file}")

if __name__ == "__main__":
    main()
