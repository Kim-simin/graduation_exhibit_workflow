"""
scripts/patch_category_expansion.py
Applies category expansion updates to the platform codebase:
1. my-exhibit-platform/components/exhibition-gallery.tsx
2. my-exhibit-platform/components/exhibition-detail-modal.tsx
3. my-exhibit-platform/lib/get-exhibitions.ts
4. my-exhibit-platform/app/admin/page.tsx
5. scripts/run_queue_agent.py
6. my-exhibit-platform/app/api/cards/route.ts
7. my-exhibit-platform/app/api/research/approve/route.ts
"""
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def patch_exhibition_gallery():
    path = os.path.join(ROOT, "my-exhibit-platform", "components", "exhibition-gallery.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Ensure import of STANDARD_CATEGORIES, EDIT_CATEGORIES, getStandardCategory
    if 'from "@/src/utils/categoryMapper"' not in content:
        content = re.sub(
            r'(import ThemeToggle from "./theme-toggle";)',
            r'\1\nimport { STANDARD_CATEGORIES, EDIT_CATEGORIES, getStandardCategory } from "@/src/utils/categoryMapper";',
            content
        )

    # 2. Replace old INDUSTRIES array with STANDARD_CATEGORIES
    content = re.sub(
        r'// [0-9]+대 표준 산업군[^\n]*\nconst INDUSTRIES = \[[^\]]*\];',
        r'// 10대 통합 표준 카테고리 메타데이터\nconst INDUSTRIES = STANDARD_CATEGORIES;',
        content,
        flags=re.DOTALL
    )

    # 3. Replace old EDIT_CATEGORIES array with imported EDIT_CATEGORIES
    content = re.sub(
        r'const EDIT_CATEGORIES = \[[^\]]*\];',
        r'// EDIT_CATEGORIES imported from categoryMapper',
        content,
        flags=re.DOTALL
    )

    # 4. Update matchesCategory filtering logic
    old_cat_filter = """    // 카테고리 조건 매칭
    const matchesCategory =
      selectedCategory === "전체" ||
      selectedCategory === "전체 분야" ||
      item.category === selectedCategory ||
      item.department?.includes(selectedCategory);"""

    new_cat_filter = """    // 카테고리 조건 매칭 (10대 표준 카테고리 및 학과 자동 매핑 일치)
    const matchesCategory =
      selectedCategory === "전체" ||
      selectedCategory === "전체 분야" ||
      item.category === selectedCategory ||
      getStandardCategory(item.category || item.department || "") === selectedCategory ||
      item.department?.includes(selectedCategory);"""

    # Normalize line endings for replacement
    content = content.replace(old_cat_filter.replace("\r\n", "\n"), new_cat_filter.replace("\r\n", "\n"))
    # In case CRLF was present
    content = content.replace(old_cat_filter.replace("\n", "\r\n"), new_cat_filter.replace("\n", "\r\n"))

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[+] Patched exhibition-gallery.tsx")

def patch_exhibition_detail_modal():
    path = os.path.join(ROOT, "my-exhibit-platform", "components", "exhibition-detail-modal.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if 'from "@/src/utils/categoryMapper"' not in content:
        content = re.sub(
            r'(import { Exhibition, Artwork } from "@/lib/get-exhibitions";)',
            r'\1\nimport { EDIT_CATEGORIES, getStandardCategory } from "@/src/utils/categoryMapper";',
            content
        )

    content = re.sub(
        r'const EDIT_CATEGORIES = \[[^\]]*\];',
        r'// EDIT_CATEGORIES is imported from categoryMapper',
        content,
        flags=re.DOTALL
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[+] Patched exhibition-detail-modal.tsx")

def patch_get_exhibitions():
    path = os.path.join(ROOT, "my-exhibit-platform", "lib", "get-exhibitions.ts")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if 'from "@/src/utils/categoryMapper"' not in content:
        content = re.sub(
            r'(import path from "path";)',
            r'\1\nimport { getStandardCategory } from "@/src/utils/categoryMapper";',
            content
        )

    # Update mapCategory function
    old_map_cat = re.search(r'export function mapCategory\(rawCat: string\): string \{.*?\n\}', content, re.DOTALL)
    if old_map_cat:
        new_map_cat = """export function mapCategory(rawCat: string): string {
  return getStandardCategory(rawCat);
}"""
        content = content.replace(old_map_cat.group(0), new_map_cat)

    # In getInitialExhibitions: category: mapCategory(item.category) -> category: getStandardCategory(item.category || item.department)
    content = re.sub(
        r'category:\s*mapCategory\(item\.category\),',
        r'category: getStandardCategory(item.category || item.department),',
        content
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[+] Patched get-exhibitions.ts")

def patch_admin_page():
    path = os.path.join(ROOT, "my-exhibit-platform", "app", "admin", "page.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if 'from "@/src/utils/categoryMapper"' not in content:
        content = re.sub(
            r'(import \{[^\}]*Cpu,[^\}]*Server,[^\}]*\} from "lucide-react";)',
            r'\1\nimport { STANDARD_CATEGORIES, getStandardCategory } from "@/src/utils/categoryMapper";',
            content
        )

    # Update matchCategory function
    old_match = re.search(r'function matchCategory\(cat: string \| null\): string \{.*?\n\}', content, re.DOTALL)
    if old_match:
        new_match = """function matchCategory(cat: string | null): string {
  return getStandardCategory(cat || "");
}"""
        content = content.replace(old_match.group(0), new_match)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[+] Patched admin/page.tsx")

def patch_run_queue_agent():
    path = os.path.join(ROOT, "scripts", "run_queue_agent.py")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import get_standard_category
    if "from category_mapper import get_standard_category" not in content:
        content = "from category_mapper import get_standard_category\n" + content

    # In process_university_card:
    # Ensure item["category"] = get_standard_category(item.get("category") or dept)
    old_code = 'item["status"] = "리서치 완료"'
    new_code = '''std_cat = get_standard_category(item.get("category") or dept)
            item["category"] = std_cat
            item["status"] = "리서치 완료"'''
    if 'item["category"] = std_cat' not in content:
        content = content.replace(old_code, new_code, 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[+] Patched run_queue_agent.py")

def patch_api_cards():
    path = os.path.join(ROOT, "my-exhibit-platform", "app", "api", "cards", "route.ts")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if 'from "@/src/utils/categoryMapper"' not in content:
        content = 'import { getStandardCategory } from "@/src/utils/categoryMapper";\n' + content

    # Replace category line
    content = re.sub(
        r'category:\s*category\.trim\(\)\s*\|\|\s*"디자인·UX/UI",',
        r'category: getStandardCategory(category?.trim() || department?.trim() || ""),',
        content
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[+] Patched api/cards/route.ts")

if __name__ == "__main__":
    patch_exhibition_gallery()
    patch_exhibition_detail_modal()
    patch_get_exhibitions()
    patch_admin_page()
    patch_run_queue_agent()
    patch_api_cards()
    print("[SUCCESS] All files successfully patched with 10 Standard Categories!")
