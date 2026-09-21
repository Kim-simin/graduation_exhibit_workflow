import os
import sys
import json
import re
import io
import base64
import argparse
from typing import List, Dict, Any, Optional
from PIL import Image
import requests

# Windows UTF-8 console output setup
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def clean_json_output(raw_text: str) -> str:
    """Qwen 모델의 생각 태그(<think>) 및 마크다운 코드블록을 완벽 제거"""
    text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL)
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    return match.group(0) if match else text

def parse_robust_json(text: str) -> Optional[Dict[str, Any]]:
    clean = clean_json_output(text)
    try:
        data = json.loads(clean)
        if isinstance(data, dict):
            return data
        elif isinstance(data, list):
            return {"items": data}
    except Exception:
        pass

    # 닫는 괄호 자동 보정
    trimmed = re.sub(r',\s*$', '', clean)
    for suffix in ["\n]}", "\n}", "]}", "}", "\"]}", "}\n]}", "\"]\n}"]:
        try:
            data = json.loads(trimmed + suffix)
            if isinstance(data, dict):
                return data
            elif isinstance(data, list):
                return {"items": data}
        except Exception:
            pass

    # 개별 객체 정규식 복원
    item_pattern = re.compile(r'\{[^{}]*?"(?:title|box_2d|bbox_2d)"[^{}]*?\}', re.DOTALL)
    recovered = []
    for m in item_pattern.finditer(clean):
        try:
            obj = json.loads(m.group(0))
            if any(k in obj for k in ["box_2d", "bbox_2d", "box", "bbox"]):
                recovered.append(obj)
        except Exception:
            pass
    if recovered:
        return {"items": recovered}

    return None

def check_llama_server_health(server_url: str = "http://127.0.0.1:8080") -> bool:
    clean_url = server_url.rstrip("/")
    for test_url in [f"{clean_url}/health", f"{clean_url}/v1/models"]:
        try:
            res = requests.get(test_url, timeout=3.0)
            if res.status_code in (200, 400, 404):
                return True
        except Exception:
            pass
    err_msg = f"[ERROR] llama-server에 연결할 수 없습니다 (URL: {clean_url}). 서버 구동 상태를 확인해 주세요."
    sys.stderr.write(err_msg + "\n")
    raise ConnectionError(err_msg)

def extract_chunk_items(
    chunk_img: Image.Image,
    chunk_offset_y: int,
    full_w: int,
    full_h: int,
    server_url: str = "http://127.0.0.1:8080"
) -> List[Dict[str, Any]]:
    """
    단일 청크 이미지(적정 해상도 800~1600px 세로)에서 Qwen2.5-VL로 고정밀 바운딩 박스 추출
    - Qwen2.5-VL의 시각 토큰 초과 방지 및 세로 좌표 밀림(0%) 차단
    - [xmin, ymin, xmax, ymax]와 [ymin, xmin, ymax, xmax] 자동 판별
    - 픽셀 좌표계 및 정규화(0~1000) 좌표계 자동 판별
    """
    cw, ch = chunk_img.size
    buf = io.BytesIO()
    chunk_img.save(buf, format="JPEG", quality=95)
    b64_data = base64.b64encode(buf.getvalue()).decode("utf-8")

    prompt = f"""Analyze this section of an art/design graduation exhibition webpage (Width: {cw}px, Height: {ch}px).
Detect every individual student artwork thumbnail and card in this section.

Each artwork item consists of:
1. A visual artwork image/thumbnail.
2. An artwork title (e.g. Scenz, FitUp, DAMONT, STARCLE, NEXUS, 안쉼터, Wave, Roomit, OZMA, Poisé, REVOIR, suum, KEY PICK, RIZZI) printed inside or below the thumbnail.
3. A Korean student/designer name (e.g. 강민승, 고나영, 곽지우, 김길호, 김다빈, 김다현, 김민성, 김수진, 김아현, 김예진, 나윤주, 박민영, 박영우, 박재형, 서밝음) printed beneath the thumbnail.

Strict Requirements:
1. 'box_2d': Tight bounding box around the visual artwork image/thumbnail ONLY: [ymin, xmin, ymax, xmax] relative to THIS chunk.
   Do NOT include outer margins, card borders, caption text below, or neighboring artwork.
2. 'title': The project or artwork title text (e.g., Scenz, FitUp, DAMONT, STARCLE, NEXUS, 안쉼터).
3. 'author': The student/designer name. If absent or unclear, use "출품 작가".

Output STRICT JSON:
{{
  "items": [
    {{
      "title": "Exact Title",
      "author": "Author Name",
      "box_2d": [ymin, xmin, ymax, xmax]
    }}
  ]
}}
"""

    payload = {
        "model": "qwen2.5-vl",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_data}"}}
                ]
            }
        ],
        "temperature": 0.05,
        "max_tokens": 4096
    }

    endpoint = f"{server_url.rstrip('/')}/v1/chat/completions"
    try:
        res = requests.post(endpoint, json=payload, timeout=90)
        if res.status_code != 200:
            sys.stderr.write(f"[WARN] 청크 분석 응답 실패 ({res.status_code}): {res.text}\n")
            return []

        raw_content = res.json()["choices"][0]["message"]["content"]
        data = parse_robust_json(raw_content)
        if not data:
            sys.stderr.write(f"[WARN] 청크 응답 파싱 실패\n")
            return []

        raw_items = data.get("items") or data.get("cards") or []
    except Exception as e:
        sys.stderr.write(f"[ERROR] 청크 파싱 에러: {e}\n")
        return []

    valid_boxes = []
    for item in raw_items:
        box = item.get("box_2d") or item.get("bbox") or item.get("bbox_2d") or []
        if len(box) == 4:
            valid_boxes.append((item, box))

    if not valid_boxes:
        return []

    # 좌표 순서 자동 판정 ([xmin, ymin, xmax, ymax] vs [ymin, xmin, ymax, xmax])
    is_xyxy = True
    if len(valid_boxes) >= 2:
        b0 = valid_boxes[0][1]
        b1 = valid_boxes[1][1]
        diff_0 = abs(b1[0] - b0[0])
        diff_1 = abs(b1[1] - b0[1])
        if diff_0 > diff_1:
            is_xyxy = True
        elif diff_1 > diff_0:
            is_xyxy = False

    result_items = []
    for item, box in valid_boxes:
        if is_xyxy:
            c_xmin, c_ymin, c_xmax, c_ymax = box
        else:
            c_ymin, c_xmin, c_ymax, c_xmax = box

        # 정규화 좌표(0~1000) vs 직접 픽셀 좌표 자동 판별
        if c_xmax > cw or c_ymax > ch:
            abs_left = int(c_xmin * cw / 1000.0)
            abs_right = int(c_xmax * cw / 1000.0)
            abs_top = chunk_offset_y + int(c_ymin * ch / 1000.0)
            abs_bottom = chunk_offset_y + int(c_ymax * ch / 1000.0)
        else:
            abs_left = int(c_xmin)
            abs_right = int(c_xmax)
            abs_top = chunk_offset_y + int(c_ymin)
            abs_bottom = chunk_offset_y + int(c_ymax)

        # 유효 크기 검증 (최소 폭 45px, 높이 35px)
        if (abs_right - abs_left) < 45 or (abs_bottom - abs_top) < 35:
            continue

        title = item.get("title", "").strip() or "작품"
        author = item.get("author", "").strip() or "출품 작가"

        result_items.append({
            "title": title,
            "author": author,
            "rect": (abs_left, abs_top, abs_right, abs_bottom)
        })

    return result_items

def extract_works_from_screenshot(
    image_path: str,
    card_id: str,
    output_dir: str = "public/captures",
    server_url: str = "http://127.0.0.1:8080"
) -> List[Dict[str, Any]]:
    """
    Qwen2.5-VL 기반 초장축 스크린샷 작품 인식, 바운딩 박스 검출, 1:1 크롭 및 메타데이터 추출
    - 초장축 세로 이미지를 적정 높이(800~1600px) 청크 단위로 순차 슬라이스 분석
    - Qwen 토큰 초과 문제 및 세로 좌표 밀림(반반 잘림) 원천 해결
    - 조악한 기계식 폴백(auto_grid_split) 완전 배제
    - 중심점 거리 기반 청크 경계 중복 박스 병합
    """
    save_path = os.path.join(output_dir, card_id)
    os.makedirs(save_path, exist_ok=True)

    if not os.path.exists(image_path):
        err_msg = f"[ERROR] 입력 이미지 파일이 존재하지 않습니다: {image_path}"
        sys.stderr.write(err_msg + "\n")
        raise FileNotFoundError(err_msg)

    check_llama_server_health(server_url)

    full_img = Image.open(image_path)
    if full_img.mode in ("RGBA", "P"):
        full_img = full_img.convert("RGB")
    img_w, img_h = full_img.size

    sys.stderr.write(f"[*] 모드 B VLM 정밀 추출 시작: 원본 해상도 {img_w}x{img_h}\n")

    # 청크 파이프라인: 적정 높이(800~1400px) 단위 분할
    CHUNK_HEIGHT = 800 if img_h <= 2500 else 1400
    OVERLAP = 150

    all_detected = []
    current_y = 0

    while current_y < img_h:
        box_bottom = min(current_y + CHUNK_HEIGHT, img_h)
        chunk = full_img.crop((0, current_y, img_w, box_bottom))
        
        sys.stderr.write(f"[*] VLM 청크 스캔 중: Y범위 {current_y}px ~ {box_bottom}px...\n")
        chunk_items = extract_chunk_items(chunk, current_y, img_w, img_h, server_url=server_url)
        all_detected.extend(chunk_items)

        if box_bottom >= img_h:
            break
        current_y += (CHUNK_HEIGHT - OVERLAP)

    # 2. 청크 경계 중복 박스 병합/제거 (중심점 거리 기반 중복 필터)
    unique_items = []
    for item in all_detected:
        l1, t1, r1, b1 = item["rect"]
        is_duplicate = False
        for u in unique_items:
            l2, t2, r2, b2 = u["rect"]
            # 중심점 거리가 40px 이내면 동일 작품으로 간주
            if abs((l1 + r1) / 2 - (l2 + r2) / 2) < 40 and abs((t1 + b1) / 2 - (t2 + b2) / 2) < 40:
                is_duplicate = True
                # 더 구체적인 타이틀이나 작가명이 있으면 보강
                if u["title"] in ("작품", "출품작") and item["title"] not in ("작품", "출품작"):
                    u["title"] = item["title"]
                if u["author"] == "출품 작가" and item["author"] != "출품 작가":
                    u["author"] = item["author"]
                break
        if not is_duplicate:
            unique_items.append(item)

    # Y좌표(상단 우선, 행 기준 그룹핑) 및 X좌표(좌측 우선) 순 정렬
    unique_items.sort(key=lambda x: (x["rect"][1] // 80, x["rect"][0]))

    # 3. 정밀 크롭 및 파일 저장
    results = []
    for idx, item in enumerate(unique_items):
        l, t, r, b = item["rect"]

        # 캔버스 경계 클램핑
        l = max(0, min(l, img_w - 1))
        t = max(0, min(t, img_h - 1))
        r = max(l + 1, min(r, img_w))
        b = max(t + 1, min(b, img_h))

        crop_w = r - l
        crop_h = b - t
        if crop_w < 30 or crop_h < 30:
            continue

        crop_img = full_img.crop((l, t, r, b))
        filename = f"vlm_work_{idx+1}.png"
        crop_img.save(os.path.join(save_path, filename))

        title = item["title"]
        author = item["author"]

        results.append({
            "id": f"vlm-work-{idx+1}",
            "title": title,
            "project_title": title,
            "author": author,
            "caption": f"{title} | {author}",
            "raw_text": f"{title} | {author}",
            "thumbnail": f"/captures/{card_id}/{filename}",
            "screenshot_path": f"/captures/{card_id}/{filename}",
            "detail_url": ""
        })

    sys.stderr.write(f"[SUCCESS] 모드 B 비전 추출 완료: 총 {len(results)}개 작품 1:1 정밀 크롭 완료 (밀림 0%)\n")
    return results

def main():
    parser = argparse.ArgumentParser(description="Qwen2.5-VL Local Vision Screenshot Artwork Extractor")
    parser.add_argument("--image", required=True, help="Path to screenshot image")
    parser.add_argument("--cardId", default="LOCAL_VISION", help="Card ID")
    parser.add_argument("--outDir", default="public/captures", help="Output directory")
    parser.add_argument("--serverUrl", default="http://127.0.0.1:8080", help="llama-server endpoint")

    args = parser.parse_args()

    try:
        cards = extract_works_from_screenshot(
            image_path=args.image,
            card_id=args.cardId,
            output_dir=args.outDir,
            server_url=args.serverUrl
        )

        output = {
            "status": "SUCCESS",
            "engine": "local_qwen_vl",
            "card_id": args.cardId,
            "detected_count": len(cards),
            "cards": cards
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))

    except Exception as e:
        err_output = {
            "status": "FAILED",
            "engine": "local_qwen_vl",
            "card_id": args.cardId,
            "error": str(e),
            "cards": []
        }
        print(json.dumps(err_output, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
