import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface DepartmentItem {
  id: string;
  university: string;
  departmentName: string;
  displayName: string;
  category: string;
  keywords: string[];
  hasCorporateCooperation: boolean;
  corporateCount: number;
}

function safeReadJson(filePath: string): any {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return null;
}

export async function GET() {
  try {
    const rootDir = path.resolve(process.cwd(), "..");
    const platformDir = process.cwd();

    const queueFiles = [
      path.join(platformDir, "data", "university_queue.json"),
      path.join(rootDir, "data", "university_queue.json"),
    ];
    const profFiles = [
      path.join(platformDir, "data", "professors.json"),
      path.join(rootDir, "data", "professors.json"),
    ];

    let queueData = null;
    for (const f of queueFiles) {
      queueData = safeReadJson(f);
      if (queueData) break;
    }

    let profData = null;
    for (const f of profFiles) {
      profData = safeReadJson(f);
      if (profData) break;
    }

    const deptMap = new Map<string, DepartmentItem>();

    // 1. university_queue.json에서 실제 학과 추출
    if (Array.isArray(queueData)) {
      for (const item of queueData) {
        const univ = (item.university || "").trim();
        const dept = (item.department || "").trim();
        if (!univ || !dept) continue;

        const key = `${univ}::${dept}`;
        if (!deptMap.has(key)) {
          const tags = item.card_news?.tags || [];
          const trendKw = item.card_news?.research_data?.trend_keywords || [];
          const skills = item.verified_required_skills || [];
          const coop = item.cooperation_companies || [];

          deptMap.set(key, {
            id: `dept-${encodeURIComponent(univ)}-${encodeURIComponent(dept)}`,
            university: univ,
            departmentName: dept,
            displayName: `${univ} ${dept}`,
            category: item.category || "디자인·UX/UI",
            keywords: Array.from(new Set([...tags, ...trendKw, ...skills])).slice(0, 8),
            hasCorporateCooperation: coop.length > 0,
            corporateCount: coop.length,
          });
        }
      }
    }

    // 2. professors.json에서 실제 학과 정보 보강
    if (Array.isArray(profData)) {
      for (const prof of profData) {
        const univ = (prof.university || "").trim();
        const dept = (prof.department || "").trim();
        if (!univ || !dept) continue;

        const key = `${univ}::${dept}`;
        const researchAreas = prof.research_areas || [];
        const collabs = prof.industry_collaborations || [];

        if (!deptMap.has(key)) {
          deptMap.set(key, {
            id: `dept-${encodeURIComponent(univ)}-${encodeURIComponent(dept)}`,
            university: univ,
            departmentName: dept,
            displayName: `${univ} ${dept}`,
            category: "디자인·연구",
            keywords: researchAreas.slice(0, 8),
            hasCorporateCooperation: collabs.length > 0,
            corporateCount: collabs.length,
          });
        } else {
          const existing = deptMap.get(key)!;
          existing.keywords = Array.from(
            new Set([...existing.keywords, ...researchAreas])
          ).slice(0, 8);
          if (collabs.length > 0) {
            existing.hasCorporateCooperation = true;
            existing.corporateCount = Math.max(existing.corporateCount, collabs.length);
          }
        }
      }
    }

    const departments = Array.from(deptMap.values()).sort((a, b) => {
      // 산학협력 실적 보유 학과 우선 정렬
      if (a.hasCorporateCooperation !== b.hasCorporateCooperation) {
        return a.hasCorporateCooperation ? -1 : 1;
      }
      return a.displayName.localeCompare(b.displayName, "ko");
    });

    return NextResponse.json({
      success: true,
      source: "university_intelligence_db",
      total: departments.length,
      departments,
    });
  } catch (error) {
    console.error("[API /api/jobs/departments] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch departments from Intelligence DB", departments: [] },
      { status: 500 }
    );
  }
}
