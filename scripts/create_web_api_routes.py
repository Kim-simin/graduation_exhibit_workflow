"""
Create minimal, read-only public API routes for web/app/api
Zero write capabilities, zero internal logic.
"""

from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
API_DIR = WORKSPACE / "web" / "app" / "api"

IMAGE_ROUTE = """import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const requestedPath = params.path.join("/");
    
    // Security check: Directory traversal prevention
    if (requestedPath.includes("..")) {
      return new NextResponse("Invalid image path", { status: 400 });
    }

    const possibleBases = [
      path.resolve(process.cwd(), "public"),
      path.resolve(process.cwd(), "public", "uploads"),
    ];

    let targetFile = "";
    for (const base of possibleBases) {
      const candidate = path.join(base, requestedPath);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        targetFile = candidate;
        break;
      }
    }

    if (!targetFile) {
      return new NextResponse("Image Not Found", { status: 404 });
    }

    const ext = path.extname(targetFile).toLowerCase();
    let contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".mp4") contentType = "video/mp4";

    const fileBuffer = fs.readFileSync(targetFile);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Error serving image", { status: 500 });
  }
}
"""

EXHIBITIONS_ROUTE = """import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "data", "published", "exhibitions.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ exhibitions: [] });
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json({ exhibitions: data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load exhibitions" }, { status: 500 });
  }
}
"""

CURRICULUMS_ROUTE = """import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const currPath = path.resolve(process.cwd(), "data", "published", "curriculums.json");
    const masterPath = path.resolve(process.cwd(), "data", "published", "leading_departments_master.json");
    
    const curriculums = fs.existsSync(currPath)
      ? JSON.parse(fs.readFileSync(currPath, "utf-8"))
      : [];
    const masterCategories = fs.existsSync(masterPath)
      ? JSON.parse(fs.readFileSync(masterPath, "utf-8"))
      : [];
      
    return NextResponse.json({
      status: "SUCCESS",
      curriculums,
      master_categories: masterCategories,
    });
  } catch (error) {
    return NextResponse.json({ status: "ERROR", message: "Failed to load curriculums" }, { status: 500 });
  }
}
"""

PROFESSORS_ROUTE = """import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "data", "published", "professors.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ professors: [] });
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load professors" }, { status: 500 });
  }
}
"""

JOBS_ROUTE = """import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "data", "published", "recruitment_intelligence.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(data);
    }
    const fallbackPath = path.resolve(process.cwd(), "data", "published", "jobs.json");
    if (fs.existsSync(fallbackPath)) {
      const data = JSON.parse(fs.readFileSync(fallbackPath, "utf-8"));
      return NextResponse.json(data);
    }
    return NextResponse.json({ verified_postings: [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}
"""

JOBS_DEPTS_ROUTE = """import { NextResponse } from "next/server";

const DEPARTMENTS = [
  "전체 학과",
  "시각디자인과",
  "산업디자인과",
  "컴퓨터공학과",
  "소프트웨어학과",
  "미디어커뮤니케이션학과",
  "패션디자인과",
  "건축학과",
  "영상애니메이션과"
];

export async function GET() {
  return NextResponse.json({ departments: DEPARTMENTS });
}
"""

OPPORTUNITIES_ROUTE = """import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const oppsPath = path.resolve(process.cwd(), "data", "published", "opportunities.json");
    const equipPath = path.resolve(process.cwd(), "data", "published", "equipment.json");
    
    const opportunities = fs.existsSync(oppsPath) ? JSON.parse(fs.readFileSync(oppsPath, "utf-8")) : [];
    const equipment = fs.existsSync(equipPath) ? JSON.parse(fs.readFileSync(equipPath, "utf-8")) : [];
    
    return NextResponse.json({
      opportunities,
      equipment,
      count: opportunities.length + equipment.length
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load opportunities" }, { status: 500 });
  }
}
"""

OPPORTUNITIES_ID_ROUTE = """import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const oppsPath = path.resolve(process.cwd(), "data", "published", "opportunities.json");
    const equipPath = path.resolve(process.cwd(), "data", "published", "equipment.json");
    
    const opportunities = fs.existsSync(oppsPath) ? JSON.parse(fs.readFileSync(oppsPath, "utf-8")) : [];
    const equipment = fs.existsSync(equipPath) ? JSON.parse(fs.readFileSync(equipPath, "utf-8")) : [];
    
    const found = [...opportunities, ...equipment].find((item: any) => item.id === params.id);
    if (found) {
      return NextResponse.json(found);
    }
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load opportunity" }, { status: 500 });
  }
}
"""

def main():
    routes = {
        API_DIR / "images" / "[...path]" / "route.ts": IMAGE_ROUTE,
        API_DIR / "exhibitions" / "route.ts": EXHIBITIONS_ROUTE,
        API_DIR / "curriculums" / "route.ts": CURRICULUMS_ROUTE,
        API_DIR / "professors" / "route.ts": PROFESSORS_ROUTE,
        API_DIR / "jobs" / "route.ts": JOBS_ROUTE,
        API_DIR / "jobs" / "departments" / "route.ts": JOBS_DEPTS_ROUTE,
        API_DIR / "opportunities" / "route.ts": OPPORTUNITIES_ROUTE,
        API_DIR / "opportunities" / "[id]" / "route.ts": OPPORTUNITIES_ID_ROUTE,
    }
    
    for route_path, content in routes.items():
        route_path.parent.mkdir(parents=True, exist_ok=True)
        route_path.write_text(content.strip(), encoding="utf-8")
        print(f"Created read-only API: {route_path.relative_to(WORKSPACE)}")

if __name__ == "__main__":
    main()
