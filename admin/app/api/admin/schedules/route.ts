import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function writeAtomicJson(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp.${crypto.randomBytes(4).toString("hex")}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_) {}
  fs.renameSync(tempPath, filePath);
}

function syncDualFiles(relativePath: string, data: any) {
  const [rootTarget, platformTarget] = getRootAndPlatformPaths(relativePath);
  try {
    writeAtomicJson(rootTarget, data);
  } catch (err) {
    console.error(`Error writing to ${rootTarget}:`, err);
  }
  try {
    writeAtomicJson(platformTarget, data);
  } catch (err) {
    console.error(`Error writing to ${platformTarget}:`, err);
  }
}

function logSchedulerEvent(eventType: string, scheduleId: string, actorId = "admin", runId: string | null = null, details: any = {}) {
  const [rootAuditPath] = getRootAndPlatformPaths("data/logs/scheduler_audit_logs.json");
  const logs = readJsonFile(rootAuditPath) || [];
  const entry = {
    event_id: `sch-evt-${crypto.randomBytes(4).toString("hex")}`,
    event_type: eventType,
    schedule_id: scheduleId,
    actor_id: actorId,
    actor_role: "ADMIN",
    run_id: runId,
    timestamp: new Date().toISOString(),
    details,
  };
  logs.unshift(entry);
  syncDualFiles("data/logs/scheduler_audit_logs.json", logs.slice(0, 100));
}

// -----------------------------------------------------------------------------
// GET /api/admin/schedules (Zero LLM Calls)
// -----------------------------------------------------------------------------
export async function GET() {
  try {
    const [rootSchedPath, platformSchedPath] = getRootAndPlatformPaths("data/schedules.json");
    const [rootLockPath] = getRootAndPlatformPaths("data/.scheduler_lock.json");
    const [rootAuditPath] = getRootAndPlatformPaths("data/logs/scheduler_audit_logs.json");

    const schedules = readJsonFile(rootSchedPath) || readJsonFile(platformSchedPath) || [];
    const lockInfo = readJsonFile(rootLockPath);
    const auditLogs = readJsonFile(rootAuditPath) || [];

    // Current KST Time calculation
    const nowUtc = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(nowUtc.getTime() + kstOffset);
    const kstIso = kstDate.toISOString().replace("Z", "+09:00");

    return NextResponse.json({
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      kst_now: kstIso,
      schedules,
      is_locked: Boolean(lockInfo),
      lock_info: lockInfo,
      audit_logs: auditLogs.slice(0, 20),
    });
  } catch (error: any) {
    return NextResponse.json({ status: "ERROR", error: error.message }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// POST /api/admin/schedules (Create or Update Schedule, Zero LLM Calls)
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // 1. Role Verification (Section 19 & Test 16, 17)
    const adminRoleHeader = req.headers.get("x-admin-role");
    const authHeader = req.headers.get("authorization");
    const isAuthorizedAdmin =
      adminRoleHeader === "admin" ||
      (authHeader && authHeader.includes("Bearer") && authHeader.includes("admin"));

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin role required to create or modify schedules", status: 403 },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, cronExpression, scope, enabled = true } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Schedule name is required", status: 400 }, { status: 400 });
    }

    if (!cronExpression || typeof cronExpression !== "string") {
      return NextResponse.json({ error: "cronExpression is required", status: 400 }, { status: 400 });
    }

    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      return NextResponse.json(
        { error: `Invalid cronExpression: '${cronExpression}'. Must have exactly 5 parts.`, status: 400 },
        { status: 400 }
      );
    }

    const [rootSchedPath] = getRootAndPlatformPaths("data/schedules.json");
    const schedules: any[] = readJsonFile(rootSchedPath) || [];

    const nowIso = new Date().toISOString();
    const scheduleId = body.scheduleId || `sched-${crypto.randomBytes(4).toString("hex")}`;
    const isNew = !schedules.some((s) => s.scheduleId === scheduleId);

    const scheduleRecord = {
      scheduleId,
      name: name.trim(),
      workflowId: body.workflowId || "wf-intelligence-pipeline",
      enabled: Boolean(enabled),
      cronExpression: cronExpression.trim(),
      timezone: "Asia/Seoul",
      scope: scope || { target: "verified_universities", platform: "INSTAGRAM", content_type: "REELS", category: "디자인·UX/UI" },
      createdAt: body.createdAt || nowIso,
      updatedAt: nowIso,
      lastRunAt: body.lastRunAt || null,
      nextRunAt: body.nextRunAt || null,
      lastRunStatus: body.lastRunStatus || "NONE",
      maxAttempts: Number(body.maxAttempts) || 3,
      retryCount: Number(body.retryCount) || 0,
      nextRetryAt: body.nextRetryAt || null,
    };

    const existingIdx = schedules.findIndex((s) => s.scheduleId === scheduleId);
    if (existingIdx >= 0) {
      schedules[existingIdx] = scheduleRecord;
      logSchedulerEvent("SCHEDULE_UPDATED", scheduleId, "admin", null, scheduleRecord);
    } else {
      schedules.push(scheduleRecord);
      logSchedulerEvent("SCHEDULE_CREATED", scheduleId, "admin", null, scheduleRecord);
    }

    syncDualFiles("data/schedules.json", schedules);

    return NextResponse.json({
      status: "SUCCESS",
      schedule: scheduleRecord,
      action: isNew ? "CREATED" : "UPDATED",
    });
  } catch (error: any) {
    return NextResponse.json({ status: "ERROR", error: error.message }, { status: 500 });
  }
}
