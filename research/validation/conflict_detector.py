"""
research/validation/conflict_detector.py
Identifies conflicting evidence and contradictory facts across sources.
"""

from typing import Dict, Any, List, Tuple


class ConflictDetector:
    @staticmethod
    def detect_conflicts(facts: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Scans for conflicting claims (same entity and field, but contradictory values).
        Returns (updated_facts, conflict_records).
        """
        # Group by (entity_type, entity_id, field)
        field_groups: Dict[tuple, List[Dict[str, Any]]] = {}

        for fact in facts:
            key = (fact.get("entity_type"), fact.get("entity_id"), fact.get("field"))
            if key not in field_groups:
                field_groups[key] = []
            field_groups[key].append(fact)

        conflicts: List[Dict[str, Any]] = []

        for key, group in field_groups.items():
            distinct_values = {}
            for f in group:
                val = str(f.get("value", "")).strip()
                if val:
                    if val not in distinct_values:
                        distinct_values[val] = []
                    distinct_values[val].append(f)

            if len(distinct_values) > 1:
                # Contradiction detected
                conflict_rec = {
                    "entity_type": key[0],
                    "entity_id": key[1],
                    "field": key[2],
                    "status": "CONFLICTED",
                    "competing_values": [
                        {
                            "value": val,
                            "facts_count": len(f_list),
                            "sources": [
                                evi.get("source_url")
                                for f in f_list
                                for evi in f.get("evidence", [])
                            ]
                        }
                        for val, f_list in distinct_values.items()
                    ]
                }
                conflicts.append(conflict_rec)

                # Mark involved facts as CONFLICTED
                for f in group:
                    f["status"] = "CONFLICTED"
                    f["conflict_info"] = conflict_rec

        return facts, conflicts
