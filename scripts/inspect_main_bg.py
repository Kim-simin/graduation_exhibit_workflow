import urllib.request
import urllib.parse
from PIL import Image

url = "http://sj-di.com/wp-content/uploads/2025/10/" + urllib.parse.quote("메인페이지-배경.png")
print("Downloading:", url)
urllib.request.urlretrieve(url, "scripts/debug_frames/main_bg.png")

img = Image.open("scripts/debug_frames/main_bg.png")
print("main_bg.png size:", img.size)
