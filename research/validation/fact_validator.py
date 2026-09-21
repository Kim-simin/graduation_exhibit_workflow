"""
research/validation/fact_validator.py
Fact verification engine ensuring no fact can be verified without concrete evidence.
"""

from typing import Dict, Any, List
from .source_validator import SourceValidator


class FactValidator:
    @staticmethod
    def validate_fact(fact: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates a single Fact object.
        Enforces invariant: An evidence-less fact CANNOT be marked VERIFIED.
        """
        evidence_list = fact.get("evidence", [])
        if not evidence_list:
            fact["status"] = "UNVERIFIED"
            fact["verification_reason"] = "STRICT_VIOLATION: No evidence attached to fact."
            fact["confidence_score"] = 0.0
            return fact

        # Evaluate attached evidence sources
        best_tier = 5
        for evi in evidence_list:
            url = evi.get("source_url", "")
            tier, _ = SourceValidator.classify_source_tier(url)
            if tier < best_tier:
                best_tier = tier

        if best_tier == 1:
            fact["status"] = "VERIFIED"
            fact["confidence_score"] = 0.95
            fact["verification_reason"] = "Primary Official Academic Source Evidence"
        elif best_tier == 2:
            fact["status"] = "VERIFIED"
            fact["confidence_score"] = 0.88
            fact["verification_reason"] = "Official Exhibition / Portal Source Evidence"
        elif best_tier == 3:
            fact["status"] = "PARTIALLY_VERIFIED"
            fact["confidence_score"] = 0.70
            fact["verification_reason"] = "Professional Platform Evidence"
        else:
            fact["status"] = "UNVERIFIED"
            fact["confidence_score"] = 0.40
            fact["verification_reason"] = "Secondary or Low Trust Evidence"

        return fact

    @staticmethod
    def validate_all_facts(facts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [FactValidator.validate_fact(f) for f in facts]
