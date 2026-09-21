"""
research/change_detection/detector.py
Change detection engine tracking webpage modifications and entity evolution over time.
"""

from typing import Dict, Any, Optional


class ChangeDetector:
    @staticmethod
    def detect_change(
        current_hash: str,
        stored_hash: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Detects if content has evolved between research crawl runs.
        """
        if not stored_hash:
            return {
                "change_type": "NEW",
                "is_changed": True,
                "current_hash": current_hash,
                "stored_hash": None,
                "action": "CREATE_NEW_SNAPSHOT"
            }

        if current_hash == stored_hash:
            return {
                "change_type": "UNCHANGED",
                "is_changed": False,
                "current_hash": current_hash,
                "stored_hash": stored_hash,
                "action": "REUSE_CACHE"
            }

        return {
            "change_type": "MODIFIED",
            "is_changed": True,
            "current_hash": current_hash,
            "stored_hash": stored_hash,
            "action": "REVALIDATE_AND_VERSION"
        }
