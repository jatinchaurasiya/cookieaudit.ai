"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  Globe2,
} from "lucide-react";

const SCAN_STEPS = [
  "SSRF Guard: Resolving DNS & Verifying IP Boundaries...",
  "Tier 1: Probing HTTP Set-Cookie & TLS 1.3 Security...",
  "Tier 2: Crawl4AI CDP Engine Extracting Privacy Policy...",
  "OpenCookieDB: Matching 2,500+ Tracking Signatures...",
  "OWASP ASVS: Auditing HttpOnly, Secure & SameSite...",
  "MiniMax M3.1 Flash: Evaluating DPDP Act & GDPR Mandates...",
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

    // Progress animation stepper
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

    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-slate-300 mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>India DPDP Act 2023 / 2025 Rules + EU GDPR Article 13 + OWASP ASVS</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Automated Web Privacy & <br />
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Cookie Security Audit in &lt;15s
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Uncover pre-consent marketing trackers, vulnerable session cookies, and DPDP Rule 3
          statutory non-compliance. Graded from 0 to 100 with copy-paste remediation code powered by{" "}
          <span className="text-slate-200 font-semibold">MiniMax M3.1 Flash</span>.
        </p>

        {/* Scan Input Form */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleScan}
            className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-sky-500/80 focus-within:ring-4 focus-within:ring-sky-500/10 shadow-2xl transition-all"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center w-full px-3 gap-2.5 text-slate-400">
                <Globe2 className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL (e.g., https://example.com)"
                  disabled={loading}
                  className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none py-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <span>Run Audit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5 text-left">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Stepper progress when loading */}
          {loading && (
            <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-sky-400">AUDIT PIPELINE ACTIVE</span>
                <span>
                  Step {currentStep + 1} of {SCAN_STEPS.length}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                  style={{
                    width: `${((currentStep + 1) / SCAN_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-200 font-mono flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                {SCAN_STEPS[currentStep]}
              </p>
            </div>
          )}
        </div>


        {/* Feature Badges */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-sky-400 font-mono text-xs mb-1">TIER 1 & 2</div>
            <div className="text-sm font-semibold text-slate-200">Zero-Crash Hybrid</div>
            <p className="text-xs text-slate-400 mt-1">
              &lt;150ms HTTP probe + Crawl4AI container CDP sandbox.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-indigo-400 font-mono text-xs mb-1">DPDP ACT 2023</div>
            <div className="text-sm font-semibold text-slate-200">Rule 3 Itemized Notice</div>
            <p className="text-xs text-slate-400 mt-1">
              Grievance Officer, Board complaint right, and equal withdrawal.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-emerald-400 font-mono text-xs mb-1">OWASP ASVS</div>
            <div className="text-sm font-semibold text-slate-200">Session Security</div>
            <p className="text-xs text-slate-400 mt-1">
              HttpOnly XSS defense, HTTPS Secure flags, and SameSite CSRF.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-amber-400 font-mono text-xs mb-1">NON-REPUDIATION</div>
            <div className="text-sm font-semibold text-slate-200">SHA-256 PDF Seal</div>
            <p className="text-xs text-slate-400 mt-1">
              Cryptographically signed audit PDF ready for enterprise DPOs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
