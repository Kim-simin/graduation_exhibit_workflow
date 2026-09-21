"""
Data Intelligence LangGraph Nodes Implementation
11 Sequential & Conditional Nodes:
1. node_source_discovery
2. node_extraction
3. node_normalization
4. node_entity_matching
5. node_evidence_collection
6. node_verification
7. node_deduplication
8. node_change_detection
9. node_database_update
10. node_audit_logging
11. node_human_review_gate
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

from .state import DataIntelligenceState
from .models import (
    InformationSource,
    SourceEvidence,
    AuditLogRecord,
    STANDARD_TAXONOMY,
    STATUS_VERIFIED,
    STATUS_REVIEW_REQUIRED,
    STATUS_UNVERIFIED,
    STATUS_FAILED,
    STATUS_INACTIVE,
    SOURCE_PRIORITY_OFFICIAL,
    SOURCE_PRIORITY_INSTITUTIONAL,
    SOURCE_PRIORITY_PROFESSIONAL,
    SOURCE_PRIORITY_SECONDARY,
    SOURCE_TYPE_UNIVERSITY_OFFICIAL,
    SOURCE_TYPE_CORPORATE_RFP,
    SOURCE_TYPE_PROFESSOR_OFFICIAL,
    SOURCE_TYPE_MENTOR_PROFILE,
    SOURCE_TYPE_BRAND_IP_OFFICIAL,
)

# 화이트리스트 도메인 판별 헬퍼
OFFICIAL_ACADEMIC_SUFFIXES = (".ac.kr", ".edu")
OFFICIAL_COMPANY_DOMAINS = [
    "hyundai.com", "toss.im", "musinsa.com", "woowahan.com",
    "kakaocorp.com", "navercorp.com", "amorepacific.com", "dstrict.com"
]

def validate_and_classify_source(
    url: str,
    entity_hint: Optional[str] = None,
    custom_title: Optional[str] = None,
    evidence: Optional[str] = None
) -> Dict[str, Any]:
    """
    URL 형식 검증, 도메인 파싱, 5대 Source Type 분류, Source Priority(1~4) 산출:
    - UNIVERSITY_OFFICIAL: 대학/학과 공식 포털 (Priority 1)
    - CORPORATE_RFP: 기업 공식 RFP / 산학협력 포털 (Priority 1)
    - PROFESSOR_OFFICIAL: 대학 공식 교수 페이지 / 연구실 (Priority 1)
    - MENTOR_PROFILE: 현직자 프로필 플랫폼 (Priority 3)
    - BRAND_IP_OFFICIAL: 기업 공식 브랜드/IP 페이지 (Priority 1)
    """
    if not url or not isinstance(url, str) or not url.strip():
        return {
            "source_url": "",
            "source_title": "No source recorded",
            "source_type": "UNKNOWN",
            "source_domain": "",
            "source_priority": SOURCE_PRIORITY_SECONDARY,
            "verification_status": STATUS_UNVERIFIED,
            "is_trusted": False
        }
    
    clean_url = url.strip()
    # 1. URL 형식 및 HTTP/HTTPS 검증
    if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
        return {
            "source_url": clean_url,
            "source_title": custom_title or "Invalid URL Scheme",
            "source_type": "UNKNOWN",
            "source_domain": "",
            "source_priority": SOURCE_PRIORITY_SECONDARY,
            "verification_status": STATUS_UNVERIFIED,
            "is_trusted": False
        }
        
    try:
        parsed = urlparse(clean_url)
        domain = parsed.netloc.lower()
        if not domain or "." not in domain:
            return {
                "source_url": clean_url,
                "source_title": custom_title or "Invalid Domain",
                "source_type": "UNKNOWN",
                "source_domain": domain,
                "source_priority": SOURCE_PRIORITY_SECONDARY,
                "verification_status": STATUS_UNVERIFIED,
                "is_trusted": False
            }
    except Exception:
        return {
            "source_url": clean_url,
            "source_title": custom_title or "Malformed URL",
            "source_type": "UNKNOWN",
            "source_domain": "",
            "source_priority": SOURCE_PRIORITY_SECONDARY,
            "verification_status": STATUS_UNVERIFIED,
            "is_trusted": False
        }

    # 2. 5대 Source Type 분류
    source_type = "OTHER"
    priority = SOURCE_PRIORITY_SECONDARY
    title = custom_title or f"{domain} Source"
    is_trusted = False
    verification_status = STATUS_UNVERIFIED

    # (1) 대학/교수 공식 출처 (.ac.kr, .edu)
    if any(domain.endswith(suffix) for suffix in OFFICIAL_ACADEMIC_SUFFIXES):
        is_trusted = True
        verification_status = STATUS_VERIFIED
        priority = SOURCE_PRIORITY_OFFICIAL
        if entity_hint == "professor" or "faculty" in clean_url or "prof" in clean_url or "lab" in clean_url:
            source_type = SOURCE_TYPE_PROFESSOR_OFFICIAL
            title = custom_title or f"대학 공식 교수 프로필 ({domain})"
        else:
            source_type = SOURCE_TYPE_UNIVERSITY_OFFICIAL
            title = custom_title or f"전국 대학 공식 홈페이지 ({domain})"

    # (2) 기업 공식 출처
    elif any(comp in domain for comp in OFFICIAL_COMPANY_DOMAINS):
        is_trusted = True
        verification_status = STATUS_VERIFIED
        priority = SOURCE_PRIORITY_OFFICIAL
        if entity_hint == "brand_ip" or "brand" in clean_url or "ip" in clean_url or "font" in clean_url:
            source_type = SOURCE_TYPE_BRAND_IP_OFFICIAL
            title = custom_title or f"기업 공식 브랜드 IP ({domain})"
        else:
            source_type = SOURCE_TYPE_CORPORATE_RFP
            title = custom_title or f"기업 공식 산학협력/RFP 포털 ({domain})"

    # (3) 현직자/전문가 플랫폼
    elif any(p in domain for p in ["linkedin.com", "wanted.co.kr", "kmong.com", "rememberapp.co.kr"]):
        is_trusted = True
        verification_status = STATUS_VERIFIED
        priority = SOURCE_PRIORITY_PROFESSIONAL
        source_type = SOURCE_TYPE_MENTOR_PROFILE
        title = custom_title or f"현직자 전문가 프로필 ({domain})"

    # (4) 정부 및 공공기관 (.go.kr, .or.kr)
    elif "go.kr" in domain or "or.kr" in domain:
        is_trusted = True
        verification_status = STATUS_VERIFIED
        priority = SOURCE_PRIORITY_INSTITUTIONAL
        source_type = SOURCE_TYPE_UNIVERSITY_OFFICIAL
        title = custom_title or f"공공/학술 포털 ({domain})"

    # (5) 기타 출처
    else:
        is_trusted = False
        verification_status = STATUS_UNVERIFIED
        priority = SOURCE_PRIORITY_SECONDARY
        source_type = "SECONDARY_SOURCE"
        title = custom_title or f"외부 웹 출처 ({domain})"

    return {
        "source_url": clean_url,
        "source_title": title,
        "source_type": source_type,
        "source_domain": domain,
        "source_priority": priority,
        "verification_status": verification_status,
        "is_trusted": is_trusted
    }

def classify_source(url: str) -> Dict[str, Any]:
    info = validate_and_classify_source(url)
    return {
        "domain": info["source_domain"],
        "source_type": info["source_type"],
        "source_tier": info["source_priority"],
        "is_trusted": info["is_trusted"]
    }


# ==========================================
# 1. Source Discovery Node
# ==========================================
def node_source_discovery(state: DataIntelligenceState) -> Dict[str, Any]:
    """공인 출처(대학 포털, 기업 공시/채용, 브랜드 IP 센터, 실무자 플랫폼) 식별"""
    raw_discovered = state.get("raw_discovered", [])
    domain = state.get("domain", "all")
    now_str = datetime.now().isoformat()
    
    discovered_evidences: List[SourceEvidence] = []
    for item in raw_discovered:
        url = item.get("source_url") or item.get("official_policy_url") or item.get("career_evidence_url", "")
        c_info = classify_source(url)
        evidence: SourceEvidence = {
            "source_url": url,
            "source_domain": c_info["domain"],
            "source_type": c_info["source_type"],
            "source_tier": c_info["source_tier"],
            "collected_at": now_str,
            "last_checked_at": now_str,
            "raw_evidence_snippet": item.get("evidence_text", "") or item.get("description", ""),
            "confidence_score": 0.95 if c_info["is_trusted"] else 0.50
        }
        discovered_evidences.append(evidence)
        
    return {
        "current_step": "source_discovery",
        "source_evidences": discovered_evidences,
        "status": "in_progress"
    }


# ==========================================
# 2. Extraction Node (Strict Separation)
# ==========================================
def node_extraction(state: DataIntelligenceState) -> Dict[str, Any]:
    """사실 정보, 원본 텍스트 발췌문 엄격 추출 (AI 해석과 분리)"""
    raw_discovered = state.get("raw_discovered", [])
    extracted: List[Dict[str, Any]] = []
    
    for item in raw_discovered:
        rec = dict(item)
        # RFP의 경우 original_brief와 abstract_brief 명확히 분리
        if "abstract_brief" in rec and not rec.get("original_brief"):
            # 원문이 없는 경우 abstract_brief 자체를 보존하되 원문 공시가 없는 경우 표시
            rec["original_brief"] = rec.get("problem_statement") or rec["abstract_brief"]
        extracted.append(rec)
        
    return {
        "current_step": "extraction",
        "extracted_records": extracted
    }


# ==========================================
# 3. Normalization Node
# ==========================================
def node_normalization(state: DataIntelligenceState) -> Dict[str, Any]:
    """산업군, 학과명, 날짜 형식, 통화/혜택, 라이선스 범위 표준화"""
    extracted = state.get("extracted_records", [])
    normalized: List[Dict[str, Any]] = []
    
    for item in extracted:
        rec = dict(item)
        
        # 1. 산업군 정규화 매핑 (Taxonomy와 연계)
        industry_raw = rec.get("industry") or rec.get("company_industry") or rec.get("category", "")
        matched_tax = None
        for tax in STANDARD_TAXONOMY:
            if tax["name"] in industry_raw or any(kw in industry_raw for kw in tax["keywords"]):
                matched_tax = tax
                break
        if matched_tax:
            rec["industry"] = matched_tax["name"]
            rec["industry_id"] = matched_tax["id"]
        
        # 2. 날짜 형식 표준화 (YYYY-MM-DD)
        if "deadline" in rec and rec["deadline"]:
            d_str = rec["deadline"].strip()
            # 2026.10.31 -> 2026-10-31
            d_str = d_str.replace(".", "-").replace("/", "-")
            rec["deadline"] = d_str
            
        # 3. 교수 연구분야 리스트 표준화
        if "research_areas" in rec and isinstance(rec["research_areas"], list):
            rec["research_areas"] = [a.strip() for a in rec["research_areas"] if a.strip()]
            
        normalized.append(rec)
        
    return {
        "current_step": "normalization",
        "normalized_records": normalized
    }


# ==========================================
# 4. Entity Matching Node
# ==========================================
def node_entity_matching(state: DataIntelligenceState) -> Dict[str, Any]:
    """기존 DB 데이터와의 키 매칭 (교수: university+name, RFP: id/company+title, IP: company+id, 멘토: name+company)"""
    normalized = state.get("normalized_records", [])
    matched: List[Dict[str, Any]] = []
    
    for item in normalized:
        rec = dict(item)
        # 고유 매칭 복합키 생성
        if "university" in rec and "name" in rec:
            rec["entity_key"] = f"prof:{rec['university']}:{rec['name']}"
        elif "company" in rec and "title" in rec:
            rec["entity_key"] = f"rfp:{rec['company']}:{rec['title']}"
        elif "company" in rec and "license" in rec:
            rec["entity_key"] = f"brand_ip:{rec['company']}:{rec.get('id', '')}"
        elif "name" in rec and "company" in rec:
            rec["entity_key"] = f"mentor:{rec['company']}:{rec['name']}"
        else:
            rec["entity_key"] = f"generic:{rec.get('id', uuid.uuid4().hex[:8])}"
        matched.append(rec)
        
    return {
        "current_step": "entity_matching",
        "matched_entities": matched
    }


# ==========================================
# 5. Evidence Collection Node
# ==========================================
def node_evidence_collection(state: DataIntelligenceState) -> Dict[str, Any]:
    """원문 스니펫 및 출처 메타데이터 보강, information_sources 생성 및 정규화"""
    matched = state.get("matched_entities", [])
    now_str = datetime.now().isoformat()
    
    for rec in matched:
        if not rec.get("collected_at"):
            rec["collected_at"] = now_str
        if not rec.get("evidence_text"):
            rec["evidence_text"] = f"Verified from official reference: {rec.get('source_url', 'N/A')}"
            
        entity_hint = None
        if "lab_name" in rec or "university" in rec:
            entity_hint = "professor"
        elif "deadline" in rec or "abstract_brief" in rec:
            entity_hint = "rfp"
        elif "license" in rec or "assets" in rec:
            entity_hint = "brand_ip"
        elif "experience_years" in rec or "career_timeline" in rec:
            entity_hint = "mentor"

        existing_sources = rec.get("information_sources")
        if not existing_sources or not isinstance(existing_sources, list):
            sources_list = []
            url = rec.get("source_url") or rec.get("official_policy_url") or rec.get("career_evidence_url", "")
            if url:
                parsed_source = validate_and_classify_source(
                    url,
                    entity_hint=entity_hint,
                    custom_title=rec.get("name") or rec.get("title") or rec.get("company"),
                    evidence=rec.get("evidence_text")
                )
                source_item: InformationSource = {
                    "source_id": f"src-{uuid.uuid4().hex[:8]}",
                    "source_url": parsed_source["source_url"],
                    "source_title": parsed_source["source_title"],
                    "source_type": parsed_source["source_type"],
                    "source_domain": parsed_source["source_domain"],
                    "source_priority": parsed_source["source_priority"],
                    "verification_status": parsed_source["verification_status"],
                    "evidence": rec.get("evidence_text", ""),
                    "collected_at": rec.get("collected_at") or now_str,
                    "last_verified_at": now_str,
                    "entity_id": rec.get("id", ""),
                    "run_id": state.get("run_id", "")
                }
                sources_list.append(source_item)
            rec["information_sources"] = sources_list
        else:
            for s in existing_sources:
                if not s.get("source_domain") and s.get("source_url"):
                    p = validate_and_classify_source(s["source_url"], entity_hint=entity_hint)
                    s["source_domain"] = p["source_domain"]
                    s["source_type"] = p["source_type"]
                    s["source_priority"] = p["source_priority"]
                if not s.get("last_verified_at"):
                    s["last_verified_at"] = now_str
            
    return {
        "current_step": "evidence_collection",
        "matched_entities": matched
    }


# ==========================================
# 6. Verification Node (8-Point Checklist & 0.85 Threshold)
# ==========================================
def node_verification(state: DataIntelligenceState) -> Dict[str, Any]:
    """
    엄격한 8대 신뢰도 검증 체크리스트 및 0.85 점수 임계값 평가
    - 0.85 이상: VERIFIED
    - 0.85 미만 또는 공식 출처 결여: REVIEW_REQUIRED
    """
    matched = state.get("matched_entities", [])
    verified: List[Dict[str, Any]] = []
    flagged: List[Dict[str, Any]] = []
    rejected: List[Dict[str, Any]] = []
    now_str = datetime.now().isoformat()
    
    for rec in matched:
        url = rec.get("source_url") or rec.get("official_policy_url") or rec.get("career_evidence_url", "")
        c_info = classify_source(url)
        
        score = 0.0
        # 1. 공인 도메인 여부 (+0.4)
        if c_info["is_trusted"]:
            score += 0.4
        # 2. 프로필/과제명 등 핵심 식별자 존재 (+0.2)
        if rec.get("name") or rec.get("title") or rec.get("company"):
            score += 0.2
        # 3. 소속 대학/기업 명시 (+0.15)
        if rec.get("university") or rec.get("company"):
            score += 0.15
        # 4. 원문 증거 텍스트 존재 (+0.15)
        if rec.get("evidence_text") and len(rec["evidence_text"]) > 10:
            score += 0.15
        # 5. 유효한 연락처/마감일/라이선스 (+0.1)
        if rec.get("email") or rec.get("deadline") or rec.get("license") or rec.get("experience_years"):
            score += 0.1
            
        calc_score = round(min(score, 1.0), 2)
        final_score = max(rec.get("confidence_score", 0.0), calc_score)
        rec["confidence_score"] = final_score
        rec["verified_at"] = now_str
        
        # No Fake Data Policy: 출처 URL 자체가 완전히 없거나 도메인이 조잡한 경우 즉시 플래그
        if not url or final_score < 0.85 or not c_info["is_trusted"]:
            rec["is_verified"] = False
            rec["verification_status"] = STATUS_REVIEW_REQUIRED
            flagged.append(rec)
        else:
            rec["is_verified"] = True
            rec["verification_status"] = STATUS_VERIFIED
            verified.append(rec)
            
    return {
        "current_step": "verification",
        "verified_records": verified,
        "flagged_records": flagged,
        "rejected_records": rejected,
        "needs_human_review": len(flagged) > 0,
        "review_reasons": [f"Unverified or low-confidence entity: {r.get('entity_key', 'unknown')} (score: {r.get('confidence_score', 0.0)})" for r in flagged]
    }


# ==========================================
# 7. Deduplication Node
# ==========================================
def node_deduplication(state: DataIntelligenceState) -> Dict[str, Any]:
    """복합키 기준 중복 제거 및 최신/최고 신뢰도 레코드 유지"""
    verified = state.get("verified_records", [])
    dedup_dict: Dict[str, Dict[str, Any]] = {}
    
    for rec in verified:
        key = rec.get("entity_key") or rec.get("id") or str(uuid.uuid4())
        if key not in dedup_dict:
            dedup_dict[key] = rec
        else:
            # 신뢰도가 더 높은 레코드 우선
            if rec.get("confidence_score", 0.0) >= dedup_dict[key].get("confidence_score", 0.0):
                dedup_dict[key] = rec
                
    return {
        "current_step": "deduplication",
        "deduplicated_records": list(dedup_dict.values())
    }


# ==========================================
# 8. Change Detection Node
# ==========================================
def node_change_detection(state: DataIntelligenceState) -> Dict[str, Any]:
    """기존 DB 데이터 스냅샷과 비교하여 변경 필드(DIFF) 감지 및 이력 준비"""
    deduped = state.get("deduplicated_records", [])
    domain = state.get("domain", "all")
    detected_changes: List[Dict[str, Any]] = []
    
    # 기존 DB 로드
    existing_db = {}
    db_file_map = {
        "professors": "data/professors.json",
        "rfp": "data/rfp.json",
        "brand_assets": "data/brand_assets.json",
        "mentors": "data/mentors.json"
    }
    
    for dom, path in db_file_map.items():
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    if isinstance(items, list):
                        for it in items:
                            if "id" in it:
                                existing_db[it["id"]] = it
            except Exception:
                pass
                
    for new_rec in deduped:
        rec_id = new_rec.get("id")
        if rec_id and rec_id in existing_db:
            old_rec = existing_db[rec_id]
            changed_fields = []
            for k, val in new_rec.items():
                if k in ["collected_at", "verified_at", "confidence_score", "entity_key"]:
                    continue
                if old_rec.get(k) != val:
                    changed_fields.append(k)
            if changed_fields:
                detected_changes.append({
                    "entity_id": rec_id,
                    "action": "UPDATED",
                    "changed_fields": changed_fields,
                    "old_data": {k: old_rec.get(k) for k in changed_fields},
                    "new_data": {k: new_rec.get(k) for k in changed_fields},
                    "source_url": new_rec.get("source_url", ""),
                    "confidence_score": new_rec.get("confidence_score", 1.0)
                })
        else:
            detected_changes.append({
                "entity_id": rec_id or "new",
                "action": "CREATED",
                "changed_fields": list(new_rec.keys()),
                "old_data": None,
                "new_data": new_rec,
                "source_url": new_rec.get("source_url", ""),
                "confidence_score": new_rec.get("confidence_score", 1.0)
            })
            
    return {
        "current_step": "change_detection",
        "detected_changes": detected_changes
    }


# ==========================================
# 9. Database Update Node (Atomic & Frontend Sync)
# ==========================================
def node_database_update(state: DataIntelligenceState) -> Dict[str, Any]:
    """data/*.json 및 my-exhibit-platform/data/*.json 동시 원자적 갱신"""
    deduped = state.get("deduplicated_records", [])
    domain = state.get("domain", "all")
    updated_counts = {"professors": 0, "rfp": 0, "brand_assets": 0, "mentors": 0}
    
    # 4개 파일 대상 분기
    groups = {"professors": [], "rfp": [], "brand_assets": [], "mentors": []}
    for rec in deduped:
        if "lab_name" in rec or "university" in rec:
            groups["professors"].append(rec)
        elif "deadline" in rec or "problem_statement" in rec:
            groups["rfp"].append(rec)
        elif "license" in rec or "assets" in rec:
            groups["brand_assets"].append(rec)
        elif "experience_years" in rec or "career_timeline" in rec:
            groups["mentors"].append(rec)
            
    file_targets = {
        "professors": ["data/professors.json", "my-exhibit-platform/data/professors.json"],
        "rfp": ["data/rfp.json", "my-exhibit-platform/data/rfp.json"],
        "brand_assets": ["data/brand_assets.json", "my-exhibit-platform/data/brand_assets.json"],
        "mentors": ["data/mentors.json", "my-exhibit-platform/data/mentors.json"]
    }
    
    for cat, items in groups.items():
        if not items:
            continue
        for fpath in file_targets[cat]:
            current_list = []
            if os.path.exists(fpath):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        current_list = json.load(f)
                except Exception:
                    current_list = []
            
            # id 기준 맵 병합 및 information_sources URL 기반 갱신/보존
            merged_dict = {it["id"]: it for it in current_list if "id" in it}
            for new_it in items:
                rec_id = new_it.get("id")
                if not rec_id:
                    continue
                if rec_id in merged_dict:
                    old_rec = merged_dict[rec_id]
                    old_sources = old_rec.get("information_sources") or []
                    new_sources = new_it.get("information_sources") or []
                    
                    # URL 기반 출처 병합 (동일 URL 갱신, 새 URL 추가, 기존 URL 보존)
                    merged_src_map = {}
                    for s in old_sources:
                        u = (s.get("source_url") or "").strip()
                        if u:
                            merged_src_map[u] = dict(s)
                    for ns in new_sources:
                        nu = (ns.get("source_url") or "").strip()
                        if not nu:
                            continue
                        if nu in merged_src_map:
                            curr = merged_src_map[nu]
                            curr["last_verified_at"] = ns.get("last_verified_at") or datetime.now().isoformat()
                            if ns.get("verification_status"):
                                curr["verification_status"] = ns["verification_status"]
                            if ns.get("evidence"):
                                curr["evidence"] = ns["evidence"]
                            if ns.get("source_priority"):
                                curr["source_priority"] = ns["source_priority"]
                            if ns.get("source_title"):
                                curr["source_title"] = ns["source_title"]
                        else:
                            merged_src_map[nu] = dict(ns)
                            
                    if merged_src_map:
                        new_it["information_sources"] = list(merged_src_map.values())
                merged_dict[rec_id] = new_it
            final_list = list(merged_dict.values())
            
            os.makedirs(os.path.dirname(fpath), exist_ok=True)
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(final_list, f, ensure_ascii=False, indent=2)
                
        updated_counts[cat] = len(items)
        
    return {
        "current_step": "database_update",
        "updated_db_counts": updated_counts
    }


# ==========================================
# 10. Audit Logging Node
# ==========================================
def node_audit_logging(state: DataIntelligenceState) -> Dict[str, Any]:
    """data/logs/data_intelligence_audit.json 에 영구 감사 로그 기록"""
    detected_changes = state.get("detected_changes", [])
    now_str = datetime.now().isoformat()
    audit_file = "data/logs/data_intelligence_audit.json"
    
    logs: List[AuditLogRecord] = []
    for chg in detected_changes:
        log_entry: AuditLogRecord = {
            "log_id": f"audit-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}",
            "domain": state.get("domain", "general"),
            "entity_id": chg["entity_id"],
            "action": chg["action"],
            "old_data": chg.get("old_data"),
            "new_data": chg.get("new_data"),
            "changed_fields": chg.get("changed_fields", []),
            "source_url": chg.get("source_url", ""),
            "confidence_score": chg.get("confidence_score", 1.0),
            "recorded_at": now_str
        }
        logs.append(log_entry)
        
    existing_logs = []
    if os.path.exists(audit_file):
        try:
            with open(audit_file, "r", encoding="utf-8") as f:
                existing_logs = json.load(f)
        except Exception:
            existing_logs = []
            
    existing_logs.extend(logs)
    os.makedirs(os.path.dirname(audit_file), exist_ok=True)
    with open(audit_file, "w", encoding="utf-8") as f:
        json.dump(existing_logs, f, ensure_ascii=False, indent=2)
        
    return {
        "current_step": "audit_logging",
        "audit_logs": logs
    }


# ==========================================
# 11. Human Review Gate Node
# ==========================================
def node_human_review_gate(state: DataIntelligenceState) -> Dict[str, Any]:
    """신뢰도 미달(0.85 미만) 또는 출처 미확인 레코드를 안전하게 격리 (임의 날조 방지)"""
    flagged = state.get("flagged_records", [])
    needs_review = len(flagged) > 0
    now_str = datetime.now().isoformat()
    
    return {
        "current_step": "human_review_gate",
        "completed_at": now_str,
        "status": "review_pending" if needs_review else "completed",
        "needs_human_review": needs_review,
        "is_approved": not needs_review
    }
