from PIL import Image

im = Image.open("scripts/test_captures/project_1_fullpage.jpg")
w, h = im.size
print(f"Image dimensions: {w}x{h}")

# Save sample slices to inspect
im.crop((0, 0, w, min(1500, h))).save("scripts/test_captures/slice_top.jpg")
im.crop((0, 1500, w, min(4000, h))).save("scripts/test_captures/slice_mid.jpg")
im.crop((0, max(0, h - 1500), w, h)).save("scripts/test_captures/slice_bottom.jpg")

print("Saved slices.")
