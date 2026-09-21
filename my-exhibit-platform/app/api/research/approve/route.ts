import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

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
  try {
    const body = await req.json();
    const { card_id, university, department, year, category, exhibition_title, target_url, main_poster, works } = body;

    const safeCardId = (card_id || `DES-${Date.now().toString().slice(-4)}`).replace(/[^a-zA-Z0-9_-]/g, "_");

    const possiblePublicDirs = [
      path.resolve(process.cwd(), "public"),
      path.resolve(process.cwd(), "my-exhibit-platform", "public"),
      path.resolve(process.cwd(), "..", "my-exhibit-platform", "public"),
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
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const targetUploadDir = path.join(publicDir, "uploads", safeCardId);
    fs.mkdirSync(targetUploadDir, { recursive: true });

    let finalMainPoster = main_poster;
    if (main_poster && main_poster.startsWith("data:image")) {
      const decoded = decodeBase64Image(main_poster);
      const fileName = `main_poster_${Date.now()}.${decoded.extension}`;
      const filePath = path.join(targetUploadDir, fileName);
      fs.writeFileSync(filePath, decoded.data);
      finalMainPoster = `uploads/${safeCardId}/${fileName}`;
    }

    const queuePaths = [
      path.resolve(process.cwd(), "..", "data", "university_queue.json"),
      path.resolve(process.cwd(), "data", "university_queue.json"),
      path.resolve("c:\\Users\\graduation_exhibit_workflow\\data\\university_queue.json"),
    ];

    let queueFile = "";
    for (const qp of queuePaths) {
      if (fs.existsSync(qp)) {
        queueFile = qp;
        break;
      }
    }

    if (!queueFile) {
      return NextResponse.json({ error: "university_queue.json 파일을 찾을 수 없습니다." }, { status: 500 });
    }

    const raw = fs.readFileSync(queueFile, "utf-8");
    const queueList = JSON.parse(raw);

    const targetIdx = queueList.findIndex((item: any) => {
      if (card_id && item.id === card_id) return true;
      if (university && department && item.university === university && item.department === department) return true;
      return false;
    });

    const cleanTitle = exhibition_title || `[${university}] ${year || "2026"} ${department} 졸업전시회`;

    const mappedArtworks = (works || []).map((w: any, idx: number) => {
      let imgPath = w.screenshot_path || w.thumbnail || w.image_url || w.image || "";
      if (imgPath && imgPath.startsWith("data:image")) {
        const decoded = decodeBase64Image(imgPath);
        const fileName = `work_${idx + 1}_${Date.now()}.${decoded.extension}`;
        const filePath = path.join(targetUploadDir, fileName);
        fs.writeFileSync(filePath, decoded.data);
        imgPath = `uploads/${safeCardId}/${fileName}`;
      }

      const artworkTitle = (w.project_title || w.title || `출품작 #${idx + 1}`).trim();
      const authorName = (w.author || w.student_name || `${university || "학생"} 작가`).trim();

      return {
        title: artworkTitle,
        student_name: authorName,
        image: imgPath,
        thumbnail: imgPath,
        screenshot_path: imgPath,
        description: (w.raw_text || `${artworkTitle} - ${authorName}`).trim(),
        inferred_role: `${department || "디자인"} 크리에이터`,
        detail_url: w.detail_url || target_url || "",
      };
    });

    const updateData = {
      status: "리서치 완료",
      isUploaded: true,
      isResearched: true,
      poster_image: finalMainPoster,
      exhibition_title: cleanTitle,
      exhibit_title: cleanTitle,
      title: cleanTitle,
      target_url: target_url,
      official_url: target_url,
      scraped_url: target_url,
      critic_score: 100,
      critic_feedback: "관리자 검수 및 실시간 카드 편집 승인 완료",
      curation_summary: {
        headline: cleanTitle,
        curation_intro: `${year || "2026"}년도 ${university} ${department} 공식 졸업전시 아카이브입니다. 학생들의 정밀 캡처된 출품작과 창의적 비전을 확인하실 수 있습니다.`,
        inferred_industry_keywords: [category?.split("·")[0] || "디자인", department, `${year || "2026"}졸전`],
      },
      artworks: mappedArtworks,
    };

    if (targetIdx !== -1) {
      queueList[targetIdx] = { ...queueList[targetIdx], ...updateData };
    } else {
      queueList.unshift({
        id: card_id || `DES-${Date.now().toString().slice(-2)}`,
        category: category || "디자인·UX/UI",
        university: university || "공식전시",
        department: department || "디자인",
        year: year || "2026",
        ...updateData,
      });
    }

    fs.writeFileSync(queueFile, JSON.stringify(queueList, null, 2), "utf-8");

    return NextResponse.json({
      status: "SUCCESS",
      message: "카드가 성공적으로 승인 및 업데이트되었습니다.",
      card_id: safeCardId,
      artworks_count: mappedArtworks.length
    });
  } catch (err: any) {
    console.error("[Approve API Error]:", err);
    return NextResponse.json({ status: "FAILED", error: err.message }, { status: 500 });
  }
}
