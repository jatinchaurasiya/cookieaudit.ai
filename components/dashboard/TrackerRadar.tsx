"use client";

import { TrackerFinding, ComplianceAuditOutput } from "@/lib/types/audit";
import { Radio, CheckCircle2, AlertOctagon } from "lucide-react";

interface TrackerRadarProps {
  trackers: TrackerFinding[];
  bannerAnalysis: ComplianceAuditOutput["bannerAnalysis"];
}

export function TrackerRadar({ trackers, bannerAnalysis }: TrackerRadarProps) {
  const preConsentCount = trackers.filter((t) => t.firedBeforeConsent).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Pre-Consent Third-Party Trackers */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] shadow-xl p-5 sm:p-6 space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Pre-Consent Tracker Telemetry
              </h3>
              <p className="text-[11px] text-slate-400">
                External beacons intercepted during initial page load
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
              preConsentCount > 0
                ? "bg-rose-950/80 text-rose-300 border-rose-800/60"
                : "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
            }`}
          >
            {preConsentCount} Fired Pre-Consent
          </span>
        </div>

        <div className="space-y-2">
          {trackers.length === 0 ? (
            <div className="p-5 rounded-xl bg-slate-950/70 border border-white/[0.05] text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-xs text-slate-300 font-medium font-mono">
                Zero third-party tracking beacons detected prior to consent.
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Website complies with DPDP Section 6 affirmative consent mandates.
              </p>
            </div>
          ) : (
            trackers.map((tr, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.05] flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="font-semibold text-slate-200">
                    {tr.domain}
                  </div>
                  {tr.scriptUrl && (
                    <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                      {tr.scriptUrl}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      tr.category === "Marketing"
                        ? "bg-rose-950 text-rose-300 border border-rose-800/50"
                        : "bg-indigo-950 text-indigo-300 border border-indigo-800/50"
                    }`}
                  >
                    {tr.category}
                  </span>
                  <span className="text-rose-400 text-[10px]">
                    Unconsented
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Cookie Banner & Dark Pattern Audit */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] shadow-xl p-5 sm:p-6 space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Consent Banner &amp; Dark Patterns
              </h3>
              <p className="text-[11px] text-slate-400">
                EU EDPB 3/2022 &amp; DPDP Section 6(4) compliance
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
              bannerAnalysis.hasOneClickReject
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                : "bg-amber-950/80 text-amber-300 border-amber-800/60"
            }`}
          >
            {bannerAnalysis.hasOneClickReject ? "1-Click Reject: YES" : "1-Click Reject: NO"}
          </span>
        </div>

        <div className="space-y-2.5 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-white/[0.05] flex items-center justify-between">
            <span className="text-slate-400">Banner DOM Detected:</span>
            <span className="text-slate-200 font-semibold">
              {bannerAnalysis.bannerDetected ? "Yes (Active)" : "None Found"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-white/[0.05] flex items-center justify-between">
            <span className="text-slate-400">Equal Prominence Reject All:</span>
            <span
              className={`font-semibold ${
                bannerAnalysis.hasOneClickReject ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {bannerAnalysis.hasOneClickReject ? "Compliant" : "Non-Compliant"}
            </span>
          </div>

          {bannerAnalysis.darkPatterns.length === 0 ? (
            <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No deceptive consent nudging or dark patterns detected in banner DOM.</span>
            </div>
          ) : (
            bannerAnalysis.darkPatterns.map((dp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span>{dp.type}</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-300 text-[10px]">
                    {dp.severity} SEVERITY
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-relaxed font-sans">
                  {dp.explanation}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
