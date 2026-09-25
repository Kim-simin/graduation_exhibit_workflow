import json
import re
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

def get_standard_category(dept_or_cat):
    d = re.sub(r'\s+', '', str(dept_or_cat).lower())
    if re.search(r'컴퓨터|소프트웨어|sw|인공지능|ai|데이터|정보통신|보안|웹개발|프론트엔드|백엔드|it', d, re.I):
        return "IT·소프트웨어·컴공"
    if re.search(r'기계|전자|전기|메카트로닉스|신소재|화학공학|로봇|산업공학|임베디드|반도체|공학', d, re.I):
        return "기계·전자·일반공학"
    return "기타"

for path in ["data/university_queue.json", "my-exhibit-platform/data/university_queue.json"]:
    with open(path, "r", encoding="utf-8") as f:
        cards = json.load(f)
    print(f"=== {path} (total {len(cards)}) ===")
    matched = []
    for c in cards:
        cat = c.get("category", "")
        dept = c.get("department", "")
        mapped = get_standard_category(cat)
        if mapped == "기타":
            mapped = get_standard_category(dept)
        if mapped in ["IT·소프트웨어·컴공", "기계·전자·일반공학"]:
            matched.append((c.get("id"), c.get("university"), c.get("department"), c.get("category"), mapped))
    print(f"Matched count: {len(matched)}")
    for m in matched[:10]:
        print(f"  [{m[0]}] {m[1]} | {m[2]} | cat: {m[3]} -> {m[4]}")
