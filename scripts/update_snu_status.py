import json

for path in ['data/university_queue.json', 'my-exhibit-platform/data/university_queue.json']:
    with open(path, 'r', encoding='utf-8') as f:
        queue = json.load(f)
    for q in queue:
        if q.get('id') == 'UNIV-2025-서울대학교-디자인과-snu-design':
            q['status'] = '리서치 완료'
            print(f"Updated status for SNU in {path}")
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
