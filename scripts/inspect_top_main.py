from PIL import Image

im = Image.open("scripts/test_captures/project_1_main.jpg")
print("Top-left pixel color:", im.getpixel((10, 10)))
print("Dimensions:", im.size)
# Save top 600px
im.crop((0, 0, im.width, 600)).save("scripts/test_captures/slice_top_main.jpg")
print("Saved slice_top_main.jpg successfully.")
