import sys
import os
from dotenv import load_dotenv

# Windows 환경 콘솔 UTF-8 출력 보정
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from state import GraphState
from graph import build_graph

# 환경 변수 로드
load_dotenv()

# LangGraph Studio 및 외부 모듈 로딩을 위한 최상위 컴파일 객체
app = build_graph()


def main():
    print("=" * 60)
    print("🎓 [졸업 전시회 카드뉴스 & 실질 직무 분류 파이프라인]")
    print("=" * 60)

    # 테스트용 졸업 작품 샘플 데이터 (신규 스키마 반영)
    sample_input: GraphState = {
        "university": "홍익대학교",
        "exhibition_year": "2026",
        "department_name": "테크노디자인학과 미디어융합전공",
        "student_name": "김예술",
        "student_id": "202198765",
        "category": "인터랙티브 미디어 / AI",
        "exhibit_title": "공명의 숲: 관람객의 호흡으로 피어나는 디지털 자연",
        "raw_description": (
            "관람객의 호흡 센서 데이터와 마이크 소리를 실시간으로 감지하여, "
            "호흡의 주기와 깊이에 따라 거대한 스크린 속 숲의 식물들이 자라나고 꽃을 피우는 "
            "생성형 미디어아트 인터랙션 프로젝트입니다. 관람객이 차분해질수록 숲은 맑고 평온한 빛을 띱니다. "
            "TouchDesigner와 피지컬 센서, 로컬 비전 AI 모델을 결합하였습니다."
        ),
        "retry_count": 0,
        "max_retries": 3
    }

    print("\n[출품 기본 정보]")
    print(f"- 대학교/년도: {sample_input['university']} ({sample_input['exhibition_year']}년)")
    print(f"- 학과: {sample_input['department_name']}")
    print(f"- 출품자: {sample_input['student_name']} ({sample_input['student_id']})")
    print(f"- 제목: {sample_input['exhibit_title']}")

    print("\n[워크플로우 실행 중...]")
    final_state = app.invoke(sample_input)

    print("\n" + "=" * 60)
    print("🏁 [최종 워크플로우 실행 결과]")
    print("=" * 60)
    print(f"- 상태(Status)        : {final_state.get('status')}")
    print(f"- 실질 직무 분류      : {final_state.get('inferred_job_role')}")
    print(f"- 실질 산업군 분류    : {final_state.get('inferred_industry')}")
    print(f"- 카드뉴스 헤드라인   : {final_state.get('card_headline')}")
    print(f"- 카드뉴스 본문       : {final_state.get('card_intro')}")
    print(f"- 전시 설명 캡션      : {final_state.get('card_caption')}")
    print(f"- AI 크리틱 점수      : {final_state.get('critic_score')}점 / 100점")
    if final_state.get("output_path"):
        print(f"- 최종 저장 파일      : {final_state.get('output_path')}")
    print("=" * 60)


if __name__ == "__main__":
    main()
