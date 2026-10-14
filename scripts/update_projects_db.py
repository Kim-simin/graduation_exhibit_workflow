import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent

TARGET_FILES = [
    WORKSPACE / "data" / "projects.json",
    WORKSPACE / "web" / "data" / "published" / "projects.json",
    WORKSPACE / "admin" / "data" / "projects.json",
]

def update_db():
    for fpath in TARGET_FILES:
        if not fpath.exists():
            print(f"File not found: {fpath}")
            continue

        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Update proj-grad-exhibit-platform
        for item in data:
            if item.get("id") == "proj-grad-exhibit-platform":
                item["origin"] = "student"
                item["summary"] = "전국 대학 학생의 프로젝트와 대학 공유자원, 기업 산학과제를 연결하는 플랫폼."
                item["problem"] = "매년 전국 수천 개 대학에서 졸업작품과 산학 연구 결과물이 쏟아져 나오지만, 오프라인 전시 종료 후 웹 도메인 만료와 데이터 파편화로 단발성 소멸되는 문제와, 학생들이 자신의 전공에 적합한 실전 기업과제와 고가 연구장비를 찾지 못하는 정보 비대칭이 발생하고 있습니다."
                item["solution"] = "전국 대학 졸업작품을 영구 아카이빙하고, 대학별 공유자원·기업 산학과제·R&D·연구장비까지 학생 전공 기준으로 원클릭 탐색 및 현직자가 학생 프로젝트의 실제 진행 과정과 Evidence를 확인해 피드백할 수 있는 양방향 플랫폼 구축"
                item["collaborationNeeds"] = [
                    "industry_feedback",
                    "mentor",
                    "testbed",
                    "company_problem",
                    "joint_development"
                ]
                item["collaborationNeedLabels"] = [
                    "대학 실증",
                    "사업단 Feedback",
                    "기업 산학협력",
                    "현직자 Feedback"
                ]
                item["visibility"] = "public"
                item["relatedChallengeIds"] = [
                    "challenge-shipbuilding-dashboard",
                    "opp_bbits_multidisciplinary_2026"
                ]

        # 2. Add second student project if not present
        has_shipyard = any(item.get("id") == "proj-smart-shipyard-safety" for item in data)
        if not has_shipyard:
            shipyard_project = {
                "id": "proj-smart-shipyard-safety",
                "origin": "student",
                "title": "스마트 조선소 작업자 안전 모니터링 시스템",
                "description": "조선소 작업자의 위험구역 접근을 AI 영상분석으로 감지하고 관리자가 실시간 확인할 수 있는 Safety Monitoring Dashboard.",
                "summary": "조선소 작업자의 위험구역 접근을 AI 영상분석으로 감지하고 관리자가 실시간 확인할 수 있는 Safety Monitoring Dashboard.",
                "problem": "조선소 도크 및 밀폐구역, 대형 크레인 작업 반경 내에서 안전관리자의 육안 감시 한계로 인해 중대재해 위험이 상존하고, 작업자의 위험구역 진입 시 즉각적인 현장 경보 및 모니터링 수단이 부족합니다.",
                "solution": "CCTV 및 현장 카메라 영상을 실시간 분석하여 작업자의 안전보호구 착용 및 위험구역 침범을 0.3초 내 탐지하고 관리자 대시보드와 작업자 웨어러블로 동시 경보를 전송하는 AI 비전 시스템",
                "university": "부산대학교",
                "department": "컴퓨터공학과",
                "projectTypes": [
                    "학생 제안",
                    "개인 프로젝트",
                    "캡스톤"
                ],
                "category": "AI / Software",
                "thumbnail": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
                "coverImage": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
                "progressStage": "solution",
                "progressPercent": 25,
                "mentorReviewStatus": "not_requested",
                "collaborationNeeds": [
                    "industry_feedback",
                    "mentor",
                    "data",
                    "testbed"
                ],
                "collaborationNeedLabels": [
                    "현업 피드백",
                    "조선기업 멘토",
                    "현장 데이터",
                    "실증기업"
                ],
                "visibility": "public",
                "createdAt": "2026.09.15",
                "updatedAt": "2026.10.04",
                "teamMembers": [
                    {
                        "id": "mem-02-1",
                        "name": "김민준",
                        "role": "AI Computer Vision Lead",
                        "department": "컴퓨터공학과",
                        "contributions": [
                            "YOLOv8 모델 파인튜닝",
                            "CCTV 영상 객체 검출 파이프라인"
                        ]
                    },
                    {
                        "id": "mem-02-2",
                        "name": "박지훈",
                        "role": "Fullstack / Dashboard Developer",
                        "department": "컴퓨터공학과",
                        "contributions": [
                            "Next.js 실시간 관제 대시보드",
                            "위험구역 좌표 바운딩 박스 시각화"
                        ]
                    }
                ],
                "skills": [
                    "AI",
                    "Computer Vision",
                    "YOLOv8",
                    "Python",
                    "React",
                    "Next.js",
                    "Dashboard",
                    "Safety"
                ],
                "links": {
                    "github": "https://github.com/Kim-simin/graduation_exhibit_workflow"
                },
                "milestones": [
                    {
                        "id": "ms-ship-01",
                        "projectId": "proj-smart-shipyard-safety",
                        "stage": "problem_definition",
                        "stageNumber": 1,
                        "title": "문제 정의",
                        "description": "조선소 밀폐구역 및 크레인 반경 내 안전사고 원인 분석",
                        "status": "completed",
                        "startedAt": "2026.09.15",
                        "completedAt": "2026.09.22",
                        "summary": "현대중공업·삼성중공업 등 조선업 중대재해 사례집 분석 결과, 위험구역 무단 진입 및 안전모 미착용이 78%를 차지함을 확인하고 이를 영상 AI로 실시간 차단하는 목표를 수립했습니다.",
                        "tasks": [
                            { "id": "t-s-01-1", "title": "조선업 산업안전보건 사례 분석", "completed": True },
                            { "id": "t-s-01-2", "title": "현장 모니터링 요구사항 도출", "completed": True }
                        ],
                        "evidence": [
                            {
                                "id": "ev-s-01",
                                "projectId": "proj-smart-shipyard-safety",
                                "milestoneId": "ms-ship-01",
                                "type": "Research",
                                "title": "조선소 야드 안전사고 유형 및 비전 AI 적용 타당성 보고서",
                                "description": "공공 데이터 및 안전보건공단 통계 분석",
                                "createdAt": "2026.09.22",
                                "contributors": ["김민준", "박지훈"]
                            }
                        ]
                    },
                    {
                        "id": "ms-ship-02",
                        "projectId": "proj-smart-shipyard-safety",
                        "stage": "solution",
                        "stageNumber": 2,
                        "title": "해결방안 도출",
                        "description": "YOLOv8 기반 객체 인식 및 경보 아키텍처 수립",
                        "status": "in_progress",
                        "startedAt": "2026.09.23",
                        "summary": "CCTV RTSP 스트림을 초당 30프레임으로 수신하여 작업자 안전모/조끼 착용 여부 및 가상 펜스 침범을 동시 판별하는 경량화 파이프라인을 설계 중입니다.",
                        "tasks": [
                            { "id": "t-s-02-1", "title": "AI 모델 벤치마크 및 경량화 테스트", "completed": True },
                            { "id": "t-s-02-2", "title": "현장 실증 데이터셋 수급 협의", "completed": False }
                        ],
                        "evidence": [
                            {
                                "id": "ev-s-02",
                                "projectId": "proj-smart-shipyard-safety",
                                "milestoneId": "ms-ship-02",
                                "type": "Architecture Diagram",
                                "title": "실시간 영상 추론 및 알림 브로커 아키텍처",
                                "description": "Edge AI 디바이스와 중앙 관제 서버 간 WebSocket 통신 구조도",
                                "createdAt": "2026.09.30",
                                "contributors": ["김민준"]
                            }
                        ]
                    }
                ],
                "mentorRequests": [],
                "feedbacks": [],
                "activityHistory": [
                    {
                        "id": "act-s-01",
                        "date": "09.15",
                        "title": "프로젝트 기획 및 팀 구성",
                        "type": "milestone",
                        "description": "컴퓨터공학과 캡스톤 디자인 과제 등록"
                    },
                    {
                        "id": "act-s-02",
                        "date": "09.22",
                        "title": "문제 정의 완료 및 아키텍처 설계 착수",
                        "type": "milestone",
                        "description": "조선소 현장 인터뷰 및 요구사항 정리"
                    }
                ],
                "relatedChallengeIds": [
                    "challenge-shipbuilding-safety-iot",
                    "challenge-shipbuilding-llm"
                ]
            }
            data.append(shipyard_project)

        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {fpath} successfully. Total projects: {len(data)}")

if __name__ == "__main__":
    update_db()
