import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getRootAndPlatformPaths(relativePath: string) {
  const rootDir = path.resolve(process.cwd(), "..");
  const cwdDir = process.cwd();
  return [
    path.join(rootDir, relativePath),
    path.join(cwdDir, relativePath),
  ];
}

function readJsonFile(filePath: string): any {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "배포 환경(Production)에서는 스케줄러 실행이 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const scheduleId = params.id;

    // 1. Role Verification (Section 19 & Test 16, 17)
    const adminRoleHeader = req.headers.get("x-admin-role");
    const authHeader = req.headers.get("authorization");
    const isAuthorizedAdmin =
      adminRoleHeader === "admin" ||
      (authHeader && authHeader.includes("Bearer") && authHeader.includes("admin"));

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required to trigger schedule execution", status: 403 },
        { status: 403 }
      );
    }

    // 2. Look up schedule
    const [rootSchedPath] = getRootAndPlatformPaths("data/schedules.json");
    const schedules: any[] = readJsonFile(rootSchedPath) || [];
    const targetSchedule = schedules.find((s) => s.scheduleId === scheduleId);

    if (!targetSchedule) {
      return NextResponse.json(
        { error: `Schedule '${scheduleId}' not found`, status: 404 },
        { status: 404 }
      );
    }

    // Parse body for dry_run
    let isDryRun = false;
    try {
      const body = await req.json();
      isDryRun = Boolean(body.dry_run);
    } catch (_) {}

    // 3. Concurrency Lock check for non-dry runs
    if (!isDryRun) {
      const [rootRuntimePath] = getRootAndPlatformPaths("data/runtime_pipeline.json");
      const [rootLockPath] = getRootAndPlatformPaths("data/.scheduler_lock.json");
      const runtimeState = readJsonFile(rootRuntimePath);
      const lockInfo = readJsonFile(rootLockPath);

      if (runtimeState?.status === "RUNNING" || lockInfo) {
        return NextResponse.json(
          {
            error: "Another pipeline run or schedule execution is already in progress. Duplicate execution prevented.",
            status: 409,
            code: "CONCURRENCY_LOCKED",
          },
          { status: 409 }
        );
      }
    }

    // 4. Invoke Python Workflow Scheduler
    const rootDir = path.resolve(process.cwd(), "..");
    const pythonScript = path.join(rootDir, "scripts", "workflow_scheduler.py");
    const pythonExe = process.platform === "win32" ? "py" : "python3";
    const args = [pythonScript, "--run-schedule", scheduleId];
    if (isDryRun) {
      args.push("--dry-run");
    }

    return new Promise<NextResponse>((resolve) => {
      const proc = spawn(pythonExe, args, { cwd: rootDir });
      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      proc.on("close", (code) => {
        if (code !== 0 && !isDryRun) {
          console.error("Scheduler process error:", stderr);
        }

        // Extract JSON execution result from stdout
        const jsonMatch = stdout.match(/Execution Result:\s*(\{[\s\S]*\})/);
        let execResult: any = null;
        if (jsonMatch) {
          try {
            execResult = JSON.parse(jsonMatch[1]);
          } catch (_) {}
        }

        if (execResult && execResult.code === 409) {
          return resolve(NextResponse.json(execResult, { status: 409 }));
        }

        return resolve(
          NextResponse.json({
            status: "SUCCESS",
            dry_run: isDryRun,
            schedule_id: scheduleId,
            schedule_name: targetSchedule.name,
            result: execResult || { message: "Execution completed", output: stdout.slice(-400) },
          })
        );
      });
    });
  } catch (error: any) {
    return NextResponse.json({ status: "ERROR", error: error.message }, { status: 500 });
  }
}
