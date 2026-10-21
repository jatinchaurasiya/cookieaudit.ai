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
    <div className="min-h-screen flex flex-col justify-between cyber-bg">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Breadcrumb */}
        <div>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-sky-400 transition-colors inline-flex items-center gap-1.5 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Scanner
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800 text-xs font-mono text-indigo-300">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>P1 SAAS CONTINUOUS GOVERNANCE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Weekly Compliance Drift Monitor
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Continuous background surveillance that detects newly injected marketing tags (via GTM),
            insecure session cookies, and statutory DPDP compliance regressions with instant Slack
            alerts.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <form onSubmit={handleRunDriftCheck} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Domain / URL:
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/80"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Slack Webhook URL (Optional):</span>
                </label>
                <input
                  type="url"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/80"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !targetUrl.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusMessage || "Running Drift Check..."}</span>
                </>
              ) : (
                <>
                  <span>Run Live Drift Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Drift Results Display */}
        {driftResult && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    driftResult.hasRegression
                      ? "bg-rose-950 text-rose-400"
                      : "bg-emerald-950 text-emerald-400"
                  }`}
                >
                  {driftResult.hasRegression ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{driftResult.domain}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Baseline: {driftResult.gradeChange.previous} → Latest:{" "}
                    {driftResult.gradeChange.current}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  driftResult.hasRegression
                    ? "bg-rose-950 text-rose-300 border-rose-800"
                    : "bg-emerald-950 text-emerald-300 border-emerald-800"
                }`}
              >
                {driftResult.hasRegression ? "REGRESSION DETECTED" : "COMPLIANT & DRIFT-FREE"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
              {driftResult.summary}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-1">New Trackers:</span>
                <span
                  className={`text-xl font-bold ${
                    driftResult.newTrackers.length > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {driftResult.newTrackers.length}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-1">New Cookies:</span>
                <span className="text-xl font-bold text-sky-400">
                  {driftResult.newCookies.length}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block mb-1">OWASP Regressions:</span>
                <span
                  className={`text-xl font-bold ${
                    driftResult.newOwaspIssues.length > 0 ? "text-rose-400" : "text-emerald-400"
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
