"use client";

import { ScanScores, ScanTelemetry } from "@/lib/types/audit";
import { ShieldCheck, ShieldAlert, Lock, Clock, Globe, ArrowUpRight } from "lucide-react";

interface ScoreOverviewProps {
  scores: ScanScores;
  telemetry: ScanTelemetry;
  executionTimeMs: number;
}

export function ScoreOverview({ scores, telemetry, executionTimeMs }: ScoreOverviewProps) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "Grade A+":
      case "Grade A":
        return {
          text: "text-emerald-400",
          border: "border-emerald-500/40",
          bg: "bg-emerald-950/40",
          stroke: "#10b981",
        };
      case "Grade B":
        return {
          text: "text-sky-400",
          border: "border-sky-500/40",
          bg: "bg-sky-950/40",
          stroke: "#38bdf8",
        };
      case "Grade C":
        return {
          text: "text-amber-400",
          border: "border-amber-500/40",
          bg: "bg-amber-950/40",
          stroke: "#f59e0b",
        };
      default:
        return {
          text: "text-rose-400",
          border: "border-rose-500/40",
          bg: "bg-rose-950/40",
          stroke: "#f43f5e",
        };
    }
  };

  const gradeStyle = getGradeColor(scores.grade);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-20"
        style={{ backgroundColor: gradeStyle.stroke }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left: Overall Score Radial & Grade */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={gradeStyle.stroke}
                strokeWidth="8"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * scores.overallScore) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
                {scores.overallScore}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">OUT OF 100</span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${gradeStyle.bg} ${gradeStyle.border} ${gradeStyle.text}`}
            >
              {scores.overallScore >= 80 ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              <span>{scores.grade}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 break-all">
              {telemetry.domain}
            </h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {executionTimeMs} ms
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sky-400">
                <Lock className="w-3.5 h-3.5" />
                {telemetry.tlsVersion}
              </span>
            </div>
          </div>
        </div>

        {/* Right: 3-Pillar Breakdown Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Pillar 1
              </span>
              <h4 className="text-sm font-semibold text-slate-200">OWASP Security</h4>
              <p className="text-[11px] text-slate-400 mt-1">HttpOnly, Secure &amp; SameSite</p>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-slate-850 pt-2">
              <span className="text-2xl font-bold text-sky-400">
                {scores.pillarOwaspScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 35 pts</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Pillar 2
              </span>
              <h4 className="text-sm font-semibold text-slate-200">Tracking Guard</h4>
              <p className="text-[11px] text-slate-400 mt-1">Pre-Consent Ad Trackers</p>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-slate-850 pt-2">
              <span className="text-2xl font-bold text-indigo-400">
                {scores.pillarTrackingScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 35 pts</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Pillar 3
              </span>
              <h4 className="text-sm font-semibold text-slate-200">DPDP &amp; GDPR</h4>
              <p className="text-[11px] text-slate-400 mt-1">Rule 3 Notice &amp; DPO</p>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-slate-850 pt-2">
              <span className="text-2xl font-bold text-emerald-400">
                {scores.pillarLegalScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 30 pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
