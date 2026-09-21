"""
scripts/run_real_job_researcher.py
Runs the RealJobResearcher pipeline for Hongik University Visual Design Dept.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from research.recruitment.real_job_researcher import RealJobResearcher

def main():
    researcher = RealJobResearcher()
    result = researcher.research_for_department(university="홍익대학교", department_name="시각디자인과")
    print(f"=== Research Result ===")
    print(f"Target: {result['target_university']} {result['target_department']}")
    print(f"Total Discovered: {result['total_discovered']}")
    print(f"Total Verified: {result['total_verified']}")
    print(f"Stale: {result['stale_count']}, Unverified: {result['unverified_count']}")
    for p in result['verified_postings']:
        print(f"- [{p['verificationStatus']}] {p['companyName']} - {p['title']} ({p['majorPreferenceStatus']})")
        print(f"  URL: {p['originUrl']}")
        print(f"  SHA256: {p['contentHash'][:12]}...")

if __name__ == "__main__":
    main()
