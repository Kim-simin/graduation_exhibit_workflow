import json
import os
import re
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT_QUEUE_PATH = os.path.abspath("data/university_queue.json")
PLATFORM_QUEUE_PATH = os.path.abspath("my-exhibit-platform/data/university_queue.json")

def get_standard_category(dept_or_cat):
    if not dept_or_cat:
        return "디자인·UX/UI"
    d = re.sub(r'\s+', '', str(dept_or_cat).lower())
    # 1. IT·소프트웨어·컴공
    if re.search(r'컴퓨터|소프트웨어|컴공|sw|인공지능|ai|데이터|정보통신|보안|웹개발|프론트엔드|백엔드|it', d, re.I):
        return "IT·소프트웨어·컴공"
    # 2. 기계·전자·일반공학
    if re.search(r'기계|전자|전기|메카트로닉스|신소재|화학공학|로봇|산업공학|임베디드|반도체|일반공학', d, re.I):
        return "기계·전자·일반공학"
    # 3. 영상·웹툰·애니
    if re.search(r'웹툰|애니|만화|영상|방송|미디어|모션그래픽|vfx|콘텐츠', d, re.I):
        return "영상·웹툰·애니"
    # 4. 디자인·UX/UI
    if re.search(r'시각|산업|제품|ux|ui|서비스|커뮤니케이션|브랜드|브랜딩|정보디자인|인터랙션', d, re.I):
        return "디자인·UX/UI"
    # 5. 미술·공예·조형
    if re.search(r'미술|회화|서양화|동양화|한국화|조소|현대미술|파인아트|조형|공예|도자|금속|목조형|유리', d, re.I):
        return "미술·공예·조형"
    # 6. 건축·공간·조경
    if re.search(r'건축|실내|공간|인테리어|환경|도시|조경', d, re.I):
        return "건축·공간·조경"
    # 7. 패션·텍스타일
    if re.search(r'패션|의류|텍스타일|의상|섬유', d, re.I):
        return "패션·텍스타일"
    # 8. 게임·메타버스
    if re.search(r'게임|캐릭터|메타버스|vr|ar', d, re.I):
        return "게임·메타버스"
    # 9. 기획·경영·마케팅
    if re.search(r'경영|경제|광고|홍보|마케팅|비즈니스|기획|무역|관광', d, re.I):
        return "기획·경영·마케팅"
    return "디자인·UX/UI"

def is_zoom_disabled(card):
    # Check manual flag
    if card.get("disable_artwork_zoom") or card.get("disableArtworkZoom"):
        return True
    cat = get_standard_category(card.get("category", ""))
    dept_cat = get_standard_category(card.get("department", ""))
    if cat in ["IT·소프트웨어·컴공", "기계·전자·일반공학"] or dept_cat in ["IT·소프트웨어·컴공", "기계·전자·일반공학"]:
        return True
    if card.get("id") == "UNIV-2026-인천대학교-컴퓨터공학부-7899":
        return True
    title = card.get("title") or card.get("exhibition_title") or ""
    if "인천대학교 2026년 컴퓨터공학부 졸업전시회" in title:
        return True
    return False

def process_file(filepath):
    print(f"\nProcessing {filepath}...")
    if not os.path.exists(filepath):
        print(f"[ERROR] {filepath} does not exist!")
        return False
    with open(filepath, "r", encoding="utf-8") as f:
        queue = json.load(f)

    disabled_count = 0
    enabled_count = 0

    for card in queue:
        should_disable = is_zoom_disabled(card)
        if should_disable:
            card["disable_artwork_zoom"] = True
            disabled_count += 1
            cid = card.get("id")
            univ = card.get("university")
            dept = card.get("department")
            cat = get_standard_category(card.get("category", ""))
            print(f"  [ZOOM DISABLED] {cid} | {univ} | {dept} | {cat}")
        else:
            if "disable_artwork_zoom" in card:
                card["disable_artwork_zoom"] = False
            enabled_count += 1

    print(f"Summary for {os.path.basename(filepath)}: {disabled_count} disabled, {enabled_count} enabled (total: {len(queue)})")

    # Atomic write
    temp_path = filepath + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
    os.replace(temp_path, filepath)
    print(f"[OK] Successfully saved {filepath}")
    return True

def main():
    ok1 = process_file(ROOT_QUEUE_PATH)
    ok2 = process_file(PLATFORM_QUEUE_PATH)
    if ok1 and ok2:
        print("\n=== All queue databases successfully synchronized with category zoom settings! ===")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
