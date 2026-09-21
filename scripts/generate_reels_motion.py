# -*- coding: utf-8 -*-
import os
import sys
import argparse
import numpy as np
import PIL.Image

# Pillow 10+ 호환성 패치 (MoviePy 1.0.3의 Image.ANTIALIAS 참조 대응)
if not hasattr(PIL.Image, "ANTIALIAS"):
    PIL.Image.ANTIALIAS = PIL.Image.Resampling.LANCZOS

from PIL import Image, ImageFilter, ImageDraw, ImageFont
from moviepy.editor import ImageClip, CompositeVideoClip


def create_text_overlay(width: int, height: int, university: str, department: str, title: str) -> np.ndarray:
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_candidates = [
        "C:/Windows/Fonts/malgunbd.ttf",
        "C:/Windows/Fonts/malgun.ttf",
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
    ]
    font_path = next((f for f in font_candidates if os.path.exists(f)), None)

    try:
        font_sub = ImageFont.truetype(font_path, 32) if font_path else ImageFont.load_default()
        font_title = ImageFont.truetype(font_path, 48) if font_path else ImageFont.load_default()
        font_tag = ImageFont.truetype(font_path, 24) if font_path else ImageFont.load_default()
    except Exception:
        font_sub = font_title = font_tag = ImageFont.load_default()

    # 하단 480px 높이의 부드러운 다크 그라디언트 생성
    gradient = Image.new("RGBA", (width, 480), color=0)
    for y in range(480):
        alpha = int((y / 480.0) ** 1.5 * 200)
        ImageDraw.Draw(gradient).line([(0, y), (width, y)], fill=(0, 0, 0, alpha))
    overlay.paste(gradient, (0, height - 480), gradient)

    margin_x = 80
    base_y = height - 260
    sub_text = f"{university} · {department}".strip(" ·")
    
    draw.text((margin_x, base_y), sub_text, font=font_sub, fill=(147, 197, 253, 255))
    draw.text((margin_x, base_y + 48), title, font=font_title, fill=(255, 255, 255, 255))
    draw.text((margin_x, base_y + 120), "GRADUATION EXHIBITION ARCHIVE", font=font_tag, fill=(200, 200, 200, 180))

    return np.array(overlay)


def generate_reels_video(poster_path: str, output_path: str, university: str = "", department: str = "", title: str = "", duration: int = 5):
    target_w, target_h = 1080, 1920
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    if not os.path.exists(poster_path):
        raise FileNotFoundError(f"포스터 파일 부재: {poster_path}")

    raw_img = Image.open(poster_path).convert("RGB")
    pw, ph = raw_img.size

    # 1. 배경 레이어 (블러 및 다크닝)
    scale_bg = max(target_w / pw, target_h / ph) * 1.05
    bg_w, bg_h = int(pw * scale_bg), int(ph * scale_bg)
    bg_resized = raw_img.resize((bg_w, bg_h), Image.Resampling.LANCZOS)
    
    left = (bg_w - target_w) // 2
    top = (bg_h - target_h) // 2
    bg_cropped = bg_resized.crop((left, top, left + target_w, top + target_h))
    bg_blurred = bg_cropped.filter(ImageFilter.GaussianBlur(radius=35))
    bg_dark = Image.fromarray((np.array(bg_blurred) * 0.45).astype(np.uint8))
    bg_clip = ImageClip(np.array(bg_dark)).set_duration(duration)

    # 2. 전경 레이어 (섀도우 및 켄 번스 줌인)
    fg_max_w, fg_max_h = int(target_w * 0.82), int(target_h * 0.65)
    scale_fg = min(fg_max_w / pw, fg_max_h / ph)
    fg_w, fg_h = int(pw * scale_fg), int(ph * scale_fg)
    fg_resized = raw_img.resize((fg_w, fg_h), Image.Resampling.LANCZOS)

    pad = 80
    canvas_w, canvas_h = fg_w + pad * 2, fg_h + pad * 2
    shadow_canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    shadow_mask = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    ImageDraw.Draw(shadow_mask).rounded_rectangle(
        [pad + 10, pad + 25, pad + fg_w + 10, pad + fg_h + 25],
        radius=20, fill=(0, 0, 0, 180)
    )
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(radius=28))
    shadow_canvas.paste(shadow_mask, (0, 0), shadow_mask)

    corner_mask = Image.new("L", (fg_w, fg_h), 0)
    ImageDraw.Draw(corner_mask).rounded_rectangle([0, 0, fg_w, fg_h], radius=16, fill=255)
    shadow_canvas.paste(fg_resized, (pad, pad), corner_mask)

    fg_clip = (
        ImageClip(np.array(shadow_canvas), transparent=True)
        .set_position(("center", int(target_h * 0.12)))
        .set_duration(duration)
        .resize(lambda t: 1.0 + 0.016 * t)
    )

    # 3. 텍스트 오버레이 레이어
    text_np = create_text_overlay(target_w, target_h, university, department, title)
    text_clip = ImageClip(text_np, transparent=True).set_duration(duration).crossfadein(0.6)

    # 4. 합성 및 고속 인코딩
    final_video = CompositeVideoClip([bg_clip, fg_clip, text_clip], size=(target_w, target_h))
    final_video.write_videofile(
        output_path,
        fps=30,
        codec="libx264",
        audio=False,
        preset="fast",
        threads=4,
        logger=None
    )
    print(f"[SUCCESS] 릴스 모션 생성 완료: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--poster", type=str, required=True, help="포스터 이미지 경로")
    parser.add_argument("--output", type=str, required=True, help="출력 mp4 비디오 경로")
    parser.add_argument("--univ", type=str, default="", help="대학명")
    parser.add_argument("--dept", type=str, default="", help="학과명")
    parser.add_argument("--title", type=str, default="", help="전시 타이틀")
    parser.add_argument("--duration", type=int, default=5, help="재생 시간(초)")
    args = parser.parse_args()

    generate_reels_video(args.poster, args.output, args.univ, args.dept, args.title, args.duration)
