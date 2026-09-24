import json

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    q1 = json.load(f)
with open("my-exhibit-platform/data/university_queue.json", "r", encoding="utf-8") as f:
    q2 = json.load(f)

print(f"data/university_queue.json count: {len(q1)}")
print(f"my-exhibit-platform/data/university_queue.json count: {len(q2)}")

ids1 = set(x.get("id") for x in q1)
ids2 = set(x.get("id") for x in q2)
print("In q1 but not q2:", len(ids1 - ids2))
print("In q2 but not q1:", len(ids2 - ids1))
print("KMU in q1:", any("국민대학교" in x.get("university", "") for x in q1))
print("KMU in q2:", any("국민대학교" in x.get("university", "") for x in q2))
