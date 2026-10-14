# scripts/check_playwright_python.py
try:
    import playwright
    print("Playwright is installed in Python!")
except ImportError:
    print("Playwright is not in Python.")
