"""
scripts/test_search_status.py
Inspects the current execution status of SearchAPIProvider (SerpAPI, Tavily, fallback).
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

load_dotenv(project_root / ".env")

from research.search_api_provider import SearchAPIProvider, SearchAPIError

def check_status():
    serp_key = os.getenv("SERPAPI_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    print("=== Search API Environment Check ===")
    print(f"SERPAPI_API_KEY present: {bool(serp_key)} (length: {len(serp_key) if serp_key else 0})")
    print(f"TAVILY_API_KEY present:  {bool(tavily_key)} (length: {len(tavily_key) if tavily_key else 0})")
    print("=====================================")

    provider = SearchAPIProvider(allow_mock=False)
    try:
        results = provider.execute_search("건국대학교", "시각영상디자인학과", "2026")
        print(f"Search succeeded! Found {len(results)} candidates.")
        for r in results:
            print(f"- [{r.domain_type}] {r.title} -> {r.url}")
    except SearchAPIError as e:
        print(f"[EXPECTED RESULT WITHOUT KEYS] SearchAPIError raised correctly:")
        print(f"-> {e}")
    except Exception as e:
        print(f"[UNEXPECTED ERROR]: {type(e).__name__}: {e}")

if __name__ == "__main__":
    check_status()
