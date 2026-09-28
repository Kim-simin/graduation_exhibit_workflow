import json

def inspect_swu_records():
    path = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json"
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for i, x in enumerate(data):
        if "서울여" in x.get('university', '') or "서울여자" in x.get('university', ''):
            print(f"Index: {i} | ID: {x.get('id')} | Univ: {x.get('university')} | Dept: {x.get('department')} | Status: {x.get('status')} | TargetURL: {x.get('target_url')}")

if __name__ == '__main__':
    inspect_swu_records()
