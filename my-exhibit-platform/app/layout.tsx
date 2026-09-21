import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/navigation/Sidebar";

export const metadata: Metadata = {
  title: "대한민국 대학 졸업전시 통합 아카이브 | Exhibit Platform",
  description: "전국 주요 대학교 디자인·미술·공예·건축 졸업전시 작품 및 작가 통합 아카이빙 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                if (saved === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 min-h-screen antialiased transition-colors duration-200">
        <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19]">
          {/* 1. 좌측 콤팩트 투명 알약 버튼 레일 */}
          <Sidebar />

          {/* 2. 우측 메인 콘텐츠 (min-w-0으로 우측 밀림 원천 차단) */}
          <div className="flex-1 min-w-0 w-full overflow-x-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
