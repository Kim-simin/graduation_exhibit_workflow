"""
scripts/category_mapper.py
전국 대학교 학과명 -> 10대 표준 학과명(카테고리) 자동 매핑 모듈
"""
import re

STANDARD_CATEGORIES = [
    {"id": "all", "name": "전체 분야", "icon": "🌐"},
    {"id": "it_sw", "name": "IT·소프트웨어·컴공", "icon": "💻"},
    {"id": "engineering", "name": "기계·전자·일반공학", "icon": "⚙️"},
    {"id": "design_ux", "name": "디자인·UX/UI", "icon": "🎨"},
    {"id": "media_toon", "name": "영상·웹툰·애니", "icon": "🎬"},
    {"id": "art_craft", "name": "미술·공예·조형", "icon": "🖼️"},
    {"id": "architecture", "name": "건축·공간·조경", "icon": "🏛️"},
    {"id": "fashion", "name": "패션·텍스타일", "icon": "👗"},
    {"id": "game_meta", "name": "게임·메타버스", "icon": "🎮"},
    {"id": "business", "name": "기획·경영·마케팅", "icon": "📊"},
]

def get_standard_category(dept_name: str) -> str:
    """
    파편화된 학과명을 10대 표준 카테고리 중 하나로 강제 매핑합니다.
    """
    if not dept_name:
        return "디자인·UX/UI"
    d = re.sub(r'\s+', '', dept_name.lower())

    # 1. IT·소프트웨어·컴공
    if re.search(r'컴퓨터|소프트웨어|sw|인공지능|ai|데이터|정보통신|보안|웹개발|프론트엔드|백엔드', d, re.I):
        return "IT·소프트웨어·컴공"
    # 2. 기계·전자·일반공학
    if re.search(r'기계|전자|전기|메카트로닉스|신소재|화학공학|로봇|산업공학|임베디드|반도체', d, re.I):
        return "기계·전자·일반공학"
    # 3. 영상·웹툰·애니 (신규 확장)
    if re.search(r'웹툰|애니|만화|영상|방송|미디어|모션그래픽|vfx|콘텐츠', d, re.I):
        return "영상·웹툰·애니"
    # 4. 디자인·UX/UI
    if re.search(r'시각|산업|제품|ux|ui|서비스|커뮤니케이션|브랜드|브랜딩|정보디자인|인터랙션', d, re.I):
        return "디자인·UX/UI"
    # 5. 미술·공예·조형 (통합)
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

    # 매핑되지 않은 경우 기본값
    return "디자인·UX/UI"
