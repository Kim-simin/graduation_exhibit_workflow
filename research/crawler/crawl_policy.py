"""
research/crawler/crawl_policy.py
Defines crawling boundaries, depth limits, timeouts, and domain restrictions.
"""

from typing import List, Optional
from urllib.parse import urlparse
from dataclasses import dataclass, field


@dataclass
class CrawlPolicy:
    max_pages: int = 5
    max_depth: int = 2
    max_images: int = 15
    max_pdfs: int = 5
    timeout_ms: int = 20000
    same_domain_only: bool = True
    allowed_domains: List[str] = field(default_factory=list)
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 GradExhibitResearchBot/1.0"
    )

    def is_domain_allowed(self, target_url: str, base_url: Optional[str] = None) -> bool:
        """Determines if a link URL falls within the allowed domain boundary."""
        target_netloc = urlparse(target_url).netloc.lower()
        if not target_netloc:
            return False

        if self.allowed_domains:
            if any(target_netloc == d or target_netloc.endswith("." + d) for d in self.allowed_domains):
                return True
            return False

        if self.same_domain_only and base_url:
            base_netloc = urlparse(base_url).netloc.lower()
            return target_netloc == base_netloc or target_netloc.endswith("." + base_netloc)

        return True
