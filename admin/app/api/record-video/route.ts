import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

function getPythonBinary(projectRoot: string): string {
  const isWin = process.platform === "win32";
  const venvWin = path.join(projectRoot, ".venv", "Scripts", "python.exe");
  const venvUnix = path.join(projectRoot, ".venv", "bin", "python");

  if (isWin && fs.existsSync(venvWin)) return venvWin;
  if (!isWin && fs.existsSync(venvUnix)) return venvUnix;

  if (isWin) {
    const localAppData = process.env.LOCALAPPDATA || "";
    const py311 = path.join(localAppData, "Programs", "Python", "Python311", "python.exe");
    if (fs.existsSync(py311)) return py311;
    const py312 = path.join(localAppData, "Programs", "Python", "Python312", "python.exe");
    if (fs.existsSync(py312)) return py312;
    if (fs.existsSync("C:\\Windows\\py.exe")) return "C:\\Windows\\py.exe";
    return "python";
  }
  return "python3";
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "배포 환경(Production)에서는 비디오 캡처 레코딩 기능이 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const { url, duration = 6, format = "mp4" } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "유효한 웹페이지 URL을 입력해주세요." },
        { status: 400 }
      );
    }

    // http:// 또는 https:// 누락 시 자동 보정
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    const fileExt = format === "webm" ? "webm" : "mp4";
    const projectRoot = process.cwd();
    const filename = `motion_${Date.now()}.${fileExt}`;
    const outDirRel = path.join("public", "downloads", "videos");
    const outDirAbs = path.join(projectRoot, outDirRel);

    if (!fs.existsSync(outDirAbs)) {
      fs.mkdirSync(outDirAbs, { recursive: true });
    }

    const scriptPath = path.join(projectRoot, "scripts", "record_intro.py");
    const pythonBin = getPythonBinary(projectRoot);

    const pyProcess = spawn(pythonBin, [
      scriptPath,
      "--url", targetUrl,
      "--duration", String(duration),
      "--outdir", outDirRel,
      "--filename", filename,
    ]);

    let stdoutData = "";
    let stderrData = "";

    pyProcess.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    const exitCode = await new Promise((resolve) => {
      pyProcess.on("close", resolve);
    });

    if (exitCode !== 0) {
      console.error("[Record Process Failed]", stderrData);
      return NextResponse.json(
        { error: "동영상 녹화에 실패했습니다.", detail: stderrData },
        { status: 500 }
      );
    }

    // 스트리밍 다운로드 엔드포인트 URL 반환
    const downloadUrl = `/downloads/videos/${filename}`;
    return NextResponse.json({
      success: true,
      downloadUrl,
      filename,
      log: stdoutData.trim(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
