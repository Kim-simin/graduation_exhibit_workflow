"""
scripts/test_category_mapper.py
Verification test for category mapping logic across all 10 standard categories.
"""
import sys
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from category_mapper import get_standard_category, STANDARD_CATEGORIES

test_cases = [
    # 1. IT·소프트웨어·컴공
    ("컴퓨터공학과", "IT·소프트웨어·컴공"),
    ("인공지능학과", "IT·소프트웨어·컴공"),
    ("소프트웨어학부", "IT·소프트웨어·컴공"),
    ("데이터사이언스학과", "IT·소프트웨어·컴공"),
    ("정보보안학과", "IT·소프트웨어·컴공"),
    ("웹개발과", "IT·소프트웨어·컴공"),

    # 2. 기계·전자·일반공학
    ("기계공학과", "기계·전자·일반공학"),
    ("전자전기공학부", "기계·전자·일반공학"),
    ("로봇공학과", "기계·전자·일반공학"),
    ("신소재공학과", "기계·전자·일반공학"),
    ("화학공학과", "기계·전자·일반공학"),

    # 3. 영상·웹툰·애니
    ("웹툰애니메이션학과", "영상·웹툰·애니"),
    ("만화창작과", "영상·웹툰·애니"),
    ("방송영상과", "영상·웹툰·애니"),
    ("미디어콘텐츠학과", "영상·웹툰·애니"),

    # 4. 디자인·UX/UI
    ("시각디자인과", "디자인·UX/UI"),
    ("산업디자인학과", "디자인·UX/UI"),
    ("서비스디자인과", "디자인·UX/UI"),
    ("인터랙션디자인학과", "디자인·UX/UI"),

    # 5. 미술·공예·조형
    ("회화과", "미술·공예·조형"),
    ("서양화과", "미술·공예·조형"),
    ("도자공예과", "미술·공예·조형"),
    ("금속조형디자인과", "미술·공예·조형"),

    # 6. 건축·공간·조경
    ("건축학과", "건축·공간·조경"),
    ("실내건축디자인과", "건축·공간·조경"),
    ("도시조경학과", "건축·공간·조경"),

    # 7. 패션·텍스타일
    ("패션디자인학과", "패션·텍스타일"),
    ("의류학과", "패션·텍스타일"),
    ("섬유패션디자인과", "패션·텍스타일"),

    # 8. 게임·메타버스
    ("게임학과", "게임·메타버스"),
    ("VR학과", "게임·메타버스"),
    ("메타버스학부", "게임·메타버스"),
    ("캐릭터디자인과", "게임·메타버스"),

    # 9. 기획·경영·마케팅
    ("경영학과", "기획·경영·마케팅"),
    ("광고홍보학과", "기획·경영·마케팅"),
    ("마케팅기획과", "기획·경영·마케팅"),
]

def run_tests():
    print(f"[*] 총 {len(STANDARD_CATEGORIES)}개 표준 카테고리 등록 확인:")
    for cat in STANDARD_CATEGORIES:
        print(f"    {cat['icon']} {cat['name']} (ID: {cat['id']})")

    print("\n[*] 학과명 자동 매핑 정밀 테스트 시작:")
    failed = 0
    for dept, expected in test_cases:
        actual = get_standard_category(dept)
        if actual == expected:
            print(f"  [PASS] '{dept}' -> '{actual}'")
        else:
            print(f"  [FAIL] '{dept}' -> Actual: '{actual}', Expected: '{expected}'")
            failed += 1

    assert failed == 0, f"{failed}개의 테스트 케이스가 실패했습니다."
    print("\n[SUCCESS] 모든 학과명 표준 카테고리 매핑 테스트를 완벽히 통과했습니다!")

if __name__ == "__main__":
    run_tests()
