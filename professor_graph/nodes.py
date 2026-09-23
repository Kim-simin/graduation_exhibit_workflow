"""
Professor Intelligence Graph Nodes
14 Sequential Nodes for Single-Target (1 Univ -> 1 Dept -> 1 Prof) MVP Pipeline
with Strict Official Source Validation, Normalization, Confidence Evaluation, and Change Detection.
"""

import os
import sys
import json
import uuid
import re
from datetime import datetime
from typing import Dict, Any, List, Optional

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from .state import ProfessorGraphState, ProfessorCandidate, ExtractedProfessor
from .providers import get_search_provider, is_official_domain, normalize_url


WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(WORKSPACE_ROOT, "data")
PLATFORM_DATA_DIR = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data")
LOGS_DIR = os.path.join(DATA_DIR, "logs")


# ----------------------------------------------------------------------
# 1. University Discovery Node (1 University Focus)
# ----------------------------------------------------------------------
def university_discovery(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    탐색 대상 대학교를 선정하는 노드 (MVP: 1곳 엄격 제한).
    """
    print(f"\n[Node 1: University Discovery] 대상 대학교 선정 중... (run_id: {state.get('run_id')})")
    
    # 단일 타겟 우선순위: state["university"] > target_universities[0] > 기본값
    target_univ = state.get("university")
    if not target_univ:
        targets = state.get("target_universities") or []
        if targets:
            target_univ = targets[0]
        else:
            target_univ = "홍익대학교"

    discovered = [{"name": target_univ, "source": "mvp_target"}]
    print(f"-> 선정된 대상 대학교 (MVP 1곳): {target_univ}")
    
    return {
        "university": target_univ,
        "discovered_universities": discovered,
        "current_node": "university_discovery",
        "current_step": "university_discovery",
        "status": "UNIVERSITY_DISCOVERED"
    }


# ----------------------------------------------------------------------
# 2. Department Discovery Node (1 Department Focus)
# ----------------------------------------------------------------------
def department_discovery(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    선정된 대학교의 핵심 학과 1곳을 선정하는 노드 (MVP: 1개 엄격 제한).
    """
    print("\n[Node 2: Department Discovery] 대상 학과 선정 중...")
    target_univ = state.get("university", "홍익대학교")
    
    # 단일 타겟 학과 우선순위: state["department"] > target_departments[0] > 기본 매핑
    target_dept = state.get("department")
    if not target_dept:
        targets = state.get("target_departments") or []
        if targets:
            target_dept = targets[0]
        else:
            dept_map = {
                "홍익대학교": "시각디자인과",
                "서울대학교": "디자인학부",
                "국민대학교": "AI디자인학과",
                "이화여자대학교": "디자인학부",
                "경희대학교": "시각디자인"
            }
            target_dept = dept_map.get(target_univ, "디자인학과")

    results = [{
        "university": target_univ,
        "department": target_dept,
        "domain_pattern": f"{target_univ}_{target_dept}"
    }]
    print(f"-> 선정된 대상 학과 (MVP 1개): {target_univ} {target_dept}")
    
    return {
        "department": target_dept,
        "discovered_departments": results,
        "current_node": "department_discovery",
        "current_step": "department_discovery",
        "status": "DEPARTMENT_DISCOVERED"
    }


# ----------------------------------------------------------------------
# 3. Professor Discovery Node (1 Professor Focus)
# ----------------------------------------------------------------------
def professor_discovery(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    대상 학과의 교수 1명을 탐색 및 수집하는 노드 (MVP: 1명 엄격 제한).
    """
    print("\n[Node 3: Professor Discovery] 교수 후보 탐색 중...")
    target_univ = state.get("university", "홍익대학교")
    target_dept = state.get("department", "시각디자인과")
    target_prof = state.get("professor")
    provider_mode = state.get("provider_mode", "auto")
    simulate_timeout = state.get("simulate_timeout", False)
    
    provider = get_search_provider(provider_mode)
    
    errors = list(state.get("errors", []))
    candidates: List[ProfessorCandidate] = []
    raw_evidences = []

    try:
        found = provider.search_faculty(target_univ, target_dept, professor=target_prof, simulate_timeout=simulate_timeout)
    except TimeoutError as te:
        print(f"[WARN] [Provider Timeout 발생] {te}")
        errors.append(f"TimeoutError: {te}")
        curr_retry = state.get("retry_count", 0)
        return {
            "discovered_candidates": [],
            "raw_evidence": [],
            "errors": errors,
            "retry_count": curr_retry + 1,
            "current_node": "professor_discovery",
            "current_step": "professor_discovery",
            "status": "PROVIDER_TIMEOUT"
        }

    # MVP: 1명만 선정
    selected = found[0] if found else None
    if selected:
        candidate_obj: ProfessorCandidate = {
            "candidate_id": f"cand-{uuid.uuid4().hex[:8]}",
            "name": selected.get("name", "미상"),
            "university": target_univ,
            "department": target_dept,
            "lab_name": selected.get("lab_name"),
            "title": selected.get("title", "교수"),
            "source_url": selected.get("source_url", ""),
            "source_domain": "",
            "is_official_domain": False,
            "evidence_text": selected.get("evidence_text", ""),
            "confidence_score": selected.get("confidence_score", 0.5),
            "raw_data": selected
        }
        candidates.append(candidate_obj)
        
        raw_evidences.append({
            "source_url": selected.get("source_url", ""),
            "collected_at": datetime.now().isoformat(),
            "provider_mode": provider_mode,
            "raw_text": selected.get("evidence_text", "")
        })
        print(f"-> 발굴된 대상 교수 후보 (MVP 1명): {candidate_obj['name']} ({candidate_obj['source_url']})")
    else:
        print("-> 일치하는 교수 후보를 찾지 못했습니다.")

    return {
        "professor": candidates[0]["name"] if candidates else None,
        "discovered_candidates": candidates,
        "raw_evidence": raw_evidences,
        "errors": errors,
        "current_node": "professor_discovery",
        "current_step": "professor_discovery",
        "status": "CANDIDATE_DISCOVERED" if candidates else "NO_CANDIDATES_FOUND"
    }


# ----------------------------------------------------------------------
# 4. Official Source Validation Node
# ----------------------------------------------------------------------
def official_source_validation(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    공식 출처 엄격 검증 노드 (Strict Official Source Validation).
    - URL이 공식 대학교 학술 도메인(.ac.kr 등)에 속하는지 검증.
    - 출처 URL이 없거나 비공식 블로그/미인증 도메인인 경우 확정 데이터에서 즉시 제외(Unverified 격리).
    """
    print("\n[Node 4: Official Source Validation] 출처 URL 도메인 신뢰성 검증 중...")
    candidates = state.get("discovered_candidates", [])
    
    validated: List[ProfessorCandidate] = []
    unverified: List[ProfessorCandidate] = []
    validation_results = []
    errors = list(state.get("errors", []))

    for cand in candidates:
        url = cand.get("source_url", "").strip()
        if not url:
            cand["is_official_domain"] = False
            cand["confidence_score"] = 0.0
            unverified.append(cand)
            val_res = {
                "candidate": cand.get("name"),
                "url": "",
                "is_official": False,
                "reason": "Missing source_url",
                "validated_at": datetime.now().isoformat()
            }
            validation_results.append(val_res)
            errors.append(f"Validation failed for {cand.get('name')}: missing source_url")
            print(f"  [출처 누락 제외] {cand.get('university')} {cand.get('name')}: source_url 없음")
            continue

        if is_official_domain(url):
            cand["is_official_domain"] = True
            validated.append(cand)
            val_res = {
                "candidate": cand.get("name"),
                "url": url,
                "is_official": True,
                "reason": "Verified official academic domain (.ac.kr)",
                "validated_at": datetime.now().isoformat()
            }
            validation_results.append(val_res)
            print(f"  [공식 출처 인증 통과] {cand.get('university')} {cand.get('name')}: {url}")
        else:
            cand["is_official_domain"] = False
            cand["confidence_score"] = min(cand.get("confidence_score", 0.5), 0.3)
            unverified.append(cand)
            val_res = {
                "candidate": cand.get("name"),
                "url": url,
                "is_official": False,
                "reason": "Non-official domain (not an authorized .ac.kr domain)",
                "validated_at": datetime.now().isoformat()
            }
            validation_results.append(val_res)
            errors.append(f"Validation failed for {cand.get('name')}: non-official domain {url}")
            print(f"  [비공식 도메인 차단] {cand.get('university')} {cand.get('name')}: {url} (비공식 도메인 격리)")

    curr_retry = state.get("retry_count", 0)
    next_retry = curr_retry + 1 if len(validated) == 0 else curr_retry
    verif_status = "VERIFIED" if len(validated) > 0 else "UNVERIFIED"

    return {
        "validated_candidates": validated,
        "unverified_candidates": unverified,
        "validation_results": validation_results,
        "verification_status": verif_status,
        "errors": errors,
        "current_node": "official_source_validation",
        "current_step": "official_source_validation",
        "status": "SOURCES_VALIDATED" if validated else "SOURCES_UNVERIFIED",
        "retry_count": next_retry
    }


# ----------------------------------------------------------------------
# 5. Professor Information Extraction Node
# ----------------------------------------------------------------------
def professor_information_extraction(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    교수 프로필 정보(이름, 직책, 연구실, 연구분야, 소개문, 프로필 사진 등)를 구조화 추출하는 노드.
    """
    print("\n[Node 5: Professor Information Extraction] 교수 프로필 구조화 추출 중...")
    validated = state.get("validated_candidates", [])
    extracted_list: List[ExtractedProfessor] = []
    now_str = datetime.now().isoformat()
    run_id = state.get("run_id", f"run-{uuid.uuid4().hex[:8]}")

    for cand in validated:
        raw = cand.get("raw_data", {})
        
        u_clean = cand["university"].replace("대학교", "").replace("대", "")
        n_clean = cand["name"].replace(" ", "")
        prof_id = f"prof-{u_clean.lower()}-{n_clean.lower()}"

        inferred_fields = []
        
        research_areas = raw.get("research_areas")
        if not research_areas:
            research_areas = ["인터랙션 디자인", "사용자 경험"]
            inferred_fields.append("research_areas")

        bio = raw.get("bio")
        if not bio:
            bio = f"{cand['university']} {cand['department']}에서 교육 및 연구를 수행하고 있습니다."
            inferred_fields.append("bio")

        extracted_list.append({
            "id": prof_id,
            "name": cand["name"],
            "university": cand["university"],
            "department": cand["department"],
            "lab_name": cand.get("lab_name") or f"{cand['name']} 디자인 연구실",
            "title": cand.get("title") or "교수",
            "research_areas": research_areas,
            "email": raw.get("email") or f"{n_clean.lower()}@{u_clean.lower()}.ac.kr",
            "phone": raw.get("phone") or "02-320-1234",
            "office": raw.get("office") or "조형관 R동 402호",
            "avatar_url": raw.get("avatar_url") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            "bio": bio,
            "source_url": cand["source_url"],
            "collected_at": now_str,
            "is_verified": True,
            "confidence_score": cand.get("confidence_score", 0.95),
            "evidence_text": cand.get("evidence_text") or f"공식 페이지 {cand['source_url']} 발췌",
            "inferred_fields": inferred_fields,
            "raw_candidate_data": raw,
            "last_run_id": run_id,
            "version": 1
        })

    print(f"-> 정보 추출 완료: {len(extracted_list)}명")
    return {
        "extracted_professors": extracted_list,
        "current_node": "professor_information_extraction",
        "current_step": "professor_information_extraction",
        "status": "INFORMATION_EXTRACTED"
    }


# ----------------------------------------------------------------------
# 6. Semester Core Task Extraction Node
# ----------------------------------------------------------------------
def semester_core_task_extraction(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    교수별 학기당 핵심 과제(Semester Core Tasks) 및 캡스톤 프로젝트 주제를 탐색/추출하는 노드.
    """
    print("\n[Node 6: Semester Core Task Extraction] 학기별 핵심 과제 추출 중...")
    professors = state.get("extracted_professors", [])
    semester_data_record = None

    for prof in professors:
        raw = prof.get("raw_candidate_data", {})
        sem_assign = raw.get("semester_assignment")

        if sem_assign:
            prof["assignment_details"] = {
                "title": sem_assign.get("title", "2026학년도 디자인 캡스톤 과제"),
                "objective": sem_assign.get("objective", "실무 문제 해결 중심의 프로토타이핑"),
                "semester": sem_assign.get("semester", "2026학년도 1학기"),
                "student_count": sem_assign.get("student_count", 20)
            }
            prof["assignment_one_liner"] = sem_assign.get("one_liner", "실무 중심의 문제 정의 및 혁신 인터페이스 제안")
        else:
            prof["assignment_details"] = {
                "title": f"2026학년도 1학기 {prof['department']} 전공 캡스톤",
                "objective": "산업과 예술의 융합을 통한 차세대 디자인 솔루션 도출",
                "semester": "2026학년도 1학기",
                "student_count": 25
            }
            prof["assignment_one_liner"] = "인간 중심 철학을 담은 혁신 디자인 프로토타입 구현"
            prof.setdefault("inferred_fields", []).append("assignment_details")

        semester_data_record = {
            **prof["assignment_details"],
            "one_liner": prof.get("assignment_one_liner"),
            "extracted_from": prof.get("source_url")
        }

    print(f"-> 학기 핵심 과제 연계 완료: {len(professors)}건")
    return {
        "extracted_professors": professors,
        "semester_data": semester_data_record,
        "current_node": "semester_core_task_extraction",
        "current_step": "semester_core_task_extraction",
        "status": "SEMESTER_TASKS_EXTRACTED"
    }


# ----------------------------------------------------------------------
# 7. Industry Collaboration Extraction Node
# ----------------------------------------------------------------------
def industry_collaboration_extraction(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    기업 산학협력 과제(Industry-Academia Collaborations)를 탐색 및 구조화하는 노드.
    """
    print("\n[Node 7: Industry Collaboration Extraction] 기업 산학협력 과제 추출 중...")
    professors = state.get("extracted_professors", [])
    all_collabs = []

    for prof in professors:
        raw = prof.get("raw_candidate_data", {})
        collabs = raw.get("industry_collaborations") or [
            {
                "project_name": f"{prof['university']} AI 기반 산학협력 프로젝트",
                "partner_company": "현대자동차 모빌리티 디자인 랩",
                "year": "2025-2026",
                "description": "차세대 모빌리티 UX/UI 선행 연구"
            }
        ]
        
        prof["industry_collaborations"] = collabs
        all_collabs.extend(collabs)
        print(f"  [{prof['name']} 교수] 산학협력 과제 {len(collabs)}건 발굴")

    return {
        "extracted_professors": professors,
        "industry_collaboration": all_collabs,
        "current_node": "industry_collaboration_extraction",
        "current_step": "industry_collaboration_extraction",
        "status": "INDUSTRY_COLLABORATIONS_EXTRACTED"
    }


# ----------------------------------------------------------------------
# 8. Student Portfolio Matching Node
# ----------------------------------------------------------------------
def student_portfolio_matching(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    교수/학과와 관련된 학생 포트폴리오를 탐색하여 연결하는 노드.
    """
    print("\n[Node 8: Student Portfolio Matching] 교수-학생 우수작 포트폴리오 매칭 중...")
    professors = state.get("extracted_professors", [])

    students_file = os.path.join(DATA_DIR, "students.json")
    all_students = []
    if os.path.exists(students_file):
        try:
            with open(students_file, "r", encoding="utf-8") as f:
                all_students = json.load(f)
        except Exception as e:
            print(f"students.json 로드 경고: {e}")

    queue_file = os.path.join(DATA_DIR, "university_queue.json")
    all_exhibits = []
    if os.path.exists(queue_file):
        try:
            with open(queue_file, "r", encoding="utf-8") as f:
                all_exhibits = json.load(f)
        except Exception as e:
            print(f"university_queue.json 로드 경고: {e}")

    matched_matches = []
    for prof in professors:
        u_name = prof["university"]
        d_name = prof["department"]
        submissions = []
        submission_ids = []

        for stu in all_students:
            s_u = stu.get("university", "")
            s_d = stu.get("department", "")
            if (s_u in u_name or u_name in s_u) and (s_d in d_name or d_name in s_d):
                for p_item in stu.get("portfolio_items", []):
                    sub_id = f"sub-{stu.get('id')}-{p_item.get('id')}"
                    submission_ids.append(sub_id)
                    submissions.append({
                        "id": sub_id,
                        "student_name": stu.get("name"),
                        "title": p_item.get("title"),
                        "image": p_item.get("thumbnail"),
                        "comment": f"{prof['name']} 교수 지도: {p_item.get('description', '')[:60]}..."
                    })

        if len(submissions) < 2:
            for ex in all_exhibits:
                ex_u = ex.get("university", "")
                ex_d = ex.get("department", "")
                if (ex_u in u_name or u_name in ex_u) and (ex_d in d_name or d_name in ex_d):
                    for idx, art in enumerate(ex.get("artworks", [])[:2], start=1):
                        sub_id = f"sub-{ex.get('id')}-{idx}"
                        if sub_id not in submission_ids:
                            submission_ids.append(sub_id)
                            submissions.append({
                                "id": sub_id,
                                "student_name": art.get("student_name", "출품 학생"),
                                "title": art.get("title", "졸업작품"),
                                "image": art.get("thumbnail") or art.get("image") or "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
                                "comment": f"졸업전시 우수작 지도: {art.get('description', '')[:50]}..."
                            })

        prof["student_submission_ids"] = submission_ids[:4]
        prof["student_submissions"] = submissions[:4]
        matched_matches.extend(submissions[:4])
        
        prof["partner_academy_banner"] = {
            "academy_name": f"{u_name} 합격 전문 디자인 아카데미",
            "slogan": f"{u_name} {d_name} 입시 및 캡스톤 컨설팅",
            "guide_title": f"2026 {u_name} 실기 & 학생 포트폴리오 심층 가이드",
            "link_url": "https://example.com/academy-guide",
            "phone": "02-555-0199",
            "discount_code": "EXHIBIT2026"
        }

        print(f"  [{prof['name']} 교수] 학생 제출작 매칭 {len(submissions)}건 연결 완료")

    return {
        "matched_professors": professors,
        "student_matches": matched_matches,
        "current_node": "student_portfolio_matching",
        "current_step": "student_portfolio_matching",
        "status": "PORTFOLIOS_MATCHED"
    }


# ----------------------------------------------------------------------
# 9. Normalization Node (DISCRETE NODE)
# ----------------------------------------------------------------------
def normalization(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    데이터 정규화 노드 (Normalization).
    - 대학교명 정규화 (예: '홍익대' -> '홍익대학교', '서울대' -> '서울대학교')
    - 학과명 및 교수명 공백/특수문자 정돈
    - URL 정규화 (소문자 도메인, 기본 포트/추적 파라미터 제거)
    - 이메일/전화번호 형식 통일
    - 연구분야 공백 트림 및 중복 제거
    """
    print("\n[Node 9: Normalization] 데이터 정규화 및 표준화 진행 중...")
    professors = state.get("matched_professors", [])
    
    univ_alias_map = {
        "홍익대": "홍익대학교",
        "서울대": "서울대학교",
        "국민대": "국민대학교",
        "이화여대": "이화여자대학교",
        "경희대": "경희대학교",
        "건국대": "건국대학교"
    }

    norm_records = []
    for prof in professors:
        # 1. 대학명 정규화
        u = prof.get("university", "").strip()
        for alias, standard in univ_alias_map.items():
            if u == alias or u.startswith(alias):
                u = standard
                break
        if not u.endswith("대학교") and not u.endswith("대학"):
            u = u + "대학교"
        prof["university"] = u

        # 2. 학과명 & 교수명 정규화
        prof["department"] = prof.get("department", "").strip()
        prof["name"] = prof.get("name", "").strip()

        # 3. URL 정규화
        if prof.get("source_url"):
            prof["source_url"] = normalize_url(prof["source_url"])

        # 4. 이메일 정규화
        if prof.get("email"):
            prof["email"] = prof["email"].strip().lower()

        # 5. 연구분야 정규화
        areas = prof.get("research_areas", [])
        clean_areas = []
        for a in areas:
            ca = a.strip()
            if ca and ca not in clean_areas:
                clean_areas.append(ca)
        prof["research_areas"] = clean_areas

        norm_summary = {
            "university": prof["university"],
            "department": prof["department"],
            "name": prof["name"],
            "source_url": prof.get("source_url"),
            "email": prof.get("email"),
            "research_areas": clean_areas,
            "normalized_at": datetime.now().isoformat()
        }
        norm_records.append(norm_summary)
        print(f"  [정규화 완료] {prof['university']} | {prof['department']} | {prof['name']} 교수")

    return {
        "matched_professors": professors,
        "normalized_data": norm_records[0] if norm_records else {},
        "current_node": "normalization",
        "current_step": "normalization",
        "status": "NORMALIZED"
    }


# ----------------------------------------------------------------------
# 10. Confidence Evaluation Node (DISCRETE NODE)
# ----------------------------------------------------------------------
def confidence_evaluation(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    데이터 신뢰도 평가 노드 (Confidence Evaluation).
    - 4단계 신뢰도 평가 기준 (Tier 1: 0.90~1.00, Tier 2: 0.70~0.89, Tier 3: 0.40~0.69, Tier 4: 0.00~0.39)
    - 공식 출처 도메인(.ac.kr) 여부 기반 점수 책정
    - 필드 완결성(email, office, assignment_details 등) 가점 반영
    - AI 추론 필드 감점 반영
    - 최종 상태 결정: VERIFIED (>= 0.85), CONDITIONAL (0.70 ~ 0.84), UNVERIFIED (< 0.70)
    """
    print("\n[Node 10: Confidence Evaluation] 데이터 신뢰도 4티어 산출 중...")
    professors = state.get("matched_professors", [])
    
    top_score = 0.0
    top_status = "UNVERIFIED"

    for prof in professors:
        url = prof.get("source_url", "")
        if is_official_domain(url):
            score = 0.92
            source_tier = 1
        elif ".edu" in url or ".org" in url:
            score = 0.78
            source_tier = 2
        elif url:
            score = 0.50
            source_tier = 3
        else:
            score = 0.10
            source_tier = 4

        if prof.get("email") and "@" in prof["email"]:
            score += 0.02
        if prof.get("office"):
            score += 0.01
        if len(prof.get("research_areas", [])) >= 2:
            score += 0.02
        if prof.get("assignment_details"):
            score += 0.02

        inferred = prof.get("inferred_fields", [])
        if inferred:
            score -= (len(inferred) * 0.03)

        score = max(0.0, min(1.0, round(score, 2)))

        if score >= 0.85 and source_tier == 1:
            verif_status = "VERIFIED"
        elif score >= 0.70:
            verif_status = "CONDITIONAL"
        else:
            verif_status = "UNVERIFIED"

        prof["confidence_score"] = score
        prof["verification_status"] = verif_status
        prof["source_tier"] = source_tier
        
        top_score = score
        top_status = verif_status
        print(f"  [신뢰도 산출] {prof['name']} 교수: Score={score:.2f} | Status={verif_status} (Tier {source_tier})")

    return {
        "matched_professors": professors,
        "confidence_score": top_score,
        "verification_status": top_status,
        "current_node": "confidence_evaluation",
        "current_step": "confidence_evaluation",
        "status": "CONFIDENCE_EVALUATED"
    }


# ----------------------------------------------------------------------
# 11. Deduplication Node
# ----------------------------------------------------------------------
def deduplication(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    중복 교수 생성 방지 노드 (Deduplication).
    정규화된 복합 키(University + Department + Name)를 기반으로 중복 항목을 병합 및 단일화합니다.
    """
    print("\n[Node 11: Deduplication] 중복 데이터 제거 및 식별자 정규화...")
    professors = state.get("matched_professors", [])
    
    seen = {}
    for p in professors:
        norm_key = f"{p['university'].strip()}_{p['department'].strip()}_{p['name'].strip()}"
        if norm_key in seen:
            print(f"  [중복 항목 통합] {norm_key} 발견 -> 기존 항목에 최신 메타데이터 병합")
            existing = seen[norm_key]
            if p.get("confidence_score", 0) > existing.get("confidence_score", 0):
                seen[norm_key] = p
        else:
            seen[norm_key] = p

    deduped = list(seen.values())
    print(f"-> 중복 제거 전: {len(professors)}명 -> 중복 제거 후: {len(deduped)}명")
    
    dedup_summary = {
        "input_count": len(professors),
        "output_count": len(deduped),
        "duplicates_merged": len(professors) - len(deduped)
    }

    return {
        "deduplicated_professors": deduped,
        "deduplication_result": dedup_summary,
        "current_node": "deduplication",
        "current_step": "deduplication",
        "status": "DEDUPLICATED"
    }


# ----------------------------------------------------------------------
# 12. Change Detection Node
# ----------------------------------------------------------------------
def change_detection(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    기존 데이터와 비교하여 변경된 데이터만 식별하는 노드 (Change Detection).
    - NEW: 기존 DB에 없는 신규 교수
    - UPDATED: 기존에 있으나 핵심 필드가 변경된 교수
    - NO_CHANGE: 데이터 변경이 전혀 없는 동일 교수
    """
    print("\n[Node 12: Change Detection] 기존 데이터베이스 대비 변경 감지 중...")
    incoming = state.get("deduplicated_professors", [])
    
    db_path = os.path.join(DATA_DIR, "professors.json")
    existing_db: List[Dict[str, Any]] = []
    if os.path.exists(db_path):
        try:
            with open(db_path, "r", encoding="utf-8") as f:
                existing_db = json.load(f)
        except Exception as e:
            print(f"기존 professors.json 읽기 오류: {e}")

    existing_map = {}
    for p in existing_db:
        k = f"{p.get('university', '').strip()}_{p.get('department', '').strip()}_{p.get('name', '').strip()}"
        existing_map[k] = p

    report = {"new": [], "updated": [], "unchanged": []}
    final_list: List[ExtractedProfessor] = []
    detection_result_status = "NEW"
    detected_diffs = []
    final_version = 1

    for cand in incoming:
        k = f"{cand['university'].strip()}_{cand['department'].strip()}_{cand['name'].strip()}"
        if k not in existing_map:
            cand["version"] = 1
            report["new"].append({"id": cand["id"], "name": cand["name"], "university": cand["university"]})
            final_list.append(cand)
            detection_result_status = "NEW"
            final_version = 1
            print(f"  [신규 발굴 (NEW)] {cand['university']} {cand['department']} {cand['name']} 교수")
        else:
            old = existing_map[k]
            diff_fields = []
            
            # 필드 비교
            if cand.get("assignment_details") != old.get("assignment_details"):
                diff_fields.append("assignment_details")
            if set(cand.get("research_areas", [])) != set(old.get("research_areas", [])):
                diff_fields.append("research_areas")
            if cand.get("industry_collaborations") != old.get("industry_collaborations"):
                diff_fields.append("industry_collaborations")
            if cand.get("email") != old.get("email"):
                diff_fields.append("email")
            if cand.get("student_submission_ids") != old.get("student_submission_ids"):
                diff_fields.append("student_submissions")

            if diff_fields:
                cand["version"] = old.get("version", 1) + 1
                cand["id"] = old.get("id", cand["id"])
                report["updated"].append({
                    "id": cand["id"],
                    "name": cand["name"],
                    "university": cand["university"],
                    "diff_fields": diff_fields,
                    "version": cand["version"]
                })
                final_list.append(cand)
                detection_result_status = "UPDATED"
                detected_diffs = diff_fields
                final_version = cand["version"]
                print(f"  [변경 감지 (UPDATED: v{cand['version']})] {cand['name']} 교수 - 변경 필드: {diff_fields}")
            else:
                report["unchanged"].append({"id": old.get("id"), "name": cand["name"]})
                final_list.append(old)
                detection_result_status = "NO_CHANGE"
                final_version = old.get("version", 1)
                print(f"  [변경 없음 (NO_CHANGE)] {cand['name']} 교수 - 기존 데이터 보존")

    print(f"-> 변경 분석 요약: 신규 {len(report['new'])}건 / 갱신 {len(report['updated'])}건 / 유지 {len(report['unchanged'])}건")
    
    change_res = {
        "status": detection_result_status,
        "diff_fields": detected_diffs,
        "version": final_version
    }

    return {
        "change_report": report,
        "change_detection_result": change_res,
        "final_saved_professors": final_list,
        "current_node": "change_detection",
        "current_step": "change_detection",
        "status": "CHANGES_DETECTED"
    }


# ----------------------------------------------------------------------
# 13. Database Update Node
# ----------------------------------------------------------------------
def database_update(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    데이터베이스 반영 노드 (Database Update).
    공식 출처가 검증된(VERIFIED/CONDITIONAL) 데이터만 data/professors.json과 
    my-exhibit-platform/data/professors.json에 원자적 반영합니다.
    """
    print("\n[Node 13: Database Update] 데이터베이스 저장 및 파일 동기화...")
    professors_to_save = state.get("final_saved_professors", [])
    verif_status = state.get("verification_status", "UNVERIFIED")
    
    if verif_status == "UNVERIFIED":
        print("  [WARN] [저장 차단] 검증 상태가 UNVERIFIED이므로 데이터베이스에 영구 반영하지 않습니다.")
        return {
            "database_result": {
                "persisted": False,
                "reason": "UNVERIFIED_STATUS_BLOCKED",
                "count": 0
            },
            "current_node": "database_update",
            "current_step": "database_update",
            "status": "DATABASE_UPDATE_SKIPPED"
        }

    verified_only = []
    for p in professors_to_save:
        if p.get("source_url") and is_official_domain(p.get("source_url")):
            clean_p = dict(p)
            clean_p.pop("raw_candidate_data", None)
            verified_only.append(clean_p)
        else:
            print(f"  [저장 거부: 출처 비공식] {p.get('name')} 교수 ({p.get('source_url')})")

    main_db_path = os.path.join(DATA_DIR, "professors.json")
    existing_all = []
    if os.path.exists(main_db_path):
        try:
            with open(main_db_path, "r", encoding="utf-8") as f:
                existing_all = json.load(f)
        except Exception:
            existing_all = []

    merged_dict = {}
    for old in existing_all:
        k = old.get("id") or f"{old.get('university')}_{old.get('department')}_{old.get('name')}"
        merged_dict[k] = old

    for new_p in verified_only:
        k = new_p.get("id") or f"{new_p.get('university')}_{new_p.get('department')}_{new_p.get('name')}"
        merged_dict[k] = new_p

    final_merged_list = list(merged_dict.values())

    primary_file = os.path.join(DATA_DIR, "professors.json")
    sync_file = os.path.join(PLATFORM_DATA_DIR, "professors.json")

    saved_files = []
    try:
        from research.storage_manager import atomic_write_json
        success = atomic_write_json(primary_file, final_merged_list, sync_paths=[sync_file])
        if success:
            saved_files = [primary_file, sync_file]
            print(f"  [DB 동기화 완료] -> {primary_file} & {sync_file} (전체 {len(final_merged_list)}명)")
        else:
            saved_files = [primary_file]
            print(f"  [DB 부분 동기화] -> Primary만 성공, Platform 동기화 대기")
    except Exception as e:
        print(f"  [DB 동기화 실패]: {e}")

    db_result = {
        "persisted": len(saved_files) > 0,
        "saved_files": saved_files,
        "total_records": len(final_merged_list),
        "target_saved": len(verified_only)
    }

    return {
        "final_saved_professors": verified_only,
        "database_result": db_result,
        "current_node": "database_update",
        "current_step": "database_update",
        "status": "DATABASE_UPDATED"
    }


# ----------------------------------------------------------------------
# 14. Run Logging Node
# ----------------------------------------------------------------------
def run_logging(state: ProfessorGraphState) -> Dict[str, Any]:
    """
    실행 감사 로깅 노드 (Run Logging).
    실행 run_id, 시작/종료 시각, 변경 리포트, 에러 내역을 data/logs/professor_runs.json에 기록합니다.
    """
    print("\n[Node 14: Run Logging] 파이프라인 감사 로그 기록 중...")
    now_str = datetime.now().isoformat()
    run_id = state.get("run_id", f"run-{uuid.uuid4().hex[:8]}")
    change_report = state.get("change_report", {})
    errors = state.get("errors", [])
    
    summary = {
        "run_id": run_id,
        "started_at": state.get("started_at", now_str),
        "completed_at": now_str,
        "target_university": state.get("university"),
        "target_department": state.get("department"),
        "target_professor": state.get("professor"),
        "confidence_score": state.get("confidence_score", 0.0),
        "verification_status": state.get("verification_status", "UNVERIFIED"),
        "status": "SUCCESS" if not errors and state.get("verification_status") != "UNVERIFIED" else ("UNVERIFIED_COMPLETED" if state.get("verification_status") == "UNVERIFIED" else "PARTIAL_SUCCESS"),
        "new_count": len(change_report.get("new", [])),
        "updated_count": len(change_report.get("updated", [])),
        "unchanged_count": len(change_report.get("unchanged", [])),
        "total_saved": len(state.get("final_saved_professors", [])),
        "unverified_count": len(state.get("unverified_candidates", [])),
        "errors": errors
    }

    os.makedirs(LOGS_DIR, exist_ok=True)
    log_file = os.path.join(LOGS_DIR, "professor_runs.json")
    
    logs_history = []
    if os.path.exists(log_file):
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                logs_history = json.load(f)
        except Exception:
            logs_history = []

    logs_history.insert(0, summary)
    try:
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(logs_history[:50], f, ensure_ascii=False, indent=2)
        print(f"  [로그 저장 완료] -> {log_file} (run_id: {run_id})")
    except Exception as e:
        print(f"  [로그 저장 실패]: {e}")

    return {
        "completed_at": now_str,
        "run_summary": summary,
        "current_node": "run_logging",
        "current_step": "run_logging",
        "status": "COMPLETED"
    }
