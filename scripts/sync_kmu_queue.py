"""
scripts/sync_kmu_queue.py
data/university_queue.json의 국민대학교 카드를 my-exhibit-platform/data/university_queue.json에도 동기화
"""
import json
import os

root_q = "data/university_queue.json"
platform_q = "my-exhibit-platform/data/university_queue.json"

with open(root_q, "r", encoding="utf-8") as f:
    root_data = json.load(f)

kmu_card = next((c for c in root_data if c.get("university") == "국민대학교"), None)
if not kmu_card:
    print("[ERROR] KMU card not found in root queue")
    exit(1)

with open(platform_q, "r", encoding="utf-8") as f:
    plat_data = json.load(f)

# 기존 국민대 카드 제거 후 맨 앞 삽입
plat_data = [c for c in plat_data if not (c.get("university") == "국민대학교" and "소프트웨어" in c.get("department", ""))]
plat_data.insert(0, kmu_card)

with open(platform_q, "w", encoding="utf-8") as f:
    json.dump(plat_data, f, ensure_ascii=False, indent=2)

print("[SUCCESS] KMU card successfully synchronized to my-exhibit-platform/data/university_queue.json")
