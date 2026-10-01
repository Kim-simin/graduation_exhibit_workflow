import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    const scriptPath = path.resolve(process.cwd(), "..", "scripts", "publish_pipeline.py");
    const { stdout, stderr } = await execPromise(`py "${scriptPath}"`);
    return NextResponse.json({
      success: true,
      message: "Publish export completed successfully",
      output: stdout,
      error: stderr || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Publish export failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "READY",
    description: "POST to this endpoint to trigger data & media export to web/data/published",
  });
}
