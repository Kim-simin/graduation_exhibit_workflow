"""
Audit public pages data sources and API calls
"""
import os
import re
from pathlib import Path

PLATFORM = Path(__file__).resolve().parent.parent / "my-exhibit-platform"
PUBLIC_DIR = PLATFORM / "app" / "(public)"

def audit_public_pages():
    pages = []
    for root, dirs, files in os.walk(PUBLIC_DIR):
        for f in files:
            if f.startswith("page."):
                pages.append(Path(root) / f)
                
    for p in sorted(pages):
        rel = str(p.relative_to(PUBLIC_DIR)).replace("\\", "/")
        content = p.read_text(encoding="utf-8", errors="ignore")
        is_client = "'use client'" in content or '"use client"' in content
        
        # Check imports of data or json
        json_imports = re.findall(r'import .* from ["\'](.*\.json)["\']', content)
        # Check lib imports
        lib_imports = re.findall(r'import .* from ["\'](@/lib/.*)["\']', content)
        # Check fetch calls
        fetch_calls = re.findall(r'fetch\(["\']([^"\']+)["\']', content)
        # Check fs imports
        uses_fs = "fs" in content and ("from 'fs'" in content or 'from "fs"' in content or "require('fs')" in content)
        
        print(f"=== {rel} ===")
        print(f"  Client Component: {is_client}")
        print(f"  Uses FS: {uses_fs}")
        if json_imports:
            print(f"  JSON imports: {json_imports}")
        if lib_imports:
            print(f"  Lib imports: {lib_imports}")
        if fetch_calls:
            print(f"  Fetch calls: {fetch_calls}")
        print()

if __name__ == "__main__":
    audit_public_pages()
