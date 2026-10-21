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
      <div className="rounded-3xl bg-[#161617]/90 border border-white/[0.1] shadow-2xl p-6 sm:p-7 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#bf5af2]/10 border border-[#bf5af2]/20 flex items-center justify-center text-[#bf5af2] shrink-0">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f5f5f7] tracking-tight">
                Pre-Consent Tracker Telemetry
              </h3>
              <p className="text-xs text-[#86868b]">
                External beacons intercepted during initial page load
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              preConsentCount > 0
                ? "bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30"
                : "bg-[#34c759]/15 text-[#34c759] border-[#34c759]/30"
            }`}
          >
            {preConsentCount} Fired Pre-Consent
          </span>
        </div>

        <div className="space-y-2">
          {trackers.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#1d1d1f]/40 border border-white/[0.06] text-center">
              <CheckCircle2 className="w-7 h-7 text-[#34c759] mx-auto mb-2" />
              <p className="text-xs text-[#f5f5f7] font-medium">
                Zero third-party tracking beacons detected prior to consent.
              </p>
              <p className="text-xs text-[#86868b] mt-1">
                Website complies with DPDP Section 6 affirmative consent mandates.
              </p>
            </div>
          ) : (
            trackers.map((tr, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#1d1d1f]/60 border border-white/[0.06] flex items-center justify-between text-xs transition-colors duration-150 hover:border-white/[0.12]"
              >
                <div>
                  <div className="font-semibold text-[#f5f5f7]">
                    {tr.domain}
                  </div>
                  {tr.scriptUrl && (
                    <div className="text-[11px] text-[#86868b] truncate max-w-xs mt-0.5 font-mono">
                      {tr.scriptUrl}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      tr.category === "Marketing"
                        ? "bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30"
                        : "bg-[#0071e3]/15 text-[#2997ff] border border-[#0071e3]/30"
                    }`}
                  >
                    {tr.category}
                  </span>
                  <span className="text-[#ff453a] text-xs font-medium">
                    Unconsented
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Cookie Banner & Dark Pattern Audit */}
      <div className="rounded-3xl bg-[#161617]/90 border border-white/[0.1] shadow-2xl p-6 sm:p-7 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center text-[#2997ff] shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f5f5f7] tracking-tight">
                Consent Banner &amp; Dark Patterns
              </h3>
              <p className="text-xs text-[#86868b]">
                EU EDPB 3/2022 &amp; DPDP Section 6(4) compliance
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              bannerAnalysis.hasOneClickReject
                ? "bg-[#34c759]/15 text-[#34c759] border-[#34c759]/30"
                : "bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30"
            }`}
          >
            {bannerAnalysis.hasOneClickReject ? "1-Click Reject: YES" : "1-Click Reject: NO"}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#1d1d1f]/60 border border-white/[0.06] flex items-center justify-between">
            <span className="text-[#86868b]">Banner DOM Detected:</span>
            <span className="text-[#f5f5f7] font-medium">
              {bannerAnalysis.bannerDetected ? "Yes (Active)" : "None Found"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1d1d1f]/60 border border-white/[0.06] flex items-center justify-between">
            <span className="text-[#86868b]">Equal Prominence Reject All:</span>
            <span
              className={`font-semibold ${
                bannerAnalysis.hasOneClickReject ? "text-[#34c759]" : "text-[#ff453a]"
              }`}
            >
              {bannerAnalysis.hasOneClickReject ? "Compliant" : "Non-Compliant"}
            </span>
          </div>

          {bannerAnalysis.darkPatterns.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-[#34c759]/10 border border-[#34c759]/20 text-xs text-[#34c759] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0" />
              <span>No deceptive consent nudging or dark patterns detected in banner DOM.</span>
            </div>
          ) : (
            bannerAnalysis.darkPatterns.map((dp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/25 text-xs text-[#ff453a] space-y-1"
              >
                <div className="flex items-center justify-between font-semibold text-xs">
                  <span>{dp.type}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ff453a]/20 text-[#ff453a] text-[10px] font-medium">
                    {dp.severity} SEVERITY
                  </span>
                </div>
                <p className="text-xs text-[#d2d2d7] leading-relaxed">
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
