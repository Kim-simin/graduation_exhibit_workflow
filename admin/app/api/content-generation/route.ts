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
    const cwdPath = process.cwd();

    // Check both root and internal data directories
    const pathsToTry = [
      path.join(rootDir, "data", "generated_contents.json"),
      path.join(cwdPath, "data", "generated_contents.json"),
    ];

    let contents: any[] = [];
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(p, "utf-8"));
          const list = Array.isArray(parsed) ? parsed : (parsed.contents || []);
          if (Array.isArray(list) && list.length > 0) {
            contents = list;
            break;
          }
        } catch {
          // continue
        }
      }
    }

    const logPathsToTry = [
      path.join(rootDir, "data", "logs", "content_generation_runs.json"),
      path.join(cwdPath, "data", "logs", "content_generation_runs.json"),
    ];

    let logs: any[] = [];
    for (const lp of logPathsToTry) {
      if (fs.existsSync(lp)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(lp, "utf-8"));
          const list = Array.isArray(parsed) ? parsed : (parsed.runs || []);
          if (Array.isArray(list) && list.length > 0) {
            logs = list;
            break;
          }
        } catch {
          // continue
        }
      }
    }

    const platformStats = contents.reduce((acc: Record<string, number>, c: any) => {
      const p = c.platform || "unknown";
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});

    const statusStats = contents.reduce((acc: Record<string, number>, c: any) => {
      const s = c.status || "UNKNOWN";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      status: "SUCCESS",
      total_contents: contents.length,
      platform_breakdown: platformStats,
      status_breakdown: statusStats,
      contents,
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
      { status: "FAILED", error: "배포 환경(Production)에서는 콘텐츠 생성 러너가 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      platform = "instagram",
      content_type = "reels",
      objective = "",
      audience = "",
      dry_run = false,
    } = body;

    const rootDir = path.resolve(process.cwd(), "..");
    const pythonExe = process.platform === "win32" ? "py" : "python3";

    const args = ["-3.11", "-m", "generation_graph.runner", "--platform", platform, "--type", content_type];
    if (objective) {
      args.push("--objective", objective);
    }
    if (audience) {
      args.push("--audience", audience);
    }
    if (dry_run) {
      args.push("--dry-run");
    }

    console.log(`[API /api/content-generation] Triggering STEP 8 Generation Graph (Platform: ${platform}, Type: ${content_type})`);

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
        if (code === 0) {
          return resolve(
            NextResponse.json({
              status: "SUCCESS",
              message: "Content generation workflow completed successfully (Approval Gate reached).",
              stdout: stdoutData,
              exit_code: code,
            })
          );
        } else {
          return resolve(
            NextResponse.json(
              {
                status: "ERROR",
                message: `Generation process exited with code ${code}`,
                stdout: stdoutData,
                stderr: stderrData,
                exit_code: code,
              },
              { status: 500 }
            )
          );
        }
      });

      proc.on("error", (err) => {
        return resolve(
          NextResponse.json(
            {
              status: "ERROR",
              message: `Failed to spawn generation runner: ${err.message}`,
            },
            { status: 500 }
          )
        );
      });
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
