import os
import urllib.request
import shutil
from PIL import Image

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

dest_dir = 'my-exhibit-platform/public/uploads/UNIV-2025-서울대학교-디자인과'
os.makedirs(dest_dir, exist_ok=True)

poster_url = 'https://2025.snudesignweek.com/about/poster.png'
png_path = os.path.join(dest_dir, 'main_poster_2025.png')
jpg_path = os.path.join(dest_dir, 'main_poster_2025.jpg')

req = urllib.request.Request(poster_url, headers=headers)
with urllib.request.urlopen(req) as resp, open(png_path, 'wb') as f:
    shutil.copyfileobj(resp, f)

print(f"Downloaded poster to {png_path}, size: {os.path.getsize(png_path)} bytes")

# Also save as JPG copy for maximum compatibility
try:
    with Image.open(png_path) as im:
        rgb_im = im.convert('RGB')
        rgb_im.save(jpg_path, 'JPEG', quality=95)
    print(f"Created JPG copy at {jpg_path}, size: {os.path.getsize(jpg_path)} bytes")
except Exception as e:
    print(f"Error converting to JPG: {e}")
