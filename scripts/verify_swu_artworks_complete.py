import os
import json

def verify():
    path = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json"
    with open(path, 'r', encoding='utf-8') as f:
        queue = json.load(f)

    rec = next(item for item in queue if item.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과")
    artworks = rec['artworks']
    
    print(f"Total artworks in record: {len(artworks)}")
    
    dept_counts = {}
    missing_files = []
    invalid_fields = []

    for idx, art in enumerate(artworks, start=1):
        dept = art.get('department')
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
        
        # Check image existence
        rel_img = art.get('image', '')
        full_img_path = os.path.join("c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public", rel_img)
        if not os.path.exists(full_img_path) or os.path.getsize(full_img_path) == 0:
            missing_files.append((idx, rel_img))

        # Check required fields
        for field in ['title', 'student_name', 'department', 'image', 'thumbnail', 'description', 'inferred_role']:
            if not art.get(field):
                invalid_fields.append((idx, field))

    print("\n--- Department Breakdown ---")
    for d, c in sorted(dept_counts.items()):
        print(f"  {d}: {c} artworks")

    print(f"\nMissing image files: {len(missing_files)}")
    if missing_files:
        print("  Missing:", missing_files)

    print(f"Invalid/empty fields: {len(invalid_fields)}")
    if invalid_fields:
        print("  Invalid:", invalid_fields)

    assert len(artworks) == 46, "Expected 46 artworks"
    assert dept_counts.get('DIGITAL FABRICATION과') == 30, "Expected 30 DF artworks"
    assert dept_counts.get('UX DESIGN과') == 10, "Expected 10 UX artworks"
    assert dept_counts.get('BX DESIGN과') == 6, "Expected 6 BX artworks"
    assert len(missing_files) == 0, "No missing files allowed"
    assert len(invalid_fields) == 0, "No invalid fields allowed"

    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    verify()
