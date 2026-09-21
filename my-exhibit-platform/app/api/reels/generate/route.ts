import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

function getPythonExecutable(projectRoot: string): { cmd: string; argsPrefix: string[] } {
  const isWin = process.platform === "win32";
  const candidates = isWin
    ? [
        path.join(projectRoot, ".venv", "Scripts", "python.exe"),
        path.join(projectRoot, "venv", "Scripts", "python.exe"),
        path.join(projectRoot, "..", ".venv", "Scripts", "python.exe"),
        path.join(projectRoot, "..", "venv", "Scripts", "python.exe"),
        "C:\\Users\\USER\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
      ]
    : [
        path.join(projectRoot, ".venv", "bin", "python"),
        path.join(projectRoot, "venv", "bin", "python"),
        path.join(projectRoot, "..", ".venv", "bin", "python"),
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { cmd: candidate, argsPrefix: [] };
    }
  }

  if (isWin) {
    return { cmd: "py", argsPrefix: ["-3.11"] };
  }

  return { cmd: "python3", argsPrefix: [] };
}

function resolvePosterPath(inputPath: string): string | null {
  if (!inputPath) return null;

  let clean = inputPath.replace(/^\/api\/images\//, "").replace(/^\/+/, "");

  if (fs.existsSync(clean) && fs.statSync(clean).isFile()) {
    return path.resolve(clean);
  }

  const bases = [
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "public", "captures"),
    path.resolve(process.cwd(), "..", "my-exhibit-platform", "public"),
    path.resolve(process.cwd(), "..", "data", "downloads"),
    path.resolve(process.cwd(), "data", "downloads"),
    path.resolve(process.cwd(), "..", "data"),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd()),
    "c:/Users/graduation_exhibit_workflow",
  ];

  for (const base of bases) {
    const candidate = path.resolve(base, clean);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "배포 환경(Production)에서는 인스타그램 릴스 비디오 생성 기능이 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { cardId, posterPath, university, department, title, duration = 5 } = body;

    if (!posterPath) {
      return NextResponse.json({ error: "posterPath가 누락되었습니다." }, { status: 400 });
    }

    const resolvedPoster = resolvePosterPath(posterPath);

    if (!resolvedPoster || !fs.existsSync(resolvedPoster)) {
      console.error(`[Reels API] Poster file not found: ${posterPath} (resolved: ${resolvedPoster})`);
      return NextResponse.json({ error: `포스터 파일을 찾을 수 없습니다: ${posterPath}` }, { status: 404 });
    }

    const outputDirRel = path.join("public", "captures", cardId || "temp");
    const outputDirAbs = path.join(process.cwd(), outputDirRel);
    if (!fs.existsSync(outputDirAbs)) {
      fs.mkdirSync(outputDirAbs, { recursive: true });
    }

    const outputFileName = `reels_${Date.now()}.mp4`;
    const outputPathAbs = path.join(outputDirAbs, outputFileName);

    const scriptCandidates = [
      path.join(process.cwd(), "scripts", "generate_reels_motion.py"),
      path.resolve(process.cwd(), "..", "scripts", "generate_reels_motion.py"),
      "c:\\Users\\graduation_exhibit_workflow\\scripts\\generate_reels_motion.py",
    ];

    let scriptPath = "";
    for (const sc of scriptCandidates) {
      if (fs.existsSync(sc)) {
        scriptPath = sc;
        break;
      }
    }

    if (!scriptPath) {
      return NextResponse.json({ error: "generate_reels_motion.py 스크립트를 찾을 수 없습니다." }, { status: 500 });
    }

    const py = getPythonExecutable(process.cwd());
    const fullArgs = [
      ...py.argsPrefix,
      scriptPath,
      "--poster", resolvedPoster,
      "--output", outputPathAbs,
      "--univ", university || "",
      "--dept", department || "",
      "--title", title || "",
      "--duration", String(duration || 5),
    ];

    console.log(`[Reels API] Running: ${py.cmd} ${fullArgs.join(" ")}`);

    const pyProcess = spawn(py.cmd, fullArgs, {
      cwd: path.resolve(process.cwd(), ".."),
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    pyProcess.stdout.on("data", (d) => { stdout += d.toString(); });
    pyProcess.stderr.on("data", (d) => { stderr += d.toString(); });

    const exitCode = await new Promise((resolve) => {
      pyProcess.on("close", resolve);
    });

    if (exitCode !== 0) {
      console.error("[Reels Render Error]", stderr || stdout);
      return NextResponse.json({ error: `모션 비디오 생성 실패: ${stderr || stdout}` }, { status: 500 });
    }

    console.log(`[Reels API] Render success: ${outputPathAbs}`);
    const clientVideoUrl = `/captures/${cardId || "temp"}/${outputFileName}`;

    return NextResponse.json({
      success: true,
      videoUrl: clientVideoUrl,
    });
  } catch (error: any) {
    console.error("[Reels API Internal Error]", error);
    return NextResponse.json({ error: error.message || "서버 에러가 발생했습니다." }, { status: 500 });
  }
}
