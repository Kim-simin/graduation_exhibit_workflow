"""
research/normalization/entity_resolver.py
Resolves, canonicalizes, and links the Academic Entity Graph:
University -> Department -> GraduationExhibition -> Artwork -> Student.
"""

from typing import Dict, Any, List, Optional
import uuid


class EntityResolver:
    @staticmethod
    def resolve_entity_graph(
        university_name: str,
        department_name: str,
        exhibition_title: str,
        exhibition_year: str,
        source_url: str,
        facts: List[Dict[str, Any]],
        artworks_raw: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Assembles canonical linked entities from validated facts and extracted artwork candidates.
        """
        univ_id = f"univ-{university_name.strip().replace(' ', '-').lower()}"
        dept_id = f"dept-{univ_id}-{department_name.strip().replace(' ', '-').lower()}"
        exhibit_id = f"exhibit-{univ_id}-{exhibition_year or '2025'}"

        # 1. University Entity
        university = {
            "id": univ_id,
            "name": university_name,
            "canonical_domain": source_url,
            "verified_status": "VERIFIED",
            "department_ids": [dept_id]
        }

        # 2. Department Entity
        department = {
            "id": dept_id,
            "university_id": univ_id,
            "name": department_name,
            "exhibition_ids": [exhibit_id],
            "verified_status": "VERIFIED"
        }

        # 3. Graduation Exhibition Entity
        exhibition = {
            "id": exhibit_id,
            "university_id": univ_id,
            "department_id": dept_id,
            "title": exhibition_title or f"{university_name} {department_name} {exhibition_year} 졸업전시회",
            "year": exhibition_year or "2025",
            "official_url": source_url,
            "artwork_ids": [],
            "verified_status": "VERIFIED"
        }

        # 4. Artwork & Student Entities
        artworks = []
        students = []

        for idx, art in enumerate(artworks_raw):
            art_id = f"art-{exhibit_id}-{idx+1:02d}"
            exhibition["artwork_ids"].append(art_id)

            student_name = art.get("author") or art.get("student_name") or "출품 작가"
            student_id = f"stu-{dept_id}-{idx+1:02d}"

            artwork_obj = {
                "id": art_id,
                "exhibition_id": exhibit_id,
                "department_id": dept_id,
                "title": art.get("title") or "제목 미상",
                "student_id": student_id,
                "student_name": student_name,
                "thumbnail": art.get("image_url") or "",
                "description": art.get("description") or art.get("raw_text_snippet") or "",
                "source_url": source_url,
                "verified_status": "VERIFIED"
            }
            artworks.append(artwork_obj)

            student_obj = {
                "id": student_id,
                "name": student_name,
                "university": university_name,
                "department": department_name,
                "year": int(exhibition_year) if exhibition_year.isdigit() else 2025,
                "portfolio_item_ids": [art_id],
                "status": "graduated" if int(exhibition_year or 2025) < 2026 else "active"
            }
            students.append(student_obj)

        return {
            "university": university,
            "department": department,
            "exhibition": exhibition,
            "artworks": artworks,
            "students": students,
            "total_artworks": len(artworks)
        }
