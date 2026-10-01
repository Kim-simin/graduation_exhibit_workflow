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
    // 1. Role / Authority Verification (Requirement Section 13 & Test 7)
    const adminRoleHeader = req.headers.get("x-admin-role");
    const authHeader = req.headers.get("authorization");
    const isAuthorizedAdmin =
      adminRoleHeader === "admin" ||
      (authHeader && authHeader.includes("Bearer") && authHeader.includes("admin"));

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized: Admin privileges required to approve or reject content",
          status: 403,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actionRaw = body.action || "";
    const action = String(actionRaw).toUpperCase().trim();
    const runId = body.run_id;
    const contentId = body.content_id;
    const version = Number(body.version) || 1;
    const reviewer = body.reviewer || "admin_master";
    const rejectionReason = body.rejection_reason ? String(body.rejection_reason).trim() : null;

    // Validate Action
    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        {
          error: "Invalid action: Must be 'APPROVE' or 'REJECT'",
          status: 400,
        },
        { status: 400 }
      );
    }

    // 2. Mandatory Rejection Reason (Requirement Section 9 & Test 4)
    if (action === "REJECT" && (!rejectionReason || rejectionReason.length === 0)) {
      return NextResponse.json(
        {
          error: "rejection_reason is required and cannot be empty when rejecting content",
          status: 400,
        },
        { status: 400 }
      );
    }

    // 3. Load Current Pipeline State & Generated Content
    const [rootRuntimePath, platformRuntimePath] = getRootAndPlatformPaths("data/runtime_pipeline.json");
    const [rootGenDbPath, platformGenDbPath] = getRootAndPlatformPaths("data/generated_contents.json");

    let runtimeState = readJsonFile(rootRuntimePath) || readJsonFile(platformRuntimePath);
    let genDb = readJsonFile(rootGenDbPath) || readJsonFile(platformGenDbPath) || {
      contents: [],
      latest_content: null,
      last_updated: null,
    };

    if (!runtimeState) {
      return NextResponse.json(
        { error: "No active or recorded pipeline state found", status: 404 },
        { status: 404 }
      );
    }

    // 4. Duplicate Check / Optimistic Locking (Requirement Section 14 & Tests 5, 6)
    let targetContent: any = null;
    if (genDb && genDb.contents && Array.isArray(genDb.contents)) {
      const idx = genDb.contents.findIndex(
        (c: any) => (contentId ? c.content_id === contentId : c.version === version)
      );
      if (idx >= 0) {
        targetContent = { ...genDb.contents[idx] };
      } else if (genDb.contents.length > 0 && !contentId) {
        targetContent = { ...genDb.contents[0] };
      }
    }

    const isRuntimeRun = Boolean(runId && (runId === runtimeState.run_id || runtimeState.current_run?.run_id === runId));
    const currentStatus = isRuntimeRun
      ? (runtimeState.approval_status || runtimeState.nodes?.find((n: any) => n.id === "node-approval-gate")?.approval_status || runtimeState.status)
      : (targetContent ? (targetContent.status || targetContent.approval_status) : (runtimeState.approval_status || runtimeState.status));

    if (currentStatus === "APPROVED" || currentStatus === "REJECTED") {
      return NextResponse.json(
        {
          error: `Duplicate action: Content has already been finalized as '${currentStatus}'. Cannot perform '${action}'.`,
          current_status: currentStatus,
          status: 409,
        },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();
    const eventId = `aud-${crypto.randomBytes(6).toString("hex")}`;
    const approvalStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // 5. Update Generated Content in DB (Preserving Version History) (Tests 8, 9, 11)

    if (targetContent) {
      targetContent.status = approvalStatus;
      targetContent.approval_status = approvalStatus;
      targetContent.approval_required = true;
      targetContent.approval_version = version;
      targetContent.updated_at = nowIso;

      if (action === "APPROVE") {
        targetContent.approved_by = reviewer;
        targetContent.approved_at = nowIso;
        targetContent.rejected_by = null;
        targetContent.rejected_at = null;
        targetContent.rejection_reason = null;
      } else {
        targetContent.approved_by = null;
        targetContent.approved_at = null;
        targetContent.rejected_by = reviewer;
        targetContent.rejected_at = nowIso;
        targetContent.rejection_reason = rejectionReason;
      }

      // Update in contents array preserving all other versions
      const updatedList = genDb.contents.map((c: any) =>
        c.content_id === targetContent.content_id ? targetContent : c
      );
      genDb.contents = updatedList;
      genDb.latest_content = targetContent;
      genDb.last_updated = nowIso;
      syncDualFiles("data/generated_contents.json", genDb);
    }

    // 6. Update Runtime Pipeline State
    runtimeState.status = approvalStatus;
    runtimeState.approval_status = approvalStatus;
    runtimeState.current_node = "Human Approval";
    runtimeState.completed_at = nowIso;

    if (runtimeState.nodes && Array.isArray(runtimeState.nodes)) {
      const approvalNode = runtimeState.nodes.find(
        (n: any) => n.id === "node-approval-gate"
      );
      if (approvalNode) {
        approvalNode.status = action === "APPROVE" ? "Completed" : "Blocked";
        approvalNode.approval_status = approvalStatus;
        approvalNode.records_count = action === "APPROVE" ? "1건 승인 완료" : "1건 반려됨";
        approvalNode.last_run_time = nowIso;
        if (action === "APPROVE") {
          approvalNode.approved_by = reviewer;
          approvalNode.approved_at = nowIso;
        } else {
          approvalNode.rejected_by = reviewer;
          approvalNode.rejected_at = nowIso;
          approvalNode.rejection_reason = rejectionReason;
        }
        if (targetContent) {
          approvalNode.target_content = targetContent;
        }
      }
    }

    // Append event
    const eventMsg =
      action === "APPROVE"
        ? `Content '${targetContent?.title || contentId}' APPROVED by ${reviewer} -> Publish Ready`
        : `Content '${targetContent?.title || contentId}' REJECTED by ${reviewer}: ${rejectionReason}`;

    runtimeState.events = runtimeState.events || [];
    runtimeState.events.push({
      id: `evt-${crypto.randomBytes(4).toString("hex")}`,
      timestamp: nowIso,
      node: "Human Approval",
      type: approvalStatus,
      message: eventMsg,
      source: `Admin (${reviewer})`,
    });

    syncDualFiles("data/runtime_pipeline.json", runtimeState);

    // 7. Append to pipeline_runs.json
    const [rootRunsLogPath] = getRootAndPlatformPaths("data/logs/pipeline_runs.json");
    const runsList = readJsonFile(rootRunsLogPath) || [];
    const updatedRuns = runsList.map((r: any) =>
      r.run_id === runtimeState.run_id ? runtimeState : r
    );
    syncDualFiles("data/logs/pipeline_runs.json", updatedRuns);

    // 8. Audit Log Persistence (Requirement Section 12 & Test 10)
    const [rootAuditLogPath] = getRootAndPlatformPaths("data/logs/approval_audit_logs.json");
    const auditLogs = readJsonFile(rootAuditLogPath) || [];
    const auditEntry = {
      event_id: eventId,
      run_id: runId || runtimeState.run_id,
      content_id: contentId || targetContent?.content_id || "unknown",
      content_version: version,
      actor_id: reviewer,
      actor_role: "ADMIN",
      action: action === "APPROVE" ? "CONTENT_APPROVED" : "CONTENT_REJECTED",
      rejection_reason: rejectionReason,
      timestamp: nowIso,
      metadata: {
        content_title: targetContent?.title || "Untitled",
        platform: runtimeState.platform || targetContent?.platform || "instagram",
        content_type: runtimeState.content_type || targetContent?.content_type || "reels",
        source_count: targetContent?.source_traceability?.length || 0,
      },
    };
    auditLogs.unshift(auditEntry);
    syncDualFiles("data/logs/approval_audit_logs.json", auditLogs.slice(0, 100));

    return NextResponse.json({
      status: "SUCCESS",
      action,
      approval_status: approvalStatus,
      run_id: runId || runtimeState.run_id,
      content_id: contentId || targetContent?.content_id,
      version,
      reviewer,
      rejection_reason: rejectionReason,
      audit_event_id: eventId,
      timestamp: nowIso,
    });
  } catch (err: any) {
    console.error("Approval API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during approval", status: 500 },
      { status: 500 }
    );
  }
}

export async function GET() {
  const [rootAuditLogPath, platformAuditLogPath] = getRootAndPlatformPaths("data/logs/approval_audit_logs.json");
  const auditLogs = readJsonFile(rootAuditLogPath) || readJsonFile(platformAuditLogPath) || [];
  return NextResponse.json({
    status: "SUCCESS",
    count: auditLogs.length,
    logs: auditLogs,
  });
}
