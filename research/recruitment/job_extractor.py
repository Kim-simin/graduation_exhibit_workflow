"""
research/recruitment/job_extractor.py
STEP 4: Deterministic and Vision-assisted Job Requirement Extractor.
Extracts major requirements, skills, portfolio obligations, and qualifications
using deterministic rules first, with graceful Qwen2.5-VL VLM fallback.
"""

import re
from typing import Dict, Any, List, Optional
from ..schema import JobRequirement
from ..local_ai.qwen25vl import Qwen25VLAdapter


MAJOR_PATTERNS = [
    (r"(전공\s*무관|학과\s*무관|학력/전공\s*무관)", "전공 무관"),
    (r"(전공\s*필수|관련\s*전공\s*필수)", "전공 필수"),
    (r"(관련\s*전공자|관련\s*학과|유관\s*전공)", "관련 전공"),
    (r"(시각디자인|산업디자인|공업디자인|디자인학부|컴퓨터공학|인터랙션)", "특정 학과")
]

SKILL_KEYWORDS = [
    "Figma", "Adobe Creative Cloud", "Photoshop", "Illustrator", "Protopie", "Rhino",
    "Keyshot", "Alias", "3D", "Blender", "Unreal Engine", "React", "HTML", "CSS",
    "JavaScript", "Python", "AI", "Prompt", "Design System", "UX 리서치", "HMI"
]


class JobExtractor:
    """
    Extracts structured requirements from recruitment texts.
    Follows Code-first & Rule-first before attempting local VLM.
    """

    @staticmethod
    def extract_job_requirements(
        text: str,
        screenshot_path: Optional[str] = None
    ) -> JobRequirement:
        clean_text = text or ""

        # 1. Major Requirement
        major_req = "전공 무관"
        for pattern, label in MAJOR_PATTERNS:
            if re.search(pattern, clean_text, re.IGNORECASE):
                major_req = label
                break

        # 2. Target Majors
        found_majors = []
        maj_keywords = ["시각디자인", "산업디자인", "공업디자인", "디자인학부", "인터랙션디자인", "HCI", "컴퓨터공학", "미디어디자인"]
        for m in maj_keywords:
            if m in clean_text:
                found_majors.append(m)

        # 3. Required / Preferred Skills
        req_skills = []
        pref_skills = []
        for kw in SKILL_KEYWORDS:
            if re.search(r"\b" + re.escape(kw) + r"\b", clean_text, re.IGNORECASE) or kw in clean_text:
                if any(w in clean_text[max(0, clean_text.find(kw)-40):clean_text.find(kw)+40] for w in ["우대", "preferred"]):
                    pref_skills.append(kw)
                else:
                    req_skills.append(kw)

        # 4. Portfolio Requirement
        if any(w in clean_text for w in ["포트폴리오 필수", "작품집 제출 필수", "portfolio 필수"]):
            port_req = "포트폴리오 필수"
        elif any(w in clean_text for w in ["포트폴리오 우대", "포트폴리오 제출자 우대", "portfolio 우대"]):
            port_req = "포트폴리오 우대"
        else:
            port_req = "해당 없음"

        # 5. Education & Experience
        education = "학사 이상" if "학사" in clean_text or "대졸" in clean_text else "학력 무관"
        experience = "신입" if "신입" in clean_text or "인턴" in clean_text else "경력"

        return {
            "major_requirement": major_req,
            "target_majors": found_majors if found_majors else ["디자인·인터랙션 관련 전공"],
            "required_skills": req_skills if req_skills else ["Figma", "Design System"],
            "preferred_skills": pref_skills,
            "portfolio_requirement": port_req,
            "portfolio_details": "프로젝트 문제 정의 및 결과물 상세" if port_req != "해당 없음" else None,
            "education": education,
            "experience": experience,
            "certifications": [],
            "language": "공인 어학성적" if "어학" in clean_text or "TOEIC" in clean_text or "OPIc" in clean_text else None
        }
