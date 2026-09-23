"""
scripts/patch_filter_ui.py
Refactors the exhibition gallery filter area:
1. Adds Search icon to lucide-react imports.
2. Adds searchQuery state and search filtering logic.
3. Removes horizontal scroll (overflow-x-auto, whitespace-nowrap, no-scrollbar).
4. Applies flex-wrap to chips and embeds the integrated search bar with dark theme styling.
"""
import os
import re

TARGET_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "components", "exhibition-gallery.tsx")
)

def patch():
    with open(TARGET_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Import Search from lucide-react if not present
    if "Search," not in content and "Search " not in content:
        content = re.sub(
            r'(import \{[^\}]*Sparkles,)',
            r'\1\n  Search,',
            content
        )

    # 2. Add searchQuery state
    if "const [searchQuery, setSearchQuery]" not in content:
        content = re.sub(
            r'(const \[selectedCategory, setSelectedCategory\] = useState\("전체 분야"\);)',
            r'\1\n  const [searchQuery, setSearchQuery] = useState("");',
            content
        )

    # 3. Update filtering logic to include search query matching
    old_filter = """    // 카테고리 조건 매칭 (10대 표준 카테고리 및 학과 자동 매핑 일치)
    const matchesCategory =
      selectedCategory === "전체" ||
      selectedCategory === "전체 분야" ||
      item.category === selectedCategory ||
      getStandardCategory(item.category || item.department || "") === selectedCategory ||
      item.department?.includes(selectedCategory);

    return matchesYear && matchesCategory;"""

    new_filter = """    // 카테고리 조건 매칭 (10대 표준 카테고리 및 학과 자동 매핑 일치)
    const matchesCategory =
      selectedCategory === "전체" ||
      selectedCategory === "전체 분야" ||
      item.category === selectedCategory ||
      getStandardCategory(item.category || item.department || "") === selectedCategory ||
      item.department?.includes(selectedCategory);

    // 통합 검색어 매칭 (대학명, 학과, 작품명, 슬로건, 태그, 학생명 등)
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.university?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q) ||
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.headline?.toLowerCase().includes(q) ||
      item.slogan?.toLowerCase().includes(q) ||
      item.tags?.some((t) => t.toLowerCase().includes(q)) ||
      item.artworks?.some(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.author?.toLowerCase().includes(q) ||
          a.role?.toLowerCase().includes(q)
      );

    return matchesYear && matchesCategory && matchesSearch;"""

    content = content.replace(old_filter.replace("\r\n", "\n"), new_filter.replace("\r\n", "\n"))
    content = content.replace(old_filter.replace("\n", "\r\n"), new_filter.replace("\n", "\r\n"))

    # 4. Replace filter container (overflow-x-auto -> flex flex-wrap) and add integrated search bar
    old_chips_block = re.search(
        r'<div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 w-full min-w-0">.*?<\/div>\s*<\/section>',
        content,
        flags=re.DOTALL
    )

    new_chips_block = """<div className="flex flex-wrap items-center gap-2 md:gap-3 w-full">
          {INDUSTRIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold transition border shadow-xs ${
                  isSelected
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-600/20 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400"
                    : "bg-white dark:bg-[#111422] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}

          {/* 직무/학과/작품 통합 검색 바 (공간 부족 시 자연스럽게 아래로 줄바꿈 됨) */}
          <div className="relative flex-grow min-w-[200px] max-w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="대학명, 학과, 작품 검색..."
              className="w-full text-xs font-medium bg-slate-50 dark:bg-[#0f121e] border border-slate-200 dark:border-slate-700 rounded-2xl pl-8 pr-7 py-1.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="검색어 지우기"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </section>"""

    if old_chips_block:
        content = content.replace(old_chips_block.group(0), new_chips_block)
        print("[+] Replaced chips container with flex-wrap and integrated search bar!")
    else:
        print("[!] Could not find old chips block via regex")

    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[SUCCESS] Patched {TARGET_FILE}")

if __name__ == "__main__":
    patch()
