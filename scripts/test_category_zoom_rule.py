import json
import re
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

def get_standard_category(dept_or_cat):
    if not dept_or_cat:
        return "디자인·UX/UI"
    d = re.sub(r'\s+', '', str(dept_or_cat).lower())
    if re.search(r'컴퓨터|소프트웨어|컴공|sw|인공지능|ai|데이터|정보통신|보안|웹개발|프론트엔드|백엔드|it', d, re.I):
        return "IT·소프트웨어·컴공"
    if re.search(r'기계|전자|전기|메카트로닉스|신소재|화학공학|로봇|산업공학|임베디드|반도체|일반공학', d, re.I):
        return "기계·전자·일반공학"
    if re.search(r'웹툰|애니|만화|영상|방송|미디어|모션그래픽|vfx|콘텐츠', d, re.I):
        return "영상·웹툰·애니"
    if re.search(r'시각|산업|제품|ux|ui|서비스|커뮤니케이션|브랜드|브랜딩|정보디자인|인터랙션', d, re.I):
        return "디자인·UX/UI"
    return "기타"

def is_zoom_disabled(card):
    if card.get("disable_artwork_zoom") or card.get("disableArtworkZoom"):
        return True
    cat = get_standard_category(card.get("category", ""))
    dept_cat = get_standard_category(card.get("department", ""))
    return cat in ["IT·소프트웨어·컴공", "기계·전자·일반공학"] or dept_cat in ["IT·소프트웨어·컴공", "기계·전자·일반공학"]

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

print("=== Verification of Category-Based Artwork Zoom Disable Rule ===")
it_eng_cards = []
design_cards = []

for c in cards:
    cid = c.get("id")
    univ = c.get("university")
    dept = c.get("department")
    disabled = is_zoom_disabled(c)
    cat = get_standard_category(c.get("category", ""))

    if cat in ["IT·소프트웨어·컴공", "기계·전자·일반공학"]:
        it_eng_cards.append((cid, univ, dept, cat, disabled))
        assert disabled is True, f"ERROR: {cid} in {cat} should have zoom disabled!"
    elif cat == "디자인·UX/UI":
        design_cards.append((cid, univ, dept, cat, disabled))
        assert disabled is False, f"ERROR: {cid} in {cat} should have zoom ENABLED!"

print(f"\n[OK] Checked {len(it_eng_cards)} IT/Engineering exhibitions -> ALL ZOOM DISABLED:")
for it in it_eng_cards:
    print(f"  - [{it[3]}] {it[1]} {it[2]} (id: {it[0]}) -> zoom disabled: {it[4]}")

print(f"\n[OK] Checked {len(design_cards)} Design exhibitions -> ALL ZOOM ENABLED:")
for d in design_cards[:5]:
    print(f"  - [{d[3]}] {d[1]} {d[2]} (id: {d[0]}) -> zoom disabled: {d[4]}")
print(f"  ... and {len(design_cards) - 5} more design cards verified.")

print("\n=== ALL TEST ASSERTIONS PASSED! ===")
