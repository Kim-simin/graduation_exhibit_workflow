import { NextResponse } from "next/server";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const messages = [
        "인스타그램 인증 세션 로드 완료",
        "타겟 해시태그 진입 중...",
        "공식 포스터 및 슬라이드 파싱 완료",
        "Gemini 큐레이션 헤드라인 생성 중...",
        "최종 검수 통과 (Critic Score: 95점)",
      ];

      for (const msg of messages) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ time: new Date().toLocaleTimeString(), message: msg })}\n\n`));
        await new Promise((r) => setTimeout(r, 600));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
