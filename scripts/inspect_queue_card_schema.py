import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('data/university_queue.json', 'r', encoding='utf-8') as f:
    queue = json.load(f)

# Find KMU and Daejin
kmu = next(q for q in queue if '국민대학교' in q.get('university', ''))
daejin = next(q for q in queue if '대진대학교' in q.get('university', ''))

print("=== KMU Card Keys ===")
print(list(kmu.keys()))
print("KMU Category:", kmu.get('category'))
print("KMU Poster Image:", kmu.get('poster_image'))
print("KMU Artworks Count:", len(kmu.get('artworks', [])))
print("KMU Cooperations:", kmu.get('cooperation_companies'))

print("\n=== Daejin Card Keys ===")
print("Daejin ID:", daejin.get('id'))
print("Daejin Category:", daejin.get('category'))
print("Daejin Poster Image:", daejin.get('poster_image'))
print("Daejin Artworks Count:", len(daejin.get('artworks', [])))
print("Daejin Cooperations:", daejin.get('cooperation_companies'))
