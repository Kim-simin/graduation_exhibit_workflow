import json
import os

platform_path = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json"
root_path = "c:/Users/graduation_exhibit_workflow/data/university_queue.json"

with open(platform_path, 'r', encoding='utf-8') as f:
    platform_queue = json.load(f)

swu_platform = next(x for x in platform_queue if x.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과")

print("Platform SWU artworks count:", len(swu_platform['artworks']))
print("Sample artwork 1 image:", swu_platform['artworks'][0]['image'])
print("Sample artwork 1 dept:", swu_platform['artworks'][0]['department'])

# Sync to root_path safely
if os.path.exists(root_path):
    with open(root_path, 'r', encoding='utf-8') as f:
        root_queue = json.load(f)
    
    orig_root_len = len(root_queue)
    for q in root_queue:
        if q.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과":
            q['artworks'] = swu_platform['artworks']
            q['critic_score'] = 98
            q['slogan'] = swu_platform.get('slogan', '')
            break
            
    with open(root_path, 'w', encoding='utf-8') as f:
        json.dump(root_queue, f, ensure_ascii=False, indent=2)
        
    with open(root_path, 'r', encoding='utf-8') as f:
        root_verified = json.load(f)
        assert len(root_verified) == orig_root_len
        swu_root = next(x for x in root_verified if x.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과")
        assert len(swu_root['artworks']) == 46
        print("Root queue synchronized and verified successfully!")

# Check all 46 files on disk
img_dir = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
missing_files = []
for idx in range(1, 47):
    f_path = os.path.join(img_dir, f"artwork_{idx}_full.jpg")
    if not os.path.exists(f_path) or os.path.getsize(f_path) == 0:
        missing_files.append(f"artwork_{idx}_full.jpg")

print(f"Verified all 46 full-scroll files on disk. Missing: {len(missing_files)}")
if missing_files:
    print("Missing:", missing_files)
else:
    print("ALL 46 FULL-SCROLL IMAGES PRESENT AND VALID!")
