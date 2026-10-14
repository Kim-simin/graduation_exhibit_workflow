"""
research/thumbnail_processor.py
전국 대학 졸업전시 세로형 작품 보드 대표 썸네일 지능형 추출 및 수집 파이프라인 모듈

핵심 원칙:
1. 원본 파일은 절대 수정하지 않고 보존.
2. 소프트웨어·컴퓨터공학 계열(IT, SW, 컴공, AI 등)은 제외하여 기존 방식 유지.
3. 비주얼 계열의 세로형 이미지(H/W > 1.3)에 대해 상단 대표 비주얼(포스터/메인 그래픽)을 스마트 크롭하여 별도 썸네일 생성.
4. Idempotency 보장 (동일 이미지 재처리 방지).
5. 리스트/카드에서는 승인된 대표 썸네일을 표시하고, 상세 모달에서는 원본 전체를 열람할 수 있도록 메타데이터 분리 저장.
"""

import os
import sys
import json
import shutil
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
import numpy as np

# 제외 대상 카테고리 / 학과 키워드 (소프트웨어·컴퓨터공학 계열)
EXCLUDED_KEYWORDS = [
    '소프트웨어', '컴퓨터공학', '컴퓨터과학', '정보통신', '인공지능',
    '데이터사이언스', 'ai/software', 'it_sw', 'engineering',
    '기계공학', '전자공학', '전기공학', '시스템개발', '소프트웨어캡스톤'
]

# 비주얼/디자인 계열 보존 키워드 (제외 키워드보다 우선하여 비주얼로 판정)
VISUAL_KEYWORDS = [
    '산업디자인', '시각디자인', '디자인이노베이션', '패션디자인', '공예',
    '도예', '금속공예', '조형', '회화', '서양화', '동양화', '한국화',
    '미술', '순수미술', '영상디자인', '미디어디자인', '커뮤니케이션디자인',
    '시각영상', '공간디자인', '실내디자인', '텍스타일'
]

def is_software_engineering_exhibition(category: str, department: str, title: str = "") -> bool:
    """소프트웨어·컴퓨터공학 계열 여부 판별 (제외 대상)"""
    combined = f"{category or ''} {department or ''} {title or ''}".lower().replace(" ", "")
    
    # 비주얼 계열 키워드가 우선 포함되어 있으면 비주얼로 분류
    for vk in VISUAL_KEYWORDS:
        if vk in combined:
            return False
            
    for ek in EXCLUDED_KEYWORDS:
        if ek in combined:
            return True
            
    return False

def is_tall_board_image(width: int, height: int, threshold_ratio: float = 1.3) -> bool:
    """세로로 긴 포트폴리오/작품보드 이미지인지 판별"""
    if width <= 0 or height <= 0:
        return False
    return (height / width) >= threshold_ratio

def find_smart_crop_boundary(im: Image.Image, max_scan_height: Optional[int] = None) -> Tuple[int, int]:
    """
    상단 대표 영역(포스터/대표 그래픽)의 (y_start, y_end) 스마트 크롭 좌표 계산
    1. 상단 불필요한 단색 여백 스킵
    2. [W * 0.95, W * 1.35] 범위 내에서 자연스러운 섹션 분할선 탐색
    """
    w, h = im.size
    scan_limit = max_scan_height or min(h, int(w * 2.5))
    
    crop_scan = im.crop((0, 0, w, scan_limit)).convert('RGB')
    arr = np.array(crop_scan)
    
    # 1. 상단 단색 여백 건너뛰기
    row_stds = np.std(arr, axis=(1, 2))
    non_blank = np.where(row_stds > 6)[0]
    y_start = int(non_blank[0]) if len(non_blank) > 0 and non_blank[0] < 250 else 0
    
    # 2. 목표 크롭 높이 결정
    min_h = int(w * 0.95)
    max_h = int(w * 1.32)
    
    if y_start + min_h >= h:
        return (y_start, h)
        
    cand_end_min = y_start + min_h
    cand_end_max = min(h, y_start + max_h)
    
    search_stds = row_stds[cand_end_min:cand_end_max]
    if len(search_stds) > 0:
        best_offset = int(np.argmin(search_stds))
        y_end = cand_end_min + best_offset
    else:
        y_end = min(h, y_start + int(w * 1.15))
        
    return (y_start, y_end)

def process_single_artwork_image(
    source_full_path: str,
    output_thumb_path: str,
    target_width: int = 1000,
    force_recreate: bool = False
) -> Optional[Dict[str, Any]]:
    """
    단일 원본 작품 이미지에서 상단 대표 썸네일을 추출하여 저장
    - Idempotency 지원
    - 원본 보존
    """
    if not os.path.exists(source_full_path):
        return None
        
    if os.path.exists(output_thumb_path) and not force_recreate:
        try:
            with Image.open(output_thumb_path) as thumb_im:
                tw, th = thumb_im.size
                return {
                    "status": "cached",
                    "thumb_width": tw,
                    "thumb_height": th,
                    "reused": True
                }
        except Exception:
            pass
            
    try:
        with Image.open(source_full_path) as im:
            w, h = im.size
            aspect_ratio = round(h / w, 2)
            
            # 세로로 긴 보드가 아니면 일반 비율 보존 리사이즈
            if not is_tall_board_image(w, h, threshold_ratio=1.3):
                thumb = im.copy()
                if w > target_width:
                    scale = target_width / w
                    thumb = thumb.resize((target_width, int(h * scale)), Image.Resampling.LANCZOS)
                
                os.makedirs(os.path.dirname(output_thumb_path), exist_ok=True)
                thumb.convert('RGB').save(output_thumb_path, 'JPEG', quality=90, optimize=True)
                return {
                    "status": "standard_aspect",
                    "crop_coords": {"x": 0, "y": 0, "width": w, "height": h, "original_width": w, "original_height": h, "aspect_ratio": aspect_ratio},
                    "thumb_size": thumb.size,
                    "reused": False
                }
            
            # 세로로 긴 보드인 경우: 스마트 상단 대표 비주얼 크롭
            y_start, y_end = find_smart_crop_boundary(im)
            crop_h = y_end - y_start
            
            cropped = im.crop((0, y_start, w, y_end))
            
            if w > target_width:
                scale = target_width / w
                new_h = int(crop_h * scale)
                cropped = cropped.resize((target_width, new_h), Image.Resampling.LANCZOS)
            
            os.makedirs(os.path.dirname(output_thumb_path), exist_ok=True)
            cropped.convert('RGB').save(output_thumb_path, 'JPEG', quality=90, optimize=True)
            
            return {
                "status": "cropped_tall_board",
                "crop_coords": {
                    "x": 0,
                    "y": y_start,
                    "width": w,
                    "height": crop_h,
                    "original_width": w,
                    "original_height": h,
                    "aspect_ratio": aspect_ratio
                },
                "thumb_size": cropped.size,
                "reused": False
            }
    except Exception as e:
        print(f"[ERROR] Failed to process image {source_full_path}: {e}")
        return None

def sync_thumbnail_to_all_apps(source_thumb_path: str, rel_path: str) -> None:
    """생성된 썸네일을 web, admin, my-exhibit-platform의 public 디렉토리에 동기화 복사"""
    base_dirs = [
        "web/public",
        "admin/public",
        "my-exhibit-platform/public"
    ]
    for b in base_dirs:
        dest_path = os.path.join(b, rel_path.replace('/', os.sep))
        if os.path.abspath(source_thumb_path) == os.path.abspath(dest_path):
            continue
        try:
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy2(source_thumb_path, dest_path)
        except Exception as e:
            # 타겟 폴더가 없으면 조용히 무시
            pass

def process_exhibition_artworks(
    exhibition: Dict[str, Any],
    public_bases: Optional[List[str]] = None,
    force_recreate: bool = False
) -> Dict[str, Any]:
    """
    단일 전시회의 모든 출품작에 대해 썸네일 생성 및 메타데이터 연결
    """
    bases = public_bases or ["web/public", "admin/public", "my-exhibit-platform/public"]
    category = exhibition.get("category") or ""
    department = exhibition.get("department") or ""
    title = exhibition.get("title") or exhibition.get("exhibition_title") or ""
    
    # 1. 소프트웨어·컴퓨터공학 계열 제외 검사
    if is_software_engineering_exhibition(category, department, title):
        return {
            "exhibition_id": exhibition.get("id"),
            "skipped": True,
            "reason": "소프트웨어·컴퓨터공학 계열로 기존 썸네일 방식 유지",
            "processed_count": 0,
            "tall_board_count": 0,
            "cached_count": 0
        }
        
    artworks = exhibition.get("artworks") or exhibition.get("works") or []
    processed_count = 0
    tall_board_count = 0
    cached_count = 0
    missing_count = 0
    
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    for idx, art in enumerate(artworks):
        img_rel = art.get("imagePath") or art.get("image") or art.get("screenshot_path") or ""
        if not img_rel:
            missing_count += 1
            continue
            
        # 기존에 이미 썸네일이 지정되어 있고 _thumb 패턴이 아니거나 유효한 경우 체크
        source_disk_path = None
        for b in bases:
            cand = os.path.join(b, img_rel.replace('/', os.sep))
            if os.path.exists(cand):
                source_disk_path = cand
                break
                
        if not source_disk_path:
            missing_count += 1
            continue
            
        # 썸네일 출력 경로 산출
        dir_name = os.path.dirname(img_rel).replace('\\', '/')
        base_name = os.path.basename(img_rel)
        name_no_ext, ext = os.path.splitext(base_name)
        
        # 썸네일 파일명 규격: <original_name>_thumb.jpg
        thumb_file_name = f"{name_no_ext}_thumb.jpg"
        thumb_rel_path = f"{dir_name}/{thumb_file_name}" if dir_name else thumb_file_name
        
        primary_output_path = os.path.join("web/public", thumb_rel_path.replace('/', os.sep))
        
        res = process_single_artwork_image(
            source_disk_path,
            primary_output_path,
            target_width=1000,
            force_recreate=force_recreate
        )
        
        if res:
            processed_count += 1
            if res.get("reused"):
                cached_count += 1
            if res.get("status") == "cropped_tall_board":
                tall_board_count += 1
                
            # 모든 앱의 public에 동기화
            sync_thumbnail_to_all_apps(primary_output_path, thumb_rel_path)
            
            # 메타데이터 업데이트 (원본은 그대로 보존하고 별도 썸네일 필드 연결)
            art["thumbnail"] = thumb_rel_path
            art["thumbnail_url"] = thumb_rel_path
            art["original_image_url"] = img_rel
            if "crop_coords" in res:
                art["thumbnail_crop_coordinates"] = res["crop_coords"]
            art["thumbnail_generated_at"] = now_iso
            art["thumbnail_status"] = "approved"
            art["thumbnail_review_status"] = "approved"
            
    # works 배열이 따로 있는 경우 동기화
    if "works" in exhibition and exhibition["works"] is not artworks:
        exhibition["works"] = artworks
        
    return {
        "exhibition_id": exhibition.get("id"),
        "skipped": False,
        "total_artworks": len(artworks),
        "processed_count": processed_count,
        "tall_board_count": tall_board_count,
        "cached_count": cached_count,
        "missing_count": missing_count
    }

def update_json_file_safely(file_path: str, target_exhibition_ids: List[str], target_exhibitions_map: Dict[str, Dict[str, Any]]) -> bool:
    """JSON DB Safeguard 원칙에 따라 파일의 기존 레코드를 보존하며 타겟 전시의 artworks만 업데이트"""
    if not os.path.exists(file_path):
        return False
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        is_list = isinstance(data, list)
        items = data if is_list else (data.get('exhibitions') or data.get('queue') or [])
        
        modified = False
        for item in items:
            item_id = item.get("id")
            if item_id in target_exhibitions_map:
                updated = target_exhibitions_map[item_id]
                # artworks 및 works 업데이트
                item["artworks"] = updated.get("artworks", item.get("artworks", []))
                if "works" in item:
                    item["works"] = updated.get("artworks", item.get("artworks", []))
                modified = True
                
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"[SAFESAVE] Updated targets in {file_path}")
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Failed to update {file_path}: {e}")
        return False
