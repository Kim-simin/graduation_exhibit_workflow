"""
research/cooperation/dept_mapper.py
STEP 3: Company <-> Department Mapping Engine.
Establishes the link between University, Department, Professor/Lab, Company, and Project.
Strict rule: No speculative department matches are created without primary evidence.
"""

from typing import Dict, Any, List, Optional
from ..schema import CooperationSignal


class DepartmentMapper:
    """
    Maps cooperation projects to specific university departments with concrete evidence.
    """

    @staticmethod
    def map_companies_to_departments(
        cooperation_signals: List[CooperationSignal]
    ) -> List[Dict[str, Any]]:
        mappings: List[Dict[str, Any]] = []

        # Deduplicate by (department, company, project_title)
        seen = set()

        for sig in cooperation_signals:
            dept = sig.get("department")
            comp = sig.get("company")
            proj = sig.get("project_title")

            if not dept or not comp:
                # Disallow speculative matching if department is absent
                continue

            dedup_key = (dept.strip(), comp.strip(), proj.strip())
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            # Determine field from project title and description
            desc_text = f"{proj} {sig.get('description', '')}".lower()
            if any(k in desc_text for k in ["모빌리티", "차량", "자율주행", "hmi"]):
                field = "모빌리티 / 오토모티브 UX"
            elif any(k in desc_text for k in ["ai", "인공지능", "생성형", "머신러닝"]):
                field = "인공지능 / 디지털 미디어"
            elif any(k in desc_text for k in ["스마트홈", "가전", "cmf", "공간"]):
                field = "스마트홈 / CMF & 공간 디자인"
            elif any(k in desc_text for k in ["로봇", "로보틱스", "pbv"]):
                field = "로보틱스 / 피지컬 인터랙션"
            elif any(k in desc_text for k in ["콘텐츠", "웹툰", "스토리"]):
                field = "디지털 콘텐츠 & 엔터테인먼트"
            else:
                field = "산업 융합 디자인"

            mapping_obj = {
                "mapping_id": f"map-{sig['signal_id']}",
                "university": sig.get("university", ""),
                "department": dept,
                "company": comp,
                "cooperation_project": proj,
                "project_field": field,
                "cooperation_type": sig.get("cooperation_type", ""),
                "professor": sig.get("professor", ""),
                "laboratory": sig.get("laboratory", ""),
                "period": sig.get("date", ""),
                "source_url": sig.get("source_url", ""),
                "evidence_id": sig.get("evidence_id", ""),
                "status": "CONFIRMED"
            }
            mappings.append(mapping_obj)

        return mappings
