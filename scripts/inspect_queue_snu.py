import json

with open('data/university_queue.json', 'r', encoding='utf-8') as f:
    queue = json.load(f)

print("Root queue count:", len(queue))
for q in queue[:5]:
    print(q.get('id'), "|", q.get('university'), "|", q.get('department'), "|", q.get('year'))

with open('my-exhibit-platform/data/university_queue.json', 'r', encoding='utf-8') as f:
    p_queue = json.load(f)

print("Platform queue count:", len(p_queue))
snu_in_queue = [q for q in p_queue if '서울대' in q.get('university', '')]
print("SNU in platform queue:", len(snu_in_queue))
for s in snu_in_queue:
    print(s.get('id'), "|", s.get('department'), "|", s.get('year'), "| status:", s.get('status'))
