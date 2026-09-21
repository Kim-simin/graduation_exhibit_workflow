#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Generate high quality junior-only job postings seed data (data/jobs.json).
Ensures 12 job categories are thoroughly covered with preferredDepartments and partnership tags.
"""

import json
import os

JOBS_DATA = [
  {
    "id": "job-001",
    "companyName": "토스 (Toss)",
    "logoEmoji": "💙",
    "title": "2026 프로덕트 디자이너 (신입)",
    "jobCategory": "디자인",
    "careerLevel": "신입",
    "preferredDepartments": ["시각디자인학과", "산업정보디자인전공", "디자인조형학부", "미디어디자인학과"],
    "techStacks": ["Figma", "UX Research", "Prototyping", "Design System"],
    "employmentType": "정규직",
    "deadline": "2026-11-30",
    "originUrl": "https://toss.im/career/job-detail?job_id=4821",
    "isPartnership": False,
    "location": "서울 강남구"
  },
  {
    "id": "job-002",
    "companyName": "현대자동차",
    "logoEmoji": "🚗",
    "title": "자율주행 인포테인먼트(ccNC) UX 기획 및 인터랙션 디자인 (신입)",
    "jobCategory": "연구개발·설계",
    "careerLevel": "신입",
    "preferredDepartments": ["산업디자인학과", "시각디자인학과", "인지심리학과", "컴퓨터공학과"],
    "techStacks": ["Wireframing", "HMI", "데이터분석", "ProtoPie"],
    "employmentType": "정규직",
    "deadline": "상시채용",
    "originUrl": "https://talent.hyundai.com/apply/applyList.do",
    "isPartnership": True,
    "location": "서울 서초구 / 경기 남양"
  },
  {
    "id": "job-003",
    "companyName": "네이버 (NAVER)",
    "logoEmoji": "🟢",
    "title": "2026 하반기 FE 프론트엔드 플랫폼 개발자 (신입 공채)",
    "jobCategory": "IT·인터넷",
    "careerLevel": "신입",
    "preferredDepartments": ["컴퓨터공학과", "소프트웨어학부", "정보통신공학과", "인공지능학과"],
    "techStacks": ["React", "TypeScript", "Next.js", "Web Performance"],
    "employmentType": "정규직",
    "deadline": "2026-10-31",
    "originUrl": "https://recruit.navercorp.com/rcrt/view.do",
    "isPartnership": True,
    "location": "경기 성남시 분당구"
  },
  {
    "id": "job-004",
    "companyName": "네이버 (NAVER)",
    "logoEmoji": "🟢",
    "title": "네이버 플레이스/지도 서비스 인터랙션 디자이너 (신입)",
    "jobCategory": "디자인",
    "careerLevel": "신입",
    "preferredDepartments": ["시각디자인과", "시각디자인학과", "산업디자인학과", "디지털미디어학과"],
    "techStacks": ["Figma", "After Effects", "GUI", "Micro-interaction"],
    "employmentType": "정규직",
    "deadline": "2026-11-15",
    "originUrl": "https://recruit.navercorp.com/rcrt/view.do?annoId=3000541",
    "isPartnership": True,
    "location": "경기 성남시 분당구"
  },
  {
    "id": "job-005",
    "companyName": "LG전자",
    "logoEmoji": "🔴",
    "title": "스마트홈 가전 GUI 선행 디자인 연구원 (신입)",
    "jobCategory": "연구개발·설계",
    "careerLevel": "신입",
    "preferredDepartments": ["산업디자인학과", "공업디자인학과", "디자인조형학부", "스마트융합학과"],
    "techStacks": ["3D Modeling", "Blender", "Rhino", "Keyshot"],
    "employmentType": "정규직",
    "deadline": "상시채용",
    "originUrl": "https://careers.lg.com/app/job/RetrieveJobNoticesDetail.rpi",
    "isPartnership": True,
    "location": "서울 서초구 양재 R&D캠퍼스"
  },
  {
    "id": "job-006",
    "companyName": "카카오 (Kakao)",
    "logoEmoji": "🟡",
    "title": "카카오톡 선물하기 서비스 브랜드 마케팅 및 캠페인 기획 (신입)",
    "jobCategory": "마케팅·광고·홍보",
    "careerLevel": "신입",
    "preferredDepartments": ["광고홍보학과", "경영학과", "미디어커뮤니케이션학과", "신문방송학과"],
    "techStacks": ["Performance Marketing", "GA4", "콘텐츠기획", "카피라이팅"],
    "employmentType": "정규직",
    "deadline": "2026-11-20",
    "originUrl": "https://careers.kakao.com/jobs/P-13421",
    "isPartnership": False,
    "location": "경기 성남시 판교"
  },
  {
    "id": "job-007",
    "companyName": "쿠팡 (Coupang)",
    "logoEmoji": "🚀",
    "title": "글로벌 로켓배송 풀필먼트 SCM / 물류 프로세스 기획 (신입)",
    "jobCategory": "무역·유통",
    "careerLevel": "신입/경력무관",
    "preferredDepartments": ["물류학과", "국제통상학과", "경영학과", "산업공학과"],
    "techStacks": ["Supply Chain Management", "SQL", "Excel Macro", "ERP"],
    "employmentType": "정규직",
    "deadline": "2026-12-15",
    "originUrl": "https://www.coupang.jobs/kr/jobs/supply-chain-specialist",
    "isPartnership": False,
    "location": "서울 송파구"
  },
  {
    "id": "job-008",
    "companyName": "삼성전자",
    "logoEmoji": "🔷",
    "title": "DS부문 차세대 반도체 공정설계 및 수율분석 엔지니어 (신입 공채)",
    "jobCategory": "생산·제조",
    "careerLevel": "신입",
    "preferredDepartments": ["전자공학과", "신소재공학과", "물리학과", "화학공학과"],
    "techStacks": ["Semiconductor Process", "TCAD", "Python", "SPICE"],
    "employmentType": "정규직",
    "deadline": "2026-10-25",
    "originUrl": "https://www.samsungcareers.com/hr/?cmd=info&mid=11",
    "isPartnership": False,
    "location": "경기 화성/평택 캠퍼스"
  },
  {
    "id": "job-009",
    "companyName": "당근 (Karrot)",
    "logoEmoji": "🥕",
    "title": "동네생활 / 비즈프로필 광고 솔루션 B2B 세일즈 어소시에이트 (신입)",
    "jobCategory": "영업·고객상담",
    "careerLevel": "신입/경력무관",
    "preferredDepartments": ["경영학과", "경제학과", "커뮤니케이션학부", "자율전공학부"],
    "techStacks": ["B2B Sales", "Client Relations", "CRM", "데이터기반 영업"],
    "employmentType": "정규직",
    "deadline": "상시채용",
    "originUrl": "https://about.daangn.com/jobs/business-sales-associate",
    "isPartnership": False,
    "location": "서울 서초구 교대"
  },
  {
    "id": "job-010",
    "companyName": "현대건설",
    "logoEmoji": "🏗️",
    "title": "스마트 건축설계 및 BIM 디지털 트윈 모델링 엔지니어 (신입)",
    "jobCategory": "건설",
    "careerLevel": "신입",
    "preferredDepartments": ["건축학과", "건축공학과", "공간디자인학과", "실내건축디자인학과"],
    "techStacks": ["BIM", "Revit", "AutoCAD", "Navisworks"],
    "employmentType": "정규직",
    "deadline": "2026-11-10",
    "originUrl": "https://hdec.recruiter.co.kr/app/jobnotice/view?systemKindCode=MRS2&jobnoticeSn=14981",
    "isPartnership": True,
    "location": "서울 종로구 계동"
  },
  {
    "id": "job-011",
    "companyName": "토스뱅크 (Toss Bank)",
    "logoEmoji": "🏦",
    "title": "여신/수신 금융 프로덕트 오너(PO) 어시스턴트 (신입)",
    "jobCategory": "금융",
    "careerLevel": "신입",
    "preferredDepartments": ["경영학과", "금융공학과", "경제학과", "산업정보디자인전공"],
    "techStacks": ["Fintech Product", "Data Driven Decisions", "SQL", "Figma"],
    "employmentType": "정규직",
    "deadline": "2026-11-28",
    "originUrl": "https://toss.im/career/job-detail?job_id=4980",
    "isPartnership": False,
    "location": "서울 강남구 테헤란로"
  },
  {
    "id": "job-012",
    "companyName": "CJ ENM",
    "logoEmoji": "🎬",
    "title": "tvN / OCN 방송 채널 프로모션 모션그래픽 디자이너 (신입)",
    "jobCategory": "미디어",
    "careerLevel": "신입",
    "preferredDepartments": ["시각디자인학과", "영상디자인학과", "애니메이션학과", "디지털미디어학과"],
    "techStacks": ["After Effects", "Cinema 4D", "Premiere Pro", "Photoshop"],
    "employmentType": "정규직",
    "deadline": "2026-11-18",
    "originUrl": "https://recruit.cj.net/recruit/ko/job/detail.fo?notiSeq=1522",
    "isPartnership": False,
    "location": "서울 마포구 상암동 E&M센터"
  },
  {
    "id": "job-013",
    "companyName": "리인벤션 특허법률사무소",
    "logoEmoji": "⚖️",
    "title": "AI/디지털 디자인 지식재산권(IP) 기술가치평가 연구원 (신입)",
    "jobCategory": "전문·특수직",
    "careerLevel": "신입/경력무관",
    "preferredDepartments": ["디자인학부", "법학과", "기술경영학과", "지식재산학과"],
    "techStacks": ["Patent Analysis", "Design Rights", "IP Escrow", "Tech Valuation"],
    "employmentType": "정규직",
    "deadline": "상시채용",
    "originUrl": "https://reinvention-ip.com/careers/junior-evaluator",
    "isPartnership": True,
    "location": "서울 강남구 역삼동"
  },
  {
    "id": "job-014",
    "companyName": "현대모비스",
    "logoEmoji": "🚘",
    "title": "미래 모빌리티 실내 PBV 공간 디자인 및 CMF 디자이너 (신입)",
    "jobCategory": "디자인",
    "careerLevel": "신입",
    "preferredDepartments": ["산업디자인학과", "시각디자인학과", "공간디자인학과", "조형예술학부"],
    "techStacks": ["CMF Design", "Rhino", "Alias", "KeyShot", "Photoshop"],
    "employmentType": "정규직",
    "deadline": "2026-11-25",
    "originUrl": "https://mobis.recruiter.co.kr/",
    "isPartnership": True,
    "location": "경기 용인 기술연구소"
  },
  {
    "id": "job-015",
    "companyName": "배달의민족 (우아한형제들)",
    "logoEmoji": "🛵",
    "title": "배민 브랜드 디자인 및 프로모션 비주얼 디자이너 (신입)",
    "jobCategory": "디자인",
    "careerLevel": "신입",
    "preferredDepartments": ["시각디자인과", "시각디자인학과", "일러스트레이션학과", "커뮤니케이션디자인학과"],
    "techStacks": ["Illustrator", "Photoshop", "Branding", "Character Art"],
    "employmentType": "정규직",
    "deadline": "2026-12-05",
    "originUrl": "https://career.woowahan.com/?jobPRNT=1001",
    "isPartnership": False,
    "location": "서울 송파구 롯데월드타워"
  },
  {
    "id": "job-016",
    "companyName": "크래프톤 (KRAFTON)",
    "logoEmoji": "🎮",
    "title": "신작 글로벌 액션 게임 UI/UX 디자이너 (신입)",
    "jobCategory": "디자인",
    "careerLevel": "신입",
    "preferredDepartments": ["게임디자인학과", "시각디자인학과", "디지털미디어학과", "컴퓨터공학과"],
    "techStacks": ["Unreal Engine", "Figma", "Game GUI", "Interaction Design"],
    "employmentType": "정규직",
    "deadline": "2026-11-30",
    "originUrl": "https://krafton.recruiter.co.kr/app/jobnotice/view?systemKindCode=MRS2&jobnoticeSn=9821",
    "isPartnership": False,
    "location": "서울 강남구 역삼동 센터필드"
  },
  {
    "id": "job-017",
    "companyName": "카카오페이 (Kakaopay)",
    "logoEmoji": "💳",
    "title": "오프라인 결제 인터랙션 및 온보딩 UX 기획 (신입)",
    "jobCategory": "IT·인터넷",
    "careerLevel": "신입",
    "preferredDepartments": ["산업정보디자인전공", "시각디자인학과", "컴퓨터공학과", "경영학과"],
    "techStacks": ["User Journey", "Wireframing", "A/B Testing", "Figma"],
    "employmentType": "정규직",
    "deadline": "2026-12-10",
    "originUrl": "https://kakaopay.recruiter.co.kr/",
    "isPartnership": False,
    "location": "경기 성남시 판교"
  },
  {
    "id": "job-018",
    "companyName": "아모레퍼시픽",
    "logoEmoji": "💄",
    "title": "글로벌 뷰티 브랜드 패키지 디자인 및 지속가능 소재 연구 (신입)",
    "jobCategory": "디자인",
    "careerLevel": "신입",
    "preferredDepartments": ["시각디자인학과", "산업디자인학과", "패키지디자인학과", "환경조형학과"],
    "techStacks": ["Package Design", "3D Rendering", "Eco Packaging", "Illustrator"],
    "employmentType": "정규직",
    "deadline": "2026-11-12",
    "originUrl": "https://careers.amorepacific.com/rec/rec_view.do",
    "isPartnership": False,
    "location": "서울 용산구 세계본사"
  },
  {
    "id": "job-019",
    "companyName": "무신사 (MUSINSA)",
    "logoEmoji": "👟",
    "title": "패션 커머스 전략기획 및 총무/경영지원 (신입)",
    "jobCategory": "경영·사무",
    "careerLevel": "신입/경력무관",
    "preferredDepartments": ["경영학과", "경제학과", "의류환경학과", "패션비즈니스학과"],
    "techStacks": ["Business Strategy", "Data Analysis", "Excel", "Notion"],
    "employmentType": "정규직",
    "deadline": "상시채용",
    "originUrl": "https://musinsa.recruiter.co.kr/app/jobnotice/view?systemKindCode=MRS2&jobnoticeSn=8721",
    "isPartnership": False,
    "location": "서울 성동구 성수동"
  },
  {
    "id": "job-020",
    "companyName": "샌드박스네트워크",
    "logoEmoji": "🥪",
    "title": "유튜브 오리지널 콘텐츠 영상 에디터 및 채널 PD (신입)",
    "jobCategory": "미디어",
    "careerLevel": "신입",
    "preferredDepartments": ["영상제작학과", "신문방송학과", "미디어커뮤니케이션학과", "시각디자인학과"],
    "techStacks": ["Premiere Pro", "After Effects", "YouTube Studio", "스토리보드"],
    "employmentType": "정규직",
    "deadline": "2026-11-20",
    "originUrl": "https://sandbox.co.kr/career",
    "isPartnership": False,
    "location": "서울 용산구 한남동"
  }
]

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_files = [
        os.path.join(root_dir, "data", "jobs.json"),
        os.path.join(root_dir, "my-exhibit-platform", "data", "jobs.json")
    ]
    
    for tf in target_files:
        os.makedirs(os.path.dirname(tf), exist_ok=True)
        with open(tf, "w", encoding="utf-8") as f:
            json.dump(JOBS_DATA, f, ensure_ascii=False, indent=2)
        print(f"Generated {len(JOBS_DATA)} jobs in {tf}")

if __name__ == "__main__":
    main()
