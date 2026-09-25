import json
import os

def main():
    p = os.path.join("data", "research", "intelligence", "recruitment_intelligence.json")
    with open(p, "r", encoding="utf-8") as f:
        data = json.load(f)

    postings = data.get("verified_postings", [])
    print(f"Total verified postings: {len(postings)}")
    print(f"Dataset type: {data.get('type')}")
    print(f"Source: {data.get('source_reference')}")
    print("-" * 60)

    # Department distribution
    dept_counts = {}
    cat_counts = {}
    companies = set()

    for job in postings:
        companies.add(job["companyName"])
        cat = job.get("jobCategory", "기타")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
        for dept in job.get("preferredDepartments", []):
            dept_counts[dept] = dept_counts.get(dept, 0) + 1

    print("\n[Company Sample (15)]:")
    for c in sorted(list(companies))[:15]:
        print(f" - {c}")

    print("\n[Job Category Distribution]:")
    for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f" - {cat}: {cnt}건")

    print("\n[Top Preferred Departments]:")
    for dept, cnt in sorted(dept_counts.items(), key=lambda x: -x[1]):
        print(f" - {dept}: {cnt}건")

    print("\n[First 5 Postings]:")
    for job in postings[:5]:
        print(f"[{job['companyName']}] {job['title']}")
        print(f"  Category: {job['jobCategory']}, Level: {job['careerLevel']}, Deadline: {job['deadline']}")
        print(f"  Target Depts: {job['preferredDepartments']}")
        print(f"  URL: {job['originUrl']}")
        print(f"  Evidence: {job['evidenceText']}")
        print()

if __name__ == "__main__":
    main()
