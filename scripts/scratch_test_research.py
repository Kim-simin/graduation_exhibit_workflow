import sys
import os

# Set root
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from research.crawler.url_policy import is_safe_url
from research.local_ai.qwen25vl import Qwen25VLAdapter
from research.validation.source_validator import SourceValidator
from research.validation.fact_validator import FactValidator
from research.validation.conflict_detector import ConflictDetector

def main():
    print("=== TESTING STEP 13 CORE LOGIC ===")
    
    # 1. Test SSRF URL Safety
    safe, r1 = is_safe_url("https://sidi.hongik.ac.kr")
    assert safe, f"Expected safe, got {r1}"
    
    blocked_local, r2 = is_safe_url("http://127.0.0.1:8080")
    assert not blocked_local, f"Expected blocked local IP, got {r2}"
    print("✔ SSRF URL Safety Tests Passed")

    # 2. Test Local Model Health Probe
    adapter = Qwen25VLAdapter()
    health = adapter.health_check()
    print(f"✔ Local Model Probe Status: {health['status']}")
    
    # 3. Test Evidence Requirement for Facts
    fact_no_evidence = {
        "fact_id": "fact-test-01",
        "field": "title",
        "value": "Test",
        "evidence": []
    }
    validated = FactValidator.validate_fact(fact_no_evidence)
    assert validated["status"] == "UNVERIFIED", f"Expected UNVERIFIED, got {validated['status']}"
    print("✔ Evidence-less fact rejected from VERIFIED status")

    # 4. Test Conflict Detection
    f1 = {"entity_type": "Artwork", "entity_id": "art-01", "field": "title", "value": "A", "evidence": []}
    f2 = {"entity_type": "Artwork", "entity_id": "art-01", "field": "title", "value": "B", "evidence": []}
    _, conflicts = ConflictDetector.detect_conflicts([f1, f2])
    assert len(conflicts) == 1, f"Expected 1 conflict, got {len(conflicts)}"
    print("✔ Conflict Detection Passed")
    
    print("🎉 ALL CORE UNIT CHECKS PASSED!")

if __name__ == "__main__":
    main()
