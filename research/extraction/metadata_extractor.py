"""
research/extraction/metadata_extractor.py
Extracts OpenGraph, Dublin Core, schema.org JSON-LD, and HTML meta tags.
"""

import re
import json
from typing import Dict, Any, List
from html.parser import HTMLParser


class MetaTagParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta_tags = {}
        self.og_tags = {}
        self.twitter_tags = {}
        self.json_ld_scripts = []
        self._current_tag = None
        self._current_data = []

    def handle_starttag(self, tag, attrs):
        attr_dict = {k.lower(): v for k, v in attrs if v is not None}
        if tag == "meta":
            name = attr_dict.get("name", "").lower()
            prop = attr_dict.get("property", "").lower()
            content = attr_dict.get("content", "")

            if prop.startswith("og:"):
                self.og_tags[prop[3:]] = content
            elif prop.startswith("twitter:") or name.startswith("twitter:"):
                key = prop[8:] if prop.startswith("twitter:") else name[8:]
                self.twitter_tags[key] = content
            elif name:
                self.meta_tags[name] = content

        elif tag == "script" and attr_dict.get("type") == "application/ld+json":
            self._current_tag = "json-ld"
            self._current_data = []

    def handle_data(self, data):
        if self._current_tag == "json-ld":
            self._current_data.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._current_tag == "json-ld":
            raw_json = "".join(self._current_data).strip()
            if raw_json:
                try:
                    parsed = json.loads(raw_json)
                    self.json_ld_scripts.append(parsed)
                except Exception:
                    pass
            self._current_tag = None
            self._current_data = []


def extract_page_metadata(html_content: str) -> Dict[str, Any]:
    """Parses standard metadata from raw HTML."""
    if not html_content:
        return {"meta": {}, "og": {}, "twitter": {}, "json_ld": []}

    parser = MetaTagParser()
    try:
        parser.feed(html_content)
    except Exception:
        pass

    return {
        "meta": parser.meta_tags,
        "og": parser.og_tags,
        "twitter": parser.twitter_tags,
        "json_ld": parser.json_ld_scripts,
        "author": parser.og_tags.get("author") or parser.meta_tags.get("author") or "",
        "title": parser.og_tags.get("title") or parser.meta_tags.get("title") or "",
        "description": parser.og_tags.get("description") or parser.meta_tags.get("description") or "",
        "image": parser.og_tags.get("image") or parser.twitter_tags.get("image") or ""
    }
