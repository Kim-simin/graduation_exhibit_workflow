import { NextResponse } from "next/server";
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

function decodeBase64Image(dataString: string) {
  const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    const pureBase64 = dataString.replace(/^data:image\/\w+;base64,/, "");
    return {
      type: "image/png",
      extension: "png",
      data: Buffer.from(pureBase64, "base64"),
    };
  }

  const type = matches[1];
  let extension = "png";
  if (type.includes("jpeg") || type.includes("jpg")) extension = "jpg";
  else if (type.includes("webp")) extension = "webp";
  else if (type.includes("svg")) extension = "svg";

  return {
    type,
    extension,
    data: Buffer.from(matches[2], "base64"),
  };
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ status: "FAILED", error: "배포 환경(Production)에서는 전시 카드 등록이 지원되지 않습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      university,
      department,
      year = "2026",
      category = "디자인·UX/UI",
      title,
      slogan,
      schedule,
      period,
      venue,
      targetUrl,
      official_url,
      poster_image,
      poster_base64,
      tags = [],
      status = "published",
      artworks = [],
    } = body;

    if (!university || !department) {
      return NextResponse.json(
        { status: "FAILED", error: "대학교명과 전공/학과명은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const queueFile = getQueueFilePath();
    if (!queueFile) {
      return NextResponse.json(
        { status: "FAILED", error: "university_queue.json 파일을 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    const raw = fs.readFileSync(queueFile, "utf-8");
    const queueList = JSON.parse(raw);

    const safeYear = String(year).trim();
    const timestamp = Date.now().toString().slice(-5);
    const safeUniv = university.trim().replace(/[^a-zA-Z0-9가-힣]/g, "");
    const safeDept = department.trim().replace(/[^a-zA-Z0-9가-힣]/g, "");
    const safeCardId = `UNIV-${safeYear}-${safeUniv}-${safeDept}-${timestamp}`;

    let finalPosterPath = poster_image || null;
    if (poster_base64 && poster_base64.startsWith("data:image")) {
      const decoded = decodeBase64Image(poster_base64);
      const possiblePublicDirs = [
        path.resolve(process.cwd(), "public"),
        path.resolve(process.cwd(), "my-exhibit-platform", "public"),
        path.resolve("c:\\Users\\graduation_exhibit_workflow\\my-exhibit-platform\\public"),
      ];
      let publicDir = "";
      for (const pd of possiblePublicDirs) {
        if (fs.existsSync(pd)) {
          publicDir = pd;
          break;
        }
      }
      if (!publicDir) {
        publicDir = path.resolve(process.cwd(), "public");
      }

      const targetUploadDir = path.join(publicDir, "uploads", safeCardId);
      fs.mkdirSync(targetUploadDir, { recursive: true });
      const fileName = `main_poster.${decoded.extension}`;
      fs.writeFileSync(path.join(targetUploadDir, fileName), decoded.data);
      finalPosterPath = `uploads/${safeCardId}/${fileName}`;
    }

    if (!finalPosterPath) {
      finalPosterPath = "captures/DES-02/main_poster.png";
    }

    const parsedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean)
      : typeof tags === "string"
      ? tags.split(/[,#\s]+/).map((t: string) => t.trim()).filter(Boolean)
      : [department.trim(), `${safeYear}졸전`, "졸업전시회"];

    const cleanTitle = title?.trim() || `[${university.trim()}] ${safeYear} ${department.trim()} 졸업전시회`;
    const cleanHeadline = slogan?.trim() || `${cleanTitle}`;
    const cleanPeriod = period?.trim() || schedule?.trim() || `${safeYear}.11월 전시 예정`;
    const cleanVenue = venue?.trim() || `${university.trim()} 교내 전시관 및 온라인 공식 아카이브`;
    const finalUrl = targetUrl?.trim() || official_url?.trim() || "";

    const newQueueItem = {
      id: safeCardId,
      category: category.trim() || "디자인·UX/UI",
      university: university.trim(),
      department: department.trim(),
      year: safeYear,
      exhibit_title: cleanTitle,
      exhibition_title: cleanTitle,
      title: cleanTitle,
      raw_description: `${safeYear}년도 ${university.trim()} ${department.trim()} 공식 졸업전시 아카이브입니다. 학생들의 뛰어난 졸업작품과 창의적인 비전을 만나보세요.`,
      status: status || "published",
      isUploaded: true,
      isResearched: true,
      poster_image: finalPosterPath,
      exhibition_period: cleanPeriod,
      exhibition_venue: cleanVenue,
      target_url: finalUrl,
      official_url: finalUrl,
      scraped_url: finalUrl,
      slogan: cleanHeadline,
      critic_score: 95,
      tags: parsedTags,
      card_news: {
        card_headline: cleanHeadline,
        card_intro: `${safeYear}년도 ${university.trim()} ${department.trim()} 공식 졸업전시 아카이브입니다.`,
        tags: parsedTags,
      },
      curation_summary: {
        headline: cleanHeadline,
        curation_intro: `${safeYear}년도 ${university.trim()} ${department.trim()} 공식 졸업전시 아카이브입니다.`,
        inferred_industry_keywords: parsedTags,
      },
      artworks: (artworks || []).map((a: any) => ({
        title: a.title || a.project_title || "출품작",
        student_name: a.author || a.student_name || `${university.trim()} 작가`,
        inferred_role: a.role || a.inferred_role || "크리에이터",
        image: (a.imagePath || a.image || a.screenshot_path || a.thumbnail || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/^public\//, ""),
        description: a.description || "",
      })),
    };

    // 최상단에 신규 추가
    queueList.unshift(newQueueItem);
    fs.writeFileSync(queueFile, JSON.stringify(queueList, null, 2), "utf-8");

    const cleanPosterPath = finalPosterPath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^public\//, "");
    const mappedFrontendArtworks = (artworks || []).map((a: any) => ({
      title: a.title || a.project_title || "출품작",
      author: a.author || a.student_name || `${university.trim()} 작가`,
      role: a.role || a.inferred_role || "크리에이터",
      imagePath: (a.imagePath || a.image || a.screenshot_path || a.thumbnail || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/^public\//, ""),
      description: a.description || "",
    }));

    const exhibitionFormat = {
      id: safeCardId,
      university: newQueueItem.university,
      department: newQueueItem.department,
      year: newQueueItem.year,
      category: newQueueItem.category,
      title: cleanTitle,
      isResearched: true,
      isUploaded: true,
      status: newQueueItem.status,
      targetUrl: finalUrl,
      posterPath: cleanPosterPath,
      headline: cleanHeadline,
      curationIntro: newQueueItem.curation_summary.curation_intro,
      period: cleanPeriod,
      schedule: cleanPeriod,
      venue: cleanVenue,
      slogan: cleanHeadline,
      subtitle: cleanHeadline,
      description: newQueueItem.raw_description,
      criticScore: 95,
      tags: parsedTags,
      artworks: mappedFrontendArtworks,
      works: mappedFrontendArtworks,
      instagramPublished: false,
      publishedAt: null,
    };

    return NextResponse.json({
      status: "SUCCESS",
      message: `[${university.trim()} ${department.trim()}] ${safeYear}년 졸업전시회 카드가 성공적으로 추가되었습니다.`,
      card: newQueueItem,
      exhibition: exhibitionFormat,
    });
  } catch (error: any) {
    console.error("[API /api/cards POST Error]:", error);
    return NextResponse.json({ status: "FAILED", error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ status: "FAILED", error: "배포 환경(Production)에서는 전시 카드 수정이 지원되지 않습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { cardId, university, department, slogan, category, tags, targetUrl, year } = body;

    if (!cardId) {
      return NextResponse.json({ status: "FAILED", error: "cardId는 필수 항목입니다." }, { status: 400 });
    }

    const queueFile = getQueueFilePath();
    if (!queueFile) {
      return NextResponse.json({ status: "FAILED", error: "university_queue.json 파일을 찾을 수 없습니다." }, { status: 500 });
    }

    const raw = fs.readFileSync(queueFile, "utf-8");
    const queueList = JSON.parse(raw);

    const idx = queueList.findIndex((item: any) => item.id === cardId);
    if (idx === -1) {
      return NextResponse.json({ status: "FAILED", error: `ID ${cardId}에 해당하는 카드를 찾을 수 없습니다.` }, { status: 404 });
    }

    const item = queueList[idx];

    if (university !== undefined) item.university = university.trim();
    if (department !== undefined) item.department = department.trim();
    if (year !== undefined) item.year = String(year).trim();
    if (category !== undefined) item.category = category.trim();
    const finalTargetUrl = targetUrl !== undefined ? targetUrl : body.target_url;
    if (finalTargetUrl !== undefined) {
      item.target_url = finalTargetUrl.trim();
      item.official_url = finalTargetUrl.trim();
      item.scraped_url = finalTargetUrl.trim();
    }

    if (slogan !== undefined) {
      item.slogan = slogan.trim();
      if (!item.card_news) item.card_news = {};
      item.card_news.card_headline = slogan.trim();
      if (!item.curation_summary) item.curation_summary = {};
      item.curation_summary.headline = slogan.trim();
    }

    if (tags !== undefined) {
      const parsedTags = Array.isArray(tags)
        ? tags.map((t: string) => t.trim()).filter(Boolean)
        : typeof tags === "string"
        ? tags.split(/[,#\s]+/).map((t: string) => t.trim()).filter(Boolean)
        : [];

      item.tags = parsedTags;
      if (!item.card_news) item.card_news = {};
      item.card_news.tags = parsedTags;
      if (!item.curation_summary) item.curation_summary = {};
      item.curation_summary.inferred_industry_keywords = parsedTags;
    }

    if (university || department) {
      const u = item.university || "";
      const d = item.department || "";
      const y = item.year || "2025";
      item.exhibit_title = `[${u}] ${y} ${d} 졸업전시회`;
    }

    fs.writeFileSync(queueFile, JSON.stringify(queueList, null, 2), "utf-8");

    return NextResponse.json({
      status: "SUCCESS",
      message: "전시 카드 정보가 성공적으로 수정되었습니다.",
      card: item,
    });
  } catch (error: any) {
    console.error("[API /api/cards PATCH Error]:", error);
    return NextResponse.json({ status: "FAILED", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ status: "FAILED", error: "배포 환경(Production)에서는 전시 카드 삭제가 지원되지 않습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json({ status: "FAILED", error: "cardId는 필수 항목입니다." }, { status: 400 });
    }

    const queueFile = getQueueFilePath();
    if (!queueFile) {
      return NextResponse.json({ status: "FAILED", error: "university_queue.json 파일을 찾을 수 없습니다." }, { status: 500 });
    }

    const raw = fs.readFileSync(queueFile, "utf-8");
    let queueList = JSON.parse(raw);

    const prevLength = queueList.length;
    queueList = queueList.filter((item: any) => item.id !== cardId);

    if (queueList.length === prevLength) {
      return NextResponse.json({ status: "FAILED", error: `ID ${cardId}에 해당하는 카드를 찾을 수 없습니다.` }, { status: 404 });
    }

    fs.writeFileSync(queueFile, JSON.stringify(queueList, null, 2), "utf-8");

    // Remove public/captures/{cardId} and public/uploads/{cardId} if exist
    const possiblePublicDirs = [
      path.resolve(process.cwd(), "public"),
      path.resolve(process.cwd(), "my-exhibit-platform", "public"),
      path.resolve("c:\\Users\\graduation_exhibit_workflow\\my-exhibit-platform\\public"),
    ];

    for (const pubDir of possiblePublicDirs) {
      for (const sub of ["captures", "uploads"]) {
        const targetDir = path.join(pubDir, sub, cardId);
        try {
          if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
          }
        } catch (rmErr) {
          console.warn(`[DELETE /api/cards] 디렉토리 삭제 경고 (${targetDir}):`, rmErr);
        }
      }
    }

    return NextResponse.json({
      status: "SUCCESS",
      message: `카드 ${cardId}가 성공적으로 영구 삭제되었습니다.`,
      deletedCardId: cardId,
    });
  } catch (error: any) {
    console.error("[API /api/cards DELETE Error]:", error);
    return NextResponse.json({ status: "FAILED", error: error.message }, { status: 500 });
  }
}
