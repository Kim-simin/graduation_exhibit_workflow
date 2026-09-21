import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "배포 환경(Production)에서는 SNS 자동 발행 기능이 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const { university = "건국대학교", department = "리빙디자인", year = "2025" } = await req.json();
    return NextResponse.json({
      success: true,
      message: `${year}년도 ${university} ${department} 전시 숏폼 쇼츠 업로드 성공`,
      videoId: "yt_sh_81237",
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
