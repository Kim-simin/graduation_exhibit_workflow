import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const requestedPath = params.path.join("/");
    
    // 1. 보안 검증: 디렉터리 순회(..) 방지
    if (requestedPath.includes("..")) {
      return new NextResponse("Invalid image path", { status: 400 });
    }

    // 2. data/downloads 및 public/captures 경로 매핑 (루트 기준 및 상대경로 검사)
    const possibleBases = [
      path.resolve(process.cwd(), "public"),
      path.resolve(process.cwd(), "..", "my-exhibit-platform", "public"),
      path.resolve(process.cwd(), "..", "data", "downloads"),
      path.resolve(process.cwd(), "data", "downloads"),
      path.resolve(process.cwd(), "..", "data"),
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
      console.warn(`[ImageServer] File not found for: ${requestedPath}`);
      return new NextResponse("Image Not Found", { status: 404 });
    }

    // 3. MIME 타입 결정
    const ext = path.extname(targetFile).toLowerCase();
    let contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";

    // 4. 바이너리 버퍼 스트리밍 응답
    const fileBuffer = fs.readFileSync(targetFile);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error: any) {
    console.error("[ImageServer] Internal Error:", error);
    return new NextResponse("Error serving image", { status: 500 });
  }
}
