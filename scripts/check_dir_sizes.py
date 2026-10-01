"""
Measure size of my-exhibit-platform directories
"""
import os
from pathlib import Path

PLATFORM = Path(__file__).resolve().parent.parent / "my-exhibit-platform"

def get_dir_size(path):
    total = 0
    count = 0
    for root, dirs, files in os.walk(path):
        for f in files:
            fp = Path(root) / f
            try:
                total += fp.stat().st_size
                count += 1
            except Exception:
                pass
    return total, count

def main():
    print(f"Inspecting {PLATFORM}:")
    for item in os.listdir(PLATFORM):
        p = PLATFORM / item
        if p.is_dir():
            size, count = get_dir_size(p)
            mb = size / (1024 * 1024)
            print(f"  {item}/: {mb:.1f} MB ({count} files)")
        else:
            print(f"  {item}: {p.stat().st_size} bytes")

if __name__ == "__main__":
    main()
