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

export async function POST(req: Request) {
  try {
    // 1. Role / Authority Verification (Section 6 & 19)
    const adminRoleHeader = req.headers.get("x-admin-role");
    const authHeader = req.headers.get("authorization");
    const isAuthorizedAdmin =
      adminRoleHeader === "admin" ||
      (authHeader && authHeader.includes("Bearer") && authHeader.includes("admin"));

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized: Admin privileges required for bulk approval",
          status: 403,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const contentIds: string[] = Array.isArray(body.content_ids) ? body.content_ids : [];
    const reviewer = body.reviewer || "admin_master";
    const action = String(body.action || "APPROVE").toUpperCase().trim();

    if (action !== "APPROVE") {
      return NextResponse.json(
        { error: "Only 'APPROVE' is currently supported for bulk action", status: 400 },
        { status: 400 }
      );
    }

    if (contentIds.length === 0) {
      return NextResponse.json(
        { error: "content_ids array cannot be empty", status: 400 },
        { status: 400 }
      );
    }

    // 2. Load Single Source of Truth DB files
    const [rootGenDbPath, platformGenDbPath] = getRootAndPlatformPaths("data/generated_contents.json");
    const [rootRuntimePath, platformRuntimePath] = getRootAndPlatformPaths("data/runtime_pipeline.json");
    const [rootAuditPath, platformAuditPath] = getRootAndPlatformPaths("data/logs/approval_audit_logs.json");

    let genDb = readJsonFile(rootGenDbPath) || readJsonFile(platformGenDbPath) || { contents: [] };
    let runtimeState = readJsonFile(rootRuntimePath) || readJsonFile(platformRuntimePath);
    let auditLogs = readJsonFile(rootAuditPath) || readJsonFile(platformAuditPath) || [];

    const nowIso = new Date().toISOString();
    const results: any[] = [];
    let approvedCount = 0;
    let skippedCount = 0;

    for (const cid of contentIds) {
      const contentIndex = genDb.contents?.findIndex((c: any) => c.content_id === cid);
      if (contentIndex === undefined || contentIndex < 0) {
        // Also check runtimeState
        if (
          runtimeState &&
          (runtimeState.status === "WAITING_FOR_APPROVAL" || runtimeState.approval_status === "WAITING_FOR_APPROVAL")
        ) {
          const approvalNode = runtimeState.nodes?.find((n: any) => n.id === "node-approval-gate");
          if (approvalNode?.target_content?.content_id === cid) {
            runtimeState.status = "APPROVED";
            runtimeState.approval_status = "APPROVED";
            runtimeState.completed_at = nowIso;
            if (approvalNode) approvalNode.status = "Completed";
            syncDualFiles("data/runtime_pipeline.json", runtimeState);

            approvedCount++;
            results.push({ content_id: cid, status: "APPROVED", detail: "Runtime in-flight item approved" });
            continue;
          }
        }

        results.push({ content_id: cid, status: "SKIPPED", reason: "Content ID not found in database" });
        skippedCount++;
        continue;
      }

      const item = genDb.contents[contentIndex];
      const currentStatus = item.status || item.approval_status;

      // Section 6 Hard Constraint: All items MUST be WAITING_FOR_APPROVAL
      if (currentStatus !== "WAITING_FOR_APPROVAL") {
        results.push({
          content_id: cid,
          status: "SKIPPED",
          reason: `Content already finalized as '${currentStatus}'`,
        });
        skippedCount++;
        continue;
      }

      // Update item
      item.status = "APPROVED";
      item.approval_status = "APPROVED";
      item.approved_by = reviewer;
      item.approved_at = nowIso;
      item.updated_at = nowIso;
      item.rejected_by = null;
      item.rejected_at = null;
      item.rejection_reason = null;

      // Record individual audit log
      const auditEntry = {
        log_id: `aud-${crypto.randomBytes(6).toString("hex")}`,
        event: "CONTENT_APPROVED",
        action: "APPROVE",
        content_id: cid,
        version: item.version || 1,
        actor: reviewer,
        run_id: item.run_id || runtimeState?.run_id || "bulk-ops",
        timestamp: nowIso,
        details: {
          title: item.title,
          platform: item.platform,
          content_type: item.content_type,
          bulk_action: true,
        },
      };
      auditLogs.push(auditEntry);

      // If matches active runtime, also update runtime
      if (
        runtimeState &&
        (runtimeState.current_run?.run_id === item.run_id ||
          runtimeState.workflow?.some((w: any) => w.target_content?.content_id === cid))
      ) {
        runtimeState.status = "APPROVED";
        runtimeState.approval_status = "APPROVED";
        runtimeState.completed_at = nowIso;
        const approvalNode = runtimeState.nodes?.find((n: any) => n.id === "node-approval-gate");
        if (approvalNode) approvalNode.status = "Completed";
      }

      approvedCount++;
      results.push({ content_id: cid, status: "APPROVED", version: item.version });
    }

    // Persist changes with atomic dual-sync
    if (approvedCount > 0) {
      genDb.last_updated = nowIso;
      syncDualFiles("data/generated_contents.json", genDb);
      syncDualFiles("data/logs/approval_audit_logs.json", auditLogs);
      if (runtimeState) {
        syncDualFiles("data/runtime_pipeline.json", runtimeState);
      }
    }

    return NextResponse.json({
      status: "SUCCESS",
      timestamp: nowIso,
      total_requested: contentIds.length,
      approved_count: approvedCount,
      skipped_count: skippedCount,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
