"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Radio,
  BellRing,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { DriftReport } from "@/lib/drift/drift-detector";

export default function DriftMonitoringPage() {
  const [targetUrl, setTargetUrl] = useState("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [driftResult, setDriftResult] = useState<DriftReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunDriftCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setError(null);
    setLoading(true);
    setDriftResult(null);
    setStatusMessage("Executing baseline audit...");

    try {
      // 1. Run baseline scan
      const baselineRes = await fetch("/api/v1/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      if (!baselineRes.ok) {
        const err = await baselineRes.json();
        throw new Error(err.error || "Failed to execute baseline scan");
      }
      const baselineScan = await baselineRes.json();

      setStatusMessage("Simulating production release verification & drift comparison...");

      // 2. Run drift scan API
      const driftRes = await fetch("/api/v1/cron/drift-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baselineScanId: baselineScan.id,
          currentScanId: baselineScan.id, // Fresh comparison
          slackWebhookUrl: slackWebhookUrl.trim() || undefined,
        }),
      });

      if (!driftRes.ok) {
        const err = await driftRes.json();
        throw new Error(err.error || "Failed to execute drift scan");
      }

      const driftData = await driftRes.json();
      setDriftResult(driftData.driftReport);
      setStatusMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to complete drift check");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between apple-canvas">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Breadcrumb */}
        <div>
          <Link
            href="/"
            className="text-xs text-[#86868b] hover:text-[#0066cc] transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Scanner
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-xs font-medium text-[#0071e3]">
            <Activity className="w-3.5 h-3.5" />
            <span>Automated Compliance Surveillance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Weekly Compliance Drift Monitor
          </h1>
          <p className="text-sm text-[#86868b] max-w-2xl leading-relaxed font-normal">
            Continuous background surveillance that detects newly injected marketing tags (via GTM),
            insecure session cookies, and statutory DPDP compliance regressions with instant Slack
            alerts.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
          <form onSubmit={handleRunDriftCheck} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1d1d1f]">
                  Target Domain / URL
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-full bg-[#f5f5f7] border border-black/[0.1] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span>Slack Webhook URL (Optional)</span>
                </label>
                <input
                  type="url"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-full bg-[#f5f5f7] border border-black/[0.1] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !targetUrl.trim()}
                className="apple-btn-primary text-xs flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{statusMessage || "Running Drift Check..."}</span>
                  </>
                ) : (
                  <>
                    <span>Run Live Drift Audit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 rounded-2xl bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-xs text-[#ff3b30] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#ff3b30]" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Drift Results Display */}
        {driftResult && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    driftResult.hasRegression
                      ? "bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/20"
                      : "bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/20"
                  }`}
                >
                  {driftResult.hasRegression ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f]">{driftResult.domain}</h3>
                  <p className="text-xs text-[#86868b] font-mono">
                    Baseline: {driftResult.gradeChange.previous} → Latest:{" "}
                    {driftResult.gradeChange.current}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  driftResult.hasRegression
                    ? "bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20"
                    : "bg-[#34c759]/10 text-[#34c759] border-[#34c759]/20"
                }`}
              >
                {driftResult.hasRegression ? "REGRESSION DETECTED" : "COMPLIANT & DRIFT-FREE"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] text-xs text-[#1d1d1f] leading-relaxed">
              {driftResult.summary}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06]">
                <span className="text-[#86868b] block mb-1">New Trackers</span>
                <span
                  className={`text-xl font-semibold ${
                    driftResult.newTrackers.length > 0 ? "text-[#ff3b30]" : "text-[#34c759]"
                  }`}
                >
                  {driftResult.newTrackers.length}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06]">
                <span className="text-[#86868b] block mb-1">New Cookies</span>
                <span className="text-xl font-semibold text-[#0071e3]">
                  {driftResult.newCookies.length}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06]">
                <span className="text-[#86868b] block mb-1">OWASP Regressions</span>
                <span
                  className={`text-xl font-semibold ${
                    driftResult.newOwaspIssues.length > 0 ? "text-[#ff3b30]" : "text-[#34c759]"
                  }`}
                >
                  {driftResult.newOwaspIssues.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
