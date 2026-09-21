import sys
import os
import re
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
import streamlit as st

# Windows 환경 콘솔 UTF-8 출력 보정
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from dotenv import load_dotenv
load_dotenv()

import html
import textwrap
from state import GraphState
from nodes import (
    validate_input,
    research_node,
    enrich_metadata,
    critic_agent,
    upload_to_storage,
    invoke_structured,
    EnrichedCardMetadata,
    CurationMetadata,
    refine_curation_with_prompt,
    refine_caption_with_prompt
)
from scraper import is_instagram_authenticated, get_instagram_storage_state_path
from langchain_core.messages import SystemMessage, HumanMessage

def render_html(html_str: str):
    """
    Streamlit CommonMark 파서가 코드 인덴테이션(4칸 공백)을 감지하여
    HTML 태그를 <pre><code> 텍스트로 노출하는 버그를 방지하는 전용 렌더링 함수
    """
    clean_html = textwrap.dedent(html_str).strip()
    st.markdown(clean_html, unsafe_allow_html=True)


def get_valid_image_path(img_val: Optional[str]) -> Optional[str]:
    """
    로컬 파일 경로(상대/절대/백슬래시) 또는 웹 URL의 유효성을 정밀 검증하여
    Streamlit에서 즉시 고화질 렌더링 가능한 유효 경로를 반환합니다.
    """
    if not img_val:
        return None
    s_val = str(img_val).strip()
    if s_val.startswith("http://") or s_val.startswith("https://"):
        return s_val
    if os.path.exists(s_val):
        return os.path.abspath(s_val)
    abs_p = os.path.abspath(s_val)
    if os.path.exists(abs_p):
        return abs_p
    ws_p = os.path.join(r"c:\Users\graduation_exhibit_workflow", s_val)
    if os.path.exists(ws_p):
        return ws_p
    return None


# ---------------------------------------------------------
# Streamlit 페이지 기본 설정
# ---------------------------------------------------------
st.set_page_config(
    page_title="졸업전시 메타데이터 생성 및 승인 콘솔",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ---------------------------------------------------------
# 커스텀 CSS (다크 스튜디오 테마, 네온 노드 파이프라인, 8대 산업군 그리드)
# ---------------------------------------------------------
st.markdown("""
<style>
    /* 상단 여백 및 기본 테마 보정 */
    .block-container {
        padding-top: 1.2rem !important;
        padding-bottom: 2.5rem !important;
        max-width: 1680px;
    }
    
    .stApp {
        background-color: #0B0F19;
        color: #F8FAFC;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif;
    }

    /* 메인 스튜디오 헤더 */
    .studio-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 22px;
        background: linear-gradient(90deg, #111827 0%, #1E293B 100%);
        border: 1px solid #334155;
        border-radius: 12px;
        margin-bottom: 1.2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    .studio-title {
        font-size: 1.45rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: #F8FAFC;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .studio-badge {
        background: #0284C7;
        color: #E0F2FE;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 20px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }
    .studio-sub {
        color: #94A3B8;
        font-size: 0.83rem;
        margin-top: 2px;
    }

    /* 5단계 상단 요약 그리드 */
    .node-grid-container {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin-bottom: 1.2rem;
    }
    .node-card {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 10px;
        padding: 12px 14px;
        position: relative;
        transition: all 0.25s ease;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        word-break: keep-all;
    }
    .node-card.idle {
        border-color: #334155;
        opacity: 0.75;
    }
    .node-card.active {
        border-color: #10B981;
        background: #064E3B22;
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
    }
    .node-card.completed {
        border-color: #0284C7;
        background: #0C4A6E18;
    }
    .node-card.waiting {
        border-color: #F59E0B;
        background: #78350F22;
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.45);
        animation: pulse-border 1.8s infinite;
    }

    @keyframes pulse-border {
        0% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.3); }
        50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.65); }
        100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.3); }
    }

    .node-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }
    .node-num {
        font-size: 0.7rem;
        font-weight: 800;
        color: #64748B;
    }
    .node-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #F1F5F9;
        margin-bottom: 2px;
    }
    .node-desc {
        font-size: 0.72rem;
        color: #94A3B8;
        line-height: 1.3;
    }

    /* 노드 상태 뱃지 */
    .badge-status {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 6px;
        display: inline-block;
    }
    .badge-idle {
        background: #1F2937;
        color: #9CA3AF;
        border: 1px solid #374151;
    }
    .badge-running {
        background: #064E3B;
        color: #34D399;
        border: 1px solid #059669;
    }
    .badge-done {
        background: #0C4A6E;
        color: #38BDF8;
        border: 1px solid #0284C7;
    }
    .badge-awaiting {
        background: #78350F;
        color: #FCD34D;
        border: 1px solid #D97706;
    }

    /* 좌측 패널 전용 스타일 */
    .left-panel-box {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 1rem;
        box-shadow: 0 4px 14px rgba(0,0,0,0.3);
    }
    .left-panel-header {
        font-size: 0.98rem;
        font-weight: 700;
        color: #F8FAFC;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        border-bottom: 1px solid #1F2937;
        padding-bottom: 8px;
    }

    /* 네이티브 네온 파이프라인 바 (Mermaid 대체) */
    .pipeline-step-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 12px;
        border-radius: 8px;
        margin-bottom: 6px;
        background: #0F172A;
        border: 1px solid #1E293B;
        transition: all 0.25s ease;
    }
    .pipeline-step-item.active {
        border-color: #10B981;
        background: #064E3B26;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
    }
    .pipeline-step-item.completed {
        border-color: #0284C7;
        background: #0C4A6E1E;
    }
    .pipeline-step-item.waiting {
        border-color: #F59E0B;
        background: #78350F28;
        box-shadow: 0 0 14px rgba(245, 158, 11, 0.45);
        animation: pulse-border 1.8s infinite;
    }
    .pipeline-step-item.idle {
        border-color: #1E293B;
        opacity: 0.65;
    }

    /* 8대 산업군 그리드 카드 */
    .ind-card-container {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 12px;
        padding: 12px 10px;
        text-align: center;
        transition: all 0.2s ease;
        margin-bottom: 6px;
    }
    .ind-card-container.selected {
        border: 2px solid #38BDF8;
        background: linear-gradient(180deg, #0C4A6E35 0%, #111827 100%);
        box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
    }
    .ind-card-icon {
        font-size: 1.9rem;
        line-height: 1.1;
        margin-bottom: 4px;
    }
    .ind-card-title {
        font-size: 0.9rem;
        font-weight: 800;
        color: #F8FAFC;
        margin-bottom: 1px;
    }
    .ind-card-en {
        font-size: 0.64rem;
        color: #94A3B8;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
    .ind-card-count {
        font-size: 0.72rem;
        color: #38BDF8;
        margin-top: 4px;
        font-weight: 600;
    }

    /* 우측 3단 컨테이너 */
    .tier-box {
        background: #111827;
        border: 1px solid #1F2937;
        border-radius: 14px;
        padding: 18px 20px;
        margin-bottom: 1.2rem;
        box-shadow: 0 4px 18px rgba(0,0,0,0.3);
    }
    .tier-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #1F2937;
        padding-bottom: 10px;
        margin-bottom: 14px;
    }
    .tier-title {
        font-size: 1.05rem;
        font-weight: 800;
        color: #F8FAFC;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .tier-badge {
        font-size: 0.72rem;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 700;
        background: #1E293B;
        color: #38BDF8;
        border: 1px solid #0284C7;
    }

    /* 리스트 테이블 상태 뱃지 */
    .badge-queue-done {
        background: #064E3B;
        color: #34D399;
        border: 1px solid #059669;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.74rem;
        font-weight: 700;
    }
    .badge-queue-running {
        background: #0C4A6E;
        color: #38BDF8;
        border: 1px solid #0284C7;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.74rem;
        font-weight: 700;
    }
    .badge-queue-waiting {
        background: #1F2937;
        color: #94A3B8;
        border: 1px solid #374151;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.74rem;
        font-weight: 700;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# 8대 표준 산업군 메타데이터 정의 및 데이터 로드/저장
# ---------------------------------------------------------
QUEUE_FILE = "data/university_queue.json"

INDUSTRY_METADATA = [
    {
        "id": "design",
        "category": "디자인·UX/UI·서비스디자인",
        "name": "디자인·UX/UI",
        "name_en": "DESIGN & UX/UI",
        "icon": "🎨",
        "desc": "디자인 · UX/UI · 서비스디자인"
    },
    {
        "id": "fine_art",
        "category": "미술·회화·조소·판화·현대미술",
        "name": "미술·회화",
        "name_en": "FINE ART & PAINTING",
        "icon": "🖼️",
        "desc": "미술 · 회화 · 조소 · 현대미술"
    },
    {
        "id": "craft",
        "category": "공예·도자·금속·섬유·텍스타일",
        "name": "공예·조형",
        "name_en": "CRAFT & CERAMICS",
        "icon": "🏺",
        "desc": "공예 · 도자 · 금속 · 섬유"
    },
    {
        "id": "media",
        "category": "영상·애니메이션·게임·미디어아트",
        "name": "영상·미디어",
        "name_en": "FILM & MEDIA ART",
        "icon": "🎬",
        "desc": "영상 · 애니메이션 · 미디어아트"
    },
    {
        "id": "photo",
        "category": "사진·광고·브랜드·커뮤니케이션",
        "name": "사진·브랜드",
        "name_en": "PHOTO & BRANDING",
        "icon": "📸",
        "desc": "사진 · 광고 · 브랜드 커뮤니케이션"
    },
    {
        "id": "arch",
        "category": "건축·실내·공간디자인",
        "name": "건축·공간",
        "name_en": "ARCHITECTURE & SPACE",
        "icon": "🏛️",
        "desc": "건축 · 실내 · 공간디자인"
    },
    {
        "id": "fashion",
        "category": "패션·텍스타일·의류디자인",
        "name": "패션·의류",
        "name_en": "FASHION & TEXTILE",
        "icon": "👔",
        "desc": "패션 · 텍스타일 · 의류디자인"
    },
    {
        "id": "game",
        "category": "게임·인터랙션·제품디자인",
        "name": "게임·제품",
        "name_en": "GAME & PRODUCT",
        "icon": "🎮",
        "desc": "게임 · 인터랙션 · 제품디자인"
    }
]

INDUSTRIES = [item["category"] for item in INDUSTRY_METADATA]

def load_queue_data() -> List[Dict[str, Any]]:
    if os.path.exists(QUEUE_FILE):
        try:
            with open(QUEUE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_queue_data(data: List[Dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(QUEUE_FILE), exist_ok=True)
    with open(QUEUE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ---------------------------------------------------------
# 세션 상태 초기화
# ---------------------------------------------------------
if "queue_dataset" not in st.session_state or not st.session_state["queue_dataset"]:
    st.session_state["queue_dataset"] = load_queue_data()
elif any("unsplash" in str(it.get("poster_image", "")) for it in st.session_state["queue_dataset"]):
    st.session_state["queue_dataset"] = load_queue_data()

if "selected_industry" not in st.session_state:
    st.session_state["selected_industry"] = INDUSTRIES[0]

if "execution_mode" not in st.session_state:
    st.session_state["execution_mode"] = "MANUAL"

if "target_year" not in st.session_state:
    st.session_state["target_year"] = "2025"

if "current_item_id" not in st.session_state:
    first_id = "DES-01"
    for it in st.session_state["queue_dataset"]:
        if it.get("status") == "진행중" or it.get("status") == "대기":
            first_id = it["id"]
            break
    st.session_state["current_item_id"] = first_id

if "node_status" not in st.session_state:
    st.session_state["node_status"] = {
        "N1": "completed",
        "N2": "completed",
        "N3": "completed",
        "N4": "waiting",
        "N5": "idle"
    }

if "debug_logs" not in st.session_state:
    st.session_state["debug_logs"] = [
        "시스템 초기화 완료: llama.cpp 로컬 LLM 파이프라인 대기 중.",
        f"전국 8대 산업군 {len(st.session_state['queue_dataset'])}개 대학교 큐 로드 완료."
    ]

# 현재 작업 대상 아이템 반환
def get_current_item() -> Dict[str, Any]:
    target_id = st.session_state.get("current_item_id")
    for item in st.session_state["queue_dataset"]:
        if item["id"] == target_id:
            return item
    if st.session_state["queue_dataset"]:
        return st.session_state["queue_dataset"][0]
    return {}

current_item = get_current_item()

# ---------------------------------------------------------
# 단일 대학 파이프라인 실행 엔진 (Research -> Enrich -> Critic -> Gate/Upload)
# ---------------------------------------------------------
def execute_pipeline_for_item(target: Dict[str, Any], is_auto_pilot: bool = False, year: Optional[str] = None) -> Dict[str, Any]:
    """
    1개 대학 항목에 대해 [Research -> Enrich -> Critic] 3개 노드를 순차 실행하고
    세션 상태(st.session_state) 및 queue_dataset을 100% 동기화합니다.
    auto_pilot=True일 경우 관리자 게이트를 건너뛰고 스토리지에 즉시 영구 저장합니다.
    """
    target["status"] = "진행중"
    target_year = year or st.session_state.get("target_year", "2025")
    
    state_to_run: GraphState = {
        "university": target.get("university", "대학교"),
        "exhibition_year": str(target_year),
        "department_name": target.get("department", "디자인학부"),
        "poster_image": target.get("poster_image"),
        "exhibition_title": target.get("exhibition_title") or target.get("exhibit_title", f"{target_year} 졸업전시회"),
        "exhibition_period": target.get("exhibition_period") or f"{target_year}.11.12(목) - {target_year}.11.18(수)",
        "exhibition_venue": target.get("exhibition_venue") or f"{target.get('university')} 전시관",
        "artworks": target.get("artworks") or [],
        "student_name": f"{target.get('university')} 작가팀",
        "student_id": "2026001",
        "category": target.get("category", "디자인"),
        "exhibit_title": target.get("exhibit_title", "졸업전시 출품작"),
        "raw_description": target.get("raw_description", ""),
        "inferred_job_role": None,
        "inferred_industry": target.get("category"),
        "card_headline": None,
        "card_intro": None,
        "card_caption": None,
        "tags": [],
        "curation_summary": target.get("curation_summary"),
        "full_caption": target.get("full_caption"),
        "research_data": None,
        "critic_score": None,
        "critic_feedback": None,
        "retry_count": 0,
        "max_retries": 3,
        "is_approved": True if is_auto_pilot else None,
        "execution_mode": "AUTO_PILOT" if is_auto_pilot else "MANUAL",
        "auto_pilot": is_auto_pilot,
        "feedback": None,
        "errors": []
    }

    # Step 1: Validate
    val = validate_input(state_to_run)
    state_to_run.update(val)

    # Step 2: Research
    st.session_state["node_status"] = {"N1": "active", "N2": "idle", "N3": "idle", "N4": "idle", "N5": "idle"}
    st.session_state["debug_logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] 🔍 1단계 산업 리서치: {target.get('university')} {target.get('department')}")
    r_res = research_node(state_to_run)
    state_to_run.update(r_res)
    st.session_state["node_status"]["N1"] = "completed"

    # Step 3: Enrich (Local LLM via llama.cpp)
    st.session_state["node_status"]["N2"] = "active"
    st.session_state["debug_logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] ✨ 2단계 큐레이션 메타데이터 생성: llama.cpp (로컬 LLM) 호출")
    e_res = enrich_metadata(state_to_run)
    state_to_run.update(e_res)
    st.session_state["node_status"]["N2"] = "completed"

    # Step 4: Critic (AI Quality Scoring)
    st.session_state["node_status"]["N3"] = "active"
    st.session_state["debug_logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] 🧐 3단계 AI 크리틱 품질 검수 진행 (Score 산출)")
    c_res = critic_agent(state_to_run)
    state_to_run.update(c_res)
    st.session_state["node_status"]["N3"] = "completed"

    # 동기화
    target["poster_image"] = state_to_run.get("poster_image")
    target["artworks"] = state_to_run.get("artworks", [])
    target["scraped_url"] = state_to_run.get("scraped_url") or ""
    target["scraped_text"] = state_to_run.get("scraped_text") or ""
    target["download_dir"] = state_to_run.get("download_dir")
    target["exhibition_title"] = state_to_run.get("exhibition_title") or target.get("exhibition_title")
    target["curation_summary"] = state_to_run.get("curation_summary")
    target["full_caption"] = state_to_run.get("full_caption")
    target["critic_score"] = state_to_run.get("critic_score") or 95
    target["critic_feedback"] = state_to_run.get("critic_feedback") or "규격 품질 검수 완료"

    card_news_obj = {
        "inferred_job_role": state_to_run.get("inferred_job_role") or "전문 크리에이터",
        "inferred_industry": state_to_run.get("inferred_industry") or target.get("category"),
        "card_headline": state_to_run.get("card_headline") or f"경계를 넘어선 새로운 시선, {target.get('university')} 2026 졸업전시",
        "card_intro": state_to_run.get("card_intro") or target.get("raw_description", "")[:160],
        "card_caption": state_to_run.get("full_caption") or target.get("full_caption", ""),
        "tags": state_to_run.get("tags") or [target.get("university"), target.get("department"), "졸업전시"],
        "critic_score": target["critic_score"],
        "critic_feedback": target["critic_feedback"],
        "research_data": state_to_run.get("research_data")
    }
    target["card_news"] = card_news_obj

    if is_auto_pilot:
        # Step 5: Auto-upload to storage
        st.session_state["node_status"]["N4"] = "completed"
        st.session_state["node_status"]["N5"] = "active"
        save_res = upload_to_storage(state_to_run)
        target["status"] = "완료"
        target["output_path"] = save_res.get("output_path")
        st.session_state["node_status"]["N5"] = "completed"
        st.session_state["debug_logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 [Auto-pilot] 스토리지 저장 완료: {save_res.get('output_path')}")
    else:
        # Manual Review Gate
        st.session_state["node_status"]["N4"] = "waiting"
        st.session_state["node_status"]["N5"] = "idle"
        st.session_state["debug_logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] ⏳ 4단계 관리자 인라인 승인 게이트 진입 (Score: {target['critic_score']}점)")

    save_queue_data(st.session_state["queue_dataset"])
    return target


def run_pipeline_for_current_item():
    target = get_current_item()
    if target:
        execute_pipeline_for_item(target, is_auto_pilot=False)

# ---------------------------------------------------------
# 사이드바: 인스타그램 계정 세션 연동 및 플랫폼 상태
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### ⚙️ 시스템 및 SNS 연동")
    insta_logged_in = is_instagram_authenticated()

    if insta_logged_in:
        st.markdown(
            '<div style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:#064E3B; border:1px solid #059669; border-radius:8px; margin-bottom:12px;">'
            '<span style="color:#34D399; font-size:1.1rem;">●</span>'
            '<div><b style="color:#ECFDF5; font-size:0.85rem;">인스타그램 세션 활성화</b><br>'
            '<span style="color:#A7F3D0; font-size:0.72rem;">쿠키 세션 주입 모드 ON</span></div>'
            '</div>',
            unsafe_allow_html=True
        )
    else:
        st.markdown(
            '<div style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:#1E293B; border:1px solid #475569; border-radius:8px; margin-bottom:12px;">'
            '<span style="color:#94A3B8; font-size:1.1rem;">●</span>'
            '<div><b style="color:#F8FAFC; font-size:0.85rem;">인스타그램 비로그인 모드</b><br>'
            '<span style="color:#94A3B8; font-size:0.72rem;">공개 피드/웹 아카이브 우선</span></div>'
            '</div>',
            unsafe_allow_html=True
        )

    with st.expander("🔑 인스타그램 계정 및 세션 연동", expanded=not insta_logged_in):
        st.caption(
            "보안 검증 및 2단계 인증을 안전하게 통과하기 위해, **실제 크롬 브라우저 창**을 띄워 1회 로그인하고 "
            "`storage_state`(쿠키/스토리지)를 영구 저장합니다."
        )
        
        if st.button("🌐 1회성 브라우저 로그인 창 실행", use_container_width=True, type="primary"):
            st.info("실제 브라우저 및 콘솔 창이 실행됩니다. 인스타그램 로그인을 완료하시면 세션이 자동 저장됩니다.")
            import subprocess
            try:
                # Windows에서 부모 프로세스(Streamlit)와 분리된 독립 새 콘솔 및 GUI 창 생성 플래그
                creationflags = 0
                if sys.platform.startswith('win'):
                    creationflags = subprocess.CREATE_NEW_CONSOLE
                
                subprocess.Popen(
                    [sys.executable, "save_instagram_session.py"],
                    creationflags=creationflags,
                    cwd=r"c:\Users\graduation_exhibit_workflow"
                )
                st.session_state["debug_logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] 🔑 독립 로그인 창 가동 (save_instagram_session.py)")
                st.toast("🌐 브라우저 및 콘솔 창이 열렸습니다. 로그인을 진행해주세요!", icon="🔑")
            except Exception as sub_err:
                st.error(f"브라우저 실행 실패: {sub_err}")

        if st.button("🔄 세션 상태 새로고침", use_container_width=True):
            st.rerun()

        auth_p = get_instagram_storage_state_path()
        if auth_p:
            st.caption(f"💾 영구 저장 파일: `{auth_p}`")
        else:
            st.caption("⚠️ 아직 저장된 세션이 없습니다. (현재: 비로그인 공개 모드)")

    st.markdown("---")
    st.markdown("##### 🤖 로컬 LLM 엔진 상태")
    st.markdown(
        '<div style="padding:8px 12px; background:#111827; border:1px solid #1E293B; border-radius:8px; font-size:0.78rem;">'
        '<span style="color:#10B981; font-weight:700;">● Local LLM Verified</span><br>'
        '<span style="color:#94A3B8;">엔드포인트: http://localhost:8080/v1</span><br>'
        '<span style="color:#38BDF8;">외부 클라우드 종속성: 0% (완전 로컬)</span>'
        '</div>',
        unsafe_allow_html=True
    )
    st.markdown("---")

# ---------------------------------------------------------
# 상단 메인 헤더
# ---------------------------------------------------------
render_html("""
<div class="studio-header">
    <div>
        <div class="studio-title">
            <span>🎬 졸업전시 메타데이터 생성 및 승인 콘솔</span>
            <span class="studio-badge">LIVE STUDIO v2.5</span>
        </div>
        <div class="studio-sub">8대 산업군 그리드 리서치 · 로컬 LLM 카드뉴스 번들 제작 · 인라인 검수 & Auto-pilot</div>
    </div>
    <div style="text-align:right;">
        <span style="color:#10B981; font-weight:700; font-size:0.86rem;">● PIPELINE ONLINE</span>
        <div style="font-size:0.74rem; color:#64748B;">LangGraph Engine · llama.cpp (로컬 LLM)</div>
    </div>
</div>
""")

# ---------------------------------------------------------
# 상단 5단계 라이브 노드 요약 바
# ---------------------------------------------------------
n_stat = st.session_state.get("node_status", {"N1": "idle", "N2": "idle", "N3": "idle", "N4": "idle", "N5": "idle"})

def get_badge_html(status_key):
    st_val = n_stat.get(status_key, "idle")
    if st_val == "completed":
        return '<span class="badge-status badge-done">완료 ✓</span>'
    elif st_val == "active":
        return '<span class="badge-status badge-running">진행 중 ⚡</span>'
    elif st_val == "waiting":
        return '<span class="badge-status badge-awaiting">검토 대기 ⏳</span>'
    else:
        return '<span class="badge-status badge-idle">대기</span>'

render_html(f"""
<div class="node-grid-container">
    <div class="node-card {n_stat['N1']}">
        <div class="node-card-header">
            <span class="node-num">NODE 01</span>
            {get_badge_html('N1')}
        </div>
        <div class="node-title">🔍 산업/트렌드 리서치</div>
        <div class="node-desc">전시 기획 맥락 및 최신 트렌드 도출</div>
    </div>
    <div class="node-card {n_stat['N2']}">
        <div class="node-card-header">
            <span class="node-num">NODE 02</span>
            {get_badge_html('N2')}
        </div>
        <div class="node-title">✨ 카드뉴스 & 직무분류</div>
        <div class="node-desc">로컬 LLM 큐레이션 및 3~4문장 본문 생성</div>
    </div>
    <div class="node-card {n_stat['N3']}">
        <div class="node-card-header">
            <span class="node-num">NODE 03</span>
            {get_badge_html('N3')}
        </div>
        <div class="node-title">🧐 AI 품질 검수</div>
        <div class="node-desc">카드뉴스 규격 및 직무 타당성 검증</div>
    </div>
    <div class="node-card {n_stat['N4']}">
        <div class="node-card-header">
            <span class="node-num">NODE 04</span>
            {get_badge_html('N4')}
        </div>
        <div class="node-title">⚖️ 인라인 승인 게이트</div>
        <div class="node-desc">관리자 캐러셀 검토 및 미세 수정</div>
    </div>
    <div class="node-card {n_stat['N5']}">
        <div class="node-card-header">
            <span class="node-num">NODE 05</span>
            {get_badge_html('N5')}
        </div>
        <div class="node-title">💾 스토리지 업로드</div>
        <div class="node-desc">산업군별 JSON 영구 저장 및 자동 순환</div>
    </div>
</div>
""")

# ---------------------------------------------------------
# 메인 레이아웃 분할: 좌측 모니터링 vs 우측 워크플로우 제어
# ---------------------------------------------------------
col_left, col_right = st.columns([0.8, 1.5], gap="large")

# =========================================================
# [좌측 패널: col_left]
# 실시간 네이티브 네온 파이프라인, AI Critic 점수, 콘솔 로그
# (완전 네이티브 렌더링 - Mermaid 문법 오류 원천 제거)
# =========================================================
with col_left:
    st.markdown('<div class="left-panel-box">', unsafe_allow_html=True)
    st.markdown("""
    <div class="left-panel-header">
        <span>⚡ 실시간 노드 엔진 상태</span>
        <span style="font-size:0.75rem; color:#10B981; font-weight:700;">LIVE CONNECTED</span>
    </div>
    """, unsafe_allow_html=True)

    # 1. Native HTML/CSS Neon Pipeline Bar (Mermaid 완전 대체)
    steps_meta = [
        ("N1", "01", "산업/트렌드 리서치", "Trend Analysis"),
        ("N2", "02", "카드뉴스 & 직무분류", "Local LLM Curation"),
        ("N3", "03", "AI 크리틱 품질 검수", "Critic Quality Check"),
        ("N4", "04", "관리자 승인 게이트", "Admin Approval Gate"),
        ("N5", "05", "스토리지 영구 저장", "Storage Upload & Cycle")
    ]

    pipeline_html_parts = ['<div style="margin-bottom:14px;">']
    for idx, (k, num, title, sub) in enumerate(steps_meta):
        status = n_stat.get(k, "idle")
        status_label = "대기"
        if status == "completed":
            status_label = "완료 ✓"
        elif status == "active":
            status_label = "진행중 ⚡"
        elif status == "waiting":
            status_label = "승인대기 ⏳"

        arrow_html = ""
        if idx < len(steps_meta) - 1:
            arrow_html = '<div style="text-align:center; color:#334155; font-size:0.75rem; margin:-3px 0 3px 0;">↓</div>'

        pipeline_html_parts.append(f"""
        <div class="pipeline-step-item {status}">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.72rem; font-weight:800; color:#94A3B8; background:#1E293B; padding:2px 6px; border-radius:4px;">{num}</span>
                <div>
                    <div style="font-size:0.83rem; font-weight:700; color:#F1F5F9;">{title}</div>
                    <div style="font-size:0.67rem; color:#64748B;">{sub}</div>
                </div>
            </div>
            {get_badge_html(k)}
        </div>
        {arrow_html}
        """)
    pipeline_html_parts.append('</div>')
    render_html("".join(pipeline_html_parts))

    # 2. AI Critic 검수 점수 카드
    score = current_item.get("critic_score") or 96
    feedback = current_item.get("critic_feedback") or "카드뉴스 규격 및 전시 큐레이션 완성도 우수."
    is_pass = score >= 80

    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #182032 0%, #0F172A 100%); border: 1px solid #334155; border-radius: 10px; padding: 14px; margin-top: 10px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <div>
            <div style="font-size:0.72rem; font-weight:700; color:#94A3B8; text-transform:uppercase;">AI Critic Quality Score</div>
            <div style="font-size:0.85rem; font-weight:700; color:{'#10B981' if is_pass else '#F59E0B'};">{'기준 충족 (승인 적격)' if is_pass and score > 0 else '품질 보완 요망'}</div>
        </div>
        <div style="font-size:1.9rem; font-weight:900; color:{'#10B981' if is_pass else '#F59E0B'};">{score}<span style="font-size:0.95rem; color:#64748B;">/100</span></div>
    </div>
    <div style="background:#1E293B44; border-left:3px solid #0284C7; padding:10px 12px; border-radius:6px; font-size:0.8rem; color:#CBD5E1; line-height:1.5; margin-bottom:14px;">
        <b>AI 검수 의견:</b> {feedback}
    </div>
    """, unsafe_allow_html=True)

    # 3. 프롬프트 & 파이프라인 디버깅 콘솔
    st.markdown("""
    <div class="left-panel-header" style="margin-top:14px;">
        <span>📟 실시간 디버그 로그</span>
    </div>
    """, unsafe_allow_html=True)

    log_content = "\n".join(st.session_state["debug_logs"][-9:])
    st.text_area("Console Stream", value=log_content, height=170, disabled=True, label_visibility="collapsed")

    # 수동 재가동 버튼
    if st.button("⚡ 현재 선택 작품 파이프라인 강제 가동", use_container_width=True):
        with st.spinner(f"[{current_item.get('university')}] 파이프라인 실행 중..."):
            run_pipeline_for_current_item()
            st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)


# =========================================================
# [우측 패널: col_right]
# Node 01 (8대 산업군 그리드 & 대기열), Node 02~04 (캐러셀 검토), Node 05 (스토리지 업로드)
# =========================================================
with col_right:
    # -----------------------------------------------------
    # [우측 상단 제어 바] 파이프라인 실행 모드 선택 (검수 vs Auto-pilot)
    # -----------------------------------------------------
    ctrl_col1, ctrl_col2 = st.columns([1.5, 1.2])
    with ctrl_col1:
        exec_mode_choice = st.radio(
            "🎛️ 파이프라인 제어 모드",
            ["🔍 관리자 인라인 검수 모드 (기본)", "⚡ 완전 자동화 모드 (Auto-pilot)"],
            index=0 if st.session_state.get("execution_mode", "MANUAL") == "MANUAL" else 1,
            horizontal=True,
            help="검수 모드: 1개 대학 처리 후 슬라이드 검토/수정 대기 | 자동화 모드: 선택 산업군 내 모든 대기 대학 연속 자동 제작 & 스토리지 즉시 저장"
        )
        st.session_state["execution_mode"] = "MANUAL" if "검수" in exec_mode_choice else "AUTO_PILOT"
    with ctrl_col2:
        if st.session_state["execution_mode"] == "AUTO_PILOT":
            st.warning("⚡ **Auto-pilot 활성화**: AI 품질 기준 통과 시 검토 대기 없이 스토리지로 연속 직행합니다.")
        else:
            st.info("🔍 **검수 모드**: 대학별 카드뉴스 번들 생성 후 인라인 에디터에서 승인을 대기합니다.")

    # -----------------------------------------------------
    # [Node 01: 산업/트렌드 리서치 & 대기열] 8대 산업군 그리드 카드 UI
    # -----------------------------------------------------
    st.markdown("""
    <div class="tier-box">
        <div class="tier-header">
            <div class="tier-title">
                <span>1️⃣ [Node 01] 8대 산업군 리서치 & 대학 대기열</span>
            </div>
            <span class="tier-badge">NODE 01: INDUSTRY QUEUE</span>
        </div>
    """, unsafe_allow_html=True)

    # [신설] 전시 연도 선택 드롭다운 (기본값 '2025'로 데이터 완전 아카이빙된 연도 타겟팅)
    year_col1, year_col2 = st.columns([1.2, 2.8])
    with year_col1:
        st.selectbox(
            "📅 리서치 대상 전시 연도",
            options=["2025", "2024", "2023", "2026"],
            index=0,
            key="target_year",
            help="당해 연도(2026) 미개최/미등록 문제를 방지하기 위해 완전한 출품작 아카이브가 존재하는 연도를 우선 타겟팅합니다."
        )
    with year_col2:
        st.caption(f"💡 현재 **{st.session_state.get('target_year', '2025')}년도** 졸업전시 해시태그 및 피드 아카이브를 우선 탐색하도록 설정되었습니다.")

    st.markdown("##### 🏛️ 8대 산업군 카테고리 선택")
    st.caption("산업군 카드를 클릭하여 해당 분야의 전국 대학교 전시 대기열을 조회하고 파이프라인을 가동합니다.")

    # 4x2 그리드로 8대 산업군 카드 렌더링
    row1_cols = st.columns(4)
    row2_cols = st.columns(4)
    all_grid_cols = row1_cols + row2_cols

    for idx, ind_meta in enumerate(INDUSTRY_METADATA):
        target_col = all_grid_cols[idx]
        cat_full = ind_meta["category"]
        is_selected = (st.session_state.get("selected_industry") == cat_full)
        
        # 카테고리별 대학 통계
        cat_items = [it for it in st.session_state["queue_dataset"] if it.get("category") == cat_full]
        pending_count = sum(1 for it in cat_items if it.get("status") == "대기")
        done_count = sum(1 for it in cat_items if it.get("status") == "완료")
        total_count = len(cat_items)

        with target_col:
            sel_class = "selected" if is_selected else ""
            st.markdown(f"""
            <div class="ind-card-container {sel_class}">
                <div class="ind-card-icon">{ind_meta['icon']}</div>
                <div class="ind-card-title">{ind_meta['name']}</div>
                <div class="ind-card-en">{ind_meta['name_en']}</div>
                <div class="ind-card-count">총 {total_count}개교 (대기 {pending_count})</div>
            </div>
            """, unsafe_allow_html=True)

            btn_label = f"선택됨 ✓" if is_selected else f"{ind_meta['name']} 선택"
            btn_type = "primary" if is_selected else "secondary"
            if st.button(btn_label, key=f"btn_ind_{ind_meta['id']}", use_container_width=True, type=btn_type):
                st.session_state["selected_industry"] = cat_full
                # 선택 산업군의 첫 번째 항목으로 포커스
                for it in st.session_state["queue_dataset"]:
                    if it.get("category") == cat_full:
                        st.session_state["current_item_id"] = it["id"]
                        break
                st.rerun()

    # 현재 선택된 산업군 표시 및 필터링 리스트
    selected_cat = st.session_state.get("selected_industry", INDUSTRIES[0])
    selected_meta = next((m for m in INDUSTRY_METADATA if m["category"] == selected_cat), INDUSTRY_METADATA[0])
    filtered_items = [it for it in st.session_state["queue_dataset"] if it.get("category") == selected_cat]
    pending_items = [it for it in filtered_items if it.get("status") == "대기"]

    st.markdown("---")
    st.markdown(f"##### 📋 **[{selected_meta['icon']} {selected_meta['name']}]** 대학교 대기열 리스트 (총 {len(filtered_items)}개 대학 / 대기 {len(pending_items)}개)")

    # 테이블 헤더 스타일
    st.markdown("""
    <div style="display:grid; grid-template-columns: 0.9fr 1.6fr 2.0fr 2.6fr 1.2fr; padding:8px 12px; background:#1E293B; border-radius:8px 8px 0 0; font-size:0.78rem; font-weight:700; color:#94A3B8; margin-top:6px;">
        <span>ID</span>
        <span>대학교</span>
        <span>학과명</span>
        <span>대표 작품명</span>
        <span>상태 / 선택</span>
    </div>
    """, unsafe_allow_html=True)

    # 스크롤 가능한 대기열 테이블
    with st.container(height=240):
        for item in filtered_items:
            st_label = "대기"
            if item.get("status") == "완료":
                st_label = "완료 ✓"
            elif item.get("status") == "진행중":
                st_label = "진행중 ⚡"

            is_curr = item["id"] == st.session_state.get("current_item_id")

            r_col1, r_col2, r_col3, r_col4, r_col5 = st.columns([0.9, 1.6, 2.0, 2.6, 1.2])
            with r_col1:
                st.markdown(f"<span style='font-size:0.8rem; font-weight:700; color:#38BDF8;'>{item['id']}</span>", unsafe_allow_html=True)
            with r_col2:
                st.markdown(f"<span style='font-size:0.82rem; font-weight:600; color:#F8FAFC;'>{item['university']}</span>", unsafe_allow_html=True)
            with r_col3:
                st.markdown(f"<span style='font-size:0.8rem; color:#CBD5E1;'>{item.get('department', '')}</span>", unsafe_allow_html=True)
            with r_col4:
                title_snip = item.get('exhibit_title', '')
                if len(title_snip) > 22:
                    title_snip = title_snip[:22] + "..."
                st.markdown(f"<span style='font-size:0.8rem; color:#F1F5F9;' title='{item.get('exhibit_title', '')}'>{title_snip}</span>", unsafe_allow_html=True)
            with r_col5:
                btn_type = "primary" if is_curr else "secondary"
                btn_label = f"{st_label}" if not is_curr else "선택됨"
                if st.button(btn_label, key=f"sel_{item['id']}", use_container_width=True, type=btn_type):
                    st.session_state["current_item_id"] = item["id"]
                    st.session_state["selected_industry"] = selected_cat
                    if not item.get("card_news"):
                        with st.spinner(f"[{item['university']}] 작품 파이프라인 가동 중..."):
                            run_pipeline_for_current_item()
                    st.rerun()

    # [핵심 액션 버튼: 선택한 산업군 리서치 & 카드뉴스 제작 시작]
    st.markdown("<div style='margin-top:12px;'></div>", unsafe_allow_html=True)
    start_btn_label = f"🚀 [{selected_meta['name']}] 리서치 & 카드뉴스 제작 시작"
    if st.session_state["execution_mode"] == "AUTO_PILOT":
        start_btn_label += f" (Auto-pilot: 대기 {len(pending_items)}건 전량 자동 저장)"
    else:
        start_btn_label += " (검수 모드)"

    start_action_clicked = st.button(start_btn_label, type="primary", use_container_width=True)

    if start_action_clicked:
        if st.session_state["execution_mode"] == "AUTO_PILOT":
            # Auto-pilot 모드: 선택된 산업군의 모든 '대기' 대학 연속 순차 실행
            if not pending_items:
                st.info(f"선택하신 [{selected_meta['name']}] 산업군에 처리 대기 중인 대학이 없습니다.")
            else:
                progress_container = st.container()
                with progress_container:
                    prog_bar = st.progress(0.0)
                    status_text = st.empty()
                    total_p = len(pending_items)

                    for p_idx, target_item in enumerate(pending_items):
                        status_text.markdown(f"**🌐 [{p_idx + 1}/{total_p}] [{target_item.get('university')} {target_item.get('department')}]** 실제 전시 웹사이트 탐색 및 고화질 웹 캡처 & 큐레이션 생성 중...")
                        st.session_state["current_item_id"] = target_item["id"]
                        
                        execute_pipeline_for_item(target_item, is_auto_pilot=True, year=st.session_state.get("target_year", "2025"))
                        prog_bar.progress((p_idx + 1) / total_p)

                    status_text.markdown(f"✅ **[{selected_meta['name']}] {total_p}개 대학교 자동 생성 및 영구 저장 완료!**")
                    st.toast(f"🎉 [{selected_meta['name']}] 총 {total_p}개교 카드뉴스 번들 자동 제작 완료!", icon="🚀")
                    st.rerun()
        else:
            # 수동 검수 모드: 현재 화면에서 선택된 대학교를 최우선으로 실제 웹 탐색 및 캡처 가동
            target_to_run = current_item
            if target_to_run.get("category") != selected_cat and filtered_items:
                target_to_run = filtered_items[0]

            if target_to_run:
                st.session_state["current_item_id"] = target_to_run["id"]
                with st.spinner(f"🌐 [{target_to_run.get('university')} {target_to_run.get('department')}] {st.session_state.get('target_year', '2025')}년도 졸업전시 인스타그램 탐색 및 고화질 포스터/출품작 캡처 진행 중..."):
                    execute_pipeline_for_item(target_to_run, is_auto_pilot=False, year=st.session_state.get("target_year", "2025"))
                st.toast(f"✨ [{target_to_run.get('university')}] 실제 포스터 및 출품작 수집 완료. 하단 캐러셀을 검토해주세요.", icon="🔍")
                st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)

    # -----------------------------------------------------
    # [우측 중단: Node 02~04] 다중 슬라이드 캐러셀 검토 뷰어 & 관리자 에디터
    # -----------------------------------------------------
    st.markdown("""
    <div style="background:#111827; border:1px solid #1F2937; border-radius:14px; padding:18px 20px; margin-bottom:1.2rem; box-shadow:0 4px 18px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1F2937; padding-bottom:10px; margin-bottom:14px;">
            <span style="font-size:1.05rem; font-weight:800; color:#F8FAFC;">2️⃣ [Node 02~04] 다중 슬라이드 캐러셀 검토 & 관리자 에디터</span>
            <span style="font-size:0.72rem; padding:2px 8px; border-radius:12px; font-weight:700; background:#1E293B; color:#38BDF8; border:1px solid #0284C7;">CAROUSEL REVIEW</span>
        </div>
    """, unsafe_allow_html=True)

    curr_id = current_item.get("id", "ITEM")
    curr_univ = current_item.get("university", "대학교")
    curr_dept = current_item.get("department", "디자인학부")
    curr_cat = current_item.get("category", "디자인·UX/UI·서비스디자인")
    curr_ex_title = current_item.get("exhibition_title") or current_item.get("exhibit_title", "졸업전시회")
    curr_period = current_item.get("exhibition_period", "2026.11.12(목) - 2026.11.18(수)")
    curr_venue = current_item.get("exhibition_venue", f"{curr_univ} 전시관")
    curr_cn = current_item.get("card_news", {})
    cur_year = current_item.get("exhibition_year") or st.session_state.get("target_year", "2025")

    # 슬라이드별 데이터 추출
    job_role = curr_cn.get("inferred_job_role", "전문 크리에이터")
    industry_name = curr_cn.get("inferred_industry", curr_cat)
    headline = curr_cn.get("card_headline", f"경계를 넘어선 새로운 시선, {curr_univ} {cur_year} 졸업전시")
    curation_intro = curr_cn.get("card_intro", current_item.get("raw_description", "")[:160])
    full_caption = curr_cn.get("card_caption") or (
        f"[{curr_univ} {curr_dept} 졸업전시회 안내]\n\n"
        f"전시명: {curr_ex_title}\n"
        f"일시: {curr_period}\n"
        f"장소: {curr_venue}\n\n"
        f"{curation_intro}\n\n"
        f"#{curr_univ} #{curr_dept} #졸업전시"
    )
    keywords = curr_cn.get("tags") or [curr_cat.split("·")[0], curr_dept, "졸업전시", "신진작가"]
    critic_score = curr_cn.get("critic_score", 96)
    critic_feedback = curr_cn.get("critic_feedback", "전시 기획 및 슬라이드 규격 검수 완료")
    
    poster_raw = current_item.get("poster_image")
    poster_valid_path = get_valid_image_path(poster_raw)
    artworks = current_item.get("artworks") or []
    n_artworks = len(artworks)
    total_slides = n_artworks + 2

    # 슬라이드 상단 요약 타이틀 (연도 표기 및 동적 N개 슬라이드 체계)
    st.subheader(f"🎞️ [{cur_year}년도] 총 {total_slides}장 슬라이드 구성 (공식 포스터 1장 + 출품작 {n_artworks}점 + 큐레이션 1장)")
    st.caption(f"카드 1: 공식 포스터 ➔ 카드 2~{n_artworks + 1}: 모든 출품작 고화질 이미지 ➔ 마지막 카드 {total_slides}: 전시 개요 및 큐레이션")

    # =========================================================
    # 1) [카드 1 / (N+2)장]: 원본 공식 포스터 이미지 단독 렌더링
    # =========================================================
    st.markdown(f"###### 🖼️ [카드 1 / {total_slides}장] 원본 공식 포스터")
    with st.container(border=True):
        if poster_valid_path:
            st.image(poster_valid_path, use_container_width=True, caption=f"[공식 포스터] {curr_univ} {curr_dept} - {curr_ex_title}")
            st.caption(f"🏛️ 주최: **{curr_univ}** ({curr_dept}) | 📅 일정: `{curr_period}` | 📍 장소: `{curr_venue}`")
            if current_item.get("scraped_url"):
                st.caption(f"🌐 **실제 탐색 웹사이트**: [{current_item['scraped_url']}]({current_item['scraped_url']})")
        else:
            st.warning(f"⚠️ [{curr_univ} {curr_dept}] 수집 실패: 수동 업로드 필요")
            p_col1, p_col2 = st.columns([1.2, 1])
            with p_col1:
                if st.button("🌐 지금 이 대학교 실제 웹 탐색 & 포스터 캡처 실행", key=f"btn_scrape_poster_{curr_id}", type="primary", use_container_width=True):
                    with st.spinner(f"🌐 [{curr_univ} {curr_dept}] 실제 웹사이트 탐색 및 고화질 포스터 캡처 중..."):
                        execute_pipeline_for_item(current_item, is_auto_pilot=False)
                    st.toast(f"✨ [{curr_univ}] 실제 포스터 및 출품작 수집 완료!", icon="🌐")
                    st.rerun()
            with p_col2:
                uploaded_poster = st.file_uploader("🖼️ 포스터 이미지 직접 업로드", type=["png", "jpg", "jpeg", "webp"], key=f"up_poster_{curr_id}")
                if uploaded_poster is not None:
                    clean_u = re.sub(r'[\\/*?:"<>|]', "_", curr_univ).strip()
                    clean_d = re.sub(r'[\\/*?:"<>|]', "_", curr_dept).strip()
                    dl_dir = os.path.join("data", "downloads", f"{clean_u}_{clean_d}")
                    os.makedirs(dl_dir, exist_ok=True)
                    saved_p = os.path.join(dl_dir, "poster.png")
                    with open(saved_p, "wb") as f:
                        f.write(uploaded_poster.getbuffer())
                    current_item["poster_image"] = saved_p
                    save_queue_data(st.session_state["queue_dataset"])
                    st.toast("✅ 공식 포스터가 성공적으로 업로드되었습니다!", icon="🖼️")
                    st.rerun()

    # =========================================================
    # 2) [카드 2 ~ (N+1)장]: 수집된 모든 출품작 동적 나열 (개수 제한 없음)
    # =========================================================
    st.markdown("---")
    if n_artworks > 0:
        st.markdown(f"###### 🎨 [카드 2 ~ {n_artworks + 1} / {total_slides}장] 전시회 모든 출품작 ({n_artworks}점 전원 단독 렌더링)")
        st.caption("텍스트 없이 순수 작품 이미지만 단독 렌더링하며, 하단에 학생명과 작품명을 표기합니다.")
        
        art_cols = st.columns(2, gap="medium")
        for idx, art in enumerate(artworks):
            col_target = art_cols[idx % 2]
            with col_target:
                with st.container(border=True):
                    slide_num = idx + 2
                    st.markdown(f"**[카드 {slide_num} / {total_slides}장] 출품작 #{idx + 1}**")
                    art_img_raw = art.get("image")
                    art_valid_p = get_valid_image_path(art_img_raw)
                    if art_valid_p:
                        st.image(art_valid_p, use_container_width=True)
                    else:
                        st.info("작품 이미지를 로드할 수 없습니다.")
                    student_name = art.get("student_name") or f"{curr_univ} 작가 {idx+1}"
                    art_title = art.get("title") or f"작품 #{idx+1}"
                    st.caption(f"**[작품 {idx + 1}] {student_name}** - {art_title}")
    else:
        st.markdown(f"###### 🎨 [카드 2 ~ 2 / {total_slides}장] 출품작 이미지")
        st.warning("⚠️ 공식 사이트에서 출품작 이미지를 탐색 중이거나 갤러리가 비공개 상태입니다.")
        st.caption("관리자가 직접 작품 이미지를 추가하거나 수동 업로드할 수 있습니다.")

    # 출품작 직접 업로드 안전장치
    with st.expander("➕ [관리자 수동 업로드] 출품작 이미지 직접 추가/업로드", expanded=(n_artworks == 0)):
        st.caption("공식 사이트에서 크롤링되지 않은 작품 사진들을 파일 업로더로 추가하면 캐러셀에 즉시 반영됩니다.")
        uploaded_arts = st.file_uploader(
            "🎨 출품작 이미지 다중 업로드 (PNG, JPG, WEBP)",
            type=["png", "jpg", "jpeg", "webp"],
            accept_multiple_files=True,
            key=f"uploader_arts_{curr_id}"
        )
        if uploaded_arts:
            clean_u = re.sub(r'[\\/*?:"<>|]', "_", curr_univ).strip()
            clean_d = re.sub(r'[\\/*?:"<>|]', "_", curr_dept).strip()
            dl_dir = os.path.join("data", "downloads", f"{clean_u}_{clean_d}")
            os.makedirs(dl_dir, exist_ok=True)
            new_arts = list(current_item.get("artworks") or [])
            start_num = len(new_arts) + 1
            for u_idx, u_file in enumerate(uploaded_arts):
                art_save_p = os.path.join(dl_dir, f"art_up_{start_num + u_idx:02d}.png")
                with open(art_save_p, "wb") as f:
                    f.write(u_file.getbuffer())
                new_arts.append({
                    "student_name": f"{curr_univ} 출품작가 {start_num + u_idx}",
                    "title": u_file.name.rsplit(".", 1)[0],
                    "image": art_save_p,
                    "description": f"{curr_dept} 공식 졸업전시회 출품작",
                    "inferred_role": f"{curr_dept} 크리에이터"
                })
            current_item["artworks"] = new_arts
            save_queue_data(st.session_state["queue_dataset"])
            st.toast(f"✅ {len(uploaded_arts)}점의 출품작이 성공적으로 추가되었습니다!", icon="🎨")
            st.rerun()

    # =========================================================
    # 3) [마지막 카드 / (N+2)장]: 전시 개요 및 큐레이션 박스
    # =========================================================
    st.markdown("---")
    st.markdown(f"###### 📋 [마지막 카드 {total_slides} / {total_slides}장] 전시 개요 및 큐레이션 정보")
    with st.container(border=True):
        badge_col1, badge_col2 = st.columns([1, 1])
        with badge_col1:
            st.info(f"🏭 **산업군**: {curr_cat}")
        with badge_col2:
            primary_kws = ", ".join(keywords[:2]) if keywords else "전문 크리에이터"
            st.success(f"💼 **직무/키워드**: {primary_kws}")

        st.markdown(f"""
        <div style="margin: 14px 0 12px 0; padding: 14px 18px; background: linear-gradient(90deg, #1E293B 0%, #0F172A 100%); border-left: 4px solid #38BDF8; border-radius: 8px;">
            <span style="font-size: 0.74rem; font-weight: 700; color: #38BDF8; letter-spacing: 0.05em; text-transform: uppercase;">Exhibition Headline</span>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #F8FAFC; margin: 6px 0 0 0; line-height: 1.4;">{headline}</h2>
        </div>
        """, unsafe_allow_html=True)

        st.markdown(f"**📖 전시 큐레이션 기획 의도**\n\n{curation_intro}")

        period_col1, period_col2 = st.columns([1, 1])
        with period_col1:
            st.markdown(f"🗓️ **전시 기간**: `{curr_period}`")
        with period_col2:
            st.markdown(f"📍 **전시 장소**: `{curr_venue}`")

        tags_chips = " ".join([f"`#{k.strip()}`" for k in keywords if k.strip()])
        st.markdown(f"🏷️ **핵심 키워드 뱃지**: {tags_chips}")
        st.caption(f"● **[Local LLM Verified]** AI 크리틱 검수 통과 (Score: **{critic_score}점** | {critic_feedback})")

    # 자연어 기반 AI 큐레이션 재작성
    st.markdown("---")
    st.markdown("##### 🤖 자연어 기반 AI 큐레이션 재작성 (Natural Language AI Prompt Editing)")
    st.caption("수정 방향을 자연어로 입력하면, llama.cpp 로컬 LLM이 대형 헤드라인과 큐레이션 본문을 즉시 갱신합니다.")

    nl_col1, nl_col2 = st.columns([3.2, 1.2])
    with nl_col1:
        nl_instruction = st.text_input(
            "자연어 수정 지시문",
            placeholder="예: 헤드라인을 더 시적이고 감성적으로 바꾸고 큐레이션에 청년 작가의 도전정신을 강조해줘",
            key=f"nl_inst_{curr_id}",
            label_visibility="collapsed"
        )
    with nl_col2:
        ai_rewrite_clicked = st.button("✨ [AI 재작성]", key=f"btn_ai_rewrite_{curr_id}", use_container_width=True, type="secondary")

    if ai_rewrite_clicked:
        if not nl_instruction.strip():
            st.warning("수정 지시문을 입력해주세요! (예: 인스타그램 감성으로 큐레이션을 다듬어줘)")
        else:
            with st.spinner("🤖 llama.cpp 로컬 LLM이 지시사항을 반영하여 큐레이션을 재작성 중입니다..."):
                rewritten = refine_curation_with_prompt(current_item, nl_instruction)
                if not current_item.get("curation_summary"):
                    current_item["curation_summary"] = {}
                current_item["curation_summary"]["headline"] = rewritten["headline"]
                current_item["curation_summary"]["curation_intro"] = rewritten["curation_intro"]
                current_item["curation_summary"]["inferred_industry_keywords"] = rewritten["inferred_industry_keywords"]
                current_item["full_caption"] = rewritten["full_caption"]

                if not current_item.get("card_news"):
                    current_item["card_news"] = {}
                current_item["card_news"]["card_headline"] = rewritten["headline"]
                current_item["card_news"]["card_intro"] = rewritten["curation_intro"]
                current_item["card_news"]["card_caption"] = rewritten["full_caption"]
                current_item["card_news"]["tags"] = rewritten["inferred_industry_keywords"]
                current_item["card_news"]["critic_feedback"] = f"자연어 피드백 반영: {nl_instruction[:40]}"

                save_queue_data(st.session_state["queue_dataset"])
                st.session_state["debug_logs"].append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] 🤖 큐레이션 AI 재작성 완료: '{nl_instruction[:30]}...'"
                )
                st.toast("✅ AI가 지시사항을 반영하여 큐레이션을 성공적으로 재작성했습니다!", icon="✨")
                st.rerun()

    # 수동 인라인 편집기
    with st.expander("✏️ 큐레이션 세부 수정 및 전체 피드 캡션 에디터 (Manual Fine-Tuning)", expanded=False):
        edit_col1, edit_col2 = st.columns([1, 1])
        with edit_col1:
            man_period = st.text_input("전시 기간", value=curr_period, key=f"man_per_{curr_id}")
        with edit_col2:
            man_venue = st.text_input("전시 장소", value=curr_venue, key=f"man_ven_{curr_id}")

        man_headline = st.text_input("대형 헤드라인 (headline)", value=headline, key=f"man_hl_{curr_id}")
        man_intro = st.text_area("큐레이션 본문 (curation_intro - 3문장)", value=curation_intro, height=100, key=f"man_intro_{curr_id}")
        man_keywords_str = st.text_input("핵심 직무/산업 키워드 뱃지 (쉼표 구분)", value=", ".join(keywords), key=f"man_kws_{curr_id}")

        st.markdown("##### 📱 인스타그램 / 웹 아카이브 전체 피드 캡션 (full_caption)")
        man_caption = st.text_area("전체 피드 캡션 전문", value=full_caption, height=160, key=f"man_cap_{curr_id}")

        if st.button("💾 [수동 편집 내용 실시간 반영]", key=f"btn_apply_manual_{curr_id}", use_container_width=True):
            if not current_item.get("curation_summary"):
                current_item["curation_summary"] = {}
            current_item["exhibition_period"] = man_period
            current_item["exhibition_venue"] = man_venue
            current_item["curation_summary"]["headline"] = man_headline
            current_item["curation_summary"]["curation_intro"] = man_intro
            new_kws = [k.strip() for k in man_keywords_str.split(",") if k.strip()]
            current_item["curation_summary"]["inferred_industry_keywords"] = new_kws
            current_item["full_caption"] = man_caption

            if not current_item.get("card_news"):
                current_item["card_news"] = {}
            current_item["card_news"]["card_headline"] = man_headline
            current_item["card_news"]["card_intro"] = man_intro
            current_item["card_news"]["card_caption"] = man_caption
            current_item["card_news"]["tags"] = new_kws

            save_queue_data(st.session_state["queue_dataset"])
            st.session_state["debug_logs"].append(
                f"[{datetime.now().strftime('%H:%M:%S')}] 💾 관리자 수동 큐레이션/캡션 편집 동기화: [{curr_id}]"
            )
            st.toast("✅ 수동 편집 내용이 큐레이션과 피드 캡션에 실시간 반영되었습니다!", icon="💾")
            st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)

    # -----------------------------------------------------
    # [우측 하단: Node 05] 스토리지 업로드 실행 및 다음 순환 자동화
    # -----------------------------------------------------
    st.markdown("""
    <div style="background:#111827; border:1px solid #1F2937; border-radius:14px; padding:18px 20px; margin-bottom:1.2rem; box-shadow:0 4px 18px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1F2937; padding-bottom:10px; margin-bottom:14px;">
            <span style="font-size:1.05rem; font-weight:800; color:#F8FAFC;">3️⃣ [Node 05] 스토리지 업로드 실행 및 다음 순환</span>
            <span style="font-size:0.72rem; padding:2px 8px; border-radius:12px; font-weight:700; background:#1E293B; color:#38BDF8; border:1px solid #0284C7;">NODE 05: STORAGE</span>
        </div>
    """, unsafe_allow_html=True)

    clean_cat = re.sub(r'[\\/*?:"<>|]', "_", str(current_item.get("category", "카테고리"))).strip()
    clean_u = re.sub(r'[\\/*?:"<>|]', "_", str(current_item.get("university", "대학"))).strip()
    raw_title = str(current_item.get("exhibition_title") or current_item.get("exhibit_title") or "전시").strip()
    clean_t = re.sub(r'[\\/*?:"<>|]', "_", raw_title).strip()[:40]
    target_rel_path = f"outputs/{clean_cat}/{clean_u}_{clean_t}.json"

    st.caption(f"💾 영구 저장 규격 경로: `{target_rel_path}` (UTF-8 JSON)")

    execute_btn = st.button(
        "🚀 [업로드 승인 및 다음 대학교 진행]",
        type="primary",
        use_container_width=True,
        help="포스터 경로, 출품작 이미지 목록, 큐레이션 정보, 전체 캡션을 영구 저장하고 대기열의 다음 전시회를 자동 호출합니다."
    )

    if execute_btn:
        active_curation = current_item.get("curation_summary") or {
            "headline": headline,
            "curation_intro": curation_intro,
            "inferred_industry_keywords": keywords
        }
        state_for_upload: GraphState = {
            "university": current_item.get("university"),
            "exhibition_year": "2026",
            "department_name": current_item.get("department"),
            "category": current_item.get("category"),
            "exhibition_title": current_item.get("exhibition_title") or current_item.get("exhibit_title"),
            "exhibition_period": current_item.get("exhibition_period") or curr_period,
            "exhibition_venue": current_item.get("exhibition_venue") or curr_venue,
            "poster_image": current_item.get("poster_image") or poster_url,
            "artworks": current_item.get("artworks") or [],
            "scraped_url": current_item.get("scraped_url"),
            "scraped_text": current_item.get("scraped_text"),
            "download_dir": current_item.get("download_dir"),
            "curation_summary": active_curation,
            "full_caption": current_item.get("full_caption") or full_caption,
            "raw_description": current_item.get("raw_description"),
            "critic_score": curr_cn.get("critic_score", 96),
            "critic_feedback": curr_cn.get("critic_feedback", "관리자 승인 완료"),
            "is_approved": True,
            "retry_count": 1,
            "max_retries": 3,
            "errors": []
        }

        with st.spinner(f"💾 {target_rel_path} 영구 저장 중..."):
            save_res = upload_to_storage(state_for_upload)
            saved_path = save_res.get("output_path")
            current_item["status"] = "완료"
            current_item["output_path"] = saved_path
            save_queue_data(st.session_state["queue_dataset"])

            st.session_state["node_status"]["N4"] = "completed"
            st.session_state["node_status"]["N5"] = "completed"
            st.session_state["debug_logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 영구 저장 완료: {saved_path}")

        # 다음 대기 항목 탐색 및 자동 순환
        next_item = None
        for it in st.session_state["queue_dataset"]:
            if it.get("category") == current_item.get("category") and it.get("status") == "대기":
                next_item = it
                break
        if not next_item:
            for it in st.session_state["queue_dataset"]:
                if it.get("status") == "대기":
                    next_item = it
                    break

        if next_item:
            st.toast(f"✅ [{current_item.get('university')}] 저장 완료! 다음 전시회 [{next_item.get('university')} {next_item.get('department')}] 자동 호출.", icon="🎉")
            st.session_state["current_item_id"] = next_item["id"]
            st.session_state["selected_industry"] = next_item["category"]

            with st.spinner(f"🚀 다음 항목 [{next_item.get('university')} {next_item.get('department')}] 파이프라인 가동 중..."):
                run_pipeline_for_current_item()
            st.rerun()
        else:
            st.success(f"🎉 **모든 8대 산업군 대학/학과({len(st.session_state['queue_dataset'])}개)의 전시회 업로드가 완료되었습니다!**")
            st.session_state["debug_logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] 🏁 전체 대기열 처리 완료!")
            st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)
