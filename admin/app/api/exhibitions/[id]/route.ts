import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getQueueFilePath(): string | null {
  const queuePaths = [
    path.resolve(process.cwd(), "..", "data", "university_queue.json"),
    path.resolve(process.cwd(), "data", "university_queue.json"),
    path.resolve("c:\\Users\\graduation_exhibit_workflow\\data\\university_queue.json"),
  ];

  for (const qp of queuePaths) {
    if (fs.existsSync(qp)) {
      return qp;
    }
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const queueFile = getQueueFilePath();
    if (!queueFile) {
      return NextResponse.json({ success: false, error: "queue file not found" }, { status: 500 });
    }

    const raw = fs.readFileSync(queueFile, "utf-8");
    const list = JSON.parse(raw);
    const item = list.find((it: any) => it.id === id);

    if (!item) {
      return NextResponse.json({ success: false, error: `Exhibition ${id} not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, exhibition: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const queueFile = getQueueFilePath();
    if (!queueFile) {
      return NextResponse.json({ success: false, error: "university_queue.json 파일을 찾을 수 없습니다." }, { status: 500 });
    }

    const raw = fs.readFileSync(queueFile, "utf-8");
    const queueList = JSON.parse(raw);

    const idx = queueList.findIndex((item: any) => item.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: `ID ${id} 전시를 찾을 수 없습니다.` }, { status: 404 });
    }

    const item = queueList[idx];

    // 기본 메타데이터
    if (body.university !== undefined) item.university = body.university.trim();
    if (body.department !== undefined) item.department = body.department.trim();
    if (body.year !== undefined) item.year = String(body.year).trim();
    if (body.category !== undefined) item.category = body.category.trim();

    // 제목
    if (body.title !== undefined) {
      item.exhibition_title = body.title.trim();
      const u = item.university || "";
      const d = item.department || "";
      const y = item.year || "2025";
      item.exhibit_title = `[${u}] ${y} ${d} 졸업전시회`;
    }

    // 일정 및 장소
    if (body.period !== undefined || body.schedule !== undefined) {
      const p = (body.period ?? body.schedule).trim();
      item.exhibition_period = p;
      item.schedule = p;
    }
    if (body.venue !== undefined) {
      item.exhibition_venue = body.venue.trim();
    }

    // 공식 URL
    if (body.targetUrl !== undefined || body.target_url !== undefined) {
      const url = (body.targetUrl ?? body.target_url).trim();
      item.target_url = url;
      item.official_url = url;
      item.scraped_url = url;
    }

    // 슬로건 및 설명
    const headline = body.headline ?? body.slogan;
    if (headline !== undefined) {
      item.slogan = headline.trim();
      if (!item.curation_summary) item.curation_summary = {};
      item.curation_summary.headline = headline.trim();
      if (!item.card_news) item.card_news = {};
      item.card_news.card_headline = headline.trim();
    }

    const intro = body.curationIntro ?? body.description;
    if (intro !== undefined) {
      item.raw_description = intro.trim();
      if (!item.curation_summary) item.curation_summary = {};
      item.curation_summary.curation_intro = intro.trim();
      if (!item.card_news) item.card_news = {};
      item.card_news.card_intro = intro.trim();
    }

    // 태그
    if (body.tags !== undefined) {
      const parsedTags = Array.isArray(body.tags)
        ? body.tags.map((t: string) => t.trim()).filter(Boolean)
        : typeof body.tags === "string"
        ? body.tags.split(/[,#\s]+/).map((t: string) => t.trim()).filter(Boolean)
        : [];
      item.tags = parsedTags;
      if (!item.curation_summary) item.curation_summary = {};
      item.curation_summary.inferred_industry_keywords = parsedTags;
      if (!item.card_news) item.card_news = {};
      item.card_news.tags = parsedTags;
    }

    // 메인 포스터 경로 (삭제 시 null 처리)
    if (body.posterPath !== undefined) {
      item.poster_image = body.posterPath ? body.posterPath.trim() : null;
    }

    // 출품작 목록 갱신
    if (body.artworks !== undefined && Array.isArray(body.artworks)) {
      item.artworks = body.artworks.map((art: any, artIdx: number) => {
        const cleanImg = (art.imagePath || art.image || "").replace(/^\/+/, "");
        return {
          title: (art.title || `출품작 #${artIdx + 1}`).trim(),
          student_name: (art.author || art.student_name || `${item.university} 작가`).trim(),
          image: cleanImg,
          thumbnail: cleanImg,
          screenshot_path: cleanImg,
          description: (art.description || "").trim(),
          inferred_role: (art.role || art.inferred_role || `${item.department || "디자인"} 크리에이터`).trim(),
          detail_url: art.detail_url || "",
        };
      });
    }

    // 상태
    if (item.poster_image) {
      item.status = "리서치 완료";
    }

    // 파일 저장
    const tmpFile = `${queueFile}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(queueList, null, 2), "utf-8");
    fs.renameSync(tmpFile, queueFile);

    return NextResponse.json({
      success: true,
      status: "SUCCESS",
      message: `'${item.university} ${item.department}' 전시 정보가 성공적으로 수정되었습니다.`,
      exhibition: item,
    });
  } catch (error: any) {
    console.error("[API /api/exhibitions/[id] PATCH Error]:", error);
    return NextResponse.json({ success: false, status: "FAILED", error: error.message }, { status: 500 });
  }
}
