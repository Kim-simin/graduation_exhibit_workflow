"""
Compare root data/ and my-exhibit-platform/data/
"""
import os
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
ROOT_DATA = WORKSPACE / "data"
WEB_DATA = WORKSPACE / "my-exhibit-platform" / "data"

def compare():
    print(f"ROOT DATA exists: {ROOT_DATA.exists()}")
    print(f"WEB DATA exists: {WEB_DATA.exists()}")
    
    root_files = set(os.listdir(ROOT_DATA)) if ROOT_DATA.exists() else set()
    web_files = set(os.listdir(WEB_DATA)) if WEB_DATA.exists() else set()
    
    common = sorted(list(root_files & web_files))
    only_root = sorted(list(root_files - web_files))
    only_web = sorted(list(web_files - root_files))
    
    print("\nCommon files:")
    for f in common:
        rf = ROOT_DATA / f
        wf = WEB_DATA / f
        if rf.is_file() and wf.is_file():
            same_size = rf.stat().st_size == wf.stat().st_size
            print(f"  {f}: size root={rf.stat().st_size}, web={wf.stat().st_size}, same={same_size}")
        else:
            print(f"  {f}: dir or other")
            
    print("\nOnly in ROOT data:")
    for f in only_root:
        print(f"  {f}")
        
    print("\nOnly in WEB data:")
    for f in only_web:
        print(f"  {f}")

if __name__ == "__main__":
    compare()
