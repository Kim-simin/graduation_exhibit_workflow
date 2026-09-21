"""
scripts/test_pipeline_quick_check.py
Quick validation test for the 7-node Academic-Corporate Research Pipeline.
"""

import os
import sys

# Windows UTF-8 console output
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from research.graph.cooperation_recruitment_runner import run_cooperation_recruitment_pipeline

def main():
    print("🚀 Starting quick test for cooperation recruitment pipeline...")
    res = run_cooperation_recruitment_pipeline(
        university="홍익대학교",
        department="시각디자인과",
        graduation_exhibit_url="https://sidi.hongik.ac.kr"
    )

    print(f"Status: {res.get('status')}")
    print(f"Run ID: {res.get('run_id')}")
    print(f"Cooperation Signals: {len(res.get('cooperation_signals', []))}")
    print(f"Expanded Companies: {len(res.get('expanded_companies', []))}")
    print(f"Department Mappings: {len(res.get('department_mappings', []))}")
    print(f"Recruitment Postings: {len(res.get('recruitment_postings', []))}")
    print(f"Talent Profiles: {len(res.get('talent_profiles', []))}")
    print(f"Cross Validation Results: {len(res.get('cross_validation_results', []))}")
    print(f"Report Length: {len(res.get('markdown_report', ''))} chars")

    assert res.get("status") == "COMPLETED", "Pipeline status must be COMPLETED"
    assert len(res.get("cooperation_signals", [])) > 0, "Should have cooperation signals"
    assert len(res.get("recruitment_postings", [])) > 0, "Should have recruitment postings"
    assert len(res.get("cross_validation_results", [])) > 0, "Should have cross-validation results"
    assert "## 6. 교차검증 결과" in res.get("markdown_report", ""), "Report must contain section 6"
    print("\n✅ Quick Pipeline Check PASSED successfully!")

if __name__ == "__main__":
    main()
