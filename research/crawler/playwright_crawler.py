"""
research/crawler/playwright_crawler.py
Production-ready Playwright Crawler for Graduate Exhibition & Academic Portals.
Handles JS rendering, SPA navigation, full-page screenshots, and raw evidence preservation.
"""

import os
import sys
import re
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin, urlparse

from .url_policy import is_safe_url
from .crawl_policy import CrawlPolicy
from .snapshot import save_snapshot, find_cached_snapshot, compute_content_hash

try:
    from playwright.sync_api import sync_playwright, Browser, Page, Response
except ImportError:
    sync_playwright = None


class PlaywrightCrawler:
    def __init__(self, policy: Optional[CrawlPolicy] = None):
        self.policy = policy or CrawlPolicy()

    def crawl_page(
        self,
        url: str,
        capture_screenshot: bool = True,
        use_cache: bool = True,
        wait_selector: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crawls a single webpage using Playwright, validates SSRF security,
        captures full-page screenshot & DOM, and stores raw evidence snapshot.
        """
        # 1. SSRF and Protocol Safety Validation
        is_safe, reason = is_safe_url(url)
        if not is_safe:
            return {
                "status": "BLOCKED",
                "error": f"SSRF Protection: {reason}",
                "requested_url": url,
                "final_url": url,
                "status_code": 0,
                "metadata": None,
                "is_cached": False,
            }

        # 2. Check Cache
        if use_cache:
            cached_meta = find_cached_snapshot(url)
            if cached_meta:
                return {
                    "status": "SUCCESS",
                    "requested_url": url,
                    "final_url": cached_meta.get("final_url", url),
                    "canonical_url": cached_meta.get("canonical_url", ""),
                    "status_code": cached_meta.get("status_code", 200),
                    "title": cached_meta.get("title", ""),
                    "content_hash": cached_meta.get("content_hash"),
                    "metadata": cached_meta,
                    "is_cached": True,
                }

        if sync_playwright is None:
            return {
                "status": "FAILED",
                "error": "Playwright is not installed or available in this Python runtime.",
                "requested_url": url,
                "final_url": url,
                "status_code": 0,
                "metadata": None,
                "is_cached": False,
            }

        try:
            with sync_playwright() as p:
                browser: Browser = p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--disable-web-security"
                    ]
                )
                context = browser.new_context(
                    user_agent=self.policy.user_agent,
                    viewport={"width": 1280, "height": 800},
                    ignore_https_errors=True
                )
                page: Page = context.new_page()

                # Track HTTP status and response headers
                nav_response = page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=self.policy.timeout_ms
                )

                if wait_selector:
                    try:
                        page.wait_for_selector(wait_selector, timeout=4000)
                    except Exception:
                        pass
                else:
                    # Brief settling delay for client JS hydration
                    page.wait_for_timeout(1500)

                final_url = page.url
                # Validate redirected destination for SSRF safety as well
                dest_safe, dest_reason = is_safe_url(final_url)
                if not dest_safe:
                    browser.close()
                    return {
                        "status": "BLOCKED",
                        "error": f"Post-redirect SSRF Block: {dest_reason}",
                        "requested_url": url,
                        "final_url": final_url,
                        "status_code": 0,
                        "metadata": None,
                        "is_cached": False,
                    }

                status_code = nav_response.status if nav_response else 200
                content_type = nav_response.headers.get("content-type", "text/html") if nav_response else "text/html"
                title = page.title()

                # Extract canonical link if specified in <head>
                canonical_url = ""
                try:
                    canonical_elem = page.query_selector("link[rel='canonical']")
                    if canonical_elem:
                        href = canonical_elem.get_attribute("href")
                        if href:
                            canonical_url = urljoin(final_url, href)
                except Exception:
                    pass

                # DOM HTML & text
                html_content = page.content()
                try:
                    text_content = page.inner_text("body")
                except Exception:
                    text_content = ""

                # Full-page screenshot capture
                screenshot_bytes = None
                if capture_screenshot:
                    try:
                        screenshot_bytes = page.screenshot(full_page=False, timeout=8000)
                    except Exception:
                        try:
                            screenshot_bytes = page.screenshot(full_page=False)
                        except Exception:
                            screenshot_bytes = None

                # Extract discovery links & image candidates
                discovered_links = []
                try:
                    anchors = page.query_selector_all("a[href]")
                    for a in anchors[:100]:
                        href = a.get_attribute("href")
                        text = a.inner_text().strip()
                        if href and not href.startswith("javascript:") and not href.startswith("#"):
                            abs_href = urljoin(final_url, href)
                            discovered_links.append({"url": abs_href, "anchor_text": text[:60]})
                except Exception:
                    pass

                discovered_images = []
                try:
                    img_nodes = page.query_selector_all("img[src]")
                    for im in img_nodes[:30]:
                        src = im.get_attribute("src")
                        alt = (im.get_attribute("alt") or "").strip()
                        if src and not src.startswith("data:"):
                            abs_src = urljoin(final_url, src)
                            discovered_images.append({"src": abs_src, "alt": alt})
                except Exception:
                    pass

                browser.close()

                # Persist raw snapshot
                metadata = save_snapshot(
                    url=url,
                    final_url=final_url,
                    canonical_url=canonical_url,
                    status_code=status_code,
                    content_type=content_type,
                    title=title,
                    html_content=html_content,
                    text_content=text_content,
                    screenshot_bytes=screenshot_bytes,
                    extra_metadata={
                        "links_count": len(discovered_links),
                        "images_count": len(discovered_images)
                    }
                )

                return {
                    "status": "SUCCESS",
                    "requested_url": url,
                    "final_url": final_url,
                    "canonical_url": canonical_url or final_url,
                    "status_code": status_code,
                    "title": title,
                    "content_hash": metadata["content_hash"],
                    "html_content": html_content,
                    "text_content": text_content,
                    "links": discovered_links,
                    "images": discovered_images,
                    "metadata": metadata,
                    "is_cached": False,
                }

        except Exception as e:
            return {
                "status": "FAILED",
                "error": str(e),
                "requested_url": url,
                "final_url": url,
                "status_code": 0,
                "metadata": None,
                "is_cached": False,
            }
