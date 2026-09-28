import json
import os

def check_queue():
    paths = [
        "c:/Users/graduation_exhibit_workflow/data/university_queue.json",
        "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json"
    ]
    for p in paths:
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"Path: {p} | Records count: {len(data)}")
            # check if Seoul Women's Univ already exists
            swu = [x for x in data if "서울여" in x.get('university', '') or "서울여자" in x.get('university', '')]
            print(f"Existing SWU records: {len(swu)}")

if __name__ == '__main__':
    check_queue()
