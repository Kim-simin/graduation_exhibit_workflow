import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

const ROOT_DIR = path.resolve(process.cwd(), "..");
const TASKS_DIR = path.join(ROOT_DIR, "temp", "insta_tasks");
const COOLDOWN_FILE = path.join(ROOT_DIR, "temp", "insta_cooldown.json");

// 1. 파이썬 인터프리터 경로 자동 탐색 (가상환경 및 Python 3.11 우선)
function getPythonCommand(projectRoot: string): { cmd: string; argsPrefix: string[] } {
  const isWin = process.platform === "win32";

  const venvCandidates = isWin
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

  for (const candidate of venvCandidates) {
    if (fs.existsSync(candidate)) {
      return { cmd: candidate, argsPrefix: [] };
    }
  }

  if (isWin) {
    return { cmd: "py", argsPrefix: ["-3.11"] };
  }

  return { cmd: "python3", argsPrefix: [] };
}

function getCooldownInfo() {
  try {
    if (fs.existsSync(COOLDOWN_FILE)) {
      const raw = fs.readFileSync(COOLDOWN_FILE, "utf-8");
      const data = JSON.parse(raw);
      const now = Date.now() / 1000;
      const expires = data.expiresAtTimestamp || 0;
      if (expires > now) {
        return {
          cooldownActive: true,
          remainingSeconds: Math.ceil(expires - now),
          lastPublishedAt: data.lastPublishedAt || null,
        };
      }
    }
  } catch (e) {
    console.error("[Instagram Route] Cooldown read error:", e);
  }
  return { cooldownActive: false, remainingSeconds: 0, lastPublishedAt: null };
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ cooldownActive: false, remainingSeconds: 0, lastPublishedAt: null });
  }
  const info = getCooldownInfo();
  return NextResponse.json(info);
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "배포 환경(Production)에서는 SNS 자동 발행 기능이 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      cardId,
      university = "대학교",
      department = "학과",
      year = "2025",
      caption = "",
      slides = [],
    } = body;

    // 1. 쿨다운 체크
    const cooldown = getCooldownInfo();
    if (cooldown.cooldownActive) {
      return NextResponse.json(
        {
          success: false,
          error: `연속 발행 방지 쿨다운이 진행 중입니다 (${cooldown.remainingSeconds}초 남음). 잠시 후 다시 시도해주세요.`,
          remainingSeconds: cooldown.remainingSeconds,
        },
        { status: 429 }
      );
    }

    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "업로드할 이미지가 지정되지 않았습니다." },
        { status: 400 }
      );
    }

    // 2. 비동기 작업 디렉터리 및 파일 생성
    if (!fs.existsSync(TASKS_DIR)) {
      fs.mkdirSync(TASKS_DIR, { recursive: true });
    }
    const jobId = `insta_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const taskFilePath = path.join(TASKS_DIR, `${jobId}.json`);
    const statusFilePath = path.join(TASKS_DIR, `${jobId}_status.json`);
    const logFilePath = path.join(TASKS_DIR, `${jobId}.log`);

    const taskPayload = {
      jobId,
      cardId,
      university,
      department,
      year,
      caption,
      slides,
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(taskFilePath, JSON.stringify(taskPayload, null, 2), "utf-8");

    const initialStatus = {
      jobId,
      status: "queued",
      step: 0,
      totalSteps: 5,
      progress: 5,
      message: "작업이 비동기 큐에 등록되었습니다. 백그라운드 워커 구동 중...",
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(statusFilePath, JSON.stringify(initialStatus, null, 2), "utf-8");

    // 3. 백그라운드 파이썬 워커 구동 (실시간 stdout/stderr 캡처 및 에러 침묵 차단)
    const scriptPath = path.join(ROOT_DIR, "scripts", "human_insta_uploader.py");
    const py = getPythonCommand(ROOT_DIR);
    const fullArgs = [...py.argsPrefix, scriptPath, "--task-file", taskFilePath];

    console.log(`[Instagram API] Spawning background worker: ${py.cmd} ${fullArgs.join(" ")}`);

    const child = spawn(py.cmd, fullArgs, {
      cwd: ROOT_DIR,
      detached: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: false,
    });

    let stdoutBuffer = "";
    let stderrBuffer = "";

    const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdoutBuffer += text;
      logStream.write(chunk);
      console.log(`[Worker ${jobId} stdout]:`, text.trim());
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderrBuffer += text;
      logStream.write(chunk);
      console.error(`[Worker ${jobId} stderr]:`, text.trim());
    });

    child.on("error", (err) => {
      console.error(`[Worker ${jobId} Spawn Error]:`, err);
      const errMsg = `파이썬 프로세스 실행 실패: ${err.message}`;
      const errPayload = {
        jobId,
        status: "error",
        step: 0,
        totalSteps: 5,
        progress: 5,
        message: errMsg,
        updatedAt: new Date().toISOString(),
      };
      try {
        fs.writeFileSync(statusFilePath, JSON.stringify(errPayload, null, 2), "utf-8");
      } catch (e) {}
    });

    child.on("close", (code) => {
      logStream.end();
      console.log(`[Worker ${jobId}] exited with code: ${code}`);

      // 만약 에러 코드로 종료되었는데 status.json이 error가 아닌 경우 즉시 에러 기록
      if (code !== 0) {
        try {
          let currentStatus: any = {};
          if (fs.existsSync(statusFilePath)) {
            currentStatus = JSON.parse(fs.readFileSync(statusFilePath, "utf-8"));
          }
          if (currentStatus.status !== "completed" && currentStatus.status !== "error") {
            const cleanErr = (stderrBuffer || stdoutBuffer || `프로세스 비정상 종료 (코드: ${code})`).slice(-400);
            const errPayload = {
              jobId,
              status: "error",
              step: currentStatus.step || 0,
              totalSteps: 5,
              progress: 0,
              message: `파이썬 에러: ${cleanErr}`,
              updatedAt: new Date().toISOString(),
            };
            fs.writeFileSync(statusFilePath, JSON.stringify(errPayload, null, 2), "utf-8");
          }
        } catch (e) {
          console.error("Error writing failure status:", e);
        }
      }
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "인스타그램 자동 발행 작업이 백그라운드에서 시작되었습니다.",
    });
  } catch (error: any) {
    console.error("[Instagram API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
