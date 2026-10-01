"""
Populate web/ directory with clean public app structure.
"""

import os
import shutil
import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
ORIGINAL = WORKSPACE / "my-exhibit-platform"
WEB_DIR = WORKSPACE / "web"

def populate_web():
    print("Populating web/...")
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Base configs
    configs = [
        "next.config.mjs",
        "tsconfig.json",
        "tailwind.config.ts",
        "postcss.config.mjs",
        "next-env.d.ts"
    ]
    for c in configs:
        src = ORIGINAL / c
        if src.exists():
            shutil.copy2(src, WEB_DIR / c)
            
    # package.json for web
    web_pkg = {
        "name": "grad-exhibit-web",
        "version": "0.1.0",
        "private": True,
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start",
            "lint": "next lint"
        },
        "dependencies": {
            "next": "^14.2.5",
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "lucide-react": "^0.400.0"
        },
        "devDependencies": {
            "typescript": "^5.5.3",
            "@types/node": "^20.14.9",
            "@types/react": "^18.3.3",
            "@types/react-dom": "^18.3.0",
            "postcss": "^8.4.39",
            "tailwindcss": "^3.4.4",
            "autoprefixer": "^10.4.19"
        }
    }
    (WEB_DIR / "package.json").write_text(json.dumps(web_pkg, indent=2, ensure_ascii=False), encoding="utf-8")
    
    # 2. Types
    (WEB_DIR / "types").mkdir(parents=True, exist_ok=True)
    for f in (ORIGINAL / "types").glob("*.ts"):
        shutil.copy2(f, WEB_DIR / "types" / f.name)
        
    # 3. Components (public only)
    (WEB_DIR / "components").mkdir(parents=True, exist_ok=True)
    
    # copy component subdirectories (challenge, monetization, opportunity)
    for sub in ["challenge", "monetization", "opportunity"]:
        if (ORIGINAL / "components" / sub).exists():
            shutil.copytree(ORIGINAL / "components" / sub, WEB_DIR / "components" / sub, dirs_exist_ok=True)
            
    # copy navigation
    (WEB_DIR / "components" / "navigation").mkdir(parents=True, exist_ok=True)
    shutil.copy2(ORIGINAL / "components" / "navigation" / "MobileHeader.tsx", WEB_DIR / "components" / "navigation" / "MobileHeader.tsx")
    
    # Clean Sidebar.tsx without admin link
    sidebar_content = (ORIGINAL / "components" / "navigation" / "Sidebar.tsx").read_text(encoding="utf-8")
    # Remove admin link block
    admin_block_pattern = """      {/* 사이드바 하단 푸터 / 유틸리티 */}
      <div className={`pt-3 flex items-center gap-1.5 ${process.env.NODE_ENV !== "production" ? "justify-between" : "justify-end"}`}>
        {process.env.NODE_ENV !== "production" && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black hover:bg-slate-900 text-white border border-slate-800/80 hover:border-slate-600 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 dark:border-slate-200 text-[11px] font-medium shadow-sm transition"
          >
            <Shield className="w-3 h-3" />
            <span>관제 시스템</span>
          </Link>
        )}
        <ThemeToggle />
      </div>"""
    
    clean_footer = """      {/* 사이드바 하단 푸터 / 유틸리티 */}
      <div className="pt-3 flex items-center justify-end">
        <ThemeToggle />
      </div>"""
      
    if admin_block_pattern in sidebar_content:
        sidebar_content = sidebar_content.replace(admin_block_pattern, clean_footer)
    else:
        # fallback replace
        import re
        sidebar_content = re.sub(r'\{process\.env\.NODE_ENV !== "production" && \([\s\S]*?<\/Link>\s*\)\}', '', sidebar_content)
        sidebar_content = sidebar_content.replace('justify-between', 'justify-end')
    
    # remove Shield import if not used
    sidebar_content = sidebar_content.replace("  Shield,\n", "")
    (WEB_DIR / "components" / "navigation" / "Sidebar.tsx").write_text(sidebar_content, encoding="utf-8")
    
    # Clean GNB.tsx without admin link
    gnb_content = (ORIGINAL / "components" / "navigation" / "GNB.tsx").read_text(encoding="utf-8")
    import re
    gnb_content = re.sub(r'\{process\.env\.NODE_ENV !== "production" && \([\s\S]*?관제 시스템[\s\S]*?<\/Link>\s*\)\}', '', gnb_content)
    (WEB_DIR / "components" / "navigation" / "GNB.tsx").write_text(gnb_content, encoding="utf-8")

    # Other single public components
    for comp in ["artwork-lightbox-modal.tsx", "CurriculumCard.tsx", "theme-toggle.tsx", "UniversityProfessorInsightModal.tsx"]:
        src_comp = ORIGINAL / "components" / comp
        if src_comp.exists():
            shutil.copy2(src_comp, WEB_DIR / "components" / comp)

    # 4. Libs
    (WEB_DIR / "lib").mkdir(parents=True, exist_ok=True)
    shutil.copy2(ORIGINAL / "lib" / "categoryMapper.ts", WEB_DIR / "lib" / "categoryMapper.ts")
    shutil.copy2(ORIGINAL / "lib" / "opportunity.ts", WEB_DIR / "lib" / "opportunity.ts")
    shutil.copy2(ORIGINAL / "lib" / "challenge.ts", WEB_DIR / "lib" / "challenge.ts")
    
    # src/utils/categoryMapper.ts as well for path alias consistency
    (WEB_DIR / "src" / "utils").mkdir(parents=True, exist_ok=True)
    shutil.copy2(ORIGINAL / "src" / "utils" / "categoryMapper.ts", WEB_DIR / "src" / "utils" / "categoryMapper.ts")

    # 5. App directory setup
    (WEB_DIR / "app").mkdir(parents=True, exist_ok=True)
    shutil.copy2(ORIGINAL / "app" / "globals.css", WEB_DIR / "app" / "globals.css")
    shutil.copy2(ORIGINAL / "app" / "layout.tsx", WEB_DIR / "app" / "layout.tsx")
    
    # Copy all routes from (public) directly to app/
    pub_app = ORIGINAL / "app" / "(public)"
    for root, dirs, files in os.walk(pub_app):
        rel = Path(root).relative_to(pub_app)
        target_dir = WEB_DIR / "app" / rel
        target_dir.mkdir(parents=True, exist_ok=True)
        for f in files:
            shutil.copy2(Path(root) / f, target_dir / f)

    print("web/ structure created.")

if __name__ == "__main__":
    populate_web()
