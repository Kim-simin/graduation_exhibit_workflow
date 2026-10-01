"""
Check component usages across my-exhibit-platform
"""
import os
from pathlib import Path

PLATFORM = Path(__file__).resolve().parent.parent / "my-exhibit-platform"

def find_usages():
    components_dir = PLATFORM / "components"
    all_comps = []
    for root, dirs, files in os.walk(components_dir):
        for f in files:
            if f.endswith((".tsx", ".ts")):
                name = f.rsplit(".", 1)[0]
                all_comps.append((name, Path(root) / f))
                
    usages = {name: [] for name, _ in all_comps}
    
    for root, dirs, files in os.walk(PLATFORM):
        if "node_modules" in root or ".next" in root:
            continue
        for f in files:
            if f.endswith((".tsx", ".ts", ".jsx", ".js")):
                fp = Path(root) / f
                content = fp.read_text(encoding="utf-8", errors="ignore")
                rel = str(fp.relative_to(PLATFORM)).replace("\\", "/")
                
                for name, comp_path in all_comps:
                    comp_rel = str(comp_path.relative_to(PLATFORM)).replace("\\", "/")
                    if rel == comp_rel:
                        continue
                    if name in content:
                        usages[name].append(rel)

    for name in sorted(usages.keys()):
        print(f"[{name}]: {len(usages[name])} files")
        for u in usages[name]:
            print(f"    - {u}")

if __name__ == "__main__":
    find_usages()
