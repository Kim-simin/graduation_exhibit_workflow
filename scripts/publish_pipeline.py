"""
Publish Pipeline Script
Safely exports approved, validated data from admin/data to web/data/published
and synchronizes media assets from admin/public to web/public.
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime, timezone

WORKSPACE = Path(__file__).resolve().parent.parent
ADMIN_DIR = WORKSPACE / "admin"
WEB_DIR = WORKSPACE / "web"
ADMIN_DATA = ADMIN_DIR / "data"
WEB_DATA = WEB_DIR / "data" / "published"
ADMIN_PUB = ADMIN_DIR / "public"
WEB_PUB = WEB_DIR / "public"

def get_standard_category(dept_or_cat: str) -> str:
    # Standard category fallback
    mapping = {
        "시각": "디자인·UX/UI",
        "산업": "디자인·UX/UI",
        "디자인": "디자인·UX/UI",
        "회화": "미술·회화",
        "미술": "미술·회화",
        "조소": "미술·회화",
        "공예": "공예·조형",
        "도예": "공예·조형",
        "금속": "공예·조형",
        "영상": "영상·미디어",
        "애니": "영상·미디어",
        "미디어": "영상·미디어",
        "사진": "사진·브랜드",
        "광고": "사진·브랜드",
        "건축": "건축·공간",
        "실내": "건축·공간",
        "공간": "건축·공간",
        "패션": "패션·의류",
        "의류": "패션·의류",
        "게임": "게임·캐릭터",
        "컴퓨터": "IT·소프트웨어·컴공",
        "소프트웨어": "IT·소프트웨어·컴공",
        "전자": "기계·전자·일반공학",
        "기계": "기계·전자·일반공학",
    }
    for k, v in mapping.items():
        if k in (dept_or_cat or ""):
            return v
    return "디자인·UX/UI"

def is_zoom_disabled(cat: str, dept: str) -> bool:
    target_cats = ["IT·소프트웨어·컴공", "기계·전자·일반공학"]
    std_cat = get_standard_category(cat or dept)
    return std_cat in target_cats

def copy_or_link(src: Path, dst: Path):
    if not src.exists():
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        return True
    try:
        os.link(src, dst)
        return True
    except Exception:
        try:
            shutil.copy2(src, dst)
            return True
        except Exception as e:
            print(f"Error copying {src} -> {dst}: {e}")
            return False

def run_export():
    print(f"=== Starting Publish Export Pipeline ===")
    print(f"Source: {ADMIN_DATA}")
    print(f"Destination: {WEB_DATA}")
    
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    WEB_PUB.mkdir(parents=True, exist_ok=True)
    
    # 1. Export university exhibitions
    queue_file = ADMIN_DATA / "university_queue.json"
    if not queue_file.exists():
        print(f"ERROR: {queue_file} not found!")
        sys.exit(1)
        
    raw_queue = json.loads(queue_file.read_text(encoding="utf-8"))
    print(f"Loaded {len(raw_queue)} total items from university_queue.json")
    
    published_exhibitions = []
    artwork_images_to_sync = set()
    poster_images_to_sync = set()
    
    researched_count = 0
    total_artworks = 0
    
    for item in raw_queue:
        poster = item.get("poster_image")
        has_real_poster = bool(poster and isinstance(poster, str) and "unsplash" not in poster and len(poster) > 5)
        clean_poster = None
        if has_real_poster:
            clean_poster = (
                poster.replace("\\", "/")
                .replace("my-exhibit-platform/public/", "")
                .replace("public/", "")
                .replace("data/downloads/", "")
                .lstrip("/")
            )
            poster_images_to_sync.add(clean_poster)
            
        poster_video = (
            item.get("poster_video") or 
            item.get("motion_poster_url") or 
            item.get("motion_poster") or 
            ("uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4" if "세종" in item.get("university", "") and "디자인이노베이션" in item.get("department", "") else None)
        )
        clean_video = None
        if poster_video:
            clean_video = poster_video.replace("\\", "/").replace("my-exhibit-platform/public/", "").replace("public/", "").replace("data/downloads/", "").lstrip("/")
            poster_images_to_sync.add(clean_video)
            
        raw_artworks = item.get("artworks", [])
        artworks = []
        for a in raw_artworks:
            img = a.get("image", "")
            if not img or "unsplash" in img:
                continue
            clean_img = img.replace("\\", "/").replace("my-exhibit-platform/public/", "").replace("public/", "").replace("data/downloads/", "").lstrip("/")
            artwork_images_to_sync.add(clean_img)
            
            artworks.append({
                "title": a.get("title") or "출품작",
                "author": a.get("student_name") or f"{item.get('university')} 작가",
                "role": a.get("inferred_role") or "크리에이터",
                "department": a.get("department") or a.get("sub_department") or a.get("track") or a.get("major") or "",
                "imagePath": clean_img,
                "description": a.get("description") or "",
            })
            
        is_researched = (item.get("status") in ["리서치 완료", "완료", "승인 완료", "검수 완료", "published"]) and has_real_poster
        if not is_researched or not clean_poster:
            # Skip unresearched placeholder cards for public web
            continue

        # Check that the poster file actually exists on disk anywhere in the project
        poster_candidates = [
            ADMIN_PUB / clean_poster,
            WORKSPACE / "my-exhibit-platform" / "public" / clean_poster,
            WORKSPACE / "public" / clean_poster,
            ADMIN_DATA / "downloads" / clean_poster,
            WORKSPACE / "data" / "downloads" / clean_poster,
        ]
        if not any(p.exists() and p.is_file() for p in poster_candidates):
            print(f"Skipping [{item.get('id')}] - poster file not found on disk: {clean_poster}")
            continue

        researched_count += 1
        total_artworks += len(artworks)
            
        clean_title = (
            item.get("exhibition_title") if has_real_poster and item.get("exhibition_title") and "인공지능 기반 능동형" not in item.get("exhibition_title")
            else f"[{item.get('university')}] {item.get('year', '2025')} {item.get('department')} 졸업전시회"
        )
        
        curation = item.get("curation_summary")
        card_news = item.get("card_news") or {}
        
        headline = (
            (curation.get("headline") if isinstance(curation, dict) else None) or
            card_news.get("card_headline") or
            clean_title
        )
        
        curation_intro = (
            ((curation.get("curation_intro") if isinstance(curation, dict) else curation) or card_news.get("card_intro") or item.get("slogan") or "")
            if is_researched
            else "아직 리서치 및 에셋 아카이빙이 진행되지 않았습니다. 공식 아카이브가 준비되는 대로 업데이트됩니다."
        )
        
        cooperation = [
            c if isinstance(c, str) else c.get("company_name", c.get("name", str(c)))
            for c in item.get("cooperation_companies", [])
        ]
        
        dept = item.get("department", "")
        cat = item.get("category", "")
        std_cat = get_standard_category(cat or dept)
        
        exhibition_record = {
            "id": item.get("id"),
            "university": item.get("university"),
            "department": dept,
            "year": item.get("year", "2025"),
            "category": std_cat,
            "title": clean_title,
            "isResearched": is_researched,
            "isUploaded": is_researched or item.get("status") == "published",
            "status": "published",
            "targetUrl": item.get("target_url") or item.get("scraped_url") or item.get("official_url") or "",
            "posterPath": clean_poster,
            "posterVideoPath": f"{clean_video}?v=horse_center_v3" if clean_video else None,
            "headline": headline,
            "curationIntro": curation_intro,
            "period": item.get("exhibition_period") or "일정 공지 대기",
            "schedule": item.get("exhibition_period") or "일정 공지 대기",
            "venue": item.get("exhibition_venue") or "교내 전시홀",
            "slogan": item.get("slogan") or headline,
            "subtitle": item.get("slogan") or headline,
            "description": item.get("raw_description") or curation_intro,
            "criticScore": item.get("critic_score", 95) if is_researched else 0,
            "tags": (curation.get("inferred_industry_keywords") if isinstance(curation, dict) else None) or card_news.get("tags") or [dept, "졸업전시"],
            "artworks": artworks,
            "instagramPublished": bool(item.get("instagramPublished")),
            "publishedAt": item.get("publishedAt"),
            "cardCaption": card_news.get("card_caption", ""),
            "cooperationCompanies": cooperation,
            "crossValidationStatus": item.get("cross_validation_status"),
            "hasCorporateCooperation": bool(item.get("has_corporate_cooperation") or cooperation),
            "corporateCooperationCount": len(cooperation),
            "verifiedRequiredSkills": item.get("verified_required_skills", []),
            "corporateResearchReport": item.get("corporate_research_report"),
            "disableArtworkZoom": is_zoom_disabled(std_cat, dept)
        }
        published_exhibitions.append(exhibition_record)
        
    # Write published exhibitions
    out_exhibits = WEB_DATA / "exhibitions.json"
    out_exhibits.write_text(json.dumps(published_exhibitions, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Exported {len(published_exhibitions)} exhibitions ({researched_count} researched, {total_artworks} artworks) to {out_exhibits}")
    
    # 2. Export verified professors
    prof_file = ADMIN_DATA / "professors.json"
    if prof_file.exists():
        profs = json.loads(prof_file.read_text(encoding="utf-8"))
        # Filter verified professors
        verified_profs = [p for p in profs if p.get("is_verified") or p.get("verification_status") == "VERIFIED"]
        out_profs = WEB_DATA / "professors.json"
        out_profs.write_text(json.dumps(verified_profs, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Exported {len(verified_profs)} / {len(profs)} verified professors to {out_profs}")
        
    # 3. Export curriculums
    curr_file = ADMIN_DATA / "curriculums.json"
    if curr_file.exists():
        currs = json.loads(curr_file.read_text(encoding="utf-8"))
        out_currs = WEB_DATA / "curriculums.json"
        out_currs.write_text(json.dumps(currs, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Exported {len(currs)} curriculums to {out_currs}")
        
    # 4. Export other public entities
    other_entities = [
        "students.json",
        "jobs.json",
        "opportunities.json",
        "brand_assets.json",
        "corporate.json",
        "industry_challenges.json",
        "mentors.json",
        "taxonomy.json",
        "leading_departments_master.json"
    ]
    for ent in other_entities:
        src_ent = ADMIN_DATA / ent
        if src_ent.exists():
            data = json.loads(src_ent.read_text(encoding="utf-8"))
            out_ent = WEB_DATA / ent
            out_ent.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            print(f"Exported {ent} to {out_ent}")

    # 5. Export recruitment intelligence if exists
    rec_int = ADMIN_DATA / "research" / "intelligence" / "recruitment_intelligence.json"
    if rec_int.exists():
        out_rec = WEB_DATA / "recruitment_intelligence.json"
        out_rec.write_text(rec_int.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"Exported recruitment_intelligence.json to {out_rec}")
        
    # 6. Synchronize Media Assets
    print("\nSynchronizing media assets to web/public...")
    all_media = artwork_images_to_sync | poster_images_to_sync
    synced_media = 0
    missing_media = 0
    
    for rel_path in all_media:
        candidate_paths = [
            ADMIN_PUB / rel_path,
            WORKSPACE / "my-exhibit-platform" / "public" / rel_path,
            WORKSPACE / "public" / rel_path,
            ADMIN_DATA / "downloads" / rel_path,
            WORKSPACE / "data" / "downloads" / rel_path,
        ]
        found_src = None
        for cand in candidate_paths:
            if cand.exists() and cand.is_file():
                found_src = cand
                break
            
        if found_src:
            dst = WEB_PUB / rel_path
            if copy_or_link(found_src, dst):
                synced_media += 1
        else:
            missing_media += 1
            
    print(f"Media sync complete: {synced_media} synced, {missing_media} missing out of {len(all_media)} referenced media files.")
            
    print(f"Media sync complete: {synced_media} synced, {missing_media} missing out of {len(all_media)} referenced media files.")
    
    # 7. Write metadata
    metadata = {
        "published_at": datetime.now(timezone.utc).isoformat(),
        "total_exhibitions": len(published_exhibitions),
        "researched_exhibitions": researched_count,
        "total_artworks": total_artworks,
        "media_files_synced": synced_media,
        "pipeline_version": "1.0.0",
        "environment": "production-export"
    }
    meta_file = WEB_DATA / "metadata.json"
    meta_file.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Published metadata written to {meta_file}")
    print(f"=== Publish Export Finished Successfully ===\n")

if __name__ == "__main__":
    run_export()
