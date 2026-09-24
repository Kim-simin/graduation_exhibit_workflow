import json

with open('data/university_queue.json', 'r', encoding='utf-8') as f:
    q = json.load(f)

for item in q[:3]:
    print("ID:", item.get('id'))
    print("Univ:", item.get('university'))
    print("Status:", item.get('status'))
    print("isResearched:", item.get('isResearched'))
    print("poster_image:", item.get('poster_image'))
    print("---")
