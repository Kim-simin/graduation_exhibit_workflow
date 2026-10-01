"use client";

import React, { useState } from "react";
import { Film, Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";

export default function VideoRecorderBar() {
  const [url, setUrl] = useState("https://www.duksungvcd2025.co.kr/projects");
  const [duration, setDuration] = useState(6);
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");
  const [status, setStatus] = useState<"idle" | "recording" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);
  const [lastFilename, setLastFilename] = useState<string | null>(null);

  const handleStartRecord = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let targetUrl = url.trim();
    if (!targetUrl) {
      setStatus("error");
      setMessage("녹화할 웹페이지 URL을 입력해주세요.");
      return;
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
      setUrl(targetUrl);
    }

    setStatus("recording");
    setMessage(`페이지 분석 및 실시간 녹화 중 (${format.toUpperCase()} 변환)...`);
    setLastDownloadUrl(null);
    setLastFilename(null);

    try {
      const res = await fetch("/api/record-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, duration, format }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "녹화 작업에 실패했습니다.");
      }

      // 다운로드 링크 생성 및 브라우저 즉시 다운로드 실행
      const a = document.createElement("a");
      a.href = data.downloadUrl;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setLastDownloadUrl(data.downloadUrl);
      setLastFilename(data.filename);
      setStatus("success");
      setMessage(`녹화 완료! ${data.filename} 파일 다운로드가 시작되었습니다.`);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "서버 통신 오류가 발생했습니다.");
    }
  };

  return (
    <div
      className="w-full bg-slate-900 border-b border-slate-800 text-slate-100 shadow-xl recorder-bar-container"
      style={{
        backgroundColor: "#0f172a",
        borderBottom: "1px solid #1e293b",
        color: "#f1f5f9",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8"
        style={{ maxWidth: "80rem", margin: "0 auto", padding: "1rem" }}
      >
        <form
          action="javascript:void(0);"
          onSubmit={(e) => {
            e.preventDefault();
            handleStartRecord();
          }}
          className="flex flex-col md:flex-row items-center gap-3"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          {/* 타이틀 및 아이콘 */}
          <div
            className="flex items-center gap-2 self-start md:self-center mr-2"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div
              className="p-2 rounded-lg bg-indigo-600 text-white shadow-md"
              style={{
                padding: "0.5rem",
                borderRadius: "0.5rem",
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Film className="w-5 h-5" style={{ width: "1.25rem", height: "1.25rem" }} />
            </div>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ffffff" }}>
                Dynamic Viewport Recorder
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>맞춤 가변 해상도 모션 캡처</div>
            </div>
          </div>

          {/* URL 입력창 */}
          <div className="relative flex-1 w-full" style={{ flex: "1 1 300px", width: "100%" }}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="녹화할 웹페이지 URL (예: https://khvd.kr/)"
              disabled={status === "recording"}
              className="recorder-input w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
                color: "#f1f5f9",
                fontSize: "0.875rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* 녹화 시간(초) 선택 */}
          <div
            className="flex items-center gap-2 self-stretch md:self-center"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <label style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
              녹화 시간:
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={status === "recording"}
              className="recorder-select px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
              style={{
                padding: "0.625rem 0.75rem",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
                color: "#f1f5f9",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <option value={4}>4초</option>
              <option value={6}>6초 (권장)</option>
              <option value={8}>8초</option>
              <option value={10}>10초</option>
              <option value={15}>15초</option>
            </select>
          </div>

          {/* 포맷(MP4 / WebM) 선택 */}
          <div
            className="flex items-center gap-2 self-stretch md:self-center"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <label style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>포맷:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "mp4" | "webm")}
              disabled={status === "recording"}
              className="recorder-select px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
              style={{
                padding: "0.625rem 0.75rem",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
                color: "#a5b4fc",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <option value="mp4">MP4 (H.264 권장)</option>
              <option value="webm">WebM</option>
            </select>
          </div>

          {/* 녹화 시작 버튼 */}
          <button
            type="button"
            onClick={() => handleStartRecord()}
            disabled={status === "recording"}
            className="recorder-btn w-full md:w-auto px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md"
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: status === "recording" ? "#312e81" : "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: status === "recording" ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            {status === "recording" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" style={{ width: "1rem", height: "1rem" }} />
                <span>녹화 및 변환 중...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" style={{ width: "1rem", height: "1rem" }} />
                <span>{format.toUpperCase()} 추출</span>
              </>
            )}
          </button>
        </form>

        {/* 상태 메시지 및 피드백 알림바 */}
        {status !== "idle" && (
          <div
            className="mt-3 p-3 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-all"
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor:
                status === "recording"
                  ? "rgba(30, 27, 75, 0.8)"
                  : status === "success"
                  ? "rgba(2, 44, 34, 0.8)"
                  : "rgba(76, 5, 25, 0.8)",
              border: `1px solid ${
                status === "recording"
                  ? "rgba(55, 48, 163, 0.8)"
                  : status === "success"
                  ? "rgba(6, 95, 70, 0.8)"
                  : "rgba(159, 18, 57, 0.8)"
              }`,
              color:
                status === "recording" ? "#c7d2fe" : status === "success" ? "#a7f3d0" : "#fecdd3",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {status === "recording" && (
                <Loader2 className="w-4 h-4 animate-spin" style={{ width: "1rem", height: "1rem" }} />
              )}
              {status === "success" && (
                <CheckCircle2 className="w-4 h-4" style={{ width: "1rem", height: "1rem" }} />
              )}
              {status === "error" && (
                <AlertCircle className="w-4 h-4" style={{ width: "1rem", height: "1rem" }} />
              )}
              <span>{message}</span>
            </div>

            {/* 수동 재다운로드 버튼 (성공 시) */}
            {status === "success" && lastDownloadUrl && (
              <a
                href={lastDownloadUrl}
                download={lastFilename || `video.${format}`}
                style={{
                  marginLeft: "1rem",
                  padding: "0.25rem 0.75rem",
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Download style={{ width: "0.875rem", height: "0.875rem" }} />
                다시 다운로드
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
