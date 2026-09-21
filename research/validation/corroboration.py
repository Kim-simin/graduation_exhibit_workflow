"""
research/validation/corroboration.py
Cross-source corroboration module. Computes multi-source agreement without counting mirror copies.
"""

from urllib.parse import urlparse
from typing import Dict, Any, List, Set


class CorroborationEngine:
    @staticmethod
    def compute_corroboration(facts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculates distinct corroborating source domains for identical entity claims.
        """
        # Group by (entity_type, entity_id, field, normalized_value)
        claim_groups: Dict[tuple, Set[str]] = {}

        for fact in facts:
            key = (
                fact.get("entity_type"),
                fact.get("entity_id"),
                fact.get("field"),
                str(fact.get("value", "")).strip().lower()
            )
            if key not in claim_groups:
                claim_groups[key] = set()

            for evi in fact.get("evidence", []):
                url = evi.get("source_url", "")
                if url:
                    domain = urlparse(url).netloc.lower()
                    claim_groups[key].add(domain)

        for fact in facts:
            key = (
                fact.get("entity_type"),
                fact.get("entity_id"),
                fact.get("field"),
                str(fact.get("value", "")).strip().lower()
            )
            distinct_domains = claim_groups.get(key, set())
            fact["corroboration_count"] = len(distinct_domains)
            fact["corroborating_domains"] = sorted(list(distinct_domains))

            # Multi-source boost
            if len(distinct_domains) >= 2 and fact.get("status") in ("VERIFIED", "PARTIALLY_VERIFIED"):
                fact["confidence_score"] = min(1.0, fact.get("confidence_score", 0.8) + 0.05)

        return facts
