"""
Check for NEXT_PUBLIC_ usages across workspace
"""
import os
import re
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent

def check_next_public():
    pattern = re.compile(r"NEXT_PUBLIC_[A-Z0-9_]*")
    matches = {}
    for root, dirs, files in os.walk(WORKSPACE):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", ".next", "__pycache__", ".venv", "venv", ".cache")]
        for f in files:
            if f.endswith((".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".env")):
                fp = Path(root) / f
                try:
                    content = fp.read_text(encoding="utf-8", errors="ignore")
                    found = pattern.findall(content)
                    if found:
                        rel = str(fp.relative_to(WORKSPACE)).replace("\\", "/")
                        matches[rel] = sorted(list(set(found)))
                except Exception:
                    pass
                    
    print(f"Total files with NEXT_PUBLIC_: {len(matches)}")
    for rel, vars in sorted(matches.items()):
        print(f"  {rel}: {vars}")

if __name__ == "__main__":
    check_next_public()
