"""
Data Intelligence Runner and Orchestration CLI
Executes the verified data pipeline across 4 key domains:
1. Professor Intelligence
2. Industry-Academia RFP
3. Brand Open IP
4. Professional Mentors
Plus Common Taxonomy Export.
"""

import os
import sys
import uuid
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from .models import STANDARD_TAXONOMY
from .graph import build_data_intelligence_graph
from .state import DataIntelligenceState

def export_taxonomy():
    """8대 표준 Taxonomy 파일을 data/ 및 my-exhibit-platform/data/ 에 생성"""
    target_files = ["data/taxonomy.json", "my-exhibit-platform/data/taxonomy.json"]
    for tf in target_files:
        os.makedirs(os.path.dirname(tf), exist_ok=True)
        with open(tf, "w", encoding="utf-8") as f:
            json.dump(STANDARD_TAXONOMY, f, ensure_ascii=False, indent=2)
    print("Exported standard taxonomy to data/ and my-exhibit-platform/data/")

def run_data_intelligence_pipeline(
    domain: str = "all",
    raw_discovered: Optional[List[Dict[str, Any]]] = None,
    provider_mode: str = "auto",
    checkpointer=None,
    thread_id: Optional[str] = None
) -> DataIntelligenceState:
    """
    Data Intelligence Pipeline 실행기.
    주어진 raw_discovered 데이터 또는 기존 data/*.json의 데이터를 검증 및 업데이트.
    """
    export_taxonomy()
    
    run_id = f"run-di-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now().isoformat()
    
    # 입력 데이터가 없는 경우 기존 파일에서 로드하여 파이프라인 검증 통과
    items_to_process = raw_discovered or []
    if not items_to_process:
        domain_files = {
            "professors": "data/professors.json",
            "rfp": "data/rfp.json",
            "brand_assets": "data/brand_assets.json",
            "mentors": "data/mentors.json"
        }
        for dom, fpath in domain_files.items():
            if domain in ["all", dom] and os.path.exists(fpath):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            items_to_process.extend(data)
                except Exception:
                    pass

    initial_state: DataIntelligenceState = {
        "run_id": run_id,
        "thread_id": thread_id or f"thread-{uuid.uuid4().hex[:8]}",
        "domain": domain,
        "provider_mode": provider_mode,
        "started_at": now_str,
        "current_step": "init",
        "current_node": "source_discovery",
        "status": "starting",
        "retry_count": 0,
        "max_retries": 2,
        "errors": [],
        "raw_discovered": items_to_process,
        "extracted_records": [],
        "source_evidences": [],
        "normalized_records": [],
        "matched_entities": [],
        "verified_records": [],
        "flagged_records": [],
        "rejected_records": [],
        "deduplicated_records": [],
        "detected_changes": [],
        "updated_db_counts": {},
        "audit_logs": [],
        "sync_results": {},
        "needs_human_review": False,
        "review_reasons": [],
        "is_approved": False
    }

    graph = build_data_intelligence_graph(checkpointer=checkpointer)
    config = {"configurable": {"thread_id": initial_state["thread_id"]}} if checkpointer else None
    
    final_state = graph.invoke(initial_state, config=config) if config else graph.invoke(initial_state)
    return final_state

if __name__ == "__main__":
    result = run_data_intelligence_pipeline(domain="all")
    print(f"Data Intelligence Pipeline Run Completed! Run ID: {result.get('run_id')}, Status: {result.get('status')}")
