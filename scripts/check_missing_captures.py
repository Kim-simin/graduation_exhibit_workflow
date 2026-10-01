import os

dir_path = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
existing = set()
for f in os.listdir(dir_path):
    if f.startswith("artwork_") and f.endswith("_full.jpg"):
        pid = int(f.replace("artwork_", "").replace("_full.jpg", ""))
        existing.add(pid)

missing = [p for p in range(1, 47) if p not in existing]
print(f"Existing ({len(existing)}): {sorted(list(existing))}")
print(f"Missing ({len(missing)}): {missing}")
