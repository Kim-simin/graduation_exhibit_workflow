"""
research/extraction/dom_extractor.py
Deterministic, code-first DOM extractor for university graduation exhibitions.
Discovers artwork cards, student names, project titles, and exhibition metadata.
"""

import re
from typing import Dict, Any, List, Optional
from html.parser import HTMLParser
from urllib.parse import urljoin


# Regex patterns for academic/graduation exhibition identification
EXHIBITION_KEYWORDS = [
    r"졸업\s*전시(?:회)?",
    r"졸업\s*작품(?:전)?",
    r"학위\s*청구\s*전시",
    r"과제전",
    r"정기\s*전시(?:회)?",
    r"Graduation\s+Exhibition",
    r"Degree\s+Show",
    r"Archive",
    r"Degree\s+Exhibition"
]

YEAR_PATTERN = re.compile(r"\b(202[0-9])\b")
KOREAN_NAME_PATTERN = re.compile(r"^[가-힣]{2,4}$")


def extract_dom_structure(html_content: str, base_url: str = "") -> Dict[str, Any]:
    """
    Extracts text blocks, headings, candidate artwork cards, and links from HTML.
    """
    if not html_content:
        return {"headings": [], "artwork_candidates": [], "exhibition_mentions": [], "clean_text": ""}

    # Extract headings (h1, h2, h3)
    headings = []
    for m in re.finditer(r"<(h[1-3])[^>]*>([\s\S]*?)</\1>", html_content, re.IGNORECASE):
        tag = m.group(1).lower()
        text = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        if text and len(text) < 150:
            headings.append({"tag": tag, "text": text})

    # Extract all text without tags
    clean_text = re.sub(r"<script[\s\S]*?</script>", " ", html_content, flags=re.IGNORECASE)
    clean_text = re.sub(r"<style[\s\S]*?</style>", " ", clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r"<[^>]+>", " ", clean_text)
    clean_text = re.sub(r"\s+", " ", clean_text).strip()

    # Detect exhibition mentions
    exhibition_mentions = []
    for kw in EXHIBITION_KEYWORDS:
        matches = re.findall(kw, clean_text, re.IGNORECASE)
        if matches:
            exhibition_mentions.extend(matches)

    # Detect years
    years = sorted(list(set(YEAR_PATTERN.findall(clean_text))))

    # Extract artwork / card-like structures
    # Look for card blocks or figure elements containing both an image and text
    artwork_candidates = []
    card_pattern = re.compile(
        r"<(?:div|article|li|section)[^>]*(?:class|id)=['\"][^'\"]*(?:item|card|work|project|artwork|gallery|post)[^'\"]*['\"][^>]*>([\s\S]*?)</(?:div|article|li|section)>",
        re.IGNORECASE
    )

    for match in card_pattern.finditer(html_content):
        chunk = match.group(1)
        # Find image inside card
        img_match = re.search(r"<img[^>]+src=['\"]([^'\"]+)['\"][^>]*>", chunk, re.IGNORECASE)
        img_url = urljoin(base_url, img_match.group(1)) if img_match else ""
        alt_text = ""
        if img_match:
            alt_m = re.search(r"alt=['\"]([^'\"]*)['\"]", img_match.group(0), re.IGNORECASE)
            if alt_m:
                alt_text = alt_m.group(1).strip()

        # Find title or text
        chunk_text = re.sub(r"<[^>]+>", " ", chunk)
        lines = [l.strip() for l in chunk_text.splitlines() if l.strip()]
        if not lines:
            lines = [w.strip() for w in chunk_text.split("  ") if w.strip()]

        if img_url and lines:
            candidate_title = alt_text or lines[0]
            candidate_author = ""
            for line in lines[1:]:
                if KOREAN_NAME_PATTERN.match(line):
                    candidate_author = line
                    break

            artwork_candidates.append({
                "title": candidate_title[:80],
                "author": candidate_author or "출품 작가",
                "image_url": img_url,
                "raw_text_snippet": " / ".join(lines[:3])[:150]
            })

    # Dedup artwork candidates by title/image
    unique_artworks = []
    seen = set()
    for art in artwork_candidates:
        key = (art["title"], art["image_url"])
        if key not in seen:
            seen.add(key)
            unique_artworks.append(art)

    return {
        "headings": headings,
        "clean_text": clean_text[:4000],
        "exhibition_mentions": list(set(exhibition_mentions)),
        "detected_years": years,
        "artwork_candidates": unique_artworks[:20]
    }
