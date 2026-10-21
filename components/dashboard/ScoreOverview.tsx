"use client";

import { ScanScores, ScanTelemetry } from "@/lib/types/audit";
import { ShieldCheck, ShieldAlert, Lock, Clock, Globe } from "lucide-react";

interface ScoreOverviewProps {
  scores: ScanScores;
  telemetry: ScanTelemetry;
  executionTimeMs: number;
}

export function ScoreOverview({ scores, telemetry, executionTimeMs }: ScoreOverviewProps) {
  const getGradeTheme = (grade: string) => {
    switch (grade) {
      case "Grade A+":
      case "Grade A":
        return {
          text: "text-[#248a3d]",
          border: "border-[#34c759]/40",
          bg: "bg-[#34c759]/15",
          stroke: "#34c759",
        };
      case "Grade B":
        return {
          text: "text-[#0066cc]",
          border: "border-[#0071e3]/40",
          bg: "bg-[#0071e3]/15",
          stroke: "#0071e3",
        };
      case "Grade C":
        return {
          text: "text-[#c93400]",
          border: "border-[#ff9500]/40",
          bg: "bg-[#ff9500]/15",
          stroke: "#ff9500",
        };
      default:
        return {
          text: "text-[#d70015]",
          border: "border-[#ff3b30]/40",
          bg: "bg-[#ff3b30]/15",
          stroke: "#ff3b30",
        };
    }
  };

  const gradeTheme = getGradeTheme(scores.grade);

  return (
    <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Overall Score Radial & Grade */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            {/* Apple Activity style Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#e5e5ea"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={gradeTheme.stroke}
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * scores.overallScore) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-semibold text-[#1d1d1f] tracking-tight">
                {scores.overallScore}
              </span>
              <span className="text-[10px] text-[#86868b]">out of 100</span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${gradeTheme.bg} ${gradeTheme.border} ${gradeTheme.text}`}
            >
              {scores.overallScore >= 80 ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              <span>{scores.grade}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight break-all">
              {telemetry.domain}
            </h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-[#86868b]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-black/[0.06] text-[#1d1d1f]">
                <Clock className="w-3.5 h-3.5 text-[#86868b]" />
                {executionTimeMs}ms SLA
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-black/[0.06] text-[#0066cc] font-medium">
                <Lock className="w-3.5 h-3.5" />
                {telemetry.tlsVersion}
              </span>
            </div>
          </div>
        </div>

        {/* Right: 3-Pillar Breakdown Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] flex flex-col justify-between hover:border-black/[0.12] transition-colors duration-200">
            <div>
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Pillar 1
              </span>
              <h4 className="text-xs font-semibold text-[#1d1d1f]">OWASP Security</h4>
              <p className="text-[11px] text-[#86868b] mt-0.5 leading-snug">HttpOnly, Secure, SameSite</p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-black/[0.06] pt-2">
              <span className="text-xl font-semibold text-[#0066cc]">
                {scores.pillarOwaspScore}
              </span>
              <span className="text-[11px] text-[#86868b]">/ 35 pts</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] flex flex-col justify-between hover:border-black/[0.12] transition-colors duration-200">
            <div>
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Pillar 2
              </span>
              <h4 className="text-xs font-semibold text-[#1d1d1f]">Tracking Guard</h4>
              <p className="text-[11px] text-[#86868b] mt-0.5 leading-snug">Pre-Consent Ad Beacons</p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-black/[0.06] pt-2">
              <span className="text-xl font-semibold text-[#5856d6]">
                {scores.pillarTrackingScore}
              </span>
              <span className="text-[11px] text-[#86868b]">/ 35 pts</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] flex flex-col justify-between hover:border-black/[0.12] transition-colors duration-200">
            <div>
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Pillar 3
              </span>
              <h4 className="text-xs font-semibold text-[#1d1d1f]">DPDP &amp; GDPR</h4>
              <p className="text-[11px] text-[#86868b] mt-0.5 leading-snug">Rule 3 Notice &amp; DPO</p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-black/[0.06] pt-2">
              <span className="text-xl font-semibold text-[#248a3d]">
                {scores.pillarLegalScore}
              </span>
              <span className="text-[11px] text-[#86868b]">/ 30 pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
