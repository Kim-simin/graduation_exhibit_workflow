from langgraph.graph import StateGraph, END
from state import GraphState
from nodes import (
    validate_input,
    research_node,
    enrich_metadata,
    critic_agent,
    human_review_gate,
    upload_to_storage
)


def check_approval(state: GraphState) -> str:
    """
    관리자 승인 여부 및 재시도 횟수를 검사하여 분기를 결정하는 조건부 라우팅 함수.
    - is_approved가 True이면 -> 'upload_to_storage'
    - is_approved가 False이고 retry_count < max_retries이면 -> 'enrich_metadata' (피드백 순환 루프)
    - is_approved가 False이고 최대 횟수에 도달하면 -> 에러/중단 메시지 출력 후 END
    """
    if state.get("is_approved") is True or state.get("auto_pilot") is True or state.get("execution_mode") == "AUTO_PILOT":
        return "upload_to_storage"

    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)

    if retry_count < max_retries:
        print(f"\n🔁 [피드백 루프백] 관리자 반려 및 수정 요청 반영 (진행 상태: {retry_count}/{max_retries}회) ➔ enrich_metadata로 순환합니다.")
        return "enrich_metadata"
    else:
        print(f"\n⛔ [최대 재시도 초과] 최대 허용 검토 횟수({max_retries}회)에 도달하여 프로세스를 종료합니다.")
        return END


def build_graph():
    """
    5단계 졸업전시회 메타데이터 처리 파이프라인 그래프 구성:
    validate_input -> research_node -> enrich_metadata -> critic_agent -> human_review_gate
    -> (조건부 분기) -> [승인: upload_to_storage -> END / 반려: enrich_metadata 루프백]
    """
    workflow = StateGraph(GraphState)

    # 1. 5단계 노드 등록
    workflow.add_node("validate_input", validate_input)
    workflow.add_node("research_node", research_node)
    workflow.add_node("enrich_metadata", enrich_metadata)
    workflow.add_node("critic_agent", critic_agent)
    workflow.add_node("human_review_gate", human_review_gate)
    workflow.add_node("upload_to_storage", upload_to_storage)

    # 2. 순차 파이프라인 엣지 연결
    workflow.set_entry_point("validate_input")
    workflow.add_edge("validate_input", "research_node")
    workflow.add_edge("research_node", "enrich_metadata")
    workflow.add_edge("enrich_metadata", "critic_agent")
    workflow.add_edge("critic_agent", "human_review_gate")

    # 3. 관리자 검토 게이트 조건부 엣지 연결
    workflow.add_conditional_edges(
        "human_review_gate",
        check_approval,
        {
            "upload_to_storage": "upload_to_storage",
            "enrich_metadata": "enrich_metadata",
            END: END
        }
    )

    # 4. 저장 완료 노드 후 종료
    workflow.add_edge("upload_to_storage", END)

    return workflow.compile()


# LangGraph Studio 및 외부 러너를 위해 컴파일된 인스턴스를 app 변수로 노출
app = build_graph()
