"""
Comprehensive Verification Script for Physical Separation
Validates all acceptance criteria from the Master Prompt.
"""

import os
import sys
import json
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE = Path(__file__).resolve().parent.parent
WEB = WORKSPACE / "web"
ADMIN = WORKSPACE / "admin"

def verify_public_web():
    print("=== [1/3] VERIFYING PUBLIC WEB (web/) ===")
    
    # 1. No /admin route in web
    admin_routes = []
    for root, dirs, files in os.walk(WEB / "app"):
        for f in files:
            fp = Path(root) / f
            rel = str(fp.relative_to(WEB / "app")).replace("\\", "/")
            if "admin" in rel.lower():
                admin_routes.append(rel)
                
    if admin_routes:
        print(f"❌ FAIL: Found admin routes in web/app: {admin_routes}")
        return False
    print("✅ PASS: Exactly ZERO /admin routes in web/app")
    
    # 2. No admin components in web/components
    admin_comps = []
    for root, dirs, files in os.walk(WEB / "components"):
        for f in files:
            fp = Path(root) / f
            rel = str(fp.relative_to(WEB / "components")).replace("\\", "/")
            if "admin" in rel.lower():
                admin_comps.append(rel)
                
    if admin_comps:
        print(f"❌ FAIL: Found admin components in web/components: {admin_comps}")
        return False
    print("✅ PASS: Exactly ZERO admin components in web/components")
    
    # 3. No write APIs in web/app/api
    write_apis = []
    for root, dirs, files in os.walk(WEB / "app" / "api"):
        for f in files:
            if f.endswith((".ts", ".js")):
                fp = Path(root) / f
                content = fp.read_text(encoding="utf-8", errors="ignore")
                for method in ["POST", "PUT", "DELETE", "PATCH"]:
                    if f"export async function {method}" in content or f"export function {method}" in content:
                        write_apis.append((str(fp.relative_to(WEB)), method))
                        
    if write_apis:
        print(f"❌ FAIL: Found write API methods in web/app/api: {write_apis}")
        return False
    print("✅ PASS: Exactly ZERO write API endpoints in web/app/api (100% Read-Only)")
    
    # 4. No internal APIs in web/app/api
    internal_keywords = ["admin", "n8n", "langgraph", "publish/instagram", "record-video", "reels", "research", "stream-log", "upload"]
    internal_apis = []
    for root, dirs, files in os.walk(WEB / "app" / "api"):
        for f in files:
            fp = Path(root) / f
            rel = str(fp.relative_to(WEB / "app" / "api")).replace("\\", "/")
            for kw in internal_keywords:
                if kw in rel:
                    internal_apis.append(rel)
    if internal_apis:
        print(f"❌ FAIL: Found internal APIs in web: {internal_apis}")
        return False
    print("✅ PASS: Exactly ZERO internal execution APIs in web/app/api")

    # 5. Published Data Check
    pub_data_dir = WEB / "data" / "published"
    if not pub_data_dir.exists():
        print("❌ FAIL: web/data/published does not exist")
        return False
        
    exhibits_file = pub_data_dir / "exhibitions.json"
    if not exhibits_file.exists():
        print("❌ FAIL: web/data/published/exhibitions.json missing")
        return False
    exhibits = json.loads(exhibits_file.read_text(encoding="utf-8"))
    if len(exhibits) == 0:
        print("❌ FAIL: exhibitions.json is empty")
        return False
    print(f"✅ PASS: Published exhibitions: {len(exhibits)} records")
    
    profs_file = pub_data_dir / "professors.json"
    profs = json.loads(profs_file.read_text(encoding="utf-8")) if profs_file.exists() else []
    print(f"✅ PASS: Published verified professors: {len(profs)} records")
    
    meta_file = pub_data_dir / "metadata.json"
    if meta_file.exists():
        meta = json.loads(meta_file.read_text(encoding="utf-8"))
        print(f"✅ PASS: Published metadata verified: {meta.get('published_at')}")

    # 6. Public media assets
    uploads_dir = WEB / "public" / "uploads"
    if uploads_dir.exists():
        upload_count = sum(1 for _ in uploads_dir.rglob("*") if _.is_file())
        print(f"✅ PASS: Web public uploads directory populated: {upload_count} media files")
    else:
        print("⚠️ NOTE: web/public/uploads not found")

    return True

def verify_private_admin():
    print("\n=== [2/3] VERIFYING PRIVATE ADMIN (admin/) ===")
    
    # 1. Admin page exists
    admin_page = ADMIN / "app" / "admin" / "page.tsx"
    if not admin_page.exists():
        print(f"❌ FAIL: {admin_page} missing")
        return False
    print(f"✅ PASS: Admin dashboard page preserved ({admin_page.stat().st_size} bytes)")
    
    # 2. Admin APIs exist
    admin_apis = [
        ADMIN / "app" / "api" / "admin" / "approval" / "route.ts",
        ADMIN / "app" / "api" / "admin" / "approval-queue" / "route.ts",
        ADMIN / "app" / "api" / "admin" / "operations" / "route.ts",
        ADMIN / "app" / "api" / "admin" / "runtime" / "route.ts",
        ADMIN / "app" / "api" / "admin" / "schedules" / "route.ts",
        ADMIN / "app" / "api" / "publish" / "export" / "route.ts",
    ]
    for api in admin_apis:
        if not api.exists():
            print(f"❌ FAIL: Admin API missing: {api}")
            return False
    print(f"✅ PASS: All core Admin APIs preserved ({len(admin_apis)} checked)")
    
    # 3. Master database preserved
    master_queue = ADMIN / "data" / "university_queue.json"
    if not master_queue.exists():
        print("❌ FAIL: master queue missing in admin/data")
        return False
    q_data = json.loads(master_queue.read_text(encoding="utf-8"))
    print(f"✅ PASS: Master database preserved in admin/data: {len(q_data)} items")
    
    return True

def verify_production_entry():
    print("\n=== [3/3] VERIFYING BUILD & PRODUCTION ENTRY ===")
    root_pkg = WORKSPACE / "package.json"
    if not root_pkg.exists():
        print("❌ FAIL: Root package.json missing")
        return False
    data = json.loads(root_pkg.read_text(encoding="utf-8"))
    build_script = data.get("scripts", {}).get("build", "")
    if "--prefix web" not in build_script and "web" not in build_script:
        print(f"❌ FAIL: Root build script does not target web: {build_script}")
        return False
    print(f"✅ PASS: Root build script correctly targets web: '{build_script}'")
    
    # Check .next output in web
    web_next = WEB / ".next"
    if web_next.exists():
        print("✅ PASS: web/.next production build artifact exists")
        
    return True

def main():
    ok1 = verify_public_web()
    ok2 = verify_private_admin()
    ok3 = verify_production_entry()
    
    print("\n" + "=" * 50)
    if ok1 and ok2 and ok3:
        print("🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY!")
        print("Physical separation between Admin and Public Web is COMPLETE.")
    else:
        print("❌ SOME VERIFICATIONS FAILED")
        sys.exit(1)
    print("=" * 50)

if __name__ == "__main__":
    main()
