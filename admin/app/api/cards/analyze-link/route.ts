import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { status: "FAILED", error: "배포 환경(Production)에서는 로컬 LLM 분석 기능이 지원되지 않습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { url, year = "2026", server_url = "http://127.0.0.1:8080" } = body;

    if (!url || typeof url !== "string" || url.trim().length < 4) {
      return NextResponse.json(
        { status: "FAILED", error: "유효한 졸업전시회 링크(URL)를 입력해 주세요." },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();
    const rootDir = path.resolve(process.cwd(), "..");
    const scriptPath = path.join(rootDir, "scripts", "local_link_analyzer.py");
    const pythonExe = process.platform === "win32" ? "py" : "python3";

    let args = process.platform === "win32"
      ? ["-3.11", scriptPath, "--url", cleanUrl, "--year", String(year), "--serverUrl", server_url]
      : [scriptPath, "--url", cleanUrl, "--year", String(year), "--serverUrl", server_url];

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
            const parsed = JSON.parse(match[0]);
            resolve(parsed);
          } else {
            resolve({
              status: "FAILED",
              error: "분석 엔진 응답 파싱 실패",
              raw: stdout || stderr,
            });
          }
        } catch (e: any) {
          resolve({
            status: "FAILED",
            error: e.message,
            raw: stdout || stderr,
          });
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });
    });

    if (result.status === "SUCCESS") {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { status: "FAILED", error: result.error || "로컬 LLM 링크 분석에 실패했습니다." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API /api/cards/analyze-link Error]:", error);
    return NextResponse.json(
      { status: "FAILED", error: error.message || "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
