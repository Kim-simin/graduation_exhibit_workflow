"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ScreenshotUploadModal from "@/components/screenshot-upload-modal";
import ThemeToggle from "@/components/theme-toggle";
import AgentWorkflowGraph, { WorkflowNodeData } from "@/components/admin/runtime/AgentWorkflowGraph";
import NodeDetailPanel from "@/components/admin/runtime/NodeDetailPanel";
import RunMonitorPanel from "@/components/admin/runtime/RunMonitorPanel";
import ContentApprovalCard from "@/components/admin/runtime/ContentApprovalCard";
import SchedulerManager from "@/components/admin/runtime/SchedulerManager";
import OperationsTopBar from "@/components/admin/runtime/OperationsTopBar";
import ApprovalQueueView from "@/components/admin/runtime/ApprovalQueueView";
import ResearchMonitorView from "@/components/admin/runtime/ResearchMonitorView";
import {
  Activity,
  Bot,
  ListTree,
  GitFork,
  Radio,
  Clock,
  Database,
  FileCheck2,
  Calendar,
} from "lucide-react";

import {
  ArrowLeft,
  Play,
  Send,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Instagram,
  Share2,
  Youtube,
  School,
  Sparkles,
  Globe,
  X,
  ExternalLink,
  Layers,
  Check,
  RotateCcw,
  Eye,
  Loader2,
  ClipboardPaste,
  Trash2,
  Plus,
  Upload,
  Image as ImageIcon,
  Cpu,
  Server,
} from "lucide-react";
import { STANDARD_CATEGORIES, getStandardCategory } from "@/src/utils/categoryMapper";

const INDUSTRIES = [
  { value: "디자인·UX/UI", label: "디자인 · UX/UI · 서비스디자인" },
  { value: "미술·회화", label: "미술 · 회화 · 조소 · 현대미술" },
  { value: "공예·조형", label: "공예 · 도자 · 금속 · 섬유" },
  { value: "영상·미디어", label: "영상 · 애니메이션 · 미디어아트" },
  { value: "사진·브랜드", label: "사진 · 광고 · 브랜드 커뮤니케이션" },
  { value: "건축·공간", label: "건축 · 실내 · 공간디자인" },
  { value: "패션·의류", label: "패션 · 텍스타일 · 의류디자인" },
  { value: "게임·캐릭터", label: "게임 · 캐릭터 · 인터랙션" },
];

function matchCategory(cat: string | null): string {
  return getStandardCategory(cat || "");
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as any;
  // STEP 9-1 & 11: Agent Runtime & Operations Dashboard State (Single Source of Truth)
  const [adminTab, setAdminTab] = useState<"dashboard" | "queue" | "agents" | "runs" | "schedules" | "datasync" | "content" | "cardnews" | "research">(
    (urlTab && ["dashboard", "queue", "agents", "runs", "schedules", "datasync", "content", "cardnews", "research"].includes(urlTab))
      ? urlTab
      : "cardnews"
  );
  const [runtimeData, setRuntimeData] = useState<any>(null);
  const [operationsData, setOperationsData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const prevRuntimeDataRef = useRef<any>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRuntimeData = useCallback(async (runIdToFetch?: string, isBackground = false) => {
    if (!isBackground) {
      setIsRuntimeLoading(true);
    }
    try {
      // 1. Fetch Operations Stats (Section 7)
      try {
        const opsRes = await fetch("/api/admin/operations");
        if (opsRes.ok) {
          const opsJson = await opsRes.json();
          if (opsJson.status === "SUCCESS") {
            setOperationsData(opsJson);
          }
        }
      } catch (_) {}

      // 2. Fetch Runtime Pipeline Data
      const activeRunId = runIdToFetch !== undefined ? runIdToFetch : selectedRunId;
      const url = activeRunId ? `/api/admin/runtime?run_id=${encodeURIComponent(activeRunId)}` : "/api/admin/runtime";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // STEP 9-5 Optimization: Avoid re-renders when data has not changed
        const prev = prevRuntimeDataRef.current;
        const hasChanged = !prev || 
          prev.status !== data.status ||
          prev.current_run?.run_id !== data.current_run?.run_id ||
          prev.current_run?.status !== data.current_run?.status ||
          prev.current_run?.current_node !== data.current_run?.current_node ||
          prev.current_run?.approval_status !== data.current_run?.approval_status ||
          prev.current_run?.completed_at !== data.current_run?.completed_at ||
          JSON.stringify(prev.workflow) !== JSON.stringify(data.workflow) ||
          (prev.runs && data.runs && prev.runs[0]?.run_id !== data.runs[0]?.run_id);

        if (hasChanged) {
          prevRuntimeDataRef.current = data;
          setRuntimeData(data);
          if (data.workflow && data.workflow.length > 0) {
            setSelectedNode((prevNode) => {
              if (!prevNode) return data.workflow[0];
              const matched = data.workflow.find((w: any) => w.id === prevNode.id);
              return matched || data.workflow[0];
            });
          } else {
            setSelectedNode(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin runtime data:", err);
    } finally {
      if (!isBackground) {
        setIsRuntimeLoading(false);
      }
    }
  }, [selectedRunId]);

  // STEP 9-5 Polling Optimization:
  // 1. Pause polling when tab is hidden (document.hidden)
  // 2. Immediately refresh on visibilitychange / window focus
  // 3. Skip polling for historical runs (immutable history)
  // 4. Adaptive polling interval based on active pipeline status
  useEffect(() => {
    fetchRuntimeData(undefined, false);

    const scheduleNextPoll = () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }

      // If user selected a historical run, do not poll immutable history
      if (selectedRunId !== null) {
        return;
      }

      // If tab is currently hidden, do not schedule active poll; visibilitychange will wake it up
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      const currentStatus = runtimeData?.current_run?.status || runtimeData?.status;
      let delayMs = 10000; // Idle heartbeat (COMPLETED, APPROVED, REJECTED, FAILED, NO_ACTIVE_RUN)
      if (currentStatus === "RUNNING" || currentStatus === "PENDING") {
        delayMs = 3000;
      } else if (currentStatus === "WAITING_FOR_APPROVAL") {
        delayMs = 5000;
      }

      pollTimerRef.current = setTimeout(async () => {
        if (typeof document !== "undefined" && !document.hidden && selectedRunId === null) {
          await fetchRuntimeData(undefined, true);
        }
        scheduleNextPoll();
      }, delayMs);
    };

    scheduleNextPoll();

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchRuntimeData(selectedRunId || undefined, false);
        scheduleNextPoll();
      }
    };

    const handleWindowFocus = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchRuntimeData(selectedRunId || undefined, false);
        scheduleNextPoll();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleWindowFocus);
    }

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleWindowFocus);
      }
    };
  }, [selectedRunId, runtimeData?.current_run?.status, runtimeData?.status, fetchRuntimeData]);

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    fetchRuntimeData(runId);
  };

  const handleApproveContent = async (contentId: string, version: number) => {
    try {
      const res = await fetch("/api/admin/approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "admin",
        },
        body: JSON.stringify({
          action: "APPROVE",
          run_id: runtimeData?.current_run?.run_id || selectedRunId,
          content_id: contentId,
          version: version,
          reviewer: "admin_master",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "승인 처리에 실패했습니다.");
        return;
      }
      await fetchRuntimeData();
    } catch (err: any) {
      alert("승인 요청 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleRejectContent = async (contentId: string, version: number, reason: string) => {
    try {
      const res = await fetch("/api/admin/approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "admin",
        },
        body: JSON.stringify({
          action: "REJECT",
          run_id: runtimeData?.current_run?.run_id || selectedRunId,
          content_id: contentId,
          version: version,
          reviewer: "admin_master",
          rejection_reason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "반려 처리에 실패했습니다.");
        return;
      }
      await fetchRuntimeData();
    } catch (err: any) {
      alert("반려 요청 중 오류가 발생했습니다: " + err.message);
    }
  };

  const urlUniv = searchParams.get("univ") || "";
  const urlDept = searchParams.get("dept") || "";
  const urlCategory = searchParams.get("category");
  const urlYear = searchParams.get("year");
  const urlCardId = searchParams.get("cardId") || searchParams.get("card_id") || searchParams.get("id") || "";
  const urlTargetUrl = searchParams.get("target_url") || searchParams.get("url") || "";
  const urlModal = searchParams.get("modal") === "true";

  const [selectedYear, setSelectedYear] = useState(urlYear || "2026");
  const [selectedIndustry, setSelectedIndustry] = useState(matchCategory(urlCategory));
  const [targetUniv, setTargetUniv] = useState(urlUniv || "");
  const [targetDept, setTargetDept] = useState(urlDept || "");
  const [targetCardId, setTargetCardId] = useState(urlCardId || "");
  const [selectedPreset, setSelectedPreset] = useState(
    urlUniv && urlDept ? `${urlUniv} - ${urlDept}` : ""
  );
  const [queueItems, setQueueItems] = useState<any[]>([]);

  // 수동 URL 주입 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(urlModal);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [manualUrl, setManualUrl] = useState(urlTargetUrl);
  const [isCapturing, setIsCapturing] = useState(false);

  // 실시간 에셋 캡처 검수 패널 상태
  const [inspectionData, setInspectionData] = useState<any | null>(null);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableMainPoster, setEditableMainPoster] = useState("");
  const [worksList, setWorksList] = useState<any[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  // Vision 자동 크롭 엔진 및 로딩 상태
  const [visionEngine, setVisionEngine] = useState<'gemini' | 'local'>('local');
  const [llamaServerUrl, setLlamaServerUrl] = useState('http://127.0.0.1:8080');
  const [isVisionExtracting, setIsVisionExtracting] = useState(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [visionImagePreview, setVisionImagePreview] = useState<string | null>(null);
  const [visionApiKey, setVisionApiKey] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("GEMINI_API_KEY");
      if (savedKey) setVisionApiKey(savedKey);
    }
  }, []);

  // Vision Extraction 실행 핸들러
  const handleRunVisionExtraction = async (sourceType: 'current' | 'custom', customBase64?: string) => {
    setIsVisionExtracting(true);
    const timestamp = new Date().toLocaleTimeString();
    const engineLabel = visionEngine === 'local' ? '로컬 Qwen2.5-VL (llama.cpp)' : 'Gemini Vision 2.5';
    setLogs((prev) => [
      ...prev,
      `------------------------------------------------------------`,
      `[${timestamp}] 🤖 [${engineLabel} 멀티모달 분석 가동] 작품 바운딩 박스 탐지 & OCR 시작`,
    ]);

    try {
      const activeCardId = targetCardId || inspectionData?.card_id || `DES-${Date.now().toString().slice(-4)}`;
      let payload: any = {
        card_id: activeCardId,
        engine: visionEngine,
        server_url: llamaServerUrl,
      };
      const effectiveKey = visionApiKey || (typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || "";
      if (effectiveKey) {
        payload.api_key = effectiveKey;
      }

      if (sourceType === 'current') {
        const currentImg = editableMainPoster || inspectionData?.main_poster;
        if (!currentImg) {
          alert("현재 검수 패널에 로드된 스크린샷/포스터 이미지가 없습니다.");
          setIsVisionExtracting(false);
          return;
        }
        if (currentImg.startsWith("data:")) {
          payload.image_base64 = currentImg;
        } else {
          payload.image_path = currentImg;
        }
      } else {
        const targetBase64 = customBase64 || visionImagePreview;
        if (!targetBase64) {
          alert("분석할 스크린샷 이미지를 선택하거나 붙여넣어 주세요.");
          setIsVisionExtracting(false);
          return;
        }
        payload.image_base64 = targetBase64;
      }

      const res = await fetch("/api/research/vision-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS" && data.cards && data.cards.length > 0) {
        const newCards = data.cards.map((c: any) => ({
          project_title: c.project_title || c.title || "출품작",
          author: c.author || `${targetUniv || "학생"} 작가`,
          raw_text: c.raw_text || `${c.title || ''} | ${c.author || ''}`,
          screenshot_path: c.screenshot_path || c.thumbnail || "",
          detail_url: c.detail_url || inspectionData?.project_url || inspectionData?.target_url || "",
        }));

        setWorksList((prev) => [...prev, ...newCards]);
        setIsVisionModalOpen(false);
        setVisionImagePreview(null);

        const doneTime = new Date().toLocaleTimeString();
        setLogs((prev) => [
          ...prev,
          `[${doneTime}] 🎯 [${engineLabel} 완료] 총 ${data.detected_count}개 작품 영역 자동 크롭 및 카드 생성 성공!`,
          `[${doneTime}] 💡 하단 '내부 링크 스마트 크롤링' 그리드에서 작품명·작가명을 확인 및 편집하세요.`,
        ]);
        alert(`${engineLabel}이 스크린샷에서 총 ${data.detected_count}개의 작품을 감지하여 자동 크롭 및 카드로 등록했습니다!`);
      } else {
        const errMsg = data.error || "작품 감지 결과가 없습니다.";
        if (data.guide) {
          setLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] 💡 [터미널 실행 가이드] ${data.guide}`,
          ]);
        }
        throw new Error(errMsg);
      }
    } catch (err: any) {
      console.error("Vision Extraction 실패:", err);
      alert(`Vision 분석 중 오류가 발생했습니다:\n\n${err.message}`);
      const errTime = new Date().toLocaleTimeString();
      setLogs((prev) => [
        ...prev,
        `[${errTime}] ⚠️ [Vision Extraction 실패] ${err.message}`,
      ]);
    } finally {
      setIsVisionExtracting(false);
    }
  };

  // 작품 카드 추가 핸들러
  const handleAddWorkCard = () => {
    const newCard = {
      project_title: `출품작 #${worksList.length + 1}`,
      author: `${targetUniv || "학생"} 작가`,
      raw_text: "",
      screenshot_path: "",
      detail_url: inspectionData?.project_url || inspectionData?.target_url || "",
    };
    setWorksList((prev) => [...prev, newCard]);
  };

  // 작품 카드 필드 수정 핸들러
  const handleUpdateWorkField = (index: number, field: string, value: string) => {
    setWorksList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // 작품 카드 삭제 핸들러 (오탐 제거)
  const handleDeleteWorkCard = (index: number) => {
    setWorksList((prev) => prev.filter((_, i) => i !== index));
  };

  // 카드 썸네일 이미지 파일 업로드
  const handleUploadCardImage = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setWorksList((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            screenshot_path: base64,
            thumbnail: base64,
            image_url: base64,
          };
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // 메인 포스터 이미지 변경
  const handleUploadMainPoster = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setEditableMainPoster(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs([
      `[${timestamp}] 시스템 초기화 완료: 수동 URL 주입 및 Playwright 내부 링크 정밀 캡처 엔진 대기 중`,
      `[${timestamp}] 실시간 전국 대학교 큐 데이터베이스 연동 활성화`,
    ]);
  }, []);

  // 1. 대기열 로드
  const loadQueue = async () => {
    try {
      const res = await fetch("/api/exhibitions");
      if (res.ok) {
        const data = await res.json();
        if (data.exhibitions) {
          setQueueItems(data.exhibitions);
        }
      }
    } catch (e) {
      console.error("큐 로드 실패:", e);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // 2. URL 쿼리 파라미터 자동 바인딩 및 동기화
  useEffect(() => {
    if (urlUniv || urlDept || urlCategory || urlYear || urlCardId || urlModal) {
      if (urlYear) setSelectedYear(urlYear);
      if (urlCategory) setSelectedIndustry(matchCategory(urlCategory));
      if (urlUniv) setTargetUniv(urlUniv);
      if (urlDept) setTargetDept(urlDept);
      if (urlCardId) setTargetCardId(urlCardId);
      if (urlTargetUrl) setManualUrl(urlTargetUrl);
      if (urlModal) setIsModalOpen(true);

      if (urlUniv && urlDept) {
        setSelectedPreset(`${urlUniv} - ${urlDept}`);
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [
          ...prev,
          `[${timestamp}] 🎯 [대기열 연동] ${urlUniv} ${urlDept} (${urlCardId || 'DES-XX'}) 선택 완료 -> 정밀 캡처 준비 (${urlYear || '2025'}년 / ${matchCategory(urlCategory)})`,
        ]);
      }
    }
  }, [urlUniv, urlDept, urlCategory, urlYear, urlCardId, urlTargetUrl, urlModal]);

  // 대기열 로드 후 쿼리 파라미터 대상의 URL 및 메타데이터 자동 바인딩
  useEffect(() => {
    if (queueItems.length > 0) {
      const matched = queueItems.find(
        (item) => (urlCardId && item.id === urlCardId) || (urlUniv && urlDept && item.university === urlUniv && item.department === urlDept)
      );
      if (matched) {
        if (!targetUniv && matched.university) setTargetUniv(matched.university);
        if (!targetDept && matched.department) setTargetDept(matched.department);
        if (matched.category) setSelectedIndustry(matchCategory(matched.category));
        if (matched.year) setSelectedYear(matched.year);
        if (matched.university && matched.department) {
          setSelectedPreset(`${matched.university} - ${matched.department}`);
        }
        const designatedUrl = urlTargetUrl || matched.targetUrl || matched.scraped_url || matched.official_url || matched.target_url;
        if (designatedUrl) {
          setManualUrl(designatedUrl);
        }
      }
    }
  }, [queueItems, urlCardId, urlUniv, urlDept, urlTargetUrl, targetUniv, targetDept]);

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPreset(val);
    if (!val) return;
    const [univ, dept] = val.split(" - ");
    if (univ && dept) {
      setTargetUniv(univ);
      setTargetDept(dept);

      const matched = queueItems.find(
        (item) => item.university === univ && item.department === dept
      );
      if (matched) {
        if (matched.category) setSelectedIndustry(matchCategory(matched.category));
        if (matched.id) setTargetCardId(matched.id);
        const designatedUrl = matched.targetUrl || matched.scraped_url || matched.official_url || matched.target_url;
        if (designatedUrl) {
          setManualUrl(designatedUrl);
        }
      }

      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [
        ...prev,
        `[${timestamp}] 🎯 [대기열 선택] ${univ} ${dept} 선택 완료 -> 수동 URL 주입 또는 리서치 준비`,
      ]);
    }
  };

  // 1. 로컬 LLM (Qwen2.5-VL) URL 파라미터 자동 분석 & 입력창 즉시 채우기
  const handleAutoFillOnly = async () => {
    if (!manualUrl.trim()) {
      alert("졸업전시회 URL을 입력해 주세요.");
      return;
    }

    setIsCapturing(true);
    const timestamp = new Date().toLocaleTimeString();

    setLogs((prev) => [
      ...prev,
      `------------------------------------------------------------`,
      `[${timestamp}] 🤖 [로컬 LLM Qwen2.5-VL] 링크 파라미터 자동 분석 요청: ${manualUrl.trim()}`,
      `[${timestamp}] ⚡ 엔드포인트: ${llamaServerUrl} (llama-server)`,
    ]);

    try {
      const res = await fetch("/api/cards/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: manualUrl.trim(),
          year: selectedYear || "2026",
          server_url: llamaServerUrl,
        }),
      });

      const data = await res.json();
      const finishTime = new Date().toLocaleTimeString();

      if (data.status === "SUCCESS" && data.data) {
        const d = data.data;
        if (d.university) setTargetUniv(d.university);
        if (d.department) setTargetDept(d.department);
        if (d.year) setSelectedYear(d.year);
        if (d.category) setSelectedIndustry(matchCategory(d.category));
        if (d.title) setEditableTitle(d.title);
        if (d.posterPreview) setEditableMainPoster(d.posterPreview);

        const genCardId = `UNIV-${d.year || '2026'}-${(d.university || 'UNIV').replace(/\s+/g, '')}-${(d.department || 'DEPT').replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`;
        setTargetCardId(genCardId);

        setLogs((prev) => [
          ...prev,
          `[${finishTime}] ✅ [로컬 LLM 인식 완료] 엔진: ${data.engine || 'Qwen2.5-VL'}`,
          `[${finishTime}] 🏫 대상 대학교: ${d.university} | 🎨 대상 학과: ${d.department} | 📅 연도: ${d.year || selectedYear} | 📂 산업군: ${matchCategory(d.category)}`,
          `[${finishTime}] 💡 관리자 화면 입력란에 파라미터가 자동으로 채워졌습니다. 이제 [🤖 AI 자동 인식 & 졸업작품 탐색 캡처] 버튼으로 학생 출품작을 수집할 수 있습니다.`,
        ]);
      } else {
        setLogs((prev) => [
          ...prev,
          `[${finishTime}] ⚠️ [LLM 분석 실패] ${data.error || "분석할 수 없는 링크입니다."}`,
        ]);
        alert(`링크 분석 실패: ${data.error || "대학교/학과 정보를 자동으로 감지하지 못했습니다."}`);
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ [분석 시스템 예외]: ${err.message}`,
      ]);
    } finally {
      setIsCapturing(false);
    }
  };

  // 2. 수동 URL 주입 + 로컬 LLM 자동 채우기 + 내부 링크 정밀 캡처 전체 파이프라인
  const handleStartManualCapture = async () => {
    if (!manualUrl.trim()) {
      alert("졸업전시 공식 웹사이트 URL을 입력해 주세요.");
      return;
    }

    setIsCapturing(true);
    setApprovalSuccess(false);
    const timestamp = new Date().toLocaleTimeString();

    let activeUniv = targetUniv;
    let activeDept = targetDept;
    let activeYear = selectedYear || "2026";
    let activeCategory = selectedIndustry;
    let activeTitle = editableTitle;
    let preArtworks: any[] = [];
    let detectedPoster = editableMainPoster;

    setLogs((prev) => [
      ...prev,
      `------------------------------------------------------------`,
      `[${timestamp}] 🚀 [로컬 LLM 인식 + 졸업작품 탐색 파이프라인 가동]`,
      `[${timestamp}] 🌐 타겟 URL: ${manualUrl}`,
      `[${timestamp}] 🤖 1단계: 로컬 LLM(Qwen2.5-VL / llama-server) 대학교·학과·연도·산업군 정밀 분석 중...`,
    ]);

    // 1단계: LLM / 고지능 룰기반 링크 분석 수행하여 화면 입력창 즉시 채우기
    try {
      const analyzeRes = await fetch("/api/cards/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: manualUrl.trim(),
          year: selectedYear || "2026",
          server_url: llamaServerUrl,
        }),
      });

      const analyzeData = await analyzeRes.json();
      if (analyzeData.status === "SUCCESS" && analyzeData.data) {
        const d = analyzeData.data;
        activeUniv = d.university || activeUniv || "공식전시";
        activeDept = d.department || activeDept || "디자인";
        activeYear = d.year || activeYear || "2026";
        activeCategory = matchCategory(d.category || activeCategory);
        activeTitle = d.title || `[${activeUniv}] ${activeYear}년 ${activeDept} 졸업전시회`;
        if (d.posterPreview && !detectedPoster) {
          detectedPoster = d.posterPreview;
          setEditableMainPoster(detectedPoster);
        }
        preArtworks = d.artworks || [];

        // 화면 입력창에 실시간 자동 채우기
        setTargetUniv(activeUniv);
        setTargetDept(activeDept);
        setSelectedYear(activeYear);
        setSelectedIndustry(activeCategory);
        setEditableTitle(activeTitle);

        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ [로컬 LLM 인식 성공] 대학교: ${activeUniv} | 학과: ${activeDept} | 연도: ${activeYear} | 산업군: ${activeCategory}`,
          `[${new Date().toLocaleTimeString()}] 🔍 2단계: 졸업작품 정밀 탐색 엔진(Playwright) 가동 중... 메인 포스터 및 GNB 학생 출품작 수집 중...`,
        ]);
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ⚠️ [LLM 1단계 경고]: ${err.message} -> 기존 입력값으로 지속`,
      ]);
    }

    // 2단계: 기존 졸업작품 탐색 엔진 가동
    try {
      const genCardId = targetCardId || `UNIV-${activeYear}-${activeUniv.replace(/\s+/g, '')}-${activeDept.replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`;
      if (!targetCardId) setTargetCardId(genCardId);

      const res = await fetch("/api/research/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: genCardId,
          target_url: manualUrl.trim(),
          univ: activeUniv || "공식전시",
          dept: activeDept || "디자인",
          year: activeYear,
          category: activeCategory,
        }),
      });

      const data = await res.json();
      const finishTime = new Date().toLocaleTimeString();

      if (data.status === "SUCCESS" && data.capture_data) {
        const cap = data.capture_data;
        setInspectionData(cap);
        if (!editableTitle || editableTitle.startsWith("[")) {
          setEditableTitle(cap.page_title || `[${activeUniv}] ${activeYear}년 ${activeDept} 졸업전시회`);
        }
        if (cap.main_poster) {
          setEditableMainPoster(cap.main_poster);
        } else if (detectedPoster) {
          setEditableMainPoster(detectedPoster);
        }

        let mappedWorks = (cap.works || []).map((w: any, idx: number) => {
          const thumb = w.screenshot_path || w.thumbnail || w.image_url || "";
          return {
            ...w,
            project_title: w.project_title || w.title || `출품작 #${idx + 1}`,
            title: w.title || w.project_title || `출품작 #${idx + 1}`,
            author: w.author || `${activeUniv || "학생"} 작가`,
            raw_text: w.raw_text || w.caption || "",
            screenshot_path: thumb,
            thumbnail: thumb,
            image_url: thumb,
            detail_url: w.detail_url || cap.project_url || cap.target_url || manualUrl.trim(),
          };
        });

        // 만약 Playwright 추출 작품이 0건이지만 LLM/DOM 분석에서 찾은 작품이 있으면 폴백 연결
        if (mappedWorks.length === 0 && preArtworks.length > 0) {
          mappedWorks = preArtworks.map((w: any, idx: number) => ({
            id: w.id || `art-${idx + 1}`,
            project_title: w.title || `출품작 #${idx + 1}`,
            title: w.title || `출품작 #${idx + 1}`,
            author: w.author || `${activeUniv || "학생"} 작가`,
            raw_text: w.description || "",
            screenshot_path: w.image || w.imagePath || "",
            thumbnail: w.image || w.imagePath || "",
            image_url: w.image || w.imagePath || "",
            detail_url: manualUrl.trim(),
          }));
        }

        setWorksList(mappedWorks);
        setIsModalOpen(false);

        setLogs((prev) => [
          ...prev,
          `[${finishTime}] 📸 [메인 포스터 확보] ${cap.main_poster || detectedPoster || '완료'}`,
          `[${finishTime}] 🎨 [학생 및 출품작 확보] 총 ${mappedWorks.length}점 확보 완료`,
          `[${finishTime}] 🔍 하단 [실시간 에셋 캡처 검수 패널]에 자동 채워졌습니다. 결과를 확인하고 승인 등록하십시오.`,
        ]);

        setTimeout(() => {
          document.getElementById("inspection-panel")?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      } else {
        // Playwright 캡처 실패 시에도 사전 메타데이터/아트웍이 있으면 검수 패널에 로드
        if (preArtworks.length > 0 || detectedPoster) {
          const fallbackCap = {
            card_id: genCardId,
            university: activeUniv,
            department: activeDept,
            year: activeYear,
            target_url: manualUrl.trim(),
            project_url: manualUrl.trim(),
            main_poster: detectedPoster || "",
            page_title: activeTitle,
            works: preArtworks,
          };
          setInspectionData(fallbackCap);
          setWorksList(preArtworks.map((w: any, idx: number) => ({
            id: w.id || `art-${idx + 1}`,
            project_title: w.title || `출품작 #${idx + 1}`,
            title: w.title || `출품작 #${idx + 1}`,
            author: w.author || `${activeUniv || "학생"} 작가`,
            raw_text: w.description || "",
            screenshot_path: w.image || w.imagePath || "",
            thumbnail: w.image || w.imagePath || "",
            image_url: w.image || w.imagePath || "",
            detail_url: manualUrl.trim(),
          })));
          setIsModalOpen(false);
          setLogs((prev) => [
            ...prev,
            `[${finishTime}] ℹ️ [메타데이터 연동 완료] 링크 분석 결과로 총 ${preArtworks.length}점의 작품이 검수 패널에 자동 채워졌습니다.`,
          ]);
          setTimeout(() => {
            document.getElementById("inspection-panel")?.scrollIntoView({ behavior: "smooth" });
          }, 300);
        } else {
          setLogs((prev) => [
            ...prev,
            `[${finishTime}] ⚠️ [캡처 실패] 입력된 URL(${manualUrl})에서 에셋을 캡처하지 못했습니다.`,
            `[${finishTime}] 오류 내용: ${data.error || "알 수 없는 오류"}`,
          ]);
          alert(`캡처 실패: ${data.error || "페이지 접속 및 캡처에 실패했습니다. URL을 확인해 주세요."}`);
        }
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ [시스템 예외]: ${err.message}`,
      ]);
    } finally {
      setIsCapturing(false);
    }
  };

  // 캡처 검수 최종 승인 및 카드 반영
  const handleApprove = async () => {
    if (!inspectionData) return;
    setIsApproving(true);
    const timestamp = new Date().toLocaleTimeString();

    try {
      const res = await fetch("/api/research/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: inspectionData.card_id,
          university: targetUniv || inspectionData.university,
          department: targetDept || inspectionData.department,
          year: selectedYear,
          category: selectedIndustry,
          exhibition_title: editableTitle,
          target_url: inspectionData.target_url,
          main_poster: editableMainPoster || inspectionData.main_poster,
          works: worksList,
        }),
      });

      if (res.ok) {
        const approveData = await res.json();
        const profCount = approveData.registered_professors?.length || 0;
        setApprovalSuccess(true);
        setLogs((prev) => [
          ...prev,
          `[${timestamp}] ✅ [수집 최종 승인 완료] ${targetUniv} ${targetDept} 카드가 데이터베이스에 '리서치 완료' 상태로 등록되었습니다! (포스터 & 출품작 ${worksList.length}점)`,
          profCount > 0
            ? `[${timestamp}] 🎓 [학과 커리큘럼 연계] ${targetUniv} ${targetDept} 교수진 ${profCount}명이 '학과 커리큘럼(교수)' 페이지(/professors)에 성공적으로 추가 등록되었습니다.`
            : `[${timestamp}] 🎓 [학과 커리큘럼 연계] ${targetUniv} ${targetDept} 교수진 정보가 학과 커리큘럼(교수) 데이터베이스와 동기화되었습니다.`,
          `[${timestamp}] 🚀 메인 공개 갤러리로 자동 이동합니다...`,
        ]);
        await loadQueue();
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        alert("승인 처리 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      alert(`승인 오류: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  // 캡처 검수 반려 및 재입력
  const handleReject = () => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      `[${timestamp}] ❌ [에셋 캡처 반려] 캡처된 에셋이 반려되었습니다. 새로운 URL을 다시 입력합니다.`,
    ]);
    setInspectionData(null);
    setWorksList([]);
    setEditableMainPoster("");
    setApprovalSuccess(false);
    const input = document.getElementById("admin-url-input");
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus();
    }
  };

  // SNS 배포 핸들러
  const publishTo = async (channel: string) => {
    setPublishStatus((prev) => ({ ...prev, [channel]: "전송 중..." }));
    try {
      const res = await fetch(`/api/publish/${channel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university: targetUniv,
          department: targetDept,
          year: selectedYear,
        }),
      });
      const data = await res.json();
      const timestamp = new Date().toLocaleTimeString();
      if (data.status === "SUCCESS") {
        setPublishStatus((prev) => ({ ...prev, [channel]: "완료 ✓" }));
        setLogs((prev) => [
          ...prev,
          `[${timestamp}] 🚀 [${channel.toUpperCase()}] 배포 완료! ID: ${data.post_id || "OK"}`,
        ]);
      } else {
        setPublishStatus((prev) => ({ ...prev, [channel]: "실패 ✕" }));
        setLogs((prev) => [
          ...prev,
          `[${timestamp}] ⚠️ [${channel.toUpperCase()}] 배포 실패: ${data.message || data.error}`,
        ]);
      }
    } catch (e: any) {
      setPublishStatus((prev) => ({ ...prev, [channel]: "오류" }));
    }
  };

  return (
    <main className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans">
      {/* 1. Global Admin Top Bar */}
      <header className="h-16 px-6 border-b border-slate-800/90 bg-[#090d16]/95 backdrop-blur-xl flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold"
            title="공개 메인 갤러리로 이동"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">서비스 홈</span>
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-600/30">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-white">
                  GRAD EXHIBIT PRO
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">/</span>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Agent Runtime
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              5 Active Stages
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Live Backend Pipeline Monitor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            LIVE SYNC (3s)
          </span>

          <button
            onClick={() => fetchRuntimeData()}
            disabled={isRuntimeLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition shadow-sm"
            title="파이프라인 실시간 상태 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRuntimeLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">상태 갱신</span>
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* 2. Main Admin Workspace (Sidebar + Content) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#090d16] border-r border-slate-800/90 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {/* Core Agent Views */}
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-3 block mb-2">
                Agent Workflows
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setAdminTab("dashboard")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    adminTab === "dashboard"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                    Graph
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab("queue")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    adminTab === "queue"
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 className="w-4 h-4 text-amber-400" />
                    <span>Approval Queue</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    (operationsData?.counts?.waiting_approval || 0) > 0
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-black/30 text-slate-400"
                  }`}>
                    {operationsData?.counts?.waiting_approval || 0}
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab("agents")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    adminTab === "agents"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4" />
                    <span>Agents</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                    {runtimeData?.agents?.length || 5}
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab("runs")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    adminTab === "runs"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4" />
                    <span>Runs</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                    {runtimeData?.runs?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab("schedules")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    adminTab === "schedules"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4" />
                    <span>Scheduler</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                    CRON
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab("datasync")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    adminTab === "datasync"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4" />
                    <span>Data Sync</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                    4 Domains
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab("content")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    adminTab === "content"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Content</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                    STEP 8
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab("research")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    adminTab === "research"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Research & Crawl</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-cyan-300">
                    STEP 13
                  </span>
                </button>
              </nav>
            </div>

            {/* Legacy Sub-Consoles */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-3 block mb-2">
                Legacy Consoles
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setAdminTab("cardnews")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                    adminTab === "cardnews"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span>🎨</span>
                    <span>카드뉴스 검수</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">v2.5</span>
                </button>

                <Link
                  href="/admin/professors"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span>🎓</span>
                    <span>교수 관제</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </Link>

                <Link
                  href="/admin/content"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span>🎬</span>
                    <span>콘텐츠 리서치</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </Link>
              </nav>
            </div>
          </div>

          {/* System Specs Card */}
          <div className="mt-6 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/90 text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>DB Entities</span>
              <strong className="text-white">{runtimeData?.metrics?.total_research_entities || 0}</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Verified Rate</span>
              <strong className="text-emerald-400">
                {runtimeData?.metrics?.total_research_entities
                  ? Math.round((runtimeData.metrics.total_verified / runtimeData.metrics.total_research_entities) * 100)
                  : 100}%
              </strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Generated Items</span>
              <strong className="text-cyan-400">{runtimeData?.metrics?.total_contents || 0}건</strong>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-600 text-center">
              Agent Runtime Kernel v3.11
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#060911] space-y-6">
          {/* STEP 11: Real-time Operations Overview Top Stats (Sections 2, 7) */}
          <OperationsTopBar
            activeRunsCount={operationsData?.counts?.active_runs ?? (runtimeData?.current_run?.status === "RUNNING" ? 1 : 0)}
            waitingApprovalCount={
              operationsData?.counts?.waiting_approval ??
              (runtimeData?.current_run?.status === "WAITING_FOR_APPROVAL" || runtimeData?.approval_status === "WAITING_FOR_APPROVAL" ? 1 : 0)
            }
            failedRunsCount={operationsData?.counts?.failed_runs ?? (runtimeData?.current_run?.status === "FAILED" ? 1 : 0)}
            scheduledCount={operationsData?.counts?.scheduled ?? 1}
            schedulerMode={operationsData?.scheduler?.execution_mode || "Manual / External Tick"}
            onNavigateTab={(tab) => setAdminTab(tab)}
          />

          {/* TAB: APPROVAL QUEUE (STEP 11) */}
          {adminTab === "queue" && (
            <div className="animate-in fade-in duration-200">
              <ApprovalQueueView
                onSelectRun={(runId) => {
                  setSelectedRunId(runId);
                  setAdminTab("dashboard");
                }}
                onRefreshStats={() => {
                  fetchRuntimeData();
                }}
              />
            </div>
          )}

          {/* TAB: RESEARCH & CRAWL INTELLIGENCE (STEP 13) */}
          {adminTab === "research" && (
            <div className="animate-in fade-in duration-200">
              <ResearchMonitorView />
            </div>
          )}

          {/* TAB 1: WORKFLOW GRAPH (DASHBOARD) */}
          {adminTab === "dashboard" && (
            <div className="space-y-6">
              {/* Proactive Approval Gate Card when Waiting for Admin Decision */}
              {(runtimeData?.current_run?.status === "WAITING_FOR_APPROVAL" ||
                runtimeData?.approval_status === "WAITING_FOR_APPROVAL") && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <ContentApprovalCard
                    runId={runtimeData.current_run.run_id}
                    content={
                      runtimeData.workflow?.find((w: any) => w.id === "node-approval-gate")?.target_content ||
                      runtimeData.workflow?.find((w: any) => w.id === "node-content-gen")?.content_item
                    }
                    approvalStatus={runtimeData.current_run.approval_status || "WAITING_FOR_APPROVAL"}
                    approvalRequestId={
                      runtimeData.workflow?.find((w: any) => w.id === "node-approval-gate")?.approval_request_id
                    }
                    approvalVersion={1}
                    onApprove={handleApproveContent}
                    onReject={handleRejectContent}
                  />
                </div>
              )}

              {/* Upper Split: Workflow Graph (65%) + Node Detail (35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        Backend Agent Workflow Graph
                      </h2>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      Click any node to inspect agent runtime state
                    </span>
                  </div>

                  {runtimeData?.workflow && runtimeData.workflow.length > 0 ? (
                    <AgentWorkflowGraph
                      nodes={runtimeData.workflow}
                      selectedNodeId={selectedNode?.id || runtimeData.workflow[0]?.id}
                      onSelectNode={setSelectedNode}
                    />
                  ) : (
                    <div className="h-[520px] bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 font-mono text-xs space-y-2 text-center p-6">
                      <Server className="w-10 h-10 text-slate-700" />
                      <p className="text-white font-bold text-sm">No Active Run</p>
                      <p className="text-slate-600">백엔드에서 실행 중이거나 기록된 파이프라인 Run이 없습니다.</p>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 h-[590px]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        Node Detail Panel
                      </h2>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono font-bold">
                      {selectedNode?.id || "node-research"}
                    </span>
                  </div>

                  <NodeDetailPanel
                    node={selectedNode || (runtimeData?.workflow?.[0] ?? null)}
                    onApprove={handleApproveContent}
                    onReject={handleRejectContent}
                  />
                </div>
              </div>

              {/* Lower: Run Monitor / Agent Status / Audit Logs */}
              <div>
                <RunMonitorPanel
                  currentRun={runtimeData?.current_run ?? null}
                  runs={runtimeData?.runs || []}
                  logs={runtimeData?.logs || []}
                  agents={runtimeData?.agents || []}
                  selectedRunId={selectedRunId}
                  onSelectRun={handleSelectRun}
                />
              </div>
            </div>
          )}

          {/* TAB 2: AGENTS */}
          {adminTab === "agents" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    Fleet Agent Runtime Matrix
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    GRAD EXHIBIT PRO를 구동하는 5대 전용 백엔드 에이전트의 실시간 가동 상태 및 Throughput 지표
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  All Systems Operational
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(runtimeData?.agents || []).map((ag: any) => (
                  <div
                    key={ag.id}
                    className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                          Stage: {ag.node}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">{ag.name}</h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {ag.status}
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Throughput</span>
                        <strong className="text-slate-200">{ag.throughput}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Last Active</span>
                        <strong className="text-slate-200 truncate max-w-[140px]">{ag.last_active}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Health</span>
                        <strong className="text-emerald-400">{ag.health}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RUNS */}
          {adminTab === "runs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    Pipeline Execution History
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Content Generation, Research Intelligence, Data Sync 파이프라인의 최근 실행 기록
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Total Runs: {runtimeData?.runs?.length || 0}
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Run ID</th>
                      <th className="p-3.5">Pipeline</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Current Node</th>
                      <th className="p-3.5">Records / Summary</th>
                      <th className="p-3.5">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                    {(runtimeData?.runs || []).map((r: any, idx: number) => (
                      <tr key={r.run_id + idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-white">{r.run_id}</td>
                        <td className="p-3.5 text-cyan-400">{r.pipeline}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">{r.current_node}</td>
                        <td className="p-3.5">{r.records}</td>
                        <td className="p-3.5 text-slate-400">{r.completed_at || r.started_at || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: WORKFLOW SCHEDULER (STEP 10) */}
          {adminTab === "schedules" && (
            <SchedulerManager />
          )}

          {/* TAB 4: DATA SYNC */}
          {adminTab === "datasync" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-cyan-400" />
                    4-Domain Database Sync & Verification Status
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    교수진, 기업 산학 과제, 브랜드 Open IP, 현직자 멘토링 4대 영역의 출처 검증 및 동기화 현황
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                  Dual Atomic Sync Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">🎓 교수 프로필</span>
                    <span className="text-xs font-mono text-emerald-400">Tier 1~2</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {runtimeData?.workflow?.[1]?.validation_breakdown?.professors || "24/24"}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    대학 공식 홈페이지(ac.kr) 및 교원 정보 인증 완료
                  </p>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">🚗 산학협력 RFP</span>
                    <span className="text-xs font-mono text-emerald-400">Verified</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {runtimeData?.workflow?.[1]?.validation_breakdown?.rfp || "10/10"}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    기업 공문 및 과제 공고 사실 검증 완료
                  </p>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">🏷️ 브랜드 Open IP</span>
                    <span className="text-xs font-mono text-emerald-400">Verified</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {runtimeData?.workflow?.[1]?.validation_breakdown?.brand_ip || "10/10"}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    공식 브랜드 가이드라인 및 로고 에셋 검증
                  </p>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">💼 현직자 멘토</span>
                    <span className="text-xs font-mono text-emerald-400">Verified</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {runtimeData?.workflow?.[1]?.validation_breakdown?.mentors || "10/10"}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    재직 증빙 및 실무 경력 확인 완료
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONTENT */}
          {adminTab === "content" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <FileCheck2 className="w-5 h-5 text-cyan-400" />
                    STEP 8 Generated Content & Approval Gate
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    10포인트 자동 QA를 통과하고 승인 대기(APPROVAL_REQUIRED) 중인 생성 콘텐츠 목록
                  </p>
                </div>
                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-800/40">
                  Human Review Required
                </span>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  총 {runtimeData?.metrics?.total_contents || 0}건의 콘텐츠가 생성되었으며, 모두 100% 출처 근거 매핑(Source Traceability) 및 무결성 검증을 통과했습니다.
                  STEP 9 SNS 자동 발행 전 관리자의 수동 승인을 대기하고 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: LEGACY CARD NEWS INSPECTION */}
          {adminTab === "cardnews" && (
            <div className="space-y-8">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🎨</span> 기존 졸전 카드뉴스 정밀 캡처 & 검수 콘솔
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    공식 졸업전시 URL을 직접 입력받아 내부 GNB를 탐색하고 학생 작품을 실시간 캡처·검수합니다.
                  </p>
                </div>
                <button
                  onClick={() => setAdminTab("dashboard")}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-bold text-xs"
                >
                  ⚡ Workflow Graph로 돌아가기
                </button>
              </div>

              
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 대시보드 나가기 (공개 갤러리로)
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              전국 대학교 졸업전시 <span className="text-cyan-600 dark:text-cyan-400">관제 및 정밀 캡처 시스템</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-400 text-xs font-semibold">
              v2.5 수동 주입 & 정밀 캡처
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            공식 졸업전시 URL을 직접 입력받아 내부 GNB(Project/Designer/Works)를 스마트 탐색하고 학생 작품을 실시간 캡처·검수합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 관제 시스템 서브 내비게이션 탭 */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-bold shadow-sm"
            >
              🎨 졸전 카드뉴스 검수
            </Link>
            <Link
              href="/admin/professors"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium"
            >
              🎓 교수 관제
            </Link>
            <Link
              href="/admin/content"
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium"
            >
              🎬 콘텐츠 리서치
            </Link>
          </div>
          <button
            onClick={() => setIsScreenshotModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 transition"
          >
            <ClipboardPaste className="w-4 h-4" /> 📸 스크린샷 직접 붙여넣기 (Ctrl+V)
          </button>
          <button
            onClick={() => {
              const input = document.getElementById("admin-url-input");
              if (input) {
                input.scrollIntoView({ behavior: "smooth", block: "center" });
                input.focus();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <Globe className="w-4 h-4 text-slate-600 dark:text-slate-300" /> 공식 URL 탐색 캡처
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Target Configuration Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> 리서치 대상 파라미터 구성
          </h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
              <Cpu className="w-3 h-3 text-cyan-500" /> 로컬 Qwen2.5-VL 연동됨
            </span>
            <span className="text-xs text-cyan-700 dark:text-cyan-400 font-mono font-semibold">
              {targetCardId ? `선택 카드: ${targetCardId}` : "새 대학교 카드 추가"}
            </span>
          </div>
        </div>

        {/* 🌐 졸업전시회 링크 직격 삽입 & 로컬 LLM 자동 채우기 바 */}
        <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/90 border border-cyan-500/40 shadow-sm space-y-2.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <label htmlFor="admin-url-input" className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>졸업전시회 링크(URL) 삽입</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-gray-400">
                — URL을 입력하면 로컬 AI가 대학교, 학과, 연도, 산업군을 자동 인식하여 아래 입력란에 채워넣습니다.
              </span>
            </label>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono hidden md:inline">
              ⚡ llama-server: 8080 (Qwen2.5-VL)
            </span>
          </div>

          {/* 📌 스크래핑 범위 및 교수 연계 원칙 안내 */}
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 px-3 py-1.5 rounded-lg">
            <span className="text-cyan-700 dark:text-cyan-400 font-bold shrink-0">📌 스크래핑 원칙:</span>
            <span>입력된 링크에서는 <strong>메인 포스터</strong>와 <strong>졸업작품(갤러리)</strong>만 정밀 스크래핑되며, 교수 정보는 <strong>학과 커리큘럼(교수) 페이지(/professors)</strong>에 자동 연계 추가됩니다.</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <input
                id="admin-url-input"
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCapturing && manualUrl.trim()) {
                    handleStartManualCapture();
                  }
                }}
                placeholder="추가/업데이트할 대학교 졸업전시회 공식 URL을 입력하세요 (예: https://sidi.hongik.ac.kr)"
                disabled={isCapturing}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono transition shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={handleAutoFillOnly}
                disabled={isCapturing || !manualUrl.trim()}
                className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700 hover:border-cyan-500 text-cyan-800 dark:text-cyan-300 font-bold text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="URL을 분석하여 아래 대상 대학교, 학과, 연도, 산업군 입력창만 자동 완성합니다"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>AI 정보만 채우기</span>
              </button>

              <button
                type="button"
                onClick={handleStartManualCapture}
                disabled={isCapturing || !manualUrl.trim()}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition cursor-pointer"
                title="로컬 LLM 인식 후 기존 졸업작품 탐색 엔진을 가동하여 하단 검수 패널을 채웁니다"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>AI 자동 인식 및 탐색 캡처 중...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>🤖 AI 자동 인식 & 졸업작품 탐색 캡처</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1.5">대상 대학교</label>
            <input
              type="text"
              value={targetUniv}
              onChange={(e) => setTargetUniv(e.target.value)}
              placeholder="예: 서경대학교, 서울대학교"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1.5">대상 학과</label>
            <input
              type="text"
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              placeholder="예: 시각정보디자인, 디자인과"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1.5">대상 연도</label>
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="2026"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1.5">8대 표준 산업군</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
            <School className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>대기열 목록에서 바로 선택:</span>
            <select
              value={selectedPreset}
              onChange={handleSelectPreset}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-gray-200 focus:outline-none focus:border-cyan-600 max-w-xs shadow-sm"
            >
              <option value="">대기열 목록에서 대학 선택...</option>
              {queueItems.map((item) => {
                const keyVal = `${item.university} - ${item.department}`;
                return (
                  <option key={item.id} value={keyVal}>
                    [{item.id}] {item.university} {item.department} ({item.status || "대기"})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsScreenshotModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4" />
              📸 스크린샷 직접 붙여넣기 등록
            </button>
            <button
              onClick={() => {
                const input = document.getElementById("admin-url-input");
                if (input) {
                  input.scrollIntoView({ behavior: "smooth", block: "center" });
                  input.focus();
                }
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 hover:border-slate-400 dark:hover:border-gray-500 text-slate-700 dark:text-gray-200 font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <Globe className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              URL 직접 입력
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Channel Publishing & Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Multi-Channel Publishing Actions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> SNS 원클릭 자동 배포
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            검수 완료된 에셋과 캡션을 각 공식 채널에 다이렉트로 전송합니다.
          </p>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => publishTo("instagram")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-pink-50 dark:bg-gradient-to-r dark:from-pink-950/40 dark:to-purple-950/40 border border-pink-200 dark:border-pink-700/50 hover:border-pink-300 dark:hover:border-pink-500 text-pink-900 dark:text-pink-200 text-xs font-bold transition shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400" /> 인스타그램 캐러셀 포스팅
              </span>
              <span className="text-[11px] font-mono text-pink-700 dark:text-pink-300">{publishStatus["instagram"] || "전송"}</span>
            </button>

            <button
              onClick={() => publishTo("threads")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-500 text-slate-800 dark:text-gray-200 text-xs font-bold transition shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-slate-600 dark:text-gray-300" /> 스레드(Threads) 타래 배포
              </span>
              <span className="text-[11px] font-mono text-slate-600 dark:text-gray-400">{publishStatus["threads"] || "전송"}</span>
            </button>

            <button
              onClick={() => publishTo("youtube")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-600 text-red-900 dark:text-red-200 text-xs font-bold transition shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-600 dark:text-red-400" /> 유튜브 쇼츠/영상 업로드
              </span>
              <span className="text-[11px] font-mono text-red-700 dark:text-red-300">{publishStatus["youtube"] || "전송"}</span>
            </button>
          </div>
        </div>

        {/* Right: Live Terminal Logs */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs flex flex-col justify-between shadow-md text-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 font-bold mb-3">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" /> 실시간 파이프라인 관제 로그
              </span>
              <span className="text-[10px] text-emerald-400">● LIVE</span>
            </div>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-2" suppressHydrationWarning>
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-300 leading-relaxed font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>스마트 크롤러: Playwright GNB 탐색 & 정밀 스크린샷 엔진</span>
            <span>정적 저장소: public/captures/</span>
          </div>
        </div>
      </div>

      {/* 4. 하단 '실시간 에셋 캡처 검수 패널 (Inspection Panel)' */}
      <section id="inspection-panel" className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0b0f19] border-2 border-cyan-500/40 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-200 dark:border-gray-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 text-xs font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 실시간 에셋 캡처 검수 뷰어
              </span>
              {inspectionData && (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                  검수 대기중 (승인 필요)
                </span>
              )}
              {approvalSuccess && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 수집 승인 완료됨
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
              {inspectionData
                ? `${inspectionData.university || targetUniv} ${inspectionData.department || targetDept} 캡처 에셋`
                : "리서치 노드 에셋 캡처 검수 대기"}
            </h2>
          </div>

          {inspectionData && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <a
                href={inspectionData.target_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-gray-700 text-cyan-700 dark:text-cyan-400 font-semibold transition"
              >
                메인 사이트 방문 <ExternalLink className="w-3 h-3" />
              </a>
              {inspectionData.project_url && inspectionData.project_url !== inspectionData.target_url && (
                <a
                  href={inspectionData.project_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 font-semibold transition"
                >
                  GNB 탐색 경로 <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Inspection Content Body */}
        {inspectionData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: 메인 포스터 */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border border-slate-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 메인 전시 포스터 / 키 비주얼
                  </h4>
                  <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-mono font-semibold">
                    {inspectionData.card_id}
                  </span>
                </div>

                <div className="relative aspect-[3/4] w-full bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-800 shadow-sm group/poster flex items-center justify-center">
                  {(editableMainPoster || inspectionData.main_poster) ? (
                    <img
                      src={editableMainPoster || inspectionData.main_poster}
                      alt="메인 포스터"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 text-xs">
                      <ImageIcon className="w-8 h-8 mb-2 text-slate-400 dark:text-gray-600" />
                      포스터 캡처 없음
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/poster:opacity-100 flex items-center justify-center cursor-pointer transition text-xs text-white font-bold gap-1.5 backdrop-blur-xs">
                    <Upload className="w-4 h-4" /> 포스터 이미지 변경
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadMainPoster(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">
                    전시 공식 타이틀 (수정 가능)
                  </label>
                  <input
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                  />
                </div>
              </div>

              {/* Right Column: 탐색된 학생 및 작품 인터랙티브 검수 그리드 */}
              <div className="lg:col-span-2 space-y-3 bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border border-slate-200 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-gray-800/80 pb-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 내부 링크 스마트 크롤링: 학생 및 출품작 ({worksList.length}점)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVisionModalOpen(true)}
                      disabled={isVisionExtracting}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-300 text-xs font-bold transition shadow-sm disabled:opacity-50"
                      title="Gemini Vision 스크린샷 작품 인식 및 자동 크롭"
                    >
                      {isVisionExtracting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      )}
                      📸 스크린샷 AI 자동 크롭 (Vision)
                    </button>
                    <button
                      type="button"
                      onClick={handleAddWorkCard}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-300 text-xs font-bold transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 새 작품 카드 추가
                    </button>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400 hidden sm:inline">
                      * 작가명·작품명·캡션·링크 즉시 수정
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                  {worksList.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden p-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-gray-700 hover:shadow-sm transition space-y-2.5 relative group"
                    >
                      {/* Card Header: #Number, Author Badge Input, Delete Button */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">#{idx + 1}</span>
                          {/* 작가/학생 이름 태그 인풋 (클릭 시 인라인 수정 가능한 뱃지 형태) */}
                          <input
                            type="text"
                            value={item.author || ""}
                            onChange={(e) => handleUpdateWorkField(idx, "author", e.target.value)}
                            placeholder="학생/작가 이름"
                            className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-slate-800 border border-cyan-200 dark:border-slate-700 focus:border-cyan-500 text-cyan-800 dark:text-cyan-300 text-xs font-semibold focus:outline-none w-full placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkCard(idx)}
                          className="p-1 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition shrink-0"
                          title="오탐 카드 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Thumbnail Image with change button / upload trigger */}
                      <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-800 group/img flex items-center justify-center">
                        {(item.screenshot_path || item.thumbnail || item.image_url) ? (
                          <img
                            src={item.screenshot_path || item.thumbnail || item.image_url}
                            alt={item.project_title || item.title || "작품 썸네일"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400 dark:text-gray-500">
                            <ImageIcon className="w-5 h-5 mb-1 text-slate-400 dark:text-gray-600" />
                            <span className="text-[10px]">이미지 등록 필요</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition text-xs text-white dark:text-cyan-300 font-semibold gap-1 backdrop-blur-xs">
                          <Upload className="w-3.5 h-3.5" /> 이미지 변경
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUploadCardImage(idx, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* 작품 타이틀 (Title) 인라인 수정 */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-gray-400 mb-0.5">작품 타이틀</label>
                        <input
                          type="text"
                          value={item.project_title || ""}
                          onChange={(e) => handleUpdateWorkField(idx, "project_title", e.target.value)}
                          placeholder="작품 타이틀"
                          className="w-full px-2.5 py-1 rounded bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 focus:border-cyan-600 text-xs font-bold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600"
                        />
                      </div>

                      {/* 상세 캡션 / 요약 설명 (Caption) */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-gray-400 mb-0.5">상세 캡션 / 요약</label>
                        <textarea
                          rows={2}
                          value={item.raw_text || ""}
                          onChange={(e) => handleUpdateWorkField(idx, "raw_text", e.target.value)}
                          placeholder="1~2줄 요약 설명 / 캡션"
                          className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 focus:border-cyan-600 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600 resize-none leading-relaxed"
                        />
                      </div>

                      {/* 상세 링크 입력창 (Detail Link) & 새 창 열기 버튼 */}
                      <div className="pt-1 border-t border-slate-100 dark:border-gray-800/60">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <label className="text-[10px] font-semibold text-slate-600 dark:text-gray-400 flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400" /> 상세 링크 URL
                          </label>
                          {item.detail_url && (
                            <a
                              href={item.detail_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 flex items-center gap-0.5 font-semibold"
                            >
                              상세 이동 ↗
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          value={item.detail_url || ""}
                          onChange={(e) => handleUpdateWorkField(idx, "detail_url", e.target.value)}
                          placeholder="https://... 작품 상세 페이지 URL"
                          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-600 text-[11px] text-slate-800 dark:text-cyan-300 font-mono focus:outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                  ))}

                  {/* 점선 박스 스타일의 새 작품 카드 추가 버튼 */}
                  <button
                    type="button"
                    onClick={handleAddWorkCard}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-xl p-4 flex flex-col items-center justify-center min-h-[220px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition group cursor-pointer shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-gray-700 group-hover:border-cyan-500 flex items-center justify-center mb-2 text-cyan-600 dark:text-cyan-400 transition">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-gray-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                      + 새 작품 카드 추가
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-gray-500 mt-1 text-center">
                      누락된 학생 출품작 직접 등록
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 🎓 학과 커리큘럼(교수) 연계 안내 바 */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold">🎓 학과 커리큘럼(교수) 페이지 자동 연계:</span>
                  <span className="ml-1 text-slate-600 dark:text-slate-300">
                    수집 승인 시 <strong>{targetUniv} {targetDept}</strong>의 교수진 정보가 학과 커리큘럼(교수) 데이터베이스에 자동 등록되며, 출품작과 연계됩니다.
                  </span>
                </div>
              </div>
              <Link
                href="/professors"
                target="_blank"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shrink-0 transition shadow-sm"
              >
                교수 페이지 확인 ↗
              </Link>
            </div>

            {/* Action Buttons Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={handleReject}
                disabled={isApproving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-bold text-xs transition shadow-sm"
              >
                <RotateCcw className="w-4 h-4" /> ❌ 반려 및 재입력
              </button>

              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> 카드 반영 및 갤러리 이동 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> ✅ 수집 승인 및 카드 반영
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Empty Placeholder */
          <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-cyan-600 shadow-sm">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              실시간 검수할 캡처 데이터가 없습니다.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              상단 [졸업전시회 링크(URL) 삽입] 란에 공식 사이트 주소를 입력하면, 로컬 LLM이 대학교/학과/연도를 자동 인식하여 파라미터를 채우고 학생 출품작과 포스터를 이곳에 로드합니다.
            </p>
            <button
              onClick={() => {
                const input = document.getElementById("admin-url-input");
                if (input) {
                  input.scrollIntoView({ behavior: "smooth", block: "center" });
                  input.focus();
                }
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" /> 상단 URL 입력란으로 이동
            </button>
          </div>
        )}
      </section>

      {/* URL 직접 입력 모달 (Manual Injection Modal) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => !isCapturing && setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 md:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900">
                  졸업전시 공식 URL 직접 입력 & 정밀 캡처
                </h3>
              </div>
              {!isCapturing && (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Target Card Badges */}
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-mono">
                카드 ID: <strong className="text-cyan-700 font-bold">{targetCardId || "DES-CUSTOM"}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-700">
                대학: <strong>{targetUniv || "대학 미지정"}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-700">
                학과: <strong>{targetDept || "학과 미지정"}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                {selectedYear}년
              </span>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                졸업전시 공식 웹사이트 URL
              </label>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="예: https://2025.skuniv-vd.com"
                disabled={isCapturing}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                * 입력된 URL로 Playwright가 직행하여 메인 포스터를 캡처하고, GNB(Project/Designer/Works) 메뉴를 클릭하여 대표 학생 출품작을 수집합니다.
              </p>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isCapturing}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                취소
              </button>

              <button
                onClick={handleStartManualCapture}
                disabled={isCapturing || !manualUrl.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    내부 링크 탐색 및 캡처 중...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    정밀 리서치 & 캡처 시작
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI Vision 스크린샷 자동 크롭 모달 */}
      {isVisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    AI 스크린샷 작품 자동 크롭 & OCR
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    전체 스크린샷에서 각 학생 작품을 시각적으로 탐지하고 1:1 개별 카드로 자동 분할합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVisionModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 비전 엔진 선택 탭 (로컬 Qwen2.5-VL vs Gemini Vision) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  ⚡ 비전 분석 엔진 선택
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setVisionEngine('local')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      visionEngine === 'local'
                        ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-sm border border-purple-300 dark:border-purple-600'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Cpu className="w-4 h-4 text-purple-500" />
                    <span>로컬 Qwen2.5-VL</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-normal">무료</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisionEngine('gemini')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      visionEngine === 'gemini'
                        ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-sm border border-purple-300 dark:border-purple-600'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Gemini 2.5 Flash</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-normal">클라우드</span>
                  </button>
                </div>
              </div>

              {/* 로컬 llama-server 설정 패널 */}
              {visionEngine === 'local' && (
                <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-purple-500" /> llama-server URL
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ● 로컬 GPU 오프라인 구동
                    </span>
                  </div>
                  <input
                    type="text"
                    value={llamaServerUrl}
                    onChange={(e) => setLlamaServerUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8080"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>💡 터미널 llama-server 실행 가이드:</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">--mmproj 필수</span>
                    </p>
                    <code className="block p-1.5 bg-slate-900 text-emerald-400 rounded text-[10px] font-mono break-all select-all">
                      llama-server.exe -m Qwen_Qwen2.5-VL-7B-Instruct-Q5_K_M.gguf --mmproj Qwen_Qwen2.5-VL-7B-Instruct-mmproj.gguf -ngl 99 --port 8080
                    </code>
                    <p className="text-[10px] text-slate-500">
                      * Qwen2.5-VL 모델과 mmproj 프로젝터가 함께 로드되어야 이미지 바운딩 박스를 인식할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Gemini API Key 설정 패널 */}
              {visionEngine === 'gemini' && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      🔑 Gemini API Key
                    </span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      Google AI Studio 키 발급 ↗
                    </a>
                  </div>
                  <input
                    type="password"
                    value={visionApiKey}
                    onChange={(e) => {
                      setVisionApiKey(e.target.value);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("GEMINI_API_KEY", e.target.value);
                      }
                    }}
                    placeholder="AIzaSy... (입력 시 .env 및 브라우저에 자동 영구 저장)"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    * Gemini 2.5 Flash가 작품명(Title) 텍스트와 썸네일을 1:1로 초정밀 자동 크롭합니다.
                  </p>
                </div>
              )}

              {/* Option A: 현재 메인 포스터/스크린샷 분할 */}
              {(editableMainPoster || inspectionData?.main_poster) && (
                <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={editableMainPoster || inspectionData?.main_poster}
                      alt="현재 캡처 이미지"
                      className="w-14 h-14 object-cover rounded-lg border border-purple-200 dark:border-purple-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        현재 검수 뷰어의 캡처 이미지 사용
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        현재 패널에 등록된 포스터/스크린샷에서 작품 분할
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunVisionExtraction('current')}
                    disabled={isVisionExtracting}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    {isVisionExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    즉시 분할
                  </button>
                </div>
              )}

              {/* Option B: 새 스크린샷 파일 업로드 / Ctrl+V 붙여넣기 */}
              <div
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (items) {
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.startsWith("image/")) {
                        const file = items[i].getAsFile();
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (re) => {
                            setVisionImagePreview(re.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                          break;
                        }
                      }
                    }
                  }
                }}
                tabIndex={0}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center hover:border-purple-500 transition cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:border-purple-500"
              >
                {visionImagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={visionImagePreview}
                      alt="분석 대상 스크린샷"
                      className="max-h-48 mx-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <label className="text-xs text-purple-600 dark:text-purple-400 font-semibold cursor-pointer hover:underline">
                        다른 이미지로 변경
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const r = new FileReader();
                              r.onload = (re) => setVisionImagePreview(re.target?.result as string);
                              r.readAsDataURL(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setVisionImagePreview(null)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer space-y-2">
                    <ClipboardPaste className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      여기를 클릭하여 스크린샷 이미지 선택 또는 <span className="text-purple-600 dark:text-purple-400">Ctrl + V</span> 붙여넣기
                    </p>
                    <p className="text-[11px] text-slate-400">
                      작품 목록이 격자로 나열된 전체 화면 캡처 이미지를 권장합니다.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const r = new FileReader();
                          r.onload = (re) => setVisionImagePreview(re.target?.result as string);
                          r.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {visionImagePreview && (
                <button
                  type="button"
                  onClick={() => handleRunVisionExtraction('custom')}
                  disabled={isVisionExtracting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition disabled:opacity-50"
                >
                  {isVisionExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {visionEngine === 'local' ? '로컬 Qwen2.5-VL 작품 분석 및 자동 크롭 중...' : 'Gemini Vision 작품 감지 및 자동 크롭 중...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {visionEngine === 'local' ? '로컬 Qwen2.5-VL로 작품 자동 크롭 및 카드 생성' : 'Gemini Vision으로 작품 자동 크롭 및 카드 생성'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 스크린샷 직접 붙여넣기 모달 (Ctrl+V) */}
      <ScreenshotUploadModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        initialData={{
          id: targetCardId,
          university: targetUniv,
          department: targetDept,
          year: selectedYear,
          category: selectedIndustry,
          title: editableTitle || (targetUniv && targetDept ? `[${targetUniv}] ${selectedYear}년 ${targetDept} 졸업전시회` : ""),
        }}
        queueList={queueItems}
        onSuccess={async () => {
          await loadQueue();
          const timestamp = new Date().toLocaleTimeString();
          setLogs((prev) => [
            ...prev,
            `[${timestamp}] 📸 [스크린샷 직접 등록 성공] ${targetUniv || "선택"} ${targetDept || "학과"} 공식 포스터 및 출품작이 저장되었습니다!`,
          ]);
        }}
      />
    
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500 font-mono text-sm">
          관리자 관제 시스템 로딩 중...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
