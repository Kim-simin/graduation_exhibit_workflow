import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

function getProfessorsFilePath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), "..", "data", "professors.json"),
    path.resolve(process.cwd(), "data", "professors.json"),
    path.resolve("c:\\Users\\graduation_exhibit_workflow\\data\\professors.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return path.resolve(process.cwd(), "data", "professors.json");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const univ = searchParams.get("univ") || "";
    const dept = searchParams.get("dept") || "";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";

    const filePath = getProfessorsFilePath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ status: "SUCCESS", count: 0, professors: [] });
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    let professors = JSON.parse(raw);

    if (univ) {
      professors = professors.filter((p: any) =>
        p.university && (p.university.includes(univ) || univ.includes(p.university))
      );
    }
    if (dept) {
      professors = professors.filter((p: any) =>
        p.department && (p.department.includes(dept) || dept.includes(p.department))
      );
    }
    if (verifiedOnly) {
      professors = professors.filter((p: any) =>
        p.is_verified === true || p.verification_status === "VERIFIED"
      );
    }

    return NextResponse.json({
      status: "SUCCESS",
      count: professors.length,
      professors,
    });
  } catch (error: any) {
    console.error("[API /api/professors GET Error]:", error);
    return NextResponse.json(
      { status: "FAILED", error: error.message || "Failed to load professors" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { university, department, target_url = "", works = [] } = body;

    if (!university || !department) {
      return NextResponse.json(
        { status: "FAILED", error: "대학교명(university)과 학과명(department)이 필요합니다." },
        { status: 400 }
      );
    }

    const rootDir = path.resolve(process.cwd(), "..");
    const scriptPath = path.join(rootDir, "scripts", "link_department_professors.py");
    const pythonExe = process.platform === "win32" ? "py" : "python3";

    const worksData = JSON.stringify(works.slice(0, 30));
    const args = process.platform === "win32"
      ? ["-3.11", scriptPath, "--univ", university, "--dept", department, "--targetUrl", target_url, "--worksJson", worksData]
      : [scriptPath, "--univ", university, "--dept", department, "--targetUrl", target_url, "--worksJson", worksData];

    const result = await new Promise<any>((resolve) => {
      let stdout = "";
      let stderr = "";
      const proc = spawn(pythonExe, args, { cwd: rootDir });
      proc.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      proc.on("close", (code) => {
        try {
          const match = stdout.match(/\{[\s\S]*\}/);
          if (match) {
            resolve(JSON.parse(match[0]));
          } else {
            resolve({ status: "FAILED", error: "응답 파싱 실패", raw: stdout || stderr });
          }
        } catch (e: any) {
          resolve({ status: "FAILED", error: e.message, raw: stdout || stderr });
        }
      });
      proc.on("error", (err) => {
        resolve({ status: "FAILED", error: err.message });
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API /api/professors POST Error]:", error);
    return NextResponse.json(
      { status: "FAILED", error: error.message || "Failed to link professors" },
      { status: 500 }
    );
  }
}
