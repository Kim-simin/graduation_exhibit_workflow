import os
import json

def verify_swu_id():
    upload_dir = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
    files = os.listdir(upload_dir)
    print(f"Files in {upload_dir} ({len(files)} files):")
    for f in sorted(files):
        fp = os.path.join(upload_dir, f)
        print(f"  {f}: {os.path.getsize(fp)} bytes")

    q_path = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json"
    with open(q_path, 'r', encoding='utf-8') as f:
        queue = json.load(f)
    
    swu = next((x for x in queue if x.get('id') == 'UNIV-2025-서울여자대학교-산업디자인학과'), None)
    if swu:
        print("\n=== Verified SWU Record ===")
        print("ID:", swu.get('id'))
        print("Univ:", swu.get('university'))
        print("Dept:", swu.get('department'))
        print("Title:", swu.get('title'))
        print("Poster:", swu.get('poster_image'))
        print("Artworks Count:", len(swu.get('artworks', [])))
        print("\nSample Artwork [0]:")
        print(json.dumps(swu.get('artworks', [])[0], ensure_ascii=False, indent=2))
        
        # Verify MANDATORY RULE: department field in every artwork
        all_have_dept = all(a.get('department') == 'INDUSTRIAL DESIGN과' for a in swu.get('artworks', []))
        print("All artworks have department 'INDUSTRIAL DESIGN과':", all_have_dept)
    else:
        print("SWU record not found!")

if __name__ == '__main__':
    verify_swu_id()
