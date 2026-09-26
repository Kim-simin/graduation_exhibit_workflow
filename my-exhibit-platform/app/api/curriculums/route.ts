import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DepartmentCurriculum } from "@/types/curriculum";

export const dynamic = "force-dynamic";

function getFilePaths() {
  const rootDataDir = path.join(process.cwd(), "..", "data");
  const localDataDir = path.join(process.cwd(), "data");

  const curriculumsFile = fs.existsSync(localDataDir)
    ? path.join(localDataDir, "curriculums.json")
    : path.join(rootDataDir, "curriculums.json");

  const rootCurriculumsFile = path.join(rootDataDir, "curriculums.json");

  const masterFile = fs.existsSync(path.join(localDataDir, "leading_departments_master.json"))
    ? path.join(localDataDir, "leading_departments_master.json")
    : path.join(rootDataDir, "leading_departments_master.json");

  return { curriculumsFile, rootCurriculumsFile, masterFile };
}

export async function GET() {
  try {
    const { curriculumsFile, masterFile } = getFilePaths();

    let curriculums: DepartmentCurriculum[] = [];
    if (fs.existsSync(curriculumsFile)) {
      const raw = fs.readFileSync(curriculumsFile, "utf-8");
      curriculums = JSON.parse(raw);
    }

    let masterCategories: any[] = [];
    if (fs.existsSync(masterFile)) {
      const rawMaster = fs.readFileSync(masterFile, "utf-8");
      masterCategories = JSON.parse(rawMaster);
    }

    return NextResponse.json({
      status: "SUCCESS",
      curriculums,
      master_categories: masterCategories,
    });
  } catch (error: any) {
    console.error("[API /api/curriculums GET Error]:", error);
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      department_category,
      lead_school,
      curriculum_title,
      short_video_url,
      video_poster,
      grade_tech_tree,
      tech_stack,
      benchmarked_universities,
    } = body;

    if (!department_category || !lead_school?.university || !curriculum_title) {
      return NextResponse.json(
        { status: "ERROR", message: "필수 정보(학과 카테고리, 대학교, 커리큘럼 제목)가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { curriculumsFile, rootCurriculumsFile } = getFilePaths();

    let curriculums: DepartmentCurriculum[] = [];
    if (fs.existsSync(curriculumsFile)) {
      curriculums = JSON.parse(fs.readFileSync(curriculumsFile, "utf-8"));
    }

    const cardId = id || `curr-${Date.now()}`;
    const newOrUpdatedCard: DepartmentCurriculum = {
      id: cardId,
      department_category,
      lead_school: {
        university: lead_school.university,
        department: lead_school.department || "선도학과",
        badge_title: lead_school.badge_title || `${lead_school.university} 대표 선도학과`,
      },
      curriculum_title,
      short_video_url: short_video_url || "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-41365-large.mp4",
      video_poster: video_poster || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
      grade_tech_tree: Array.isArray(grade_tech_tree) && grade_tech_tree.length > 0
        ? grade_tech_tree
        : [
            { grade: "1학년", stage: "기초 입문", tools: ["기초도구"], desc: "전공 기초 지식 및 개념 이해" },
            { grade: "2학년", stage: "심화 응용", tools: ["실무툴"], desc: "실무 소프트웨어 도구 및 분석 훈련" },
            { grade: "3학년", stage: "실전 프로젝트", tools: ["전문기술"], desc: "산학 프로젝트 및 포트폴리오 기획" },
            { grade: "4학년", stage: "캡스톤 완성", tools: ["상용스펙"], desc: "졸업 캡스톤 및 상용 규격 완성" },
          ],
      tech_stack: Array.isArray(tech_stack)
        ? tech_stack
        : (grade_tech_tree || []).flatMap((g: any) => g.tools || []).filter(Boolean),
      benchmarked_universities: Array.isArray(benchmarked_universities) ? benchmarked_universities : [],
    };

    const existingIdx = curriculums.findIndex((c) => c.id === cardId || (
      c.department_category === department_category &&
      c.lead_school.university === lead_school.university
    ));

    if (existingIdx >= 0) {
      curriculums[existingIdx] = newOrUpdatedCard;
    } else {
      curriculums.unshift(newOrUpdatedCard);
    }

    // Save to local data
    fs.writeFileSync(curriculumsFile, JSON.stringify(curriculums, null, 2), "utf-8");

    // Also sync to root data if exists
    if (fs.existsSync(path.dirname(rootCurriculumsFile))) {
      try {
        fs.writeFileSync(rootCurriculumsFile, JSON.stringify(curriculums, null, 2), "utf-8");
      } catch (err) {
        console.warn("Failed to sync to root data file:", err);
      }
    }

    return NextResponse.json({
      status: "SUCCESS",
      curriculum: newOrUpdatedCard,
      message: `'${lead_school.university} (${department_category})' 커리큘럼 카드가 성공적으로 저장 및 업데이트되었습니다.`,
    });
  } catch (error: any) {
    console.error("[API /api/curriculums POST Error]:", error);
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { status: "ERROR", message: "삭제할 커리큘럼 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { curriculumsFile, rootCurriculumsFile } = getFilePaths();
    if (!fs.existsSync(curriculumsFile)) {
      return NextResponse.json({ status: "ERROR", message: "데이터 파일이 없습니다." }, { status: 404 });
    }

    const curriculums: DepartmentCurriculum[] = JSON.parse(fs.readFileSync(curriculumsFile, "utf-8"));
    const filtered = curriculums.filter((c) => c.id !== id);

    fs.writeFileSync(curriculumsFile, JSON.stringify(filtered, null, 2), "utf-8");
    if (fs.existsSync(path.dirname(rootCurriculumsFile))) {
      try {
        fs.writeFileSync(rootCurriculumsFile, JSON.stringify(filtered, null, 2), "utf-8");
      } catch (e) {
        console.warn(e);
      }
    }

    return NextResponse.json({
      status: "SUCCESS",
      message: "선택한 커리큘럼 카드가 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("[API /api/curriculums DELETE Error]:", error);
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
