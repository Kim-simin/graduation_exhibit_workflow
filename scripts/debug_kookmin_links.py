import requests
import re
import urllib.parse

res = requests.get("https://expo.cs.kookmin.ac.kr/", verify=False)
html = res.text

hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE)
print("All hrefs:")
for h in hrefs:
    print(" ", h)

paths = re.findall(r'["\'](/(?:capstone|aws-day|works|gallery|projects)[^"\']*)["\']', html)
print("\nPaths found in quotes:")
for p in set(paths):
    print(" ", p)
