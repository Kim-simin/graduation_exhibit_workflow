"use client";

import React, { useState, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Layers,
  ShieldCheck,
  Zap,
  ArrowDown,
  UserCheck,
} from "lucide-react";

export interface WorkflowNodeData {
  id: string;
  name: string;
  agent_name: string;
  role: string;
  status: "Idle" | "Running" | "Completed" | "Failed" | "Blocked";
  last_run_time: string;
  records_count: string;
  error: string;
  input: string;
  source: string;
  output: string;
  [key: string]: any;
}

interface AgentWorkflowGraphProps {
  nodes: WorkflowNodeData[];
  selectedNodeId: string;
  onSelectNode: (node: WorkflowNodeData) => void;
}

export default function AgentWorkflowGraph({
  nodes,
  selectedNodeId,
  onSelectNode,
}: AgentWorkflowGraphProps) {
  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1.6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleFitView = () => {
    setZoom(0.95);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.001;
    setZoom((prev) => Math.min(Math.max(prev + zoomDelta, 0.5), 1.6));
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".workflow-node-card")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Status visual mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "WAITING_FOR_APPROVAL":
      case "APPROVAL_REQUIRED":
        return {
          badgeBg: "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold animate-pulse",
          dotBg: "bg-amber-400 animate-ping",
          border: "border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/50",
        };
      case "APPROVED":
        return {
          badgeBg: "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold",
          dotBg: "bg-emerald-400",
          border: "border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        };
      case "REJECTED":
        return {
          badgeBg: "bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold",
          dotBg: "bg-rose-400",
          border: "border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]",
        };
      case "Running":
      case "RUNNING":
        return {
          badgeBg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
          dotBg: "bg-cyan-400 animate-pulse",
          border: "border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.25)]",
        };
      case "Completed":
      case "COMPLETED":
        return {
          badgeBg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
          dotBg: "bg-emerald-400",
          border: "border-emerald-500/40 hover:border-emerald-400/80",
        };
      case "Failed":
      case "FAILED":
        return {
          badgeBg: "bg-rose-500/15 border-rose-500/40 text-rose-400",
          dotBg: "bg-rose-400 animate-ping",
          border: "border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
        };
      case "Blocked":
      case "BLOCKED":
      case "Paused":
      case "PAUSED":
        return {
          badgeBg: "bg-amber-500/15 border-amber-500/40 text-amber-400",
          dotBg: "bg-amber-400",
          border: "border-amber-500/50",
        };
      case "Pending":
      case "PENDING":
        return {
          badgeBg: "bg-slate-800/80 border-slate-700 text-slate-400",
          dotBg: "bg-slate-500",
          border: "border-slate-800/80 hover:border-slate-700",
        };
      case "Skipped":
      case "SKIPPED":
        return {
          badgeBg: "bg-slate-800 border-slate-700 text-slate-500",
          dotBg: "bg-slate-600",
          border: "border-slate-800",
        };
      default:
        return {
          badgeBg: "bg-slate-800 border-slate-700 text-slate-400",
          dotBg: "bg-slate-500",
          border: "border-slate-800",
        };
    }
  };

  const getNodeIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 1:
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 2:
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 3:
        return <Database className="w-4 h-4 text-blue-400" />;
      case 4:
        return <Zap className="w-4 h-4 text-purple-400" />;
      case 5:
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[590px] bg-[#090d16] rounded-2xl border border-slate-800/90 overflow-hidden select-none cursor-${
        isDragging ? "grabbing" : "grab"
      }`}
      style={{
        backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitView}
          title="Fit View / Reset"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-mono"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-800 mx-1" />
        <span className="text-[11px] font-mono text-slate-400 px-1.5">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Pipeline Watermark / Status indicator */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-800 text-[11px] text-slate-400 font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Vertical Linear Pipeline ({nodes.length} Nodes & Approval Gate)</span>
      </div>

      {/* Canvas Viewport (Pan & Zoom Transform) */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center top",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
        className="w-full h-full flex flex-col items-center justify-start pt-16 pb-12 px-4"
      >
        <div className="flex flex-col items-center w-full max-w-[480px]">
          {nodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            const style = getStatusColor(node.status);
            const isLast = index === nodes.length - 1;

            return (
              <React.Fragment key={node.id}>
                {/* Node Card */}
                <div
                  onClick={() => onSelectNode(node)}
                  className={`workflow-node-card group cursor-pointer relative w-full bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3.5 border transition-all duration-200 ${
                    isSelected
                      ? "ring-2 ring-cyan-500 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-[1.02]"
                      : style.border
                  } shadow-md`}
                >
                  {/* Row 1: Header (Step, Icon, Name, Agent, Status) */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 group-hover:scale-110 transition shrink-0">
                        {getNodeIcon(index)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                            STEP {index + 1}
                          </span>
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition truncate">
                            {node.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          {node.agent_name}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${style.badgeBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dotBg}`} />
                      {node.status}
                    </span>
                  </div>

                  {/* Row 2: Metrics Strip */}
                  <div className="bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <div className="truncate pr-2">
                      <span className="text-slate-500 text-[10px] mr-1.5">건수:</span>
                      <span className="font-bold text-slate-200">
                        {node.records_count}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 text-slate-400 text-[10px]">
                      <span>
                        <span className="text-slate-500 mr-1">실행:</span>
                        {node.last_run_time !== "-"
                          ? node.last_run_time.split("T")[1]?.slice(0, 8) || node.last_run_time.slice(11, 19)
                          : "-"}
                      </span>
                      <span>
                        <span className="text-slate-500 mr-1">오류:</span>
                        <span
                          className={node.error !== "None" ? "text-rose-400 font-bold" : "text-emerald-400"}
                        >
                          {node.error}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Animated Downward Flow Connector */}
                {!isLast && (
                  <div className="flex flex-col items-center justify-center my-1.5 h-5 shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="overflow-visible">
                      <line
                        x1="10"
                        y1="0"
                        x2="10"
                        y2="14"
                        stroke="#334155"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="10"
                        y1="0"
                        x2="10"
                        y2="14"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="4 8"
                        className="animate-[dash_1s_linear_infinite]"
                      />
                      <polygon
                        points="6,12 10,18 14,12"
                        fill="#06b6d4"
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
