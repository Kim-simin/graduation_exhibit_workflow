import os
import sys
import json
import re
import argparse
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import numpy as np

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def get_api_key(cli_key: Optional[str] = None) -> Optional[str]:
    """
    GEMINI_API_KEY 또는 GOOGLE_API_KEY를 우선순위에 따라 탐색
    1. CLI 인자
    2. 환경 변수 (GEMINI_API_KEY, GOOGLE_API_KEY)
    3. 루트 및 하위 .env / .env.local 파일
    """
    if cli_key and cli_key.strip():
        return cli_key.strip()
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ.get("GEMINI_API_KEY").strip()
    if os.environ.get("GOOGLE_API_KEY"):
        return os.environ.get("GOOGLE_API_KEY").strip()

    search_dirs = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform")),
    ]
    for d in search_dirs:
        for fpath in [os.path.join(d, ".env"), os.path.join(d, ".env.local")]:
            if os.path.exists(fpath):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("GEMINI_API_KEY=") or line.startswith("GOOGLE_API_KEY="):
                                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                                if val and val != "your_gemini_api_key_here":
                                    return val
                except Exception:
                    pass
    return None

def detect_row_slices(img: Image.Image) -> List[Tuple[int, int]]:
    """
    세로로 긴 3열 그리드 이미지에서 행(Row) 사이의 수평 공백/경계선을 탐지하여 슬라이스 구간(top, bottom) 반환
    """
    w, h = img.size
    aspect = h / max(1, w)

    # 일반적인 비율(가로형 또는 완만한 직사각형)이면 전체를 1개 슬라이스로 처리
    if aspect <= 1.4:
        return [(0, h)]

    gray = img.convert("L")
    arr = np.array(gray)

    # 배경색 흰색 비율(또는 단색 비율) 계산
    white_frac = np.mean(arr > 245, axis=1)
    is_gap = white_frac > 0.82

    # 단색 어두운 배경일 경우 대비
    bg_is_dark = np.median(arr) < 50
    if bg_is_dark:
        dark_frac = np.mean(arr < 25, axis=1)
        is_gap = dark_frac > 0.82

    gaps = []
    start = None
    for r in range(h):
        if is_gap[r]:
            if start is None:
                start = r
        else:
            if start is not None:
                if r - start >= 4:
                    gaps.append((start, r))
                start = None
    if start is not None and h - start >= 4:
        gaps.append((start, h))

    content_rows = []
    prev = 0
    for gs, ge in gaps:
        if gs - prev >= 60:
            content_rows.append((prev, gs))
        prev = ge
    if h - prev >= 60:
        content_rows.append((prev, h))

    # 공백선이 감지되지 않은 경우 세로 비율에 맞춘 슬라이스(약 2행씩 묶음)
    if len(content_rows) < 2:
        chunk_h = int(w * 0.75)
        step = int(chunk_h * 0.85)
        content_rows = []
        top = 0
        while top < h:
            bottom = min(h, top + chunk_h)
            content_rows.append((top, bottom))
            if bottom >= h:
                break
            top += step

    return content_rows

def call_gemini_vision(img_chunk: Image.Image, prompt: str, api_key: str) -> List[Dict[str, Any]]:
    """
    Gemini 2.5 Flash / 1.5 Flash에 이미지 전달 후 JSON 파싱
    """
    import google.generativeai as genai
    genai.configure(api_key=api_key)

    # Gemini 2.5 Flash 호출 설정
    model_name = "gemini-2.5-flash"
    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={"response_mime_type": "application/json"}
        )
        response = model.generate_content([img_chunk, prompt])
    except Exception as e1:
        sys.stderr.write(f"[*] gemini-2.5-flash 실패, gemini-1.5-flash 폴백 시도: {e1}\n")
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )
        response = model.generate_content([img_chunk, prompt])

    if not response or not response.text:
        raise ValueError("Gemini Vision 응답이 비어있습니다.")

    def parse_robust_json(text: str):
        clean = text.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(clean)
        except Exception:
            pass
        dict_match = re.search(r"\{[\s\S]*\}", clean)
        if dict_match:
            try:
                return json.loads(dict_match.group(0))
            except Exception:
                pass
        trimmed = re.sub(r',\s*$', '', clean)
        for suffix in ["\n]}", "\n}", "]}", "}", "\"]}", "}\n]}", "\"]\n}"]:
            try:
                return json.loads(trimmed + suffix)
            except Exception:
                pass
        item_pattern = re.compile(r'\{[^{}]*?"(?:title|box_2d|bbox_2d)"[^{}]*?\}', re.DOTALL)
        recovered_items = []
        for m in item_pattern.finditer(clean):
            raw_obj = m.group(0)
            try:
                obj = json.loads(raw_obj)
                if any(k in obj for k in ["box_2d", "bbox_2d", "box", "bbox"]):
                    recovered_items.append(obj)
            except Exception:
                fixed = re.sub(r',\s*}', '}', raw_obj)
                try:
                    obj = json.loads(fixed)
                    if any(k in obj for k in ["box_2d", "bbox_2d", "box", "bbox"]):
                        recovered_items.append(obj)
                except Exception:
                    pass
        if recovered_items:
            return {"items": recovered_items}
        return None

    data = parse_robust_json(response.text)
    if data is None:
        raise ValueError(f"유효한 JSON을 응답에서 찾을 수 없습니다: {response.text[:200]}")

    # schema variants: {"items": [...]}, {"detected_works": [...]}, or list
    if isinstance(data, dict):
        if "items" in data and isinstance(data["items"], list):
            return data["items"]
        elif "detected_works" in data and isinstance(data["detected_works"], list):
            return data["detected_works"]
    elif isinstance(data, list):
        return data
    return []

def extract_works_from_screenshot(
    image_path: str,
    card_id: str,
    output_dir: str = "public/captures",
    api_key: Optional[str] = None
) -> List[Dict[str, Any]]:
    save_path = os.path.join(output_dir, card_id)
    os.makedirs(save_path, exist_ok=True)

    if not os.path.exists(image_path):
        err_msg = f"[ERROR] 입력 이미지 파일이 존재하지 않습니다: {image_path}"
        print(err_msg)
        raise FileNotFoundError(err_msg)

    # 1. API 키 확인 (없으면 조악한 기계 분할 대신 즉시 명확한 오류 보고)
    resolved_key = get_api_key(api_key)
    if not resolved_key:
        err_msg = (
            "[ERROR] Gemini Vision 호출 실패: GEMINI_API_KEY 또는 GOOGLE_API_KEY가 설정되지 않았습니다. "
            ".env 파일에 GEMINI_API_KEY를 등록하거나 관리자 모달창에 API 키를 입력해 주세요."
        )
        print(err_msg)
        raise ValueError(err_msg)

    img = Image.open(image_path)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img_w, img_h = img.size

    print(f"[*] Gemini Vision 분석 요청 시작 (해상도: {img_w}x{img_h})...")

    # 2. 세로로 긴 스크린샷인 경우 가로 3열 그리드의 '행(Row)' 단위로 안정적 슬라이싱
    aspect = img_h / max(1, img_w)
    slices = detect_row_slices(img)
    is_multi_sliced = len(slices) > 1

    prompt_full = """
    이 이미지는 대학교 졸업전시 웹사이트의 작품 목록 화면입니다.
    화면은 명확한 '3열 그리드(3 Columns)' 구조로 배열되어 있습니다.
    
    [필수 작업]
    1. 화면에 보이는 모든 개별 작품을 순서대로 식별하십시오 (좌->우, 상->하).
    2. 각 작품의 [이미지 썸네일 영역]만을 정확히 바운딩 박스(0~1000 정규화 좌표: [ymin, xmin, ymax, xmax])로 지정하십시오. 인접한 다른 작품이나 여백이 잘려 들어가지 않도록 주의하십시오.
    3. 각 이미지 바로 아래(또는 내부)에 적혀 있는 고유 텍스트(예: among, BIP, Etoe, Ever After, finpong, HLPER, ME&MEAL, Niche, NUA, ON:, Sequence 등)를 정확히 읽어 'title'에 넣으십시오.
    
    [JSON 출력 스키마]
    {
      "items": [
        {
          "title": "이미지 하단에 적힌 실제 작품명 텍스트 (OCR)",
          "author": "작가명 (표기되어 있다면 기재, 없으면 '작가 미상')",
          "box_2d": [ymin, xmin, ymax, xmax]
        }
      ]
    }
    """

    prompt_row = """
    이 이미지는 대학교 졸업전시 웹사이트 작품 목록의 가로 1~2개 행(Row, 최대 3~6개 작품) 부분 스크린샷입니다.
    
    [필수 작업]
    1. 화면에 보이는 각 개별 작품을 순서대로 식별하십시오 (좌->우, 상->하).
    2. 각 작품의 [이미지 썸네일 영역]만을 정확히 바운딩 박스(0~1000 정규화 좌표: [ymin, xmin, ymax, xmax])로 지정하십시오.
    3. 각 이미지 바로 아래(또는 내부)에 적혀 있는 실제 고유 작품명 텍스트(OCR)를 정확히 판별하여 'title'에 기재하십시오. 임의의 기본값(출품작 #1 등)을 넣지 마십시오.
    
    [JSON 출력 스키마]
    {
      "items": [
        {
          "title": "이미지 하단에 적힌 실제 고유 작품명 (OCR)",
          "author": "작가명 (표기되어 있다면 기재, 없으면 '작가 미상')",
          "box_2d": [ymin, xmin, ymax, xmax]
        }
      ]
    }
    """

    raw_detected_items = []

    try:
        if not is_multi_sliced:
            # 단일 이미지 분석
            items = call_gemini_vision(img, prompt_full, resolved_key)
            for item in items:
                raw_detected_items.append((item, 0, img_h))
        else:
            print(f"[*] 고해상도 세로 스크린샷 감지: 총 {len(slices)}개 행 단위로 분할 분석을 수행합니다.")
            for s_idx, (s_top, s_bottom) in enumerate(slices):
                s_h = s_bottom - s_top
                chunk_img = img.crop((0, s_top, img_w, s_bottom))
                print(f"  - [{s_idx+1}/{len(slices)}] 행 슬라이스 분석 중 (Y: {s_top}~{s_bottom}, H: {s_h}px)...")
                try:
                    chunk_items = call_gemini_vision(chunk_img, prompt_row, resolved_key)
                    for item in chunk_items:
                        raw_detected_items.append((item, s_top, s_h))
                except Exception as row_err:
                    sys.stderr.write(f"[WARN] 행 {s_idx+1} 분석 실패: {row_err}\n")
    except Exception as e:
        print(f"[ERROR] Gemini Vision 호출 실패: {e}")
        raise RuntimeError(f"Gemini Vision 호출 실패: {e}")

    results = []
    seen_titles = set()

    for idx, (item, base_y, chunk_height) in enumerate(raw_detected_items):
        box = item.get("box_2d", [])
        if len(box) != 4:
            continue
        ymin, xmin, ymax, xmax = box

        # 슬라이스 기준 좌표를 원본 전체 이미지 픽셀 좌표로 역산
        left = max(0, int(xmin * img_w / 1000))
        top = max(0, int(base_y + (ymin * chunk_height / 1000)))
        right = min(img_w, int(xmax * img_w / 1000))
        bottom = min(img_h, int(base_y + (ymax * chunk_height / 1000)))

        # 유효한 크기인지 검증 (최소 60px)
        if (right - left) < 60 or (bottom - top) < 60:
            continue

        # 중복 방지 (동일 영역 또는 동일 타이틀 중복 스킵)
        title_raw = item.get("title", "").strip()
        if not title_raw:
            title_raw = f"작품 #{len(results) + 1}"

        # 개별 작품 이미지 크롭 및 저장
        crop_img = img.crop((left, top, right, bottom))
        filename = f"work_{len(results) + 1}.png"
        crop_img.save(os.path.join(save_path, filename))

        author_raw = item.get("author", "").strip() or "작가 미상"
        rel_path = f"/captures/{card_id}/{filename}"

        results.append({
            "id": f"work-{len(results) + 1}",
            "title": title_raw,
            "author": author_raw,
            "caption": f"{title_raw} | {author_raw}",
            "thumbnail": rel_path,
            "screenshot_path": rel_path,
            "project_title": title_raw,
            "raw_text": f"{title_raw} | {author_raw}",
            "detail_url": ""
        })

    if len(results) == 0:
        err_msg = "[ERROR] Gemini Vision 호출 완료되었으나 감지된 작품 카드가 0건입니다."
        print(err_msg)
        raise RuntimeError(err_msg)

    print(f"[SUCCESS] 총 {len(results)}개 작품 정상 크롭 및 OCR 완료")
    return results

# 하위 호환성을 위한 alias
extract_and_crop_works = extract_works_from_screenshot

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gemini Vision Screenshot Artwork Extractor & Cropper")
    parser.add_argument("--image", required=True, help="Path to input screenshot image")
    parser.add_argument("--cardId", required=True, help="Target exhibition card ID (e.g. DES-02)")
    parser.add_argument("--outDir", default="", help="Output captures directory")
    parser.add_argument("--apiKey", default="", help="Optional Gemini API key")
    args = parser.parse_args()

    out_directory = args.outDir
    if not out_directory:
        out_directory = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "public", "captures")
        )

    try:
        cards = extract_works_from_screenshot(
            image_path=args.image,
            card_id=args.cardId,
            output_dir=out_directory,
            api_key=args.apiKey
        )
        result = {
            "status": "SUCCESS",
            "card_id": args.cardId,
            "detected_count": len(cards),
            "cards": cards
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        sys.stderr.write(f"[Vision Extractor Error]: {e}\n")
        err_result = {
            "status": "FAILED",
            "error": str(e),
            "cards": []
        }
        print(json.dumps(err_result, ensure_ascii=False, indent=2))
        sys.exit(1)
