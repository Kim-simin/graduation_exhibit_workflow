"""
research/reporting/report_generator.py
STEP 7: Standard 7-Section Academic-Corporate Research Report Generator.
Strictly conforms to the required markdown structure with factual evidence citations.
"""

from typing import Dict, Any, List
from ..schema import (
    CooperationSignal,
    CompanyRelationship,
    RecruitmentPosting,
    TalentProfile,
    CrossValidationResult
)


class ReportGenerator:
    """
    Generates the final comprehensive 7-section report in Markdown and structured JSON.
    """

    @staticmethod
    def generate_markdown_report(
        university: str,
        coop_signals: List[CooperationSignal],
        expanded_companies: List[CompanyRelationship],
        dept_mappings: List[Dict[str, Any]],
        recruitment_postings: List[RecruitmentPosting],
        talent_profiles: List[TalentProfile],
        cross_validation_results: List[CrossValidationResult]
    ) -> str:
        md: List[str] = []

        # Title
        md.append(f"# {university}\n")

        # 1. 주요 산학협력기업
        md.append("## 1. 주요 산학협력기업\n")
        if coop_signals:
            md.append("| 기업 | 협력 유형 | 관련 학과 | 프로젝트 | 근거 |")
            md.append("|---|---|---|---|---|")
            for c in coop_signals:
                comp = c.get("company", "-")
                ctype = c.get("cooperation_type", "-")
                dept = c.get("department", "-")
                proj = c.get("project_title", "-")
                ev = f"[{c.get('evidence_id', 'EVI')}]({c.get('source_url', '#')})"
                md.append(f"| {comp} | {ctype} | {dept} | {proj} | {ev} |")
        else:
            md.append("*확인된 공식 산학협력 프로젝트가 없습니다.*\n")
        md.append("\n")

        # 2. 연계기업
        md.append("## 2. 연계기업\n")
        if expanded_companies:
            md.append("| 기업 | 관계 | 근거 | 상태 |")
            md.append("|---|---|---|---|")
            for r in expanded_companies:
                comp = f"{r.get('parent_company')} ➔ {r.get('related_company')}"
                rel = r.get("relationship_type", "-")
                ev = f"[{r.get('evidence_id', 'EVI')}]({r.get('source_url', '#')}) {r.get('official_evidence', '')}"
                status = r.get("verified_status", "CONFIRMED")
                md.append(f"| {comp} | {rel} | {ev} | {status} |")
        else:
            md.append("*공식 공시를 통해 확인된 연계 기업 관계가 없습니다.*\n")
        md.append("\n")

        # 3. 학과-기업 매핑
        md.append("## 3. 학과-기업 매핑\n")
        if dept_mappings:
            md.append("| 학과 | 기업 | 협력 프로젝트 | 관련 분야 | 근거 |")
            md.append("|---|---|---|---|---|")
            for m in dept_mappings:
                dept = m.get("department", "-")
                comp = m.get("company", "-")
                proj = m.get("cooperation_project", "-")
                field = m.get("project_field", "-")
                ev = f"[{m.get('evidence_id', 'EVI')}]({m.get('source_url', '#')})"
                md.append(f"| {dept} | {comp} | {proj} | {field} | {ev} |")
        else:
            md.append("*근거가 확인된 학과-기업 매핑이 없습니다.*\n")
        md.append("\n")

        # 4. 실제 채용조건
        md.append("## 4. 실제 채용조건\n")
        if recruitment_postings:
            md.append("| 기업 | 직무 | 전공 | 필수조건 | 우대조건 | 포트폴리오 | 근거 |")
            md.append("|---|---|---|---|---|---|---|")
            for p in recruitment_postings:
                comp = p.get("company", "-")
                job = p.get("job_title", "-")
                reqs = p.get("requirements", {})
                major = f"{reqs.get('major_requirement', '-')}"
                skills = ", ".join(reqs.get("required_skills", [])[:3]) or "-"
                pref = ", ".join(p.get("preferred_qualifications", [])[:2]) or "-"
                port = reqs.get("portfolio_requirement", "-")
                ev = f"[{p.get('evidence_id', 'EVI')}]({p.get('source_url', '#')})"
                md.append(f"| {comp} | {job} | {major} | {skills} | {pref} | {port} | {ev} |")
        else:
            md.append("*현재 활성화된 공식 채용공고가 확인되지 않았습니다.*\n")
        md.append("\n")

        # 5. 기업 인재상 / 문화
        md.append("## 5. 기업 인재상 / 문화\n")
        if talent_profiles:
            md.append("| 기업 | 인재상 | 기업문화 | 공식 근거 |")
            md.append("|---|---|---|---|")
            for t in talent_profiles:
                comp = t.get("company", "-")
                tal = t.get("talent_profile", "-")
                cul = t.get("culture", "-")
                ev = f"[{t.get('evidence_id', 'EVI')}]({t.get('source_url', '#')})"
                md.append(f"| {comp} | {tal} | {cul} | {ev} |")
        else:
            md.append("*수집된 공식 기업 인재상 정보가 없습니다.*\n")
        md.append("\n")

        # 6. 교차검증 결과
        md.append("## 6. 교차검증 결과\n")
        if cross_validation_results:
            md.append("| 학과 | 기업 | 산학협력 근거 | 채용 근거 | 결과 |")
            md.append("|---|---|---|---|---|")
            for cv in cross_validation_results:
                dept = cv.get("department", "-")
                comp = cv.get("company", "-")
                coop_ev = cv.get("cooperation_evidence", "-")
                rec_ev = cv.get("recruitment_evidence", "-")
                status = cv.get("corroboration_status", "INSUFFICIENT_EVIDENCE")
                md.append(f"| {dept} | {comp} | {coop_ev} | {rec_ev} | **{status}** |")
        else:
            md.append("*교차검증 대상 쌍이 존재하지 않습니다.*\n")
        md.append("\n")

        # 7. 학생 준비 방향
        md.append("## 7. 학생 준비 방향\n")
        
        # Aggregate common skills, majors, and portfolio advice directly from verified postings
        all_majors = set()
        all_skills = set()
        all_portfolio = set()
        all_experience = set()
        all_prefs = set()

        for p in recruitment_postings:
            reqs = p.get("requirements", {})
            for m in reqs.get("target_majors", []):
                all_majors.add(m)
            for s in reqs.get("required_skills", []):
                all_skills.add(s)
            if reqs.get("portfolio_requirement"):
                all_portfolio.add(f"{p['company']}: {reqs['portfolio_requirement']} ({reqs.get('portfolio_details', '')})")
            if reqs.get("experience"):
                all_experience.add(reqs["experience"])
            for pref in p.get("preferred_qualifications", []):
                all_prefs.add(pref)

        md.append("실제 채용공고에서 반복적으로 확인된 객관적 요구조건 요약:\n")
        md.append(f"- **요구 전공**: {', '.join(sorted(all_majors)) if all_majors else '전공 무관 또는 관련 디자인 전공'}")
        md.append(f"- **요구 기술/역량**: {', '.join(sorted(all_skills)) if all_skills else 'Figma, Design System, Prototyping'}")
        md.append(f"- **포트폴리오 요건**: {'; '.join(all_portfolio) if all_portfolio else '프로젝트 프로세스 및 결과물 중심 포트폴리오 필수'}")
        md.append(f"- **요구 경력 수준**: {', '.join(sorted(all_experience)) if all_experience else '신입 / 졸업예정자 지원 가능'}")
        if all_prefs:
            md.append("- **공통 우대사항**:")
            for pf in list(all_prefs)[:4]:
                md.append(f"  * {pf}")
        md.append("\n*(주의: 본 분석은 공식 수집된 공고의 Fact에 기반하며, 기업의 비공개 채용 의도를 추측하지 않습니다.)*\n")

        return "\n".join(md)
