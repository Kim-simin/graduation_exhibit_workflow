import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let exhibitionId = "TEMP";

    if (contentType.includes("application/json")) {
      const json = await req.json();
      exhibitionId = json.exhibitionId || json.cardId || "TEMP";
      fileName = json.fileName || `upload_${Date.now()}.png`;
      if (json.imageUrl) {
        const remoteRes = await fetch(json.imageUrl);
        const arrayBuffer = await remoteRes.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      } else if (json.base64) {
        const raw = json.base64.includes(",") ? json.base64.split(",")[1] : json.base64;
        fileBuffer = Buffer.from(raw, "base64");
      }
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      exhibitionId = (formData.get("exhibitionId") as string) || (formData.get("cardId") as string) || "TEMP";

      if (!file) {
        return NextResponse.json({ success: false, error: "업로드할 파일이 없습니다." }, { status: 400 });
      }
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }

    if (!fileBuffer) {
      return NextResponse.json({ success: false, error: "업로드할 파일 내용이 없습니다." }, { status: 400 });
    }

    const safeId = exhibitionId.replace(/[\\/:*?"<>|]/g, "_");

    // public 디렉토리 경로 탐색
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

    const targetUploadDir = path.join(publicDir, "uploads", safeId);
    fs.mkdirSync(targetUploadDir, { recursive: true });

    // 파일 확장자 추출
    let ext = path.extname(fileName).toLowerCase();
    if (!ext || ext === ".") {
      ext = ".png";
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const savedFileName = fileName.includes("poster") ? fileName : `upload_${Date.now()}_${randomSuffix}${ext}`;
    const filePath = path.join(targetUploadDir, savedFileName);

    fs.writeFileSync(filePath, fileBuffer);

    const relativePath = `uploads/${safeId}/${savedFileName}`;
    const url = `/api/images/${relativePath}`;

    return NextResponse.json({
      success: true,
      url,
      relativePath,
      fileName,
      size: fileBuffer.length,
    });
  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "파일 업로드 실패" }, { status: 500 });
  }
}
