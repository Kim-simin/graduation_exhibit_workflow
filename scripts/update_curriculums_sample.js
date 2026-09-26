const fs = require('fs');
const path = require('path');

const curriculums = [
  {
    "id": "curr-design-hongik",
    "department_category": "디자인 (시각/산업 등)",
    "lead_school": {
      "university": "홍익대학교",
      "department": "미술대학 시각디자인과",
      "badge_title": "글로벌 비주얼 인터랙션 & 브랜드 아이덴티티 선도 학과"
    },
    "curriculum_title": "제너레이티브 비주얼 디자인 및 반응형 디지털 브랜드 경험(BX) 설계",
    "short_video_url": "https://assets.mixkit.co/videos/preview/mixkit-woman-designer-working-on-a-digital-tablet-41367-large.mp4",
    "video_poster": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800",
    "grade_tech_tree": [
      {
        "grade": "1학년",
        "stage": "기초 조형 및 타이포그래피",
        "tools": ["Photoshop", "Illustrator"],
        "desc": "그리드 시스템 기반 타이포그래피 및 2D 기초 시각 조형 설계"
      },
      {
        "grade": "2학년",
        "stage": "디지털 브랜드 인터랙션",
        "tools": ["Figma", "AfterEffects"],
        "desc": "반응형 UI/UX 디자인 시스템 구축 및 키네틱 타이포 모션"
      },
      {
        "grade": "3학년",
        "stage": "생성형 3D & WebGL 공간 연동",
        "tools": ["Cinema4D", "Three.js"],
        "desc": "실시간 인터랙티브 3D 그래픽스 및 WebGL 공간 경험 구축"
      },
      {
        "grade": "4학년",
        "stage": "산학 캡스톤 및 상용 쇼케이스",
        "tools": ["디자인 토큰", "BX 가이드라인"],
        "desc": "글로벌 상용 브랜드 아이덴티티 구축 및 피지컬 팝업 스토어 연동"
      }
    ],
    "tech_stack": ["Figma", "Illustrator", "Cinema4D", "Three.js", "AfterEffects"],
    "benchmarked_universities": [
      { "university": "국민대학교", "department": "시각디자인학과" },
      { "university": "건국대학교", "department": "커뮤니케이션디자인학과" },
      { "university": "서울과학기술대학교", "department": "디자인학과" }
    ]
  },
  {
    "id": "curr-cs-kaist",
    "department_category": "컴퓨터공학 (IT/SW)",
    "lead_school": {
      "university": "KAIST",
      "department": "전산학부",
      "badge_title": "차세대 분산 컴퓨팅 및 지능형 AI 시스템 선도 학과"
    },
    "curriculum_title": "클라우드 네이티브 분산 시스템 및 거대 인공지능(LLM) 서빙 인프라 엔지니어링",
    "short_video_url": "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-41365-large.mp4",
    "video_poster": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    "grade_tech_tree": [
      {
        "grade": "1학년",
        "stage": "시스템 프로그래밍 및 자료구조",
        "tools": ["C++", "Python", "Linux"],
        "desc": "메모리 관리, 포인터 기반 알고리즘 구현 및 리눅스 환경 실습"
      },
      {
        "grade": "2학년",
        "stage": "운영체제 및 네트워크 소켓 프로그래밍",
        "tools": ["Go", "Docker", "Git"],
        "desc": "OS 커널 개념 분석 및 동시성 네트워크 소켓 서버 구축"
      },
      {
        "grade": "3학년",
        "stage": "분산 데이터 처리 및 AI 파이프라인",
        "tools": ["PyTorch", "Kubernetes", "Kafka"],
        "desc": "대용량 스트리밍 데이터 파이프라인 및 분산 모델 학습 파이프라인"
      },
      {
        "grade": "4학년",
        "stage": "상용 MSA 인프라 캡스톤 프로젝트",
        "tools": ["AWS Cloud", "gRPC", "Prometheus"],
        "desc": "Zero-Downtime 마이크로서비스 아키텍처 및 실시간 모니터링 배포"
      }
    ],
    "tech_stack": ["C++", "Python", "Go", "Docker", "Kubernetes", "PyTorch"],
    "benchmarked_universities": [
      { "university": "서울대학교", "department": "컴퓨터공학부" },
      { "university": "POSTECH", "department": "컴퓨터공학과" },
      { "university": "서강대학교", "department": "컴퓨터공학과" },
      { "university": "숭실대학교", "department": "컴퓨터학부" }
    ]
  },
  {
    "id": "curr-business-snu",
    "department_category": "상경 (경영/경제)",
    "lead_school": {
      "university": "서울대학교",
      "department": "경영대학",
      "badge_title": "데이터 드리븐 퀀트 파이낸스 & 전략 비즈니스 선도 학과"
    },
    "curriculum_title": "머신러닝 기반 금융 자산 밸류에이션 및 글로벌 테크 기업 경영 전략 수립",
    "short_video_url": "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-smartphone-with-green-screen-mockup-42861-large.mp4",
    "video_poster": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    "grade_tech_tree": [
      {
        "grade": "1학년",
        "stage": "경영원론 및 재무회계 원리",
        "tools": ["Excel Advanced", "SPSS"],
        "desc": "기업 재무제표 분석 기초 및 통계 기반 비즈니스 의사결정"
      },
      {
        "grade": "2학년",
        "stage": "계량경제 및 금융 시계열 데이터 분석",
        "tools": ["Python", "Pandas", "R"],
        "desc": "파이썬 금융 라이브러리를 활용한 위험 포트폴리오 최적화"
      },
      {
        "grade": "3학년",
        "stage": "퀀트 투자 알고리즘 및 기업 가치평가",
        "tools": ["SQL", "Tableau", "Bloomberg Terminal"],
        "desc": "DCF 현금흐름 할인 모형 및 블룸버그 터미널 실시간 실습"
      },
      {
        "grade": "4학년",
        "stage": "글로벌 M&A 및 전략 컨설팅 캡스톤",
        "tools": ["PowerBI", "Monte Carlo Simulator"],
        "desc": "실제 글로벌 사모펀드(PE) 투자 심사보고서 및 산학 피칭"
      }
    ],
    "tech_stack": ["Python", "Excel Advanced", "SQL", "Tableau", "Bloomberg Terminal"],
    "benchmarked_universities": [
      { "university": "연세대학교", "department": "경영대학" },
      { "university": "고려대학교", "department": "경영대학" },
      { "university": "서강대학교", "department": "경영학부" }
    ]
  },
  {
    "id": "curr-elec-skku",
    "department_category": "전자공학 (반도체/디스플레이)",
    "lead_school": {
      "university": "성균관대학교",
      "department": "정보통신대학 반도체시스템공학과",
      "badge_title": "차세대 시스템반도체 설계 & 파운드리 공정 선도 학과"
    },
    "curriculum_title": "초미세 공정 기반 시스템반도체 SoC 회로 설계 및 웨이퍼 수율 분석",
    "short_video_url": "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-hands-soldering-a-circuit-board-42862-large.mp4",
    "video_poster": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "grade_tech_tree": [
      {
        "grade": "1학년",
        "stage": "회로이론 및 물리전자 기초",
        "tools": ["MATLAB", "SPICE"],
        "desc": "RLC 회로 과도응답 해석 및 반도체 밴드갭 물성 이론 검증"
      },
      {
        "grade": "2학년",
        "stage": "디지털 논리설계 및 HDL 코딩",
        "tools": ["Verilog", "ModelSim"],
        "desc": "FPGA 보드 타겟 RTL 설계 및 하드웨어 타이밍 검증"
      },
      {
        "grade": "3학년",
        "stage": "CMOS 아날로그 직접회로 설계",
        "tools": ["Cadence Virtuoso", "Synopsys Design Compiler"],
        "desc": "트랜지스터 레이아웃 DRC/LVS 검증 및 풀커스텀 칩 설계"
      },
      {
        "grade": "4학년",
        "stage": "산학 연계 파운드리 테이프아웃(Tape-out)",
        "tools": ["Cadence EDA", "수율 분석 SW"],
        "desc": "실제 파운드리 MPW 공정 의뢰 및 패키징 테스트 캡스톤"
      }
    ],
    "tech_stack": ["Verilog", "Cadence Virtuoso", "Synopsys", "SPICE", "MATLAB"],
    "benchmarked_universities": [
      { "university": "경북대학교", "department": "전자공학부" }
    ]
  },
  {
    "id": "curr-mech-hanyang",
    "department_category": "기계공학 (자동차/중공업)",
    "lead_school": {
      "university": "한양대학교",
      "department": "공과대학 미래자동차공학과",
      "badge_title": "SDV 소프트웨어 중심 차량 및 전동화 파워트레인 선도 학과"
    },
    "curriculum_title": "친환경 전기차(EV) 열관리 시스템 최적화 및 자율 모빌리티 동역학 제어",
    "short_video_url": "https://assets.mixkit.co/videos/preview/mixkit-graphic-designer-using-a-mouse-and-keyboard-41366-large.mp4",
    "video_poster": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    "grade_tech_tree": [
      {
        "grade": "1학년",
        "stage": "4대 역학 기초 및 기계 CAD",
        "tools": ["CATIA", "AutoCAD"],
        "desc": "정역학/재료역학 기초 수식 모델링 및 3D 파트 모델링"
      },
      {
        "grade": "2학년",
        "stage": "열유체 해석 및 메카트로닉스",
        "tools": ["ANSYS Fluent", "Arduino", "LabVIEW"],
        "desc": "배터리 팩 냉각 유동장 CFD 시뮬레이션 및 모터 제어 회로"
      },
      {
        "grade": "3학년",
        "stage": "차량 동역학 및 임베디드 ECU 제어",
        "tools": ["Simulink", "MATLAB", "CarSim"],
        "desc": "CAN 통신 기반 차량 제어 로직 설계 및 HILs 시뮬레이션 검증"
      },
      {
        "grade": "4학년",
        "stage": "스마트 자율 모빌리티 실차 제작 캡스톤",
        "tools": ["ROS", "CANoe", "LiDAR 연동"],
        "desc": "실제 주행 가능한 자율주행 포뮬러 EV 완성차 제작 및 트랙 주행"
      }
    ],
    "tech_stack": ["CATIA", "ANSYS Fluent", "MATLAB", "Simulink", "CarSim"],
    "benchmarked_universities": [
      { "university": "부산대학교", "department": "기계공학부" },
      { "university": "경북대학교", "department": "기계공학부" }
    ]
  },
  {
    "id": "curr-film-karts",
    "department_category": "영상 (제작/미디어)",
    "lead_school": {
      "university": "한국예술종합학교",
      "department": "영상원 방송영상과",
      "badge_title": "시네마틱 스토리텔링 & 버추얼 프로덕션 선도 학과"
    },
    "curriculum_title": "실시간 언리얼 엔진 기반 버추얼 스튜디오 시네마토그래피 및 장편 연출",
    "short_video_url": "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-smartphone-with-green-screen-mockup-42861-large.mp4",
    "video_poster": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800",
    "grade_tech_tree": [
      {
        "grade": "1학년",
        "stage": "시나리오 작법 및 영상 문법",
        "tools": ["Final Draft", "Premiere Pro"],
        "desc": "단편 영화 구조 시나리오 분석 및 기초 몽타주 편집 실습"
      },
      {
        "grade": "2학년",
        "stage": "디지털 촬영 조명 및 오디오 믹싱",
        "tools": ["DaVinci Resolve", "ProTools"],
        "desc": "시네마 카메라 색보정(DI) 워크플로우 및 입체 음향 마스터링"
      },
      {
        "grade": "3학년",
        "stage": "버추얼 프로덕션 및 VFX 합성",
        "tools": ["Unreal Engine 5", "Nuke"],
        "desc": "실시간 LED 월 버추얼 스튜디오 카메라 트래킹 및 실사 합성"
      },
      {
        "grade": "4학년",
        "stage": "장편 졸업 졸업영화 제작 및 영화제 출품",
        "tools": ["DCP 마스터링", "Dolby Atmos"],
        "desc": "상업 영화 규격 DCP 제작 및 국제 영화제 출품 쇼케이스 완성"
      }
    ],
    "tech_stack": ["Unreal Engine 5", "DaVinci Resolve", "Premiere Pro", "Nuke", "ProTools"],
    "benchmarked_universities": [
      { "university": "서울예술대학교", "department": "영상학부" }
    ]
  },
  {
    "id": "curr-arch-hongik",
    "department_category": "건축학 (설계/공학)",
    "lead_school": {
      "university": "홍익대학교",
      "department": "건축학부 건축학전공 (설계)",
      "badge_title": "파라메트릭 공간 조형 & 탄소중립 스마트 빌딩 설계 선도 학과"
    },
    "curriculum_title": "알고리즈믹 파라메트릭 파사드 모델링 및 도심 복합 고밀도 친환경 건축 설계",
    "short_video_url": "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-41365-large.mp4",
    "video_poster": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
    "grade_tech_tree": [
      {
        "grade": "1학년",
        "stage": "건축 조형 연습 및 공간 드로잉",
        "tools": ["Rhino", "AutoCAD"],
        "desc": "공간 비례와 스케일 감각 훈련 및 3D 매스 스터디 모델링"
      },
      {
        "grade": "2학년",
        "stage": "파라메트릭 알고리즘 디자인",
        "tools": ["Grasshopper", "Enscape"],
        "desc": "연산적 패턴 파사드 설계 및 실시간 건축 렌더링 검토"
      },
      {
        "grade": "3학년",
        "stage": "BIM 통합 빌딩 정보 모델링",
        "tools": ["Revit", "Lumion"],
        "desc": "구조·설비 간섭 체크 및 환경 에너지 부하 시뮬레이션"
      },
      {
        "grade": "4학년",
        "stage": "도심 재생 캡스톤 졸업 설계",
        "tools": ["VR Walkthrough", "모형 3D 프린팅"],
        "desc": "도시 맥락을 반영한 대규모 복합 공공 건축 마스터플랜 완성"
      }
    ],
    "tech_stack": ["Rhino", "Grasshopper", "Revit", "Enscape", "Lumion"],
    "benchmarked_universities": [
      { "university": "서울시립대학교", "department": "건축학부 (설계)" },
      { "university": "한국예술종합학교", "department": "미술원 건축과 (설계)" },
      { "university": "한양대학교", "department": "건축공학부 (공학)" }
    ]
  }
];

const destRoot = path.join(__dirname, '..', 'data', 'curriculums.json');
const destApp = path.join(__dirname, '..', 'my-exhibit-platform', 'data', 'curriculums.json');

fs.writeFileSync(destRoot, JSON.stringify(curriculums, null, 2), 'utf8');
fs.writeFileSync(destApp, JSON.stringify(curriculums, null, 2), 'utf8');
console.log(`Updated ${curriculums.length} initial exemplary curriculums to both data locations!`);
