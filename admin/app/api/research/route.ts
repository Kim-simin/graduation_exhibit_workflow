import { NextResponse } from "next/server";
import { runResearchPipeline, ArchiveAgentResult } from "@/lib/research-node";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      university = "고려대학교",
      department = "산업정보디자인",
      year = "2025",
      category = "디자인·UX/UI·서비스디자인",
    } = body;

    console.log(`[API /api/research] 아카이브 탐색 에이전트 가동: ${year}년 ${university} ${department} (${category})`);

    const result: ArchiveAgentResult = await runResearchPipeline({
      university,
      department,
      year,
      category,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API /api/research Error]:", error);
    return NextResponse.json(
      {
        status: "FAILED",
        error: error.message,
        metadata: { university: "", department: "", year: "2025", industry_category: "" },
        exhibition: { official_url: null, works_url: null, poster_url: null, title: "" },
        works_sample: [],
        validation_report: { is_poster_verified: false, confidence_score: 0, source_type: "error" },
      },
      { status: 500 }
    );
  }
}
