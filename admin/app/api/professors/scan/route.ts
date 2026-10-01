import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Access denied in production" }, { status: 403 });
  }
  try {
    const rootDir = path.resolve(process.cwd(), "..");
    const logPath = path.join(rootDir, "data", "logs", "professor_runs.json");
    const profPath = path.join(rootDir, "data", "professors.json");

    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, "utf-8"));
    }

    let professors = [];
    if (fs.existsSync(profPath)) {
      professors = JSON.parse(fs.readFileSync(profPath, "utf-8"));
    }

    return NextResponse.json({
      status: "SUCCESS",
      total_professors: professors.length,
      latest_run: logs[0] || null,
      recent_runs: logs.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { status: "FAILED", error: "배포 환경(Production)에서는 교수진 스캔 기능이 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { mode = "mock", universities = [], departments = [] } = body;

    const rootDir = path.resolve(process.cwd(), "..");
    const pythonExe = process.platform === "win32" ? "py" : "python3";
    
    const args = ["-3.11", "-m", "professor_graph.runner", "--mode", mode];
    if (universities.length > 0) {
      args.push("--univs", ...universities);
    }
    if (departments.length > 0) {
      args.push("--depts", ...departments);
    }

    console.log(`[API /api/professors/scan] Triggering Professor Intelligence Graph (mode: ${mode})`);

    return new Promise<NextResponse>((resolve) => {
      let stdoutData = "";
      let stderrData = "";

      const proc = spawn(pythonExe, args, { cwd: rootDir });

      proc.stdout.on("data", (chunk) => {
        stdoutData += chunk.toString();
      });

      proc.stderr.on("data", (chunk) => {
        stderrData += chunk.toString();
      });

      proc.on("close", (code) => {
        console.log(`[API /api/professors/scan] Process exited with code ${code}`);
        if (code === 0) {
          const logPath = path.join(rootDir, "data", "logs", "professor_runs.json");
          let latestRun = null;
          if (fs.existsSync(logPath)) {
            const logs = JSON.parse(fs.readFileSync(logPath, "utf-8"));
            latestRun = logs[0] || null;
          }

          resolve(
            NextResponse.json({
              status: "SUCCESS",
              exitCode: code,
              output: stdoutData,
              latest_run: latestRun,
            })
          );
        } else {
          resolve(
            NextResponse.json(
              {
                status: "FAILED",
                exitCode: code,
                error: stderrData || stdoutData,
              },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
