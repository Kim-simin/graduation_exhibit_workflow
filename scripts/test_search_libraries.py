"""
scripts/test_search_libraries.py
Check installed search libraries in python environment.
"""
import sys

packages = ["tavily", "serpapi", "google_search_results", "duckduckgo_search", "googlesearch", "bs4"]
found = {}
for p in packages:
    try:
        __import__(p)
        found[p] = True
    except ImportError:
        found[p] = False

print("Installed packages:", found)
