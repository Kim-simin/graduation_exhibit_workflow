import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { status: "FAILED", error: "배포 환경(Production)에서는 수동 캡처 리서치 기능이 지원되지 않습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { card_id, target_url, univ, dept, year, category } = body;

    if (!target_url) {
      return NextResponse.json({ error: "타겟 URL이 필요합니다." }, { status: 400 });
    }

    const rootDir = path.resolve(process.cwd(), "..");
    const scriptPath = path.join(rootDir, "scripts", "manual_capture.py");
    const outBase = path.join(process.cwd(), "public", "captures", card_id || "TEMP");
    fs.mkdirSync(outBase, { recursive: true });

    const pythonExe = process.platform === "win32" ? "py" : "python3";
    const args = process.platform === "win32"
      ? [
          "-3.11",
          scriptPath,
          "--url", target_url,
          "--cardId", card_id || "TEMP",
          "--univ", univ || "",
          "--dept", dept || "",
          "--outDir", outBase,
        ]
      : [
          scriptPath,
          "--url", target_url,
          "--cardId", card_id || "TEMP",
          "--univ", univ || "",
          "--dept", dept || "",
          "--outDir", outBase,
        ];

    const result = await new Promise<any>((resolve, reject) => {
      let stdout = "";
      let stderr = "";

      const proc = spawn(pythonExe, args, { cwd: rootDir });
      proc.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      proc.on("close", (code) => {
        try {
          const match = stdout.match(/\{[\s\S]*\}/);
          if (match) {
            return resolve(JSON.parse(match[0]));
          }
          resolve({ status: "FAILED", error: "JSON 파싱 실패", raw: stdout });
        } catch (e) {
          resolve({ status: "FAILED", error: String(e), raw: stdout });
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });
    });

    return NextResponse.json({ status: "SUCCESS", capture_data: result });
  } catch (err: any) {
    console.error("[Manual Capture API Error]:", err);
    return NextResponse.json({ status: "FAILED", error: err.message }, { status: 500 });
  }
}
