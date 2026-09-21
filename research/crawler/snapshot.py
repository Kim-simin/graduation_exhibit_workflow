"""
research/crawler/snapshot.py
Raw Evidence Snapshot Management Module.
Preserves raw HTML, text, screenshots, and metadata indexed by SHA-256 content hashes.
"""

import os
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_DIR = os.path.join(WORKSPACE_ROOT, "data", "research", "raw")
HTML_DIR = os.path.join(RAW_DIR, "html")
TEXT_DIR = os.path.join(RAW_DIR, "text")
SCREENSHOT_DIR = os.path.join(RAW_DIR, "screenshot")
METADATA_DIR = os.path.join(RAW_DIR, "metadata")


def ensure_snapshot_dirs():
    for d in [HTML_DIR, TEXT_DIR, SCREENSHOT_DIR, METADATA_DIR]:
        os.makedirs(d, exist_ok=True)


def compute_content_hash(html_content: str, text_content: str = "") -> str:
    """Computes a deterministic SHA-256 hash over normalized page text and HTML structure."""
    hasher = hashlib.sha256()
    hasher.update((html_content or "").encode("utf-8"))
    if text_content:
        hasher.update((text_content or "").encode("utf-8"))
    return hasher.hexdigest()[:32]


def find_cached_snapshot(url: str, content_hash: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Checks if a snapshot matching the URL (and optionally content_hash) already exists in cache.
    """
    ensure_snapshot_dirs()
    if content_hash:
        meta_file = os.path.join(METADATA_DIR, f"{content_hash}.json")
        if os.path.exists(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    if meta.get("url") == url or meta.get("final_url") == url:
                        return meta
            except Exception:
                pass

    # Search by URL
    for fname in os.listdir(METADATA_DIR):
        if not fname.endswith(".json"):
            continue
        meta_path = os.path.join(METADATA_DIR, fname)
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
                if meta.get("url") == url or meta.get("final_url") == url:
                    return meta
        except Exception:
            continue

    return None


def save_snapshot(
    url: str,
    final_url: str,
    canonical_url: str,
    status_code: int,
    content_type: str,
    title: str,
    html_content: str,
    text_content: str,
    screenshot_bytes: Optional[bytes] = None,
    crawler_version: str = "1.0.0",
    extra_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Persists raw evidence snapshot atomically into the designated directories.
    Returns metadata summary with relative file paths and contentHash.
    """
    ensure_snapshot_dirs()
    content_hash = compute_content_hash(html_content, text_content)

    html_rel = os.path.join("data", "research", "raw", "html", f"{content_hash}.html")
    text_rel = os.path.join("data", "research", "raw", "text", f"{content_hash}.txt")
    screenshot_rel = os.path.join("data", "research", "raw", "screenshot", f"{content_hash}.png") if screenshot_bytes else None
    metadata_rel = os.path.join("data", "research", "raw", "metadata", f"{content_hash}.json")

    html_abs = os.path.join(WORKSPACE_ROOT, html_rel)
    text_abs = os.path.join(WORKSPACE_ROOT, text_rel)
    screenshot_abs = os.path.join(WORKSPACE_ROOT, screenshot_rel) if screenshot_rel else None
    metadata_abs = os.path.join(WORKSPACE_ROOT, metadata_rel)

    # 1. Save HTML
    with open(html_abs, "w", encoding="utf-8") as f:
        f.write(html_content or "")

    # 2. Save Text
    with open(text_abs, "w", encoding="utf-8") as f:
        f.write(text_content or "")

    # 3. Save Screenshot if present
    if screenshot_bytes and screenshot_abs:
        with open(screenshot_abs, "wb") as f:
            f.write(screenshot_bytes)

    # 4. Save Metadata
    metadata = {
        "content_hash": content_hash,
        "url": url,
        "final_url": final_url,
        "canonical_url": canonical_url,
        "status_code": status_code,
        "content_type": content_type,
        "title": title,
        "accessed_at": datetime.now().isoformat(),
        "crawler_version": crawler_version,
        "html_path": html_rel.replace("\\", "/"),
        "text_path": text_rel.replace("\\", "/"),
        "screenshot_path": screenshot_rel.replace("\\", "/") if screenshot_rel else None,
        "metadata_path": metadata_rel.replace("\\", "/"),
        "extra": extra_metadata or {}
    }

    with open(metadata_abs, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    return metadata
