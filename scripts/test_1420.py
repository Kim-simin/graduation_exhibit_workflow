from PIL import Image

frame = Image.open("scripts/debug_frames/frame_4s.jpg")
crop_1420 = frame.crop((988, 0, 1852, 1080))
crop_1420.save("scripts/debug_frames/crop_center_1420.jpg")
print("Saved crop_center_1420.jpg")
