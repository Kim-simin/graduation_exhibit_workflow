"""
Professor Intelligence Graph Workflow
Constructs and compiles the StateGraph connecting the 14 nodes in exact sequence.
Supports optional Checkpointer for state persistence and time-travel debugging.
"""

from typing import Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.base import BaseCheckpointSaver
from .state import ProfessorGraphState
from .nodes import (
    university_discovery,
    department_discovery,
    professor_discovery,
    official_source_validation,
    professor_information_extraction,
    semester_core_task_extraction,
    industry_collaboration_extraction,
    student_portfolio_matching,
    normalization,
    confidence_evaluation,
    deduplication,
    change_detection,
    database_update,
    run_logging,
)


def route_after_validation(state: ProfessorGraphState) -> str:
    """
    공식 출처 검증 후 분기 결정 함수:
    - 검증 통과 후보가 1명 이상이면 정상 추출 노드로 이동
    - 0명이고 retry_count < max_retries이면 검색 재시도(fallback) 루프로 순환
    - 0명이고 재시도 초과 시 무리한 데이터 생성 없이 run_logging으로 직행
    """
    validated = state.get("validated_candidates", [])
    if len(validated) > 0:
        return "professor_information_extraction"

    retry = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 2)
    if retry < max_retries:
        print(f"\n🔁 [출처 검증 실패 재시도] 유효 공식 출처 미발견 (시도: {retry}/{max_retries}) -> 재탐색 순환")
        return "professor_discovery"

    print("\n⚠️ [공식 출처 검증 실패] 신뢰 가능한 공식 학술 도메인 후보가 없어 무리한 생성을 중단하고 로깅으로 이동합니다.")
    return "run_logging"


def build_professor_graph(checkpointer: Optional[BaseCheckpointSaver] = None):
    """
    Professor Intelligence Graph 구축
    14 Sequential Nodes:
    START
    → University Discovery
    → Department Discovery
    → Professor Discovery
    → Official Source Validation
    → Professor Information Extraction
    → Semester Core Task Extraction
    → Industry Collaboration Extraction
    → Student Portfolio Matching
    → Normalization
    → Confidence Evaluation
    → Deduplication
    → Change Detection
    → Database Update
    → Run Logging
    → END
    """
    workflow = StateGraph(ProfessorGraphState)

    # 1. 14개 노드 등록
    workflow.add_node("university_discovery", university_discovery)
    workflow.add_node("department_discovery", department_discovery)
    workflow.add_node("professor_discovery", professor_discovery)
    workflow.add_node("official_source_validation", official_source_validation)
    workflow.add_node("professor_information_extraction", professor_information_extraction)
    workflow.add_node("semester_core_task_extraction", semester_core_task_extraction)
    workflow.add_node("industry_collaboration_extraction", industry_collaboration_extraction)
    workflow.add_node("student_portfolio_matching", student_portfolio_matching)
    workflow.add_node("normalization", normalization)
    workflow.add_node("confidence_evaluation", confidence_evaluation)
    workflow.add_node("deduplication", deduplication)
    workflow.add_node("change_detection", change_detection)
    workflow.add_node("database_update", database_update)
    workflow.add_node("run_logging", run_logging)

    # 2. 엣지 연결 (순차 워크플로우)
    workflow.set_entry_point("university_discovery")
    workflow.add_edge("university_discovery", "department_discovery")
    workflow.add_edge("department_discovery", "professor_discovery")
    workflow.add_edge("professor_discovery", "official_source_validation")

    # 3. 출처 검증 조건부 엣지
    workflow.add_conditional_edges(
        "official_source_validation",
        route_after_validation,
        {
            "professor_information_extraction": "professor_information_extraction",
            "professor_discovery": "professor_discovery",
            "run_logging": "run_logging"
        }
    )

    # 4. 추출, 정규화, 신뢰도 평가, 저장 엣지 연결
    workflow.add_edge("professor_information_extraction", "semester_core_task_extraction")
    workflow.add_edge("semester_core_task_extraction", "industry_collaboration_extraction")
    workflow.add_edge("industry_collaboration_extraction", "student_portfolio_matching")
    workflow.add_edge("student_portfolio_matching", "normalization")
    workflow.add_edge("normalization", "confidence_evaluation")
    workflow.add_edge("confidence_evaluation", "deduplication")
    workflow.add_edge("deduplication", "change_detection")
    workflow.add_edge("change_detection", "database_update")
    workflow.add_edge("database_update", "run_logging")
    workflow.add_edge("run_logging", END)

    if checkpointer:
        return workflow.compile(checkpointer=checkpointer)
    return workflow.compile()


app = build_professor_graph()
