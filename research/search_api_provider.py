"""
research/search_api_provider.py
Strict API-based web search client.
PROHIBITS direct browser-use search on Google/Naver to avoid CAPTCHA & IP ban.
Supports SerpAPI, Tavily, and strictly isolates mock data from production.
"""
import os
import sys
import re
import json
import urllib.parse
import urllib.request
from typing import Dict, Any, List, Optional
from datetime import datetime

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

class SearchAPIError(Exception):
    """Raised when external Search API fails or credentials are missing."""
    pass

class SearchCandidate:
    def __init__(self, url: str, title: str, snippet: str, domain_type: str, query: str):
        self.url = url
        self.title = title
        self.snippet = snippet
        self.domain_type = domain_type  # OFFICIAL_ACADEMIC, SNS, NEWS, OTHER
        self.query = query

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "title": self.title,
            "snippet": self.snippet,
            "domain_type": self.domain_type,
            "query": self.query
        }

def classify_domain_type(url: str) -> str:
    """Classifies domain into official academic, SNS, news, or other."""
    u_low = url.lower()
    if ".ac.kr" in u_low or ".edu" in u_low:
        return "OFFICIAL_ACADEMIC"
    elif "instagram.com" in u_low or "x.com" in u_low or "twitter.com" in u_low or "facebook.com" in u_low:
        return "SNS"
    elif any(n in u_low for n in ["news", "yna.co.kr", "chosun.com", "donga.com", "joongang.co.kr", "hankookilbo.com"]):
        return "NEWS"
    return "OTHER"

def generate_search_queries(university_name: str, department_keyword: str, target_year: str) -> List[str]:
    """Generates the 5 mandatory query sets."""
    dept = department_keyword.strip() if department_keyword else ""
    queries = [
        f'"{university_name} {dept} 졸업전시회 {target_year}"'.strip(),
        f'"{university_name} {dept} 졸전 {target_year}"'.strip(),
        f'"{university_name} {dept} 학위전시 {target_year}"'.strip(),
        f'site:instagram.com "{university_name} {dept} 졸업전시"'.strip(),
        f'site:x.com "{university_name} {dept} 졸업전시"'.strip()
    ]
    return queries

class SearchAPIProvider:
    def __init__(self, allow_mock: bool = False):
        """
        allow_mock: If False (default for production), API failures raise SearchAPIError
                    and NEVER generate synthetic/mock data.
        """
        self.allow_mock = allow_mock
        self.serpapi_key = os.getenv("SERPAPI_API_KEY")
        self.tavily_key = os.getenv("TAVILY_API_KEY")

    def execute_search(
        self,
        university_name: str,
        department_keyword: str,
        target_year: str
    ) -> List[SearchCandidate]:
        """
        Executes multi-query search via official Search API.
        Deduplicates results and tags domains.
        """
        queries = generate_search_queries(university_name, department_keyword, target_year)
        all_candidates: List[SearchCandidate] = []
        seen_urls = set()

        api_called = False

        # 1. Try SerpAPI (Google) if key is present
        if self.serpapi_key:
            try:
                for q in queries:
                    items = self._query_serpapi(q)
                    for it in items:
                        if it.url not in seen_urls:
                            seen_urls.add(it.url)
                            all_candidates.append(it)
                api_called = True
            except Exception as e:
                print(f"[SearchAPIProvider] SerpAPI error: {e}", flush=True)

        # 2. Try Tavily API if SerpAPI was not used or failed
        if not api_called and self.tavily_key:
            try:
                for q in queries:
                    items = self._query_tavily(q)
                    for it in items:
                        if it.url not in seen_urls:
                            seen_urls.add(it.url)
                            all_candidates.append(it)
                api_called = True
            except Exception as e:
                print(f"[SearchAPIProvider] Tavily error: {e}", flush=True)

        # 3. Handle Missing/Failed API
        if not api_called:
            if not self.allow_mock:
                raise SearchAPIError(
                    "Search API credentials missing (neither SERPAPI_API_KEY nor TAVILY_API_KEY found) "
                    "or API failed. Mock data is strictly prohibited from entering production."
                )
            else:
                # Controlled mock ONLY for isolated test runs
                print("[SearchAPIProvider] [TEST ONLY] Using isolated test search candidates...", flush=True)
                return self._generate_isolated_test_candidates(university_name, department_keyword, target_year)

        return all_candidates

    def _query_serpapi(self, query: str) -> List[SearchCandidate]:
        params = {
            "api_key": self.serpapi_key,
            "engine": "google",
            "q": query,
            "hl": "ko",
            "gl": "kr",
            "num": 5
        }
        url = f"https://serpapi.com/search.json?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        results = []
        for item in data.get("organic_results", []):
            link = item.get("link")
            if link and link.startswith("http"):
                results.append(SearchCandidate(
                    url=link,
                    title=item.get("title", ""),
                    snippet=item.get("snippet", ""),
                    domain_type=classify_domain_type(link),
                    query=query
                ))
        return results

    def _query_tavily(self, query: str) -> List[SearchCandidate]:
        payload = json.dumps({
            "query": query,
            "max_results": 5,
            "search_depth": "basic"
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.tavily.com/search",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.tavily_key}"
            }
        )
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        results = []
        for item in data.get("results", []):
            link = item.get("url")
            if link and link.startswith("http"):
                results.append(SearchCandidate(
                    url=link,
                    title=item.get("title", ""),
                    snippet=item.get("content", ""),
                    domain_type=classify_domain_type(link),
                    query=query
                ))
        return results

    def _generate_isolated_test_candidates(self, univ: str, dept: str, year: str) -> List[SearchCandidate]:
        """Provides verified known test candidates for unit test purposes ONLY."""
        if "건국" in univ and "시각" in dept:
            return [
                SearchCandidate(
                    url="https://kku2026mid.com/project",
                    title="2026 건국대학교 시각영상디자인학과 졸업전시회",
                    snippet="2026 건국대학교 시각영상디자인학과 졸업전시 아카이브입니다. Click to Dive 등 학생 작품 수록.",
                    domain_type="OFFICIAL_ACADEMIC",
                    query=f"{univ} {dept} 졸업전시회 {year}"
                )
            ]
        elif "인천" in univ and ("컴퓨터" in dept or "컴공" in dept):
            return [
                SearchCandidate(
                    url="https://cse.inu.ac.kr/isis/13789/subview.do",
                    title="인천대학교 컴퓨터공학부 2026 졸업작품 게시판",
                    snippet="인천대학교 컴퓨터공학부 졸업작품 목록입니다. G-05 공연 음향 튜닝 등 출품.",
                    domain_type="OFFICIAL_ACADEMIC",
                    query=f"{univ} {dept} 졸업전시회 {year}"
                )
            ]
        return []
