"""
research/crawler/url_policy.py
Strict URL validation and SSRF prevention module.
"""

import socket
import ipaddress
from urllib.parse import urlparse
from typing import Tuple, Optional

# Private / reserved IPv4 & IPv6 networks to reject for SSRF defense
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "local",
    "broadcasthost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
}


def is_safe_url(url: str) -> Tuple[bool, str]:
    """
    Validates that a URL is safe for server-side fetching.
    Guards against SSRF, internal port scanning, and loopback attacks.
    """
    if not url or not isinstance(url, str):
        return False, "Empty or non-string URL provided"

    clean_url = url.strip()
    try:
        parsed = urlparse(clean_url)
    except Exception as e:
        return False, f"Invalid URL syntax: {e}"

    # 1. Enforce http / https scheme only
    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported URL scheme: '{parsed.scheme}'. Only http and https are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL lacks a valid hostname"

    hostname_lower = hostname.lower()

    # 2. Block internal / loopback hostnames
    if hostname_lower in BLOCKED_HOSTNAMES or hostname_lower.endswith(".local"):
        return False, f"Access to localhost/internal hostname '{hostname}' is blocked."

    # 3. Resolve and block private / reserved IP addresses
    try:
        # Check if hostname is an explicit IP literal
        ip = ipaddress.ip_address(hostname_lower)
        for net in BLOCKED_NETWORKS:
            if ip in net:
                return False, f"Access to private/reserved IP address '{ip}' is blocked."
    except ValueError:
        # Hostname is a domain name, resolve via DNS
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip = ipaddress.ip_address(ip_str)
                for net in BLOCKED_NETWORKS:
                    if ip in net:
                        return False, f"Resolved IP '{ip}' for hostname '{hostname}' is within blocked private network."
        except socket.gaierror:
            # DNS resolution failure will be handled by crawler, but domain name format is accepted
            pass
        except Exception as e:
            return False, f"Host validation error: {e}"

    return True, "URL is safe"
