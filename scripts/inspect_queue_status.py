"""
Inspect approval status of university_queue.json
"""
import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
QUEUE_FILE = WORKSPACE / "my-exhibit-platform" / "data" / "university_queue.json"

def inspect_queue():
    if not QUEUE_FILE.exists():
        print("Queue file not found")
        return
        
    data = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    print(f"Total queue items: {len(data)}")
    
    statuses = {}
    with_poster = 0
    with_artworks = 0
    total_artworks = 0
    
    for item in data:
        st = item.get("status", "UNKNOWN")
        statuses[st] = statuses.get(st, 0) + 1
        poster = item.get("poster_image")
        if poster and not "unsplash" in poster:
            with_poster += 1
        arts = item.get("artworks", [])
        if arts:
            with_artworks += 1
            total_artworks += len(arts)
            
    print("\nStatus distribution:")
    for st, count in sorted(statuses.items()):
        print(f"  {st}: {count}")
        
    print(f"\nItems with real poster: {with_poster}")
    print(f"Items with artworks: {with_artworks} (total artworks: {total_artworks})")

if __name__ == "__main__":
    inspect_queue()
