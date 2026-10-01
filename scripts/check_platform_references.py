"""
Check all references to 'my-exhibit-platform' across the repository
"""
import os
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent

def find_references():
    matches = []
    for root, dirs, files in os.walk(WORKSPACE):
        # ignore node_modules, .git, .next, __pycache__
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", ".next", "__pycache__", ".venv", "venv", ".cache")]
        for f in files:
            if f.endswith((".py", ".json", ".ts", ".tsx", ".js", ".mjs", ".md", ".sh", ".ps1")):
                fp = Path(root) / f
                try:
                    content = fp.read_text(encoding="utf-8", errors="ignore")
                    if "my-exhibit-platform" in content:
                        rel = str(fp.relative_to(WORKSPACE)).replace("\\", "/")
                        count = content.count("my-exhibit-platform")
                        matches.append((rel, count))
                except Exception:
                    pass
                    
    print(f"Total files referencing 'my-exhibit-platform': {len(matches)}")
    for rel, count in sorted(matches):
        print(f"  {rel} ({count} occurrences)")

if __name__ == "__main__":
    find_references()
