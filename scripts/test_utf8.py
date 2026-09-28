import json

def test_utf8():
    q_path = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json"
    with open(q_path, 'r', encoding='utf-8') as f:
        queue = json.load(f)
    swu = next((x for x in queue if x.get('id') == 'UNIV-2025-서울여자대학교-산업디자인학과'), None)
    if swu:
        with open("c:/Users/graduation_exhibit_workflow/scripts/swu_utf8_check.txt", "w", encoding="utf-8") as out:
            out.write("University: " + swu.get('university') + "\n")
            out.write("Department: " + swu.get('department') + "\n")
            out.write("Title: " + swu.get('title') + "\n")
            out.write("Slogan: " + swu.get('slogan') + "\n")
            for a in swu.get('artworks', []):
                out.write(f"- {a.get('title')} | {a.get('student_name')} | {a.get('department')}\n")
        print("Wrote swu_utf8_check.txt successfully")

if __name__ == '__main__':
    test_utf8()
