import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const exhibitionId = (formData.get("exhibitionId") as string) || (formData.get("cardId") as string) || "TEMP";

    if (!file) {
      return NextResponse.json({ success: false, error: "업로드할 파일이 없습니다." }, { status: 400 });
    }

    const safeId = exhibitionId.replace(/[^a-zA-Z0-9_-]/g, "_");

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
    let ext = path.extname(file.name).toLowerCase();
    if (!ext || ext === ".") {
      if (file.type.includes("jpeg") || file.type.includes("jpg")) ext = ".jpg";
      else if (file.type.includes("png")) ext = ".png";
      else if (file.type.includes("webp")) ext = ".webp";
      else ext = ".png";
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `upload_${Date.now()}_${randomSuffix}${ext}`;
    const filePath = path.join(targetUploadDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const relativePath = `uploads/${safeId}/${fileName}`;
    const url = `/api/images/${relativePath}`;

    return NextResponse.json({
      success: true,
      url,
      relativePath,
      fileName,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "파일 업로드 실패" }, { status: 500 });
  }
}
