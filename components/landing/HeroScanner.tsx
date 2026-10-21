"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowRight,
  Loader2,
  Globe,
  Terminal,
  Lock,
  ChevronRight,
} from "lucide-react";

const SCAN_STEPS = [
  "Resolving DNS & Enforcing Pinned Socket Isolation...",
  "Inspecting TLS Transport & Security Headers...",
  "Auditing Cookie Attributes against OWASP ASVS v4.0...",
  "Cross-Referencing Tracking Signatures & Pre-Consent Beacons...",
  "Evaluating DPDP Act 2023 & GDPR Statutory Disclosures...",
  "Generating Cryptographic SHA-256 Non-Repudiation Seal...",
];

export function HeroScanner() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setLoading(true);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    try {
      const res = await fetch("/api/v1/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Scan failed with status ${res.status}`);
      }

      const result = await res.json();
      router.push(`/scan/${result.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setLoading(false);
      setError(err.message || "Failed to complete compliance scan. Please verify URL.");
    }
  };

  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Apple Product Showcase Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-black/[0.08] text-xs font-medium text-[#0066cc] shadow-sm">
            <span>Statutory Audit Engine</span>
            <ChevronRight className="w-3 h-3" />
          </div>

          {/* Display Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1d1d1f] tracking-[-0.03em] leading-[1.08]">
            Automated Web Privacy &amp; <br className="hidden sm:inline" />
            Cookie Security.
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-[#86868b] leading-relaxed max-w-2xl mx-auto font-normal">
            Audit any web application in seconds. Detect unauthorized marketing trackers, verify OWASP
            session integrity, and enforce India DPDP Act 2023 &amp; EU GDPR compliance.
          </p>
        </div>

        {/* Apple-styled Pill Search/Scan Console */}
        <div className="max-w-2xl mx-auto space-y-4">
          <form
            onSubmit={handleScan}
            className="p-1.5 sm:p-2 rounded-full bg-white border border-[#d2d2d7] shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center gap-2 focus-within:border-[#0071e3] focus-within:shadow-[0_0_24px_rgba(0,113,227,0.2)] transition-all duration-300"
          >
            <div className="flex items-center w-full px-4 gap-3 text-[#86868b]">
              <Globe className="w-4 h-4 text-[#0066cc] shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter any website URL (e.g., https://apple.com or zerodha.com)"
                disabled={loading}
                className="w-full bg-transparent text-[#1d1d1f] placeholder-[#86868b] text-[15px] focus:outline-none py-2 font-normal"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="apple-btn-primary w-full sm:w-auto shrink-0 shadow-md shadow-[#0071e3]/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white mr-2" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <span>Audit Website</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Domain Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#86868b] pt-1">
            <span>Quick Audit:</span>
            {["https://apple.com", "https://stripe.com", "https://zerodha.com"].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setUrl(sample)}
                className="px-3 py-1 rounded-full bg-white hover:bg-black/[0.04] border border-black/[0.08] text-[#1d1d1f] hover:text-[#0066cc] transition-colors duration-150 text-xs shadow-sm"
              >
                {sample.replace("https://", "")}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#d70015] text-xs flex items-center gap-2.5 max-w-xl mx-auto">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stepper Progress Bar */}
          {loading && (
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] text-left space-y-3 shadow-xl max-w-xl mx-auto">
              <div className="flex items-center justify-between text-xs font-mono text-[#86868b]">
                <span className="text-[#0066cc] font-medium">AUDIT PIPELINE ACTIVE</span>
                <span>
                  Stage {currentStep + 1} of {SCAN_STEPS.length}
                </span>
              </div>
              <div className="w-full h-1 bg-black/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0071e3] transition-[width] duration-300 ease-out"
                  style={{
                    width: `${((currentStep + 1) / SCAN_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-[#1d1d1f] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0066cc]" />
                <span>{SCAN_STEPS[currentStep]}</span>
              </p>
            </div>
          )}
        </div>

        {/* Feature Stat Cards (Apple Keynote Metric Style) */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center">
          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200">
            <span className="text-2xl font-semibold text-[#0066cc] block mb-0.5 tracking-tight">0–100</span>
            <div className="text-xs text-[#1d1d1f] font-semibold">Evidence Scoring</div>
            <div className="text-[11px] text-[#86868b] mt-0.5">Automated Grade</div>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200">
            <span className="text-2xl font-semibold text-[#34c759] block mb-0.5 tracking-tight">DPDP 2023</span>
            <div className="text-xs text-[#1d1d1f] font-semibold">Rule 3 Notice</div>
            <div className="text-[11px] text-[#86868b] mt-0.5">Statutory Audit</div>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200">
            <span className="text-2xl font-semibold text-[#ff9500] block mb-0.5 tracking-tight">OWASP</span>
            <div className="text-xs text-[#1d1d1f] font-semibold">ASVS v4.0</div>
            <div className="text-[11px] text-[#86868b] mt-0.5">Cookie Security</div>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200">
            <span className="text-2xl font-semibold text-[#1d1d1f] block mb-0.5 tracking-tight">SHA-256</span>
            <div className="text-xs text-[#1d1d1f] font-semibold">Ledger Seal</div>
            <div className="text-[11px] text-[#86868b] mt-0.5">Non-Repudiation</div>
          </div>
        </div>
      </div>
    </section>
  );
}
