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
    const {
      card_id,
      university,
      department,
      year = "2025",
      category = "디자인·UX/UI",
      exhibition_title,
      main_poster_base64,
      artworks = [],
    } = body;

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

    let mainPosterRelPath: string | null = null;
    if (main_poster_base64) {
      if (main_poster_base64.startsWith("data:image")) {
        const decoded = decodeBase64Image(main_poster_base64);
        const fileName = `main_poster.${decoded.extension}`;
        const filePath = path.join(targetUploadDir, fileName);
        fs.writeFileSync(filePath, decoded.data);
        mainPosterRelPath = `uploads/${safeCardId}/${fileName}`;
      } else {
        mainPosterRelPath = main_poster_base64;
      }
    }

    const savedArtworks = (artworks || []).map((art: any, index: number) => {
      let artRelPath = "";
      if (art.image_base64) {
        if (art.image_base64.startsWith("data:image")) {
          const decoded = decodeBase64Image(art.image_base64);
          const fileName = `artwork_${index + 1}_${Date.now()}.${decoded.extension}`;
          const filePath = path.join(targetUploadDir, fileName);
          fs.writeFileSync(filePath, decoded.data);
          artRelPath = `uploads/${safeCardId}/${fileName}`;
        } else {
          artRelPath = art.image_base64;
        }
      }

      return {
        title: art.title?.trim() || `출품작 #${index + 1}`,
        student_name: art.student_name?.trim() || `${university || "출품"} 작가`,
        image: artRelPath,
        description: art.description?.trim() || `${art.title || "출품작"} - ${art.student_name || university}`,
        inferred_role: art.role || `${department || "디자인"} 크리에이터`,
        detail_url: art.detail_url || "",
      };
    });

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
      return NextResponse.json(
        { error: "university_queue.json 파일을 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    const raw = fs.readFileSync(queueFile, "utf-8");
    const queueList = JSON.parse(raw);

    const targetIdx = queueList.findIndex((item: any) => {
      if (card_id && item.id === card_id) return true;
      if (university && department && item.university === university && item.department === department) return true;
      return false;
    });

    const cleanTitle = exhibition_title || `[${university}] ${year} ${department} 졸업전시회`;

    const updateData = {
      status: "수집 완료",
      poster_image: mainPosterRelPath,
      exhibition_title: cleanTitle,
      critic_score: 100,
      critic_feedback: "공식 포스터 및 학생 출품작 직접 검수/스크린샷 업로드 완료",
      curation_summary: {
        headline: cleanTitle,
        curation_intro: `${year}년도 ${university} ${department} 공식 졸업전시 아카이브입니다. 학생들의 직접 등록된 출품작과 창의적 비전을 확인하실 수 있습니다.`,
        inferred_industry_keywords: [
          category?.split("·")[0] || "디자인",
          department,
          `${year}졸전`,
        ],
      },
      artworks: savedArtworks,
    };

    if (targetIdx !== -1) {
      queueList[targetIdx] = {
        ...queueList[targetIdx],
        ...updateData,
      };
    } else {
      queueList.unshift({
        id: card_id || `DES-${Date.now().toString().slice(-4)}`,
        category: category || "디자인·UX/UI",
        university: university || "공식전시",
        department: department || "디자인",
        year: year || "2025",
        ...updateData,
      });
    }

    fs.writeFileSync(queueFile, JSON.stringify(queueList, null, 2), "utf-8");

    return NextResponse.json({
      status: "SUCCESS",
      message: "공식 포스터 및 학생 출품작이 성공적으로 저장되었습니다.",
      card_id: safeCardId,
      poster_path: mainPosterRelPath,
      artworks_count: savedArtworks.length,
    });
  } catch (err: any) {
    console.error("[DirectUpload API Error]:", err);
    return NextResponse.json(
      { status: "FAILED", error: err.message },
      { status: 500 }
    );
  }
}
