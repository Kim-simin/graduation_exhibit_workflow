import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

# Check home html and about html
with open('C:/Users/USER/.gemini/antigravity/brain/4ef68056-b3d6-40cd-a517-78ded487fedb/.system_generated/steps/725/content.md', 'r', encoding='utf-8') as f:
    home_html = f.read()

with open('scripts/snu_about_clean.html', 'r', encoding='utf-8') as f:
    about_html = f.read()

print("Home OG Image:", re.findall(r'property="og:image"\s+content="([^"]+)"', home_html))
print("About OG Image:", re.findall(r'property="og:image"\s+content="([^"]+)"', about_html))

# Find any <img> or poster references
print("Home <img>:", re.findall(r'<img[^>]+src="([^"]+)"', home_html))
print("About <img>:", re.findall(r'<img[^>]+src="([^"]+)"', about_html))

# Also search for "poster" in both
print("Home 'poster' matches:", re.findall(r'[^"\s\']*(?:poster|main)[^"\s\']*', home_html, re.I)[:10])
print("About 'poster' matches:", re.findall(r'[^"\s\']*(?:poster|main)[^"\s\']*', about_html, re.I)[:10])
