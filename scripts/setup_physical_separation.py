"""
Script to safely set up physical separation into web/ and admin/
following the Master Prompt instructions.
Does NOT delete original files.
"""

import os
import shutil
import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
ORIGINAL = WORKSPACE / "my-exhibit-platform"
WEB_DIR = WORKSPACE / "web"
ADMIN_DIR = WORKSPACE / "admin"

def copy_or_link_file(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        return
    try:
        # Try hardlink first (fast, 0 disk space on same volume)
        os.link(src, dst)
    except Exception:
        shutil.copy2(src, dst)

def setup_admin_project():
    print("Setting up admin/ directory...")
    ADMIN_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Config files
    configs = [
        "package.json",
        "package-lock.json",
        "next.config.mjs",
        "tsconfig.json",
        "tailwind.config.ts",
        "postcss.config.mjs",
        "next-env.d.ts"
    ]
    for c in configs:
        src = ORIGINAL / c
        if src.exists():
            copy_or_link_file(src, ADMIN_DIR / c)
            
    # Update admin package.json name
    admin_pkg = ADMIN_DIR / "package.json"
    if admin_pkg.exists():
        data = json.loads(admin_pkg.read_text(encoding="utf-8"))
        data["name"] = "grad-exhibit-admin"
        admin_pkg.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    # 2. Copy entire app, components, lib, types, data, src, public to admin
    # (Since admin maintains all original internal functionalities)
    for folder in ["app", "components", "lib", "types", "data", "src"]:
        src_folder = ORIGINAL / folder
        dst_folder = ADMIN_DIR / folder
        if src_folder.exists():
            shutil.copytree(src_folder, dst_folder, dirs_exist_ok=True)
            
    # For public, copy assets or link
    src_pub = ORIGINAL / "public"
    dst_pub = ADMIN_DIR / "public"
    if src_pub.exists():
        for root, dirs, files in os.walk(src_pub):
            rel = Path(root).relative_to(src_pub)
            (dst_pub / rel).mkdir(parents=True, exist_ok=True)
            for f in files:
                copy_or_link_file(Path(root) / f, dst_pub / rel / f)

    print("admin/ directory populated successfully.")

if __name__ == "__main__":
    setup_admin_project()
