import type { Metadata } from "next";
import "./globals.css";
import ArchiveShell from "@/components/archive/ArchiveShell";
import "./archive.css";
import "./industry.css";

export const metadata: Metadata = {
  title: "GRAD EXHIBIT | 졸업전시 아카이브",
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
                if (saved === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 min-h-screen antialiased transition-colors duration-200">
        <ArchiveShell>{children}</ArchiveShell>
      </body>
    </html>
  );
}
