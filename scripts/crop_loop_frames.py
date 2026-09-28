from PIL import Image

f25 = Image.open("scripts/debug_frames/loop_check_2.5s.jpg").crop((948, 0, 1812, 1080))
f84 = Image.open("scripts/debug_frames/loop_check_8.4s.jpg").crop((948, 0, 1812, 1080))

f25.save("scripts/debug_frames/crop_2.5s.jpg")
f84.save("scripts/debug_frames/crop_8.4s.jpg")
print("Saved 2.5s and 8.4s crops")
