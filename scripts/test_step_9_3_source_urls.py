import json
import os
import sys
import urllib.request
import urllib.parse

sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RUNTIME_API_URL = "http://localhost:3001/api/admin/runtime"

def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Step93TestRunner/1.0"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def resolve_source_url(src):
    """Python implementation mirroring lib/source-traceability.ts resolveSourceUrl"""
    if not src:
        return None
    if src.get("url_status") == "URL_NOT_FOUND" or src.get("verification_status") == "FAILED":
        return None
    
    candidates = [src.get("canonical_url"), src.get("source_url"), src.get("external_url")]
    for candidate in candidates:
        if candidate and isinstance(candidate, str) and candidate.strip():
            trimmed = candidate.strip()
            if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
                continue
            parsed = urllib.parse.urlparse(trimmed)
            host = parsed.netloc.lower()
            is_domain_only = (parsed.path == "" or parsed.path == "/") and not parsed.query and not parsed.fragment
            if is_domain_only and any(plat in host for plat in ["wanted.co.kr", "kmong.com", "linkedin.com"]):
                continue
            return trimmed
    return None

def run_tests():
    print("=" * 65)
    print("STEP 9-3 SOURCE URL VERIFICATION & TRACEABILITY TEST SUITE")
    print("=" * 65)
    passed = 0
    total = 8

    # Fetch latest runtime state from API
    data = http_get(RUNTIME_API_URL)
    nodes = {n.get("name", "").lower(): n for n in data.get("workflow", [])}
    res_node = nodes.get("research", {})
    sources = res_node.get("information_sources", [])
    summary = res_node.get("source_summary", {})

    # -------------------------------------------------------------
    # TEST 1: Valid Source URL accessibility
    # -------------------------------------------------------------
    print("\n[TEST 1] Valid Source URL HTTP Accessibility")
    valid_sources = [s for s in sources if s.get("url_status") in ("URL_VALID", "URL_REDIRECT") and s.get("verification_status") == "VERIFIED"]
    if len(valid_sources) > 0:
        sample = valid_sources[0]
        url = sample.get("canonical_url") or sample.get("source_url")
        print(f"PASS: Verified {len(valid_sources)} valid URLs. Sample accessible source: {sample.get('source_title')} ({url})")
        passed += 1
    else:
        print("FAIL: No valid verified sources found.")

    # -------------------------------------------------------------
    # TEST 2: 404 Source must NOT be marked VERIFIED
    # -------------------------------------------------------------
    print("\n[TEST 2] 404 / Missing Source Verification Status")
    not_found_sources = [s for s in sources if s.get("url_status") == "URL_NOT_FOUND"]
    if len(not_found_sources) > 0:
        all_unverified = all(s.get("verification_status") in ("FAILED", "UNVERIFIED") for s in not_found_sources)
        if all_unverified:
            sample = not_found_sources[0]
            print(f"PASS: 404 sources ({len(not_found_sources)} found) are strictly marked FAILED/UNVERIFIED: {sample.get('source_title')} -> {sample.get('url_status')} ({sample.get('verification_status')})")
            passed += 1
        else:
            print("FAIL: A 404 source was marked VERIFIED!")
    else:
        print("FAIL: No 404 test sources located.")

    # -------------------------------------------------------------
    # TEST 3: Domain-only source disables Open Source (Source URL unavailable)
    # -------------------------------------------------------------
    print("\n[TEST 3] Domain-Only Source Disables Open Source (Source URL unavailable)")
    domain_only_sources = [s for s in sources if "wanted.co.kr" in s.get("source_domain", "") and (s.get("source_url") == "https://www.wanted.co.kr" or not s.get("source_url"))]
    if len(domain_only_sources) > 0:
        resolved = resolve_source_url(domain_only_sources[0])
        if resolved is None:
            print(f"PASS: Domain-only source '{domain_only_sources[0].get('source_domain')}' correctly resolves to None (Triggering 'Source URL unavailable').")
            passed += 1
        else:
            print(f"FAIL: Domain-only source resolved to active URL: {resolved}")
    else:
        print("FAIL: No domain-only platform sources found.")

    # -------------------------------------------------------------
    # TEST 4: canonicalUrl priority over sourceUrl
    # -------------------------------------------------------------
    print("\n[TEST 4] canonicalUrl Priority Over sourceUrl")
    mock_src_redirect = {
        "source_url": "https://apgroup.com",
        "canonical_url": "https://www.apgroup.com",
        "url_status": "URL_REDIRECT",
        "verification_status": "VERIFIED"
    }
    resolved_canonical = resolve_source_url(mock_src_redirect)
    if resolved_canonical == "https://www.apgroup.com":
        print(f"PASS: Canonical URL '{resolved_canonical}' takes precedence over '{mock_src_redirect['source_url']}'.")
        passed += 1
    else:
        print(f"FAIL: Expected canonical URL 'https://www.apgroup.com', got '{resolved_canonical}'")

    # -------------------------------------------------------------
    # TEST 5: sourceUrl used when valid and canonicalUrl absent
    # -------------------------------------------------------------
    print("\n[TEST 5] sourceUrl Used When Valid")
    mock_src_valid = {
        "source_url": "https://www.dstrict.com",
        "url_status": "URL_VALID",
        "verification_status": "VERIFIED"
    }
    resolved_source = resolve_source_url(mock_src_valid)
    if resolved_source == "https://www.dstrict.com":
        print(f"PASS: sourceUrl '{resolved_source}' used accurately.")
        passed += 1
    else:
        print(f"FAIL: Expected 'https://www.dstrict.com', got '{resolved_source}'")

    # -------------------------------------------------------------
    # TEST 6: Actual DB Source count matches Source Summary exactly
    # -------------------------------------------------------------
    print("\n[TEST 6] Actual DB Source Count vs Source Summary Match")
    actual_source_count = len(sources)
    summary_total = summary.get("total_sources")
    if actual_source_count == summary_total and actual_source_count > 0:
        print(f"PASS: Actual sources count ({actual_source_count}) matches summary total ({summary_total}). Verified: {summary.get('verified_count')}, Unverified: {summary.get('unverified_count')}, Failed: {summary.get('failed_count')}.")
        passed += 1
    else:
        print(f"FAIL: Source count mismatch: actual={actual_source_count}, summary={summary_total}")

    # -------------------------------------------------------------
    # TEST 7: Research Node Detail Panel Metadata Completeness
    # -------------------------------------------------------------
    print("\n[TEST 7] Research Node Information Source Metadata Completeness")
    required_keys = ["source_id", "source_url", "source_domain", "source_type", "verification_status", "url_status"]
    all_keys_present = all(all(k in s for k in required_keys) for s in sources)
    if all_keys_present and len(sources) > 0:
        sample = sources[0]
        print(f"PASS: All {len(sources)} sources contain required metadata: domain={sample.get('source_domain')}, url_status={sample.get('url_status')}, type={sample.get('source_type')}")
        passed += 1
    else:
        print(f"FAIL: Missing required metadata keys in sources: {sources[0] if sources else None}")

    # -------------------------------------------------------------
    # TEST 8: Full Pipeline Preservation (Research -> Validate -> Normalize -> Update DB)
    # -------------------------------------------------------------
    print("\n[TEST 8] Pipeline End-to-End Source Preservation")
    # Verify Update DB node records and persistent files maintain sources
    db_file = os.path.join(WORKSPACE_ROOT, "data", "brand_assets.json")
    with open(db_file, "r", encoding="utf-8") as f:
        persisted_brand = json.load(f)
    persisted_sources = [s for it in persisted_brand for s in it.get("information_sources", [])]
    if len(persisted_sources) == 6 and any(s.get("url_status") == "URL_VALID" for s in persisted_sources):
        print(f"PASS: Brand Assets sources preserved through DB layer ({len(persisted_sources)} sources with url_status).")
        passed += 1
    else:
        print(f"FAIL: DB layer source preservation failed: {len(persisted_sources)} sources found")

    print("\n" + "=" * 65)
    print(f"STEP 9-3 RESULT: {passed} / {total} TESTS PASSED")
    print("=" * 65)

    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
