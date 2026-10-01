import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { status: "FAILED", error: "배포 환경(Production)에서는 비전 텍스트 추출 기능이 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { image_path, image_base64, card_id, api_key, engine = "gemini", server_url = "http://127.0.0.1:8080" } = body;

    const targetCardId = card_id || `CROP-${Date.now().toString().slice(-4)}`;
    const rootDir = path.resolve(process.cwd(), "..");
    const capturesDir = path.join(process.cwd(), "public", "captures", targetCardId);
    fs.mkdirSync(capturesDir, { recursive: true });

    // Gemini API 키가 전달되면 .env에 자동 저장하여 지속성 확보
    if (engine === "gemini" && api_key && typeof api_key === "string" && api_key.trim().length > 10) {
      try {
        const envPath = path.join(rootDir, ".env");
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, "utf-8");
          if (envContent.includes("GEMINI_API_KEY=")) {
            envContent = envContent.replace(/GEMINI_API_KEY=.*(\r?\n|$)/, `GEMINI_API_KEY=${api_key.trim()}\n`);
          } else {
            envContent += `\nGEMINI_API_KEY=${api_key.trim()}\n`;
          }
          fs.writeFileSync(envPath, envContent, "utf-8");
        }
      } catch (envErr) {
        console.warn("[Vision API] .env 저장 경고:", envErr);
      }
    }

    let finalImagePath = "";

    // 1. Base64 이미지인 경우 디스크에 저장
    if (image_base64) {
      const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `input_vision_${Date.now()}.png`;
      finalImagePath = path.join(capturesDir, filename);
      fs.writeFileSync(finalImagePath, buffer);
    } else if (image_path) {
      // 2. 상대 경로(/captures/...) 또는 절대 경로 처리
      if (image_path.startsWith("/captures/")) {
        finalImagePath = path.join(process.cwd(), "public", image_path);
      } else if (path.isAbsolute(image_path)) {
        finalImagePath = image_path;
      } else {
        finalImagePath = path.join(process.cwd(), image_path);
      }
    }

    if (!finalImagePath || !fs.existsSync(finalImagePath)) {
      return NextResponse.json(
        { status: "FAILED", error: "유효한 스크린샷 이미지 경로 또는 Base64 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    const isLocalEngine = engine === "local";
    const scriptName = isLocalEngine ? "local_vision_extractor.py" : "vision_extractor.py";
    const scriptPath = path.join(rootDir, "scripts", scriptName);
    const pythonExe = process.platform === "win32" ? "py" : "python3";

    let scriptArgs: string[] = [];
    if (process.platform === "win32") {
      scriptArgs.push("-3.11");
    }
    scriptArgs.push(
      scriptPath,
      "--image", finalImagePath,
      "--cardId", targetCardId,
      "--outDir", path.join(process.cwd(), "public", "captures")
    );

    if (isLocalEngine) {
      scriptArgs.push("--serverUrl", server_url || "http://127.0.0.1:8080");
    } else {
      if (api_key) {
        scriptArgs.push("--apiKey", api_key);
      }
    }

    const result = await new Promise<any>((resolve, reject) => {
      let stdout = "";
      let stderr = "";

      const proc = spawn(pythonExe, scriptArgs, { cwd: rootDir });
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
          resolve({
            status: "FAILED",
            error: stderr.trim() || "스크립트 실행 중 파싱 가능한 JSON 응답이 반환되지 않았습니다.",
            raw: stdout,
            stderr
          });
        } catch (e) {
          resolve({
            status: "FAILED",
            error: String(e),
            raw: stdout,
            stderr
          });
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Vision Extract API Error]:", err);
    return NextResponse.json({ status: "FAILED", error: err.message }, { status: 500 });
  }
}
