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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-medium text-[#2997ff]">
            <span>Statutory Audit Engine</span>
            <ChevronRight className="w-3 h-3" />
          </div>

          {/* Display Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#f5f5f7] tracking-[-0.03em] leading-[1.08]">
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
            className="p-1.5 sm:p-2 rounded-full bg-[#161617]/95 border border-white/[0.15] backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 focus-within:border-[#0071e3] focus-within:shadow-[0_0_30px_rgba(0,113,227,0.25)] transition-all duration-300"
          >
            <div className="flex items-center w-full px-4 gap-3 text-[#86868b]">
              <Globe className="w-4 h-4 text-[#2997ff] shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter any website URL (e.g., https://apple.com or zerodha.com)"
                disabled={loading}
                className="w-full bg-transparent text-[#f5f5f7] placeholder-[#86868b] text-[15px] focus:outline-none py-2 font-normal"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="apple-btn-primary w-full sm:w-auto shrink-0 shadow-lg shadow-[#0071e3]/25"
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
                className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#d2d2d7] hover:text-white transition-colors duration-150 text-[11px]"
              >
                {sample.replace("https://", "")}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/30 text-[#ff453a] text-xs flex items-center gap-2.5 max-w-xl mx-auto">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stepper Progress Bar */}
          {loading && (
            <div className="p-5 rounded-2xl bg-[#161617] border border-white/[0.1] text-left space-y-3 shadow-2xl max-w-xl mx-auto">
              <div className="flex items-center justify-between text-xs font-mono text-[#86868b]">
                <span className="text-[#2997ff] font-medium">AUDIT PIPELINE ACTIVE</span>
                <span>
                  Stage {currentStep + 1} of {SCAN_STEPS.length}
                </span>
              </div>
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0071e3] transition-[width] duration-300 ease-out"
                  style={{
                    width: `${((currentStep + 1) / SCAN_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-[#f5f5f7] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2997ff]" />
                <span>{SCAN_STEPS[currentStep]}</span>
              </p>
            </div>
          )}
        </div>

        {/* Feature Stat Cards (Apple Keynote Metric Style) */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center">
          <div className="p-4 rounded-3xl bg-[#161617]/80 border border-white/[0.08] hover:border-white/[0.15] transition-colors duration-200">
            <span className="text-xl font-semibold text-[#2997ff] block mb-0.5 tracking-tight">0–100</span>
            <div className="text-xs text-[#f5f5f7] font-medium">Evidence Scoring</div>
            <div className="text-[11px] text-[#86868b] mt-0.5">Automated Grade</div>
          </div>
          <div className="p-4 rounded-3xl bg-[#161617]/80 border border-white/[0.08] hover:border-white/[0.15] transition-colors duration-200">
            <span className="text-xl font-semibold text-[#34c759] block mb-0.5 tracking-tight">DPDP 2023</span>
            <div className="text-xs text-[#f5f5f7] font-medium">Rule 3 Notice</div>
            <div className="text-[11px] text-[#86868b] mt-0.5">Statutory Audit</div>
          </div>
          <div className="p-4 rounded-3xl bg-[#161617]/80 border border-white/[0.08] hover:border-white/[0.15] transition-colors duration-200">
            <span className="text-xl font-semibold text-[#ff9f0a] block mb-0.5 tracking-tight">OWASP</span>
            <div className="text-xs text-[#f5f5f7] font-medium">ASVS v4.0</div>
            <div className="text-[11px] text-[#86868b] mt-0.5">Cookie Security</div>
          </div>
          <div className="p-4 rounded-3xl bg-[#161617]/80 border border-white/[0.08] hover:border-white/[0.15] transition-colors duration-200">
            <span className="text-xl font-semibold text-[#f5f5f7] block mb-0.5 tracking-tight">SHA-256</span>
            <div className="text-xs text-[#f5f5f7] font-medium">Ledger Seal</div>
            <div className="text-[11px] text-[#86868b] mt-0.5">Non-Repudiation</div>
          </div>
        </div>
      </div>
    </section>
  );
}
