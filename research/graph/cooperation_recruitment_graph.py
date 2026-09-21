"""
research/graph/cooperation_recruitment_graph.py
LangGraph 7-Node Academic-Corporate Cooperation & Recruitment Research Workflow:
1. cooperation_search: 대학 산학협력단 / LINC+ / 공식 공지 기반 산학협력 신호 수집 (STEP 1)
2. company_expansion: 공식 공시 기반 계열사, 자회사, 파트너 확장 (STEP 2)
3. department_mapping: 대학-학과-연구실-기업 간 근거 기반 매핑 (STEP 3)
4. recruitment_crawl: 공식 채용 사이트 및 포털 실제 채용공고 크롤링 (STEP 4)
5. talent_crawl: 공식 인재상 및 기업 문화 추출 (STEP 5)
6. cross_validation: Cooperation Signal vs Recruitment Signal 교차검증 (STEP 6)
7. report_generation: 7-Section 표준 리포트 생성 및 저장 (STEP 7)
"""

from datetime import datetime
from typing import Dict, Any

from langgraph.graph import StateGraph, END
from ..schema import AcademicCorporateGraphState
from ..cooperation.cooperation_crawler import CooperationCrawler
from ..cooperation.company_expander import CompanyExpander
from ..cooperation.dept_mapper import DepartmentMapper
from ..recruitment.job_crawler import JobCrawler
from ..recruitment.talent_extractor import TalentExtractor
from ..cross_validation.cross_validator import CrossValidator
from ..reporting.report_generator import ReportGenerator


# Node 1: Cooperation Search
def cooperation_search_node(state: AcademicCorporateGraphState) -> Dict[str, Any]:
    univ = state["target_university"]
    dept = state.get("target_department")
    crawler = CooperationCrawler()

    res = crawler.discover_cooperation_signals(
        university=univ,
        target_department=dept
    )

    evidences = list(state.get("evidences", [])) + res.get("evidences", [])
    sources = list(state.get("sources", [])) + res.get("sources", [])

    return {
        "cooperation_signals": res.get("cooperation_signals", []),
        "evidences": evidences,
        "sources": sources,
        "current_step": "COOPERATION_SEARCH"
    }


# Node 2: Company Expansion
def company_expansion_node(state: AcademicCorporateGraphState) -> Dict[str, Any]:
    coop_signals = state.get("cooperation_signals", [])
    parent_companies = [s["company"] for s in coop_signals if s.get("company")]

    res = CompanyExpander.expand_companies(parent_companies)

    evidences = list(state.get("evidences", [])) + res.get("evidences", [])
    sources = list(state.get("sources", [])) + res.get("sources", [])

    return {
        "expanded_companies": res.get("relationships", []),
        "evidences": evidences,
        "sources": sources,
        "current_step": "COMPANY_EXPANSION"
    }


# Node 3: Department Mapping
def department_mapping_node(state: AcademicCorporateGraphState) -> Dict[str, Any]:
    coop_signals = state.get("cooperation_signals", [])
    mappings = DepartmentMapper.map_companies_to_departments(coop_signals)

    return {
        "department_mappings": mappings,
        "current_step": "DEPARTMENT_MAPPING"
    }


# Node 4: Recruitment Crawl
def recruitment_crawl_node(state: AcademicCorporateGraphState) -> Dict[str, Any]:
    crawler = JobCrawler()
    coop_signals = state.get("cooperation_signals", [])
    expanded = state.get("expanded_companies", [])

    target_companies = set()
    for s in coop_signals:
        if s.get("company"):
            target_companies.add(s["company"])
    for e in expanded:
        if e.get("related_company"):
            target_companies.add(e["related_company"])

    postings = []
    evidences = list(state.get("evidences", []))
    sources = list(state.get("sources", []))
    errors = list(state.get("errors", []))

    for comp in sorted(target_companies):
        c_res = crawler.crawl_company_postings(comp)
        if c_res.get("status") == "SUCCESS":
            postings.extend(c_res.get("postings", []))
            evidences.extend(c_res.get("evidences", []))
            sources.extend(c_res.get("sources", []))
        elif c_res.get("status") == "NOT_FOUND":
            # Normal graceful handling
            pass
        elif c_res.get("status") == "BLOCKED":
            errors.append(f"{comp}: {c_res.get('message')}")

    return {
        "recruitment_postings": postings,
        "evidences": evidences,
        "sources": sources,
        "errors": errors,
        "current_step": "RECRUITMENT_CRAWL"
    }


# Node 5: Talent Crawl
def talent_crawl_node(state: AcademicCorporateGraphState) -> Dict[str, Any]:
    coop_signals = state.get("cooperation_signals", [])
    expanded = state.get("expanded_companies", [])

    all_companies = set()
    for s in coop_signals:
        if s.get("company"):
            all_companies.add(s["company"])
    for e in expanded:
        if e.get("related_company"):
            all_companies.add(e["related_company"])

    profiles = []
    evidences = list(state.get("evidences", []))
    sources = list(state.get("sources", []))

    for comp in sorted(all_companies):
        t_res = TalentExtractor.extract_talent_profile(comp)
        if t_res.get("status") == "SUCCESS" and t_res.get("talent_profile"):
            profiles.append(t_res["talent_profile"])
            if t_res.get("evidence"):
                evidences.append(t_res["evidence"])
            if t_res.get("source"):
                sources.append(t_res["source"])

    return {
        "talent_profiles": profiles,
        "evidences": evidences,
        "sources": sources,
        "current_step": "TALENT_CRAWL"
    }


# Node 6: Cross Validation
def cross_validation_node(state: AcademicCorporateGraphState) -> Dict[str, Any]:
    coop_signals = state.get("cooperation_signals", [])
    recruit_signals = state.get("recruitment_postings", [])
    talent_profiles = state.get("talent_profiles", [])
    default_dept = state.get("target_department") or "디자인학과"

    cv_results = CrossValidator.run_cross_validation(
        coop_signals=coop_signals,
        recruit_signals=recruit_signals,
        talent_profiles=talent_profiles,
        default_department=default_dept
    )

    return {
        "cross_validation_results": cv_results,
        "current_step": "CROSS_VALIDATION"
    }


# Node 7: Report Generation
def report_generation_node(state: AcademicCorporateGraphState) -> Dict[str, Any]:
    univ = state["target_university"]
    coop = state.get("cooperation_signals", [])
    exp = state.get("expanded_companies", [])
    dept_map = state.get("department_mappings", [])
    rec = state.get("recruitment_postings", [])
    tal = state.get("talent_profiles", [])
    cv = state.get("cross_validation_results", [])

    report_md = ReportGenerator.generate_markdown_report(
        university=univ,
        coop_signals=coop,
        expanded_companies=exp,
        dept_mappings=dept_map,
        recruitment_postings=rec,
        talent_profiles=tal,
        cross_validation_results=cv
    )

    return {
        "markdown_report": report_md,
        "current_step": "REPORT_GENERATION",
        "status": "COMPLETED",
        "completed_at": datetime.now().isoformat()
    }


def build_academic_corporate_graph():
    """
    Builds and compiles the 7-Node Academic-Corporate LangGraph.
    """
    workflow = StateGraph(AcademicCorporateGraphState)

    workflow.add_node("cooperation_search", cooperation_search_node)
    workflow.add_node("company_expansion", company_expansion_node)
    workflow.add_node("department_mapping", department_mapping_node)
    workflow.add_node("recruitment_crawl", recruitment_crawl_node)
    workflow.add_node("talent_crawl", talent_crawl_node)
    workflow.add_node("cross_validation", cross_validation_node)
    workflow.add_node("report_generation", report_generation_node)

    workflow.set_entry_point("cooperation_search")
    workflow.add_edge("cooperation_search", "company_expansion")
    workflow.add_edge("company_expansion", "department_mapping")
    workflow.add_edge("department_mapping", "recruitment_crawl")
    workflow.add_edge("recruitment_crawl", "talent_crawl")
    workflow.add_edge("talent_crawl", "cross_validation")
    workflow.add_edge("cross_validation", "report_generation")
    workflow.add_edge("report_generation", END)

    return workflow.compile()
