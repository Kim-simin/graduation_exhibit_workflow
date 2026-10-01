import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

/**
 * POST /api/research/antigravity-intake
 * Triggers the Antigravity Universal Research Intelligence Engine
 * Automatically mines poster, student artworks, and verified faculty members.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      target_url,
      university = null,
      department = null,
      year = null,
      max_artworks = 40,
    } = body;

    if (!target_url) {
      return NextResponse.json(
        { status: "ERROR", error: "졸업전시회 웹사이트 링크(target_url)는 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const rootDir = path.resolve(process.cwd(), "..");
    const pythonExe = process.platform === "win32" ? "py" : "python3";
    const scriptPath = path.join(rootDir, "scripts", "antigravity_universal_intake.py");

    const args = [scriptPath, "--url", target_url, "--max-artworks", String(max_artworks)];
    if (university) args.push("--univ", university);
    if (department) args.push("--dept", department);
    if (year) args.push("--year", String(year));

    return new Promise<NextResponse>((resolve) => {
      const proc = spawn(pythonExe, args, { cwd: rootDir });
      let stdoutData = "";
      let stderrData = "";

      proc.stdout.on("data", (chunk) => {
        stdoutData += chunk.toString();
      });
      proc.stderr.on("data", (chunk) => {
        stderrData += chunk.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          // Parse JSON block from stdout if present
          let resultJson = null;
          const jsonMatch = stdoutData.match(/\{[\s\S]*"status":\s*"SUCCESS"[\s\S]*\}/);
          if (jsonMatch) {
            try {
              resultJson = JSON.parse(jsonMatch[0]);
            } catch (_) {}
          }

          resolve(
            NextResponse.json({
              status: "SUCCESS",
              message: "Antigravity 자율 리서치 및 아카이브/교수 카드 인제스트 완료",
              data: resultJson,
              stdout: stdoutData,
            })
          );
        } else {
          resolve(
            NextResponse.json(
              {
                status: "FAILED",
                error: stderrData || stdoutData || `Process exited with code ${code}`,
                stdout: stdoutData,
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

/**
 * GET /api/research/antigravity-intake
 * Returns the status of the latest Antigravity intake runs.
 */
export async function GET() {
  try {
    const rootDir = path.resolve(process.cwd(), "..");
    const logPath = path.join(rootDir, "data", "logs", "research_runs.json");

    let runs: any[] = [];
    if (fs.existsSync(logPath)) {
      try {
        runs = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      } catch (_) {
        runs = [];
      }
    }

    const antigravityRuns = runs.filter((r) =>
      r.research_run_id?.startsWith("run-antigravity")
    );

    return NextResponse.json({
      status: "SUCCESS",
      runs: antigravityRuns.slice(0, 10),
      latest_run: antigravityRuns[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
