"""
scripts/test_ddgs.py
Test duckduckgo_search package with DDGS.
"""
from duckduckgo_search import DDGS

def test_search():
    with DDGS() as ddgs:
        for q in ["건국대학교 졸업전시", "인천대학교 컴퓨터공학부 졸업작품"]:
            print(f"--- Query: {q} ---")
            results = list(ddgs.text(q, max_results=3))
            print(f"Results count: {len(results)}")
            for r in results:
                print(f"- {r.get('title')}: {r.get('href')}")

if __name__ == "__main__":
    test_search()
