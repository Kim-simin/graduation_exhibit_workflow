"""
research/local_ai/provider.py
Abstract interface and health probe for Local Vision-Language AI models.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class LocalVisionModelProvider(ABC):
    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Probes the local model server / runtime and returns health status."""
        pass

    @abstractmethod
    def analyze_artwork_card(
        self,
        screenshot_path: str,
        untrusted_text_context: str
    ) -> Dict[str, Any]:
        """Analyzes artwork card visually and extracts structured fields."""
        pass

    @abstractmethod
    def classify_page_intent(
        self,
        untrusted_text_context: str
    ) -> Dict[str, Any]:
        """Classifies if a webpage is an official exhibition, department portal, or unrelated."""
        pass
