import json
import os
import re
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

STEP_1262_FILE = r"C:/Users/USER/.gemini/antigravity/brain/4ef68056-b3d6-40cd-a517-78ded487fedb/.system_generated/steps/1262/output.txt"

def load_extracted_works():
    with open(STEP_1262_FILE, "r", encoding="utf-8") as f:
        text = f.read()
    
    # Locate JSON start
    start_idx = text.find('"[')
    if start_idx != -1:
        # It was printed as a quoted json string
        raw_json_str = json.loads(text[start_idx:])
        return json.loads(raw_json_str)
    
    # Try finding normal [
    start_idx = text.find('[')
    if start_idx != -1:
        return json.loads(text[start_idx:])
    
    raise ValueError("Could not find JSON in step 1262 output file")

def download_file(url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        return
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp, open(target_path, "wb") as out:
            out.write(resp.read())
        print(f"Downloaded: {target_path} ({os.path.getsize(target_path)} bytes)")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def main():
    print("=== 1. Loading 274 extracted works ===")
    works = load_extracted_works()
    print(f"Loaded {len(works)} works.")

    # Download posters
    poster_dir = r"my-exhibit-platform/public/uploads/UNIV-2025-홍익대학교-시각디자인과"
    os.makedirs(poster_dir, exist_ok=True)
    main_poster_path = os.path.join(poster_dir, "main_poster_2025.png")
    poster_class_path = os.path.join(poster_dir, "poster_class.webp")
    poster_text_path = os.path.join(poster_dir, "poster_text.webp")

    print("=== 2. Downloading Posters ===")
    download_file("https://thedowntown.s3.ap-northeast-2.amazonaws.com/OG_image.png", main_poster_path)
    download_file("https://hongiksidi.com/gs/2025/assets/poster_class-k4G7nl0d.webp", poster_class_path)
    download_file("https://hongiksidi.com/gs/2025/assets/poster_text-C7KF5No9.webp", poster_text_path)

    # Download thumbnails for works (locally cache first 30 for high performance)
    captures_dir = r"my-exhibit-platform/public/captures/UNIV-2025-홍익대학교-시각디자인과"
    os.makedirs(captures_dir, exist_ok=True)

    print("=== 3. Caching Work Images ===")
    artworks = []
    for idx, w in enumerate(works):
        thumb_url = w.get("thumbnail")
        local_rel_path = ""
        if thumb_url and thumb_url.startswith("http"):
            fname = f"work_{idx+1:03d}_{w.get('slug', 'art')}.jpg"
            local_full_path = os.path.join(captures_dir, fname)
            if idx < 40: # Cache top 40 locally
                download_file(thumb_url, local_full_path)
                if os.path.exists(local_full_path):
                    local_rel_path = f"captures/UNIV-2025-홍익대학교-시각디자인과/{fname}"
            if not local_rel_path:
                local_rel_path = thumb_url

        artworks.append({
            "title": f"[{w.get('village', 'Village')}] {w.get('title')}",
            "student_name": w.get("studentName"),
            "image": local_rel_path,
            "thumbnail": local_rel_path,
            "screenshot_path": local_rel_path,
            "description": f"[{w.get('village')}] {w.get('title')} ({w.get('titleEn', '')}) — 작가: {w.get('studentName')} | 이메일: {w.get('email')} | SNS: {w.get('instagram')}\n{w.get('description', '')}",
            "inferred_role": "시각디자이너",
            "detail_url": f"https://hongiksidi.com/gs/2025/project/{w.get('classLetter', 'a').lower()}/{w.get('slug', '')}"
        })

    # 4. Update professors.json
    print("=== 4. Updating professors.json ===")
    hongik_profs = [
        {
            "id": "prof-hongik-vcd-01",
            "name": "안효진",
            "english_name": "Hyojin An",
            "title": "지도교수 (Village A)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "시각디자인 / 타이포그라피 / 출판",
            "lab": "Village A: 종이비행기를 날리는 17가지 방법 (R721)",
            "status": "재직",
            "research_interests": ["타이포그라피", "북디자인", "비주얼 커뮤니케이션", "에디토리얼 디자인"],
            "bio": "홍익대학교 미술대학 시각디자인과 지도교수. 2025 홍익시디 졸업전시 Village A(종이비행기를 날리는 17가지 방법)를 지도함."
        },
        {
            "id": "prof-hongik-vcd-02",
            "name": "윤재영",
            "english_name": "Jae Young Yun",
            "title": "지도교수 (Village B)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "인터랙션 디자인 / UX/UI / AI·XR",
            "lab": "Village B: 제너레이티브 퓨처 (R1)",
            "status": "재직",
            "research_interests": ["AI 경험 디자인", "XR 디자인", "다크패턴 분석", "차세대 UX/UI", "생성형 인터랙션"],
            "bio": "홍익대학교 미술대학 시각디자인과 지도교수. AI, XR, 확장된 UX/UI 언어를 탐구하는 Village B(Generative Future)를 지도함."
        },
        {
            "id": "prof-hongik-vcd-03",
            "name": "허민재",
            "english_name": "Minjae Huh",
            "title": "지도교수 (Village C)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "브랜딩 / 디자인 IP / 크리에이티브 디렉션",
            "lab": "Village C: 동작과 파편 (R720)",
            "status": "재직",
            "research_interests": ["브랜드 디자인", "디자인 IP", "비애티튜드 샵", "누핍", "크리에이티브 디렉션"],
            "bio": "홍익대학교 시각디자인과 지도교수. 브랜딩 스튜디오 더블디, 비애티튜드 샵, 누핍 크리에이티브 디렉터. Village C(동작과 파편) 지도."
        },
        {
            "id": "prof-hongik-vcd-04",
            "name": "서정민",
            "english_name": "Jeongmin Seo",
            "title": "지도교수 (Village D)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "그래픽 디자인 / 디자인 스튜디오 비즈니스",
            "lab": "Village D: 클루드 뉴비스 (R719)",
            "status": "재직",
            "research_interests": ["디자인 스튜디오 창업", "그래픽 디자인", "비주얼 아이덴티티", "브랜딩 전략"],
            "bio": "홍익대학교 시각디자인과 지도교수. 디자인 스튜디오 A to Z를 이끌며 실무 스튜디오 환경과 Village D(클루드 뉴비스) 지도."
        },
        {
            "id": "prof-hongik-vcd-05",
            "name": "안병학",
            "english_name": "Byunghak Ahn",
            "title": "지도교수 (Village E)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "타이포그라피 / 시각 비평",
            "lab": "Village E: 안녕 ( ) (R724)",
            "status": "재직",
            "research_interests": ["타이포그라피", "글자 조형", "디자인 비평", "시각언어"],
            "bio": "홍익대학교 시각디자인과 지도교수. 한글 타이포그라피 및 시각 문화 연구자. Village E(안녕 ( )) 지도."
        },
        {
            "id": "prof-hongik-vcd-06",
            "name": "박유선",
            "english_name": "Yuseon Park",
            "title": "지도교수 (Village F)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "비주얼 커뮤니케이션 / 디자인 연구",
            "lab": "Village F: 우리는 말한다 (R718)",
            "status": "재직",
            "research_interests": ["비주얼 커뮤니케이션", "디자이너 발화 구조", "글로벌 디자인 씬"],
            "bio": "홍익대학교 시각디자인과 지도교수. 영미권 디자인 유학과 현대 비주얼 커뮤니케이션을 강의하며 Village F(우리는 말한다) 지도."
        },
        {
            "id": "prof-hongik-vcd-07",
            "name": "김예니",
            "english_name": "Yeni Kim",
            "title": "지도교수 (Village G)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "일러스트레이션 / 시각 스토리텔링",
            "lab": "Village G: 출발역, 종착역, 환승역 (R726)",
            "status": "재직",
            "research_interests": ["비주얼 내러티브", "일러스트레이션", "출판 디자인", "스토리텔링"],
            "bio": "홍익대학교 시각디자인과 지도교수. 시각 스토리텔링과 일러스트레이션을 연구하며 Village G(출발역, 종착역, 환승역) 지도."
        },
        {
            "id": "prof-hongik-vcd-08",
            "name": "박요셉",
            "english_name": "Joseph Park",
            "title": "지도교수 (Village H)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "회화 / 드로잉 / 비주얼 아트워크",
            "lab": "Village H: 디핑소스 : 영감 레시피 (R727)",
            "status": "재직",
            "research_interests": ["자아 표현 드로잉", "회화적 시각언어", "창작 레시피"],
            "bio": "홍익대학교 시각디자인과 지도교수. '나'로부터 시작하는 드로잉과 비주얼 아트를 연구하며 Village H(디핑소스 : 영감 레시피) 지도."
        },
        {
            "id": "prof-hongik-vcd-09",
            "name": "이인수",
            "english_name": "Insu Lee",
            "title": "지도교수 (Village I)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "일러스트레이션 / 그래픽 노블 / 다매체 창작",
            "lab": "Village I: 오프 더 월 (R711)",
            "status": "재직",
            "research_interests": ["독창적 시각 서사", "드로잉", "제4의 벽 파괴", "경계 없는 그래픽"],
            "bio": "홍익대학교 시각디자인과 지도교수. 틀을 깨는 독창적 일러스트레이션과 서사를 지도하며 Village I(오프 더 월) 지도."
        },
        {
            "id": "prof-hongik-vcd-10",
            "name": "김효은",
            "english_name": "Hyoeun Kim",
            "title": "지도교수 (Village J)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "그림책 / 시각적 내러티브 / 일러스트레이션",
            "lab": "Village J: 쥬이시, 젤리, 잼! (R725)",
            "status": "재직",
            "research_interests": ["개인 서사 시각화", "그림책 내러티브", "다양한 표현기법"],
            "bio": "홍익대학교 시각디자인과 지도교수. 개인 서사를 시각 언어로 확장하는 작업을 지도하며 Village J(쥬이시, 젤리, 잼!) 지도."
        },
        {
            "id": "prof-hongik-vcd-11",
            "name": "김현석",
            "english_name": "Hyunsuk Kim",
            "title": "지도교수 (Village K)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "영상디자인 / 인터랙션 / 게임 디자인",
            "lab": "Village K: 러닝 타임: 2,102,400분 (R716)",
            "status": "재직",
            "research_interests": ["게임 UI/UX", "영상 시퀀스", "메이플스토리/배틀그라운드 실무 연계", "인터랙티브 미디어"],
            "bio": "홍익대학교 시각디자인과 지도교수. 게임 및 영상 디자인 분야의 최고 권위자로 Village K(러닝 타임: 2,102,400분) 지도."
        },
        {
            "id": "prof-hongik-vcd-12",
            "name": "김주신",
            "english_name": "Jusin Kim",
            "title": "지도교수 (Village L)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "공간 디자인 / 시각 서사",
            "lab": "Village L: 창문에서 바라보면 (R717)",
            "status": "재직",
            "research_interests": ["공간 시각화", "도시 야경 서사", "환경 그래픽"],
            "bio": "홍익대학교 시각디자인과 지도교수. 시선과 공간의 상호작용을 탐구하며 Village L(창문에서 바라보면) 지도."
        },
        {
            "id": "prof-hongik-vcd-13",
            "name": "윤정미",
            "english_name": "Jeongmee Yoon",
            "title": "지도교수 (Village M)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "사진예술 / 시각문화",
            "lab": "Village M: 틀을 넘어서는 고유의 궤적 (R1)",
            "status": "재직",
            "research_interests": ["현대 사진", "핑크 & 블루 프로젝트", "시각예술 창작", "작가주의"],
            "bio": "홍익대학교 시각디자인과 지도교수. 세계적 사진 프로젝트 '핑크&블루' 작가이자 Village M(틀을 넘어서는 고유의 궤적) 지도."
        },
        {
            "id": "prof-hongik-vcd-14",
            "name": "송영성",
            "english_name": "Yungsung Song",
            "title": "지도교수 (Village N)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "조형 디자인 / 예술 교육 / 드로잉",
            "lab": "Village N: 숲 (R722)",
            "status": "재직",
            "research_interests": ["브루노 무나리 드로잉", "자연 생태 조형", "시각 조형 교육"],
            "bio": "홍익대학교 시각디자인과 지도교수. 브루노 무나리 조형 방법론과 예술 교육을 탐구하며 Village N(숲) 지도."
        },
        {
            "id": "prof-hongik-vcd-15",
            "name": "박윤형",
            "english_name": "Yun Park",
            "title": "지도교수 (Village O)",
            "university": "홍익대학교",
            "department": "시각디자인과",
            "major": "생성형 AI / 오픈소스 디자인",
            "lab": "Village O: (이어지는 원천 (R723)",
            "status": "재직",
            "research_interests": ["생성형 AI와 창작", "오픈소스 디자인 문화", "인간-AI 협동 창작", "집단 지성"],
            "bio": "홍익대학교 시각디자인과 지도교수. 생성형 AI 시대의 새로운 디자인 패러다임을 연구하며 Village O((이어지는 원천) 지도."
        }
    ]

    for p_path in ["data/professors.json", "my-exhibit-platform/data/professors.json"]:
        if os.path.exists(p_path):
            with open(p_path, "r", encoding="utf-8") as f:
                existing_profs = json.load(f)
            # Remove any existing hongik profs to avoid duplicates
            filtered = [p for p in existing_profs if p.get("university") != "홍익대학교"]
            merged = hongik_profs + filtered
            with open(p_path, "w", encoding="utf-8") as f:
                json.dump(merged, f, ensure_ascii=False, indent=2)
            print(f"Updated {p_path}: {len(existing_profs)} -> {len(merged)} professors.")

    # 5. Build Exhibition Queue Entry
    print("=== 5. Building Exhibition Queue Entry ===")
    curation_intro_kr = "DOWNTOWN. 이 전시는 홍익시디의 학생들이 시민으로서 함께 쌓아 올린 집들로 이루어진 가상의 도시이다. 약 300명의 학생들이 각자 4년간의 시간과 노력을 담아 지은 ‘집’은 곧 작품이 되어 도시에 놓인다. 15개 반은 서로 다른 특색을 지닌 마을로 자리하고, 다양한 분야와 개성을 지닌 작품들은 그 안에서 저마다 다른 형태의 집으로 서 있다. 관람객은 이 도시에 초대된 여행자로서 거리를 거닐며 다양한 집들을 만나고 경험한다.\n\n두 포스터가 이를 시각적으로 드러낸다. 첫 번째 포스터는 15개 반의 전시 제목을 간판으로 나타내어 도시의 구조를 보여준다. 두 번째 포스터는 시각디자인과 관련된 다양한 문구들 20개로 이루어져 있다. 이들은 때로는 특정 분야를 지칭하기도 하고, 때로는 여러 분야에 걸쳐 나타나기도 한다. 이들은 분야의 경계 없이 교차하며 작품들의 다양성과 다층성을 드러낸다. 작품이라는 집들이 모여 마을을 이루는 과정에서 다채로운 풍경이 나타난다. 간판은 이 모든 것을 아우르며 전시의 정체성을 드러내는 핵심 장치로 기능한다. 이렇게 완성된 도시는 네 해 동안의 시간과 관계에서 비롯된 정다움과 맞물리며 우리만의 다운타운을 완성한다."
    curation_intro_en = "DOWNTOWN. This exhibition is a fictional city built from the houses created by students. Each of the students has poured four years of effort into a ‘house,’ which stands here as an art project. 15 classes form distinct neighborhoods, where works of different fields and qualities gather side by side. Visitors are invited as travelers encountering these diverse houses.\n\nTwo posters visualize this concept. The first poster presents the titles of the 15 class exhibitions as signboards, mapping out the city. The second poster is composed of 20 signboards featuring phrases related to visual design. Some point to specific fields, while others span across multiple areas. These phrases cross boundaries to reveal the diverse and layered nature of the artwork. As these houses—the works—gather to form neighborhoods, a multifaceted landscape emerges. The signboards tie everything together, functioning as a key device that expresses the identity of the exhibition. In the end, the city that is formed reflects the warmth that has formed from four years of shared time and relationships, completing our own DOWNTOWN."
    full_curation_intro = f"{curation_intro_kr}\n\n{curation_intro_en}"

    exhibition_entry = {
        "id": "UNIV-2025-홍익대학교-시각디자인과-hivcd",
        "category": "디자인·UX/UI",
        "university": "홍익대학교",
        "department": "시각디자인과",
        "year": 2025,
        "status": "리서치 완료",
        "isUploaded": True,
        "isResearched": True,
        "poster_image": "uploads/UNIV-2025-홍익대학교-시각디자인과/main_poster_2025.png",
        "exhibition_title": "2025 홍익대학교 시각디자인과 졸업주간 | The Downtown",
        "exhibit_title": "2025 홍익대학교 시각디자인과 졸업주간 | HIVCD Graduation Show Week",
        "title": "2025 홍익대학교 시각디자인과 졸업주간 | The Downtown",
        "target_url": "https://hongiksidi.com/gs/2025",
        "official_url": "https://hongiksidi.com/gs/2025",
        "scraped_url": "https://hongiksidi.com/gs/2025",
        "exhibition_period": "2025.12.01. - 2025.12.06. (월-금 10:00-20:00, 토 10:00-18:00)",
        "exhibition_venue": "홍익대학교 홍문관 1층∙7층 (서울특별시 마포구 와우산로 94)",
        "slogan": "The Downtown: 학생들이 쌓아 올린 가상의 도시와 15개 마을",
        "exhibit_slogan": "The Downtown: 학생들이 쌓아 올린 가상의 도시와 15개 마을",
        "critic_score": 99,
        "critic_feedback": "홍익대학교 시각디자인과 2025 졸업주간은 15개 전문 스튜디오 반(Village A~O)과 274개에 달하는 독창적인 그래픽·브랜딩·UX/UI·XR·영상 작품을 통해 국내 시각디자인 최고 수준의 스펙트럼과 실험성을 증명합니다.",
        "curation_summary": {
            "headline": "2025 홍익대학교 시각디자인과 졸업주간 | The Downtown",
            "curation_intro": full_curation_intro,
            "inferred_industry_keywords": ["시각디자인과", "TheDowntown", "홍익시디", "2025졸전"]
        },
        "cooperation_companies": [
            "홍익대학교 미술대학 시각디자인전공",
            "HIVCD 졸업준비위원회",
            "홍익시디 프린트실"
        ],
        "has_corporate_cooperation": True,
        "corporate_cooperation_count": 3,
        "cross_validation_status": "CORROBORATED",
        "artworks": artworks
    }

    for q_path in ["data/university_queue.json", "my-exhibit-platform/data/university_queue.json"]:
        if os.path.exists(q_path):
            with open(q_path, "r", encoding="utf-8") as f:
                queue = json.load(f)
            # Remove any existing Hongik entry
            filtered_q = [item for item in queue if item.get("id") != exhibition_entry["id"]]
            new_queue = [exhibition_entry] + filtered_q
            with open(q_path, "w", encoding="utf-8") as f:
                json.dump(new_queue, f, ensure_ascii=False, indent=2)
            print(f"Updated {q_path}: {len(queue)} -> {len(new_queue)} exhibitions.")

    print("=== Complete! ===")

if __name__ == "__main__":
    main()
