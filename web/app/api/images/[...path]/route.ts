import { NextRequest, NextResponse } from "next/server";
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