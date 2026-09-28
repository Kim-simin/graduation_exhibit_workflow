from PIL import Image

frame = Image.open("scripts/debug_frames/frame_4s.jpg")
# center_x = 1380 -> x1 = 948, x2 = 1812
crop1 = frame.crop((948, 0, 1812, 1080))
crop1.save("scripts/debug_frames/crop_center_1380.jpg")

# center_x = 1360 -> x1 = 928, x2 = 1792
crop2 = frame.crop((928, 0, 1792, 1080))
crop2.save("scripts/debug_frames/crop_center_1360.jpg")

# center_x = 1400 -> x1 = 968, x2 = 1832
crop3 = frame.crop((968, 0, 1832, 1080))
crop3.save("scripts/debug_frames/crop_center_1400.jpg")

print("Saved crops at 1360, 1380, 1400")
