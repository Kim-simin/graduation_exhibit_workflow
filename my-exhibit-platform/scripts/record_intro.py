import asyncio
import os
import argparse
import subprocess
import shutil
from playwright.async_api import async_playwright

def get_ffmpeg_binary() -> str:
    ffmpeg_bin = shutil.which("ffmpeg")
    if ffmpeg_bin:
        return ffmpeg_bin
    
    common_paths = [
        r"C:\ProgramData\HP\LCDDisplayHelper\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe",
    ]
    for p in common_paths:
        if os.path.exists(p):
            return p
    return "ffmpeg"

def convert_to_mp4(webm_path: str, mp4_path: str):
    ffmpeg_bin = get_ffmpeg_binary()
    if os.path.exists(mp4_path):
        os.remove(mp4_path)
    
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i", webm_path,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        mp4_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        raise RuntimeError(f"MP4 변환 실패: {res.stderr.decode('utf-8', errors='ignore')}")

async def get_target_dimensions(page):
    """웹페이지 내부의 캔버스 또는 실제 콘텐츠 크기를 동적으로 측정하여 반환"""
    dims = await page.evaluate("""() => {
        // 1. 주요 캔버스 요소가 있는 경우 해당 캔버스 해상도 우선 추출
        const canvas = document.querySelector('canvas');
        if (canvas && canvas.width > 200 && canvas.height > 200) {
            return { width: canvas.width, height: canvas.height };
        }
        // 2. 전체 페이지 콘텐츠 및 뷰포트 크기 계산
        const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
        const scrollH = Math.max(document.documentElement.clientHeight, window.innerHeight);
        return { width: scrollW, height: scrollH };
    }""")
    
    w = int(dims.get("width", 1920))
    h = int(dims.get("height", 1080))

    # 상하한선 보호 및 비디오 인코더 요구 규격(반드시 짝수 픽셀이어야 함) 처리
    w = max(480, min(w, 3840))
    h = max(480, min(h, 2160))
    w = w if w % 2 == 0 else w + 1
    h = h if h % 2 == 0 else h + 1

    return w, h

async def record_adaptive_video(target_url: str, duration_sec: int, save_dir: str, output_name: str):
    abs_save_dir = os.path.abspath(save_dir)
    os.makedirs(abs_save_dir, exist_ok=True)
    final_output_path = os.path.join(abs_save_dir, output_name)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1단계: 타겟 사이트의 실제 렌더링 규격 사전 측정
        probe_page = await browser.new_page()
        try:
            await probe_page.goto(target_url, wait_until="domcontentloaded", timeout=40000)
            await probe_page.wait_for_timeout(1000)
            target_w, target_h = await get_target_dimensions(probe_page)
        except Exception:
            target_w, target_h = 1920, 1080
        finally:
            await probe_page.close()

        print(f"[*] 사이트 맞춤 감지 규격 적용: {target_w}x{target_h}")

        # 2단계: 측정된 동적 크기 기반 녹화 컨텍스트 생성
        context = await browser.new_context(
            viewport={"width": target_w, "height": target_h},
            record_video_dir=abs_save_dir,
            record_video_size={"width": target_w, "height": target_h}
        )
        record_page = await context.new_page()

        try:
            await record_page.goto(target_url, wait_until="networkidle", timeout=45000)
        except Exception:
            pass

        # 애니메이션/인터랙션 재생 시간 대기
        await record_page.wait_for_timeout(duration_sec * 1000)

        video = record_page.video
        await context.close()
        await browser.close()

        # 3단계: 생성된 비디오 파일을 지정 파일명으로 치환 저장 (MP4 요청 시 자동 변환)
        if video:
            temp_path = await video.path()
            if final_output_path.lower().endswith(".mp4"):
                print("[*] MP4 변환 진행 중 (H.264 / yuv420p)...")
                convert_to_mp4(temp_path, final_output_path)
                try:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                except Exception:
                    pass
            else:
                if os.path.exists(final_output_path):
                    os.remove(final_output_path)
                os.replace(temp_path, final_output_path)
            print(f"[SUCCESS] {final_output_path} ({target_w}x{target_h})")
        else:
            raise RuntimeError("비디오 캡처 객체 생성 실패")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", type=str, required=True)
    parser.add_argument("--duration", type=int, default=6)
    parser.add_argument("--outdir", type=str, default="public/downloads/videos")
    parser.add_argument("--filename", type=str, required=True)
    args = parser.parse_args()

    asyncio.run(record_adaptive_video(args.url, args.duration, args.outdir, args.filename))
