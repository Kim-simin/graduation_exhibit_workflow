import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ status: "ERROR", message: "Access denied in production" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const rootDir = path.resolve(process.cwd(), "..");
    const queueFilePath = path.join(
      rootDir,
      "data",
      "queues",
      "national_professor_queue.json"
    );

    if (!fs.existsSync(queueFilePath)) {
      // 큐가 없으면 파이썬 러너를 통해 status 호출하여 자동 초기화
      const pythonExe = process.platform === "win32" ? "py" : "python3";
      await new Promise<void>((resolve) => {
        const proc = spawn(
          pythonExe,
          ["-3.11", "-m", "professor_graph.national_runner", "--action", "status"],
          { cwd: rootDir }
        );
        proc.on("close", () => resolve());
      });
    }

    if (!fs.existsSync(queueFilePath)) {
      return NextResponse.json(
        { status: "ERROR", message: "Queue file could not be initialized." },
        { status: 500 }
      );
    }

    const queueData = JSON.parse(fs.readFileSync(queueFilePath, "utf-8"));
    const univQueue = queueData.university_queue || [];
    const totalItems = univQueue.length;
    const startIdx = (page - 1) * pageSize;
    const paginatedQueue = univQueue.slice(startIdx, startIdx + pageSize);

    return NextResponse.json({
      status: "SUCCESS",
      statistics: queueData.statistics || {
        total_universities: totalItems,
        completed: 0,
        in_progress: 0,
        failed: 0,
        new_professors: 0,
        updated_professors: 0,
        new_tasks: 0,
        new_collaborations: 0,
        progress_percentage: 0.0,
        last_collected_at: null,
        next_scheduled_at: null,
      },
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
      university_queue: paginatedQueue,
      failed_universities: queueData.failed_universities || [],
      failed_professors: queueData.failed_professors || [],
      last_updated: queueData.last_updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { status: "FAILED", error: "배포 환경(Production)에서는 교수진 큐 러너가 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      action = "batch",
      batchSize = 2,
      delay = 0.5,
      mode = "mock",
      universities = [],
    } = body;

    const rootDir = path.resolve(process.cwd(), "..");
    const pythonExe = process.platform === "win32" ? "py" : "python3";

    const args = [
      "-3.11",
      "-m",
      "professor_graph.national_runner",
      "--action",
      action,
      "--batch-size",
      String(batchSize),
      "--delay",
      String(delay),
      "--mode",
      mode,
    ];

    if (universities.length > 0) {
      args.push("--univs", ...universities);
    }

    console.log(
      `[API /api/professors/queue] Action: ${action} | BatchSize: ${batchSize} | Mode: ${mode}`
    );

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
        console.log(`[API /api/professors/queue] Process exited with code ${code}`);
        if (code === 0) {
          const queueFilePath = path.join(
            rootDir,
            "data",
            "queues",
            "national_professor_queue.json"
          );
          let queueData: any = {};
          if (fs.existsSync(queueFilePath)) {
            try {
              queueData = JSON.parse(fs.readFileSync(queueFilePath, "utf-8"));
            } catch (e) {}
          }

          resolve(
            NextResponse.json({
              status: "SUCCESS",
              action,
              exitCode: code,
              statistics: queueData.statistics || null,
              failed_universities: queueData.failed_universities || [],
              failed_professors: queueData.failed_professors || [],
            })
          );
        } else {
          resolve(
            NextResponse.json(
              {
                status: "FAILED",
                action,
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
