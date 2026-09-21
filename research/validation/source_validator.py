"""
research/validation/source_validator.py
Evaluates Source authority, classification, and reliability tiers (Level 1~5).
"""

from urllib.parse import urlparse
from typing import Dict, Any, Tuple


class SourceValidator:
    @staticmethod
    def classify_source_tier(url: str) -> Tuple[int, str]:
        """
        Classifies a URL into its respective authority hierarchy tier:
        - Level 1: Primary Official (ac.kr, edu, official university domains)
        - Level 2: Official Exhibition / Gallery / Department portals
        - Level 3: Professional portfolio platforms (Behance, etc.)
        - Level 4: Secondary media, blogs, articles
        - Level 5: Unknown / Low trust
        """
        if not url:
            return 5, "UNKNOWN"

        domain = urlparse(url).netloc.lower()

        # Level 1: Official University Domains
        if domain.endswith(".ac.kr") or domain.endswith(".edu"):
            return 1, "UNIVERSITY_OFFICIAL"

        # Level 2: Official Exhibition / Organization Portals
        exhibition_domains = [
            "exhibit", "degree-show", "degreeshow", "archive", "gallery",
            "kidp.or.kr", "kodfa.org", "designdb.com"
        ]
        if any(ed in domain for ed in exhibition_domains):
            return 2, "EXHIBITION_OFFICIAL"

        # Level 3: Professional Platforms
        prof_platforms = ["behance.net", "artstation.com", "notion.site", "linkedin.com"]
        if any(pp in domain for pp in prof_platforms):
            return 3, "PROFESSIONAL_PLATFORM"

        # Level 4: General Articles / Blogs
        media_platforms = ["naver.com", "tistory.com", "brunch.co.kr", "medium.com"]
        if any(mp in domain for mp in media_platforms):
            return 4, "SECONDARY_MEDIA"

        # Level 5: Default Unknown
        return 5, "UNVERIFIED_SOURCE"

    @staticmethod
    def is_trusted_official(url: str) -> bool:
        tier, _ = SourceValidator.classify_source_tier(url)
        return tier in (1, 2)
