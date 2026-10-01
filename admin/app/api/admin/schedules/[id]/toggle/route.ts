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
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
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

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id;

    // 1. Role Verification
    const adminRoleHeader = req.headers.get("x-admin-role");
    const authHeader = req.headers.get("authorization");
    const isAuthorizedAdmin =
      adminRoleHeader === "admin" ||
      (authHeader && authHeader.includes("Bearer") && authHeader.includes("admin"));

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required to toggle schedule status", status: 403 },
        { status: 403 }
      );
    }

    const body = await req.json();
    const enabled = Boolean(body.enabled);

    const [rootSchedPath] = getRootAndPlatformPaths("data/schedules.json");
    const schedules: any[] = readJsonFile(rootSchedPath) || [];
    const targetIdx = schedules.findIndex((s) => s.scheduleId === scheduleId);

    if (targetIdx < 0) {
      return NextResponse.json(
        { error: `Schedule '${scheduleId}' not found`, status: 404 },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    schedules[targetIdx].enabled = enabled;
    schedules[targetIdx].updatedAt = nowIso;

    // Audit Logging
    const [rootAuditPath] = getRootAndPlatformPaths("data/logs/scheduler_audit_logs.json");
    const auditLogs: any[] = readJsonFile(rootAuditPath) || [];
    const eventType = enabled ? "SCHEDULE_ENABLED" : "SCHEDULE_DISABLED";
    auditLogs.unshift({
      event_id: `sch-evt-${crypto.randomBytes(4).toString("hex")}`,
      event_type: eventType,
      schedule_id: scheduleId,
      actor_id: "admin",
      actor_role: "ADMIN",
      run_id: null,
      timestamp: nowIso,
      details: { enabled, schedule_name: schedules[targetIdx].name },
    });

    syncDualFiles("data/schedules.json", schedules);
    syncDualFiles("data/logs/scheduler_audit_logs.json", auditLogs.slice(0, 100));

    return NextResponse.json({
      status: "SUCCESS",
      schedule_id: scheduleId,
      enabled,
      schedule: schedules[targetIdx],
    });
  } catch (error: any) {
    return NextResponse.json({ status: "ERROR", error: error.message }, { status: 500 });
  }
}
