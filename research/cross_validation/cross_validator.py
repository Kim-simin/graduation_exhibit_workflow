"""
research/cross_validation/cross_validator.py
STEP 6: Cross-Validation & Reliability Determination Engine.
Maintains strict separation between Cooperation Signals and Recruitment Signals.
Determines corroboration statuses without hallucinating arbitrary 0-100 scores:
- CORROBORATED: Both university cooperation and direct recruitment requirements align.
- INFERRED: University cooperation exists, but direct job posting evidence is absent.
- RECRUITMENT_CONFIRMED: Official job posting exists, but no university cooperation link.
- CONFLICTED: Conflicting facts or requirements across sources.
- INSUFFICIENT_EVIDENCE: Neither sufficient cooperation nor recruitment evidence found.
"""

from typing import Dict, Any, List, Optional
from ..schema import (
    CooperationSignal,
    RecruitmentPosting,
    TalentProfile,
    CrossValidationResult,
    VerificationStatus
)


class CrossValidator:
    """
    Cross-validates Academic-Corporate Cooperation against Real Recruitment Postings.
    """

    @staticmethod
    def validate_department_company_pair(
        department: str,
        company: str,
        coop_signals: List[CooperationSignal],
        recruit_signals: List[RecruitmentPosting],
        talent_profile: Optional[TalentProfile] = None
    ) -> CrossValidationResult:
        # Filter matching signals
        matched_coop = [
            s for s in coop_signals
            if (s.get("company") == company or company in s.get("company", "")) and
               (not s.get("department") or department in s.get("department", "") or s.get("department") in department)
        ]

        matched_recruit = [
            r for r in recruit_signals
            if r.get("company") == company or company in r.get("company", "")
        ]

        evidence_ids: List[str] = []
        for c in matched_coop:
            if c.get("evidence_id"):
                evidence_ids.append(c["evidence_id"])
        for r in matched_recruit:
            if r.get("evidence_id"):
                evidence_ids.append(r["evidence_id"])
        if talent_profile and talent_profile.get("evidence_id"):
            evidence_ids.append(talent_profile["evidence_id"])

        has_coop = len(matched_coop) > 0
        has_recruit = len(matched_recruit) > 0

        # Build Objective Evidences
        coop_ev = ""
        dept_ev = ""
        if has_coop:
            c = matched_coop[0]
            coop_ev = f"공식 산학협력 프로젝트 [{c['project_title']}] 확인 (유형: {c['cooperation_type']}, 기간: {c['date']})"
            dept_ev = f"{c.get('department', department)} 주관 ({c.get('professor', '')} 교수 연구실: {c.get('laboratory', '')})"
        else:
            coop_ev = "해당 대학과의 공식 산학협력 프로젝트 미확인 (수요 신호 없음)"
            dept_ev = f"{department}과의 직접적인 공식 산학 연계 근거 미확인"

        recruit_ev = ""
        skill_ev: List[str] = []
        port_ev = ""
        has_matching_dept_job = False

        if has_recruit:
            r = matched_recruit[0]
            reqs = r["requirements"]
            recruit_ev = f"공식 채용공고 [{r['job_title']}] 확인 (고용형태: {r['employment_type']}, 전공요건: {reqs['major_requirement']})"
            skill_ev = reqs.get("required_skills", [])
            port_ev = f"{reqs['portfolio_requirement']} ({reqs.get('portfolio_details', '세부요건 확인')})"

            # Check if department matches target majors
            target_majors = reqs.get("target_majors", [])
            if reqs["major_requirement"] == "전공 무관" or any(m in department or department in m for m in target_majors):
                has_matching_dept_job = True
        else:
            recruit_ev = "기업 공식 채용 사이트 내 관련 직무 활성 채용공고 미확인"
            skill_ev = []
            port_ev = "채용공고 미확인으로 인한 포트폴리오 요구조건 판정 불가"

        talent_ev = ""
        if talent_profile:
            talent_ev = f"공식 인재상: {talent_profile['talent_profile']} | 핵심가치: {', '.join(talent_profile['values'])}"
        else:
            talent_ev = "공식 인재상 정보 미제공"

        # Determine Corroboration Status
        status: VerificationStatus = "INSUFFICIENT_EVIDENCE"
        rationale = ""

        if has_coop and has_recruit and has_matching_dept_job:
            status = "CORROBORATED"
            rationale = (
                f"{company}와 {department} 간 공식 산학협력 프로젝트 실적과, "
                f"실제 채용공고의 전공({reqs['major_requirement']}) 및 역량 요구사항이 일치하여 상호 입증됨. "
                f"(단, 산학협력은 관심 신호이며 공식 채용 절차는 별도 공고 기준임)"
            )
        elif has_coop and not has_recruit:
            status = "INFERRED"
            rationale = (
                f"{company}와의 산학협력 프로젝트({matched_coop[0]['project_title']})는 존재하나, "
                f"현재 공개 채용공고가 확인되지 않음. 산학협력 데이터를 기업의 관심 분야 수요 신호로 참고함."
            )
        elif not has_coop and has_recruit:
            status = "RECRUITMENT_CONFIRMED"
            rationale = (
                f"{company}의 실제 공식 채용공고({matched_recruit[0]['job_title']})는 확인되었으나, "
                f"{department}과의 공식 산학협력 프로젝트 이력은 없음. 실제 채용조건을 1차 근거로 사용함."
            )
        elif has_coop and has_recruit and not has_matching_dept_job:
            status = "CONFLICTED"
            rationale = (
                f"산학협력은 {department}과 체결되었으나, "
                f"실제 채용공고의 전공 요건({reqs['major_requirement']}: {', '.join(reqs['target_majors'])})과 상충됨."
            )
        else:
            status = "INSUFFICIENT_EVIDENCE"
            rationale = "공식 산학협력 및 실제 채용공고 양쪽 모두에서 충분한 근거를 확보하지 못함."

        return {
            "department": department,
            "company": company,
            "cooperation_signals": matched_coop,
            "recruitment_signals": matched_recruit,
            "talent_profile": talent_profile,
            "cooperation_evidence": coop_ev,
            "department_evidence": dept_ev,
            "recruitment_evidence": recruit_ev,
            "skill_evidence": skill_ev,
            "portfolio_evidence": port_ev,
            "talent_evidence": talent_ev,
            "corroboration_status": status,
            "confidence_rationale": rationale,
            "evidence_ids": list(set(evidence_ids))
        }

    @classmethod
    def run_cross_validation(
        cls,
        coop_signals: List[CooperationSignal],
        recruit_signals: List[RecruitmentPosting],
        talent_profiles: List[TalentProfile],
        default_department: str = "디자인학과"
    ) -> List[CrossValidationResult]:
        results: List[CrossValidationResult] = []

        # Gather all distinct companies
        companies = set()
        for s in coop_signals:
            if s.get("company"):
                companies.add(s["company"])
        for r in recruit_signals:
            if r.get("company"):
                companies.add(r["company"])

        # Map talent by company
        talent_map = {t["company"]: t for t in talent_profiles}

        for comp in sorted(companies):
            # Find associated department(s)
            matched_depts = set()
            for s in coop_signals:
                if s.get("company") == comp and s.get("department"):
                    matched_depts.add(s["department"])

            if not matched_depts:
                matched_depts.add(default_department)

            for dept in matched_depts:
                res = cls.validate_department_company_pair(
                    department=dept,
                    company=comp,
                    coop_signals=coop_signals,
                    recruit_signals=recruit_signals,
                    talent_profile=talent_map.get(comp)
                )
                results.append(res)

        return results
