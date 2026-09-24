import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('data/university_queue.json', 'r', encoding='utf-8') as f:
    queue = json.load(f)

kmu = next(q for q in queue if '국민대학교' in q.get('university', ''))
print("=== KMU Artwork 0 ===")
print(json.dumps(kmu['artworks'][0], ensure_ascii=False, indent=2))

with open('my-exhibit-platform/data/university_queue.json', 'r', encoding='utf-8') as f:
    p_queue = json.load(f)
daejin = next(q for q in p_queue if '대진대학교' in q.get('university', ''))
print("\n=== Daejin Artwork 0 ===")
print(json.dumps(daejin['artworks'][0], ensure_ascii=False, indent=2))
