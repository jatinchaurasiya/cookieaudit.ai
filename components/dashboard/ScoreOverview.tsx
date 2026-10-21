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
          text: "text-[#34c759]",
          border: "border-[#34c759]/30",
          bg: "bg-[#34c759]/10",
          stroke: "#34c759",
        };
      case "Grade B":
        return {
          text: "text-[#0071e3]",
          border: "border-[#0071e3]/30",
          bg: "bg-[#0071e3]/10",
          stroke: "#0071e3",
        };
      case "Grade C":
        return {
          text: "text-[#ff9f0a]",
          border: "border-[#ff9f0a]/30",
          bg: "bg-[#ff9f0a]/10",
          stroke: "#ff9f0a",
        };
      default:
        return {
          text: "text-[#ff453a]",
          border: "border-[#ff453a]/30",
          bg: "bg-[#ff453a]/10",
          stroke: "#ff453a",
        };
    }
  };

  const gradeTheme = getGradeTheme(scores.grade);

  return (
    <div className="rounded-3xl bg-[#161617]/90 border border-white/[0.1] shadow-2xl overflow-hidden backdrop-blur-xl">
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
                stroke="#2c2c2e"
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
              <span className="text-3xl font-semibold text-[#f5f5f7] tracking-tight">
                {scores.overallScore}
              </span>
              <span className="text-[10px] text-[#86868b]">out of 100</span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${gradeTheme.bg} ${gradeTheme.border} ${gradeTheme.text}`}
            >
              {scores.overallScore >= 80 ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              <span>{scores.grade}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-[#f5f5f7] tracking-tight break-all">
              {telemetry.domain}
            </h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-[#86868b]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <Clock className="w-3.5 h-3.5 text-[#86868b]" />
                {executionTimeMs}ms SLA
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#2997ff]">
                <Lock className="w-3.5 h-3.5" />
                {telemetry.tlsVersion}
              </span>
            </div>
          </div>
        </div>

        {/* Right: 3-Pillar Breakdown Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-[#1d1d1f]/60 border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.15] transition-colors duration-200">
            <div>
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Pillar 1
              </span>
              <h4 className="text-xs font-semibold text-[#f5f5f7]">OWASP Security</h4>
              <p className="text-[11px] text-[#86868b] mt-0.5 leading-snug">HttpOnly, Secure, SameSite</p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-white/[0.06] pt-2">
              <span className="text-xl font-semibold text-[#2997ff]">
                {scores.pillarOwaspScore}
              </span>
              <span className="text-[11px] text-[#86868b]">/ 35 pts</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-[#1d1d1f]/60 border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.15] transition-colors duration-200">
            <div>
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Pillar 2
              </span>
              <h4 className="text-xs font-semibold text-[#f5f5f7]">Tracking Guard</h4>
              <p className="text-[11px] text-[#86868b] mt-0.5 leading-snug">Pre-Consent Ad Beacons</p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-white/[0.06] pt-2">
              <span className="text-xl font-semibold text-[#bf5af2]">
                {scores.pillarTrackingScore}
              </span>
              <span className="text-[11px] text-[#86868b]">/ 35 pts</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-[#1d1d1f]/60 border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.15] transition-colors duration-200">
            <div>
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                Pillar 3
              </span>
              <h4 className="text-xs font-semibold text-[#f5f5f7]">DPDP &amp; GDPR</h4>
              <p className="text-[11px] text-[#86868b] mt-0.5 leading-snug">Rule 3 Notice &amp; DPO</p>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-white/[0.06] pt-2">
              <span className="text-xl font-semibold text-[#34c759]">
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
