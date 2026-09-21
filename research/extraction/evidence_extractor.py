"""
research/extraction/evidence_extractor.py
Constructs formal Evidence and Fact objects strictly mapping claims to source URLs and DOM locations.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional


def create_evidence(
    source_url: str,
    source_id: str,
    evidence_type: str,  # DOM_TEXT | SCREENSHOT | METADATA | PDF
    quote: str,
    locator: str = "",
    content_hash: str = "",
    screenshot_path: Optional[str] = None
) -> Dict[str, Any]:
    """Creates an atomic, immutable Evidence object."""
    return {
        "evidence_id": f"evi-{uuid.uuid4().hex[:10]}",
        "source_url": source_url,
        "source_id": source_id,
        "evidence_type": evidence_type,
        "locator": locator or "body",
        "quote": quote[:300] if quote else "",
        "content_hash": content_hash,
        "screenshot_path": screenshot_path,
        "captured_at": datetime.now().isoformat()
    }


def create_fact(
    entity_type: str,
    entity_id: str,
    field: str,
    value: Any,
    evidence_list: List[Dict[str, Any]],
    source_level: int = 1
) -> Dict[str, Any]:
    """
    Creates a Fact object linked to one or more concrete Evidence items.
    If evidence_list is empty, status starts strictly as UNVERIFIED.
    """
    has_evidence = bool(evidence_list and len(evidence_list) > 0)
    initial_status = "AI_EXTRACTED" if source_level > 3 else ("CANDIDATE" if has_evidence else "UNVERIFIED")

    return {
        "fact_id": f"fact-{uuid.uuid4().hex[:10]}",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "field": field,
        "value": value,
        "status": initial_status,
        "source_level": source_level,
        "evidence": evidence_list or [],
        "created_at": datetime.now().isoformat()
    }


def build_evidence_bundle(
    url: str,
    source_id: str,
    content_hash: str,
    dom_data: Dict[str, Any],
    meta_data: Dict[str, Any],
    screenshot_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Bundles DOM extraction and metadata into concrete Evidence records and Fact candidates.
    """
    evidences: List[Dict[str, Any]] = []
    facts: List[Dict[str, Any]] = []

    # 1. Metadata Evidence
    if meta_data.get("title"):
        evi_meta = create_evidence(
            source_url=url,
            source_id=source_id,
            evidence_type="METADATA",
            quote=f"og:title: {meta_data['title']}",
            locator="head > meta[property='og:title']",
            content_hash=content_hash,
            screenshot_path=screenshot_path
        )
        evidences.append(evi_meta)

    # 2. Text / Headings Evidence
    headings = dom_data.get("headings", [])
    if headings:
        heading_text = " | ".join([f"{h['tag']}: {h['text']}" for h in headings[:3]])
        evi_head = create_evidence(
            source_url=url,
            source_id=source_id,
            evidence_type="DOM_TEXT",
            quote=heading_text,
            locator="h1, h2, h3",
            content_hash=content_hash,
            screenshot_path=screenshot_path
        )
        evidences.append(evi_head)

    # 3. Artwork Candidates with Evidence
    artworks = dom_data.get("artwork_candidates", [])
    for idx, art in enumerate(artworks):
        art_id = f"art-{content_hash[:8]}-{idx+1:02d}"
        evi_art = create_evidence(
            source_url=url,
            source_id=source_id,
            evidence_type="DOM_TEXT",
            quote=f"Artwork: {art['title']} / Author: {art.get('author', '출품 작가')} / Img: {art.get('image_url', '')}",
            locator=f".artwork-card:nth-of-type({idx+1})",
            content_hash=content_hash,
            screenshot_path=screenshot_path
        )
        evidences.append(evi_art)

        fact_title = create_fact("Artwork", art_id, "title", art["title"], [evi_art])
        fact_author = create_fact("Artwork", art_id, "student_name", art.get("author", "출품 작가"), [evi_art])
        facts.extend([fact_title, fact_author])

    return {
        "evidences": evidences,
        "facts": facts,
        "artworks_count": len(artworks)
    }
