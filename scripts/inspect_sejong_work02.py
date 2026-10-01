import os
from PIL import Image

p = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/work_02_GOLDFISHSYNDROME.jpg"
if os.path.exists(p):
    im = Image.open(p)
    print("Dimensions of Sejong work_02:", im.size)
    print("Format:", im.format)
    print("Mode:", im.mode)
else:
    print("File not found")
