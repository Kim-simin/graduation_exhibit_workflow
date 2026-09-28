from PIL import Image
import numpy as np

poster = Image.open("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/main_poster_2025.jpg")
frame = Image.open("scripts/debug_frames/frame_4s.jpg")

# Resize poster to height 1080 to match video height
pw, ph = poster.size
scale = 1080.0 / ph
new_pw = int(pw * scale) # 1684 * (1080 / 2384) = 762
poster_resized = poster.resize((new_pw, 1080), Image.Resampling.LANCZOS)

print(f"Poster scaled to height 1080 has width: {new_pw}")

# In the poster, let's find the x position of the vertical black bar #1 and #2
# In the frame, let's find the x position of the same vertical black bars
p_arr = np.array(poster_resized.convert("L"))
f_arr = np.array(frame.convert("L"))

# Let's inspect a horizontal line across the vertical bars, say y = 300
p_slice = p_arr[300, :]
f_slice = f_arr[300, :]

# Let's find dark pixels (< 50) along y=300
p_bars = np.where(p_slice < 50)[0]
f_bars = np.where(f_slice < 50)[0]

print("Poster dark pixels along y=300 in first 200px:", p_bars[p_bars < 200][:10])
print("Frame dark pixels along y=300 around 800-1100:", f_bars[(f_bars > 800) & (f_bars < 1100)][:10])

# Let's do cross-correlation to find the exact horizontal offset between poster and frame!
# Crop a feature in poster (e.g. around the horse eye or stripes)
# Let's search best offset dx such that frame[:, dx : dx + new_pw] matches poster_resized
best_diff = float("inf")
best_dx = 0

# Convert to float and consider area where graphics are present (e.g. y from 100 to 800)
p_sub = p_arr[100:800, :]
for dx in range(800, 1200):
    if dx + new_pw > frame.size[0]:
        break
    f_sub = f_arr[100:800, dx : dx + new_pw]
    # compute mean absolute difference in high-contrast regions
    diff = np.mean(np.abs(p_sub.astype(float) - f_sub.astype(float)))
    if diff < best_diff:
        best_diff = diff
        best_dx = dx

print(f"Best matching dx: {best_dx} with diff: {best_diff:.2f}")

# Save the overlaid comparison at best_dx
matched_frame_crop = frame.crop((best_dx, 0, best_dx + new_pw, 1080))
matched_frame_crop.save("scripts/debug_frames/matched_poster_crop.jpg")
poster_resized.save("scripts/debug_frames/matched_poster_orig.jpg")

# Also create side-by-side or blend:
blend = Image.blend(matched_frame_crop.convert("RGBA"), poster_resized.convert("RGBA"), alpha=0.5)
blend.save("scripts/debug_frames/matched_blend.png")
print("Saved matched_blend.png")
