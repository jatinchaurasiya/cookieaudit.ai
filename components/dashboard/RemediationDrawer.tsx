"use client";

import { useState } from "react";
import { ComplianceAuditOutput } from "@/lib/types/audit";
import { Terminal, Copy, Check, FileCode, Shield, Code2 } from "lucide-react";

interface RemediationDrawerProps {
  remediation: ComplianceAuditOutput["remediationPackage"];
}

export function RemediationDrawer({ remediation }: RemediationDrawerProps) {
  const [activeTab, setActiveTab] = useState<"LEGAL" | "MIDDLEWARE" | "CONSENT_GATE">("LEGAL");
  const [copied, setCopied] = useState<boolean>(false);

  const getActiveContent = () => {
    switch (activeTab) {
      case "LEGAL":
        return remediation.dpdpCompliantNoticeMarkdown;
      case "MIDDLEWARE":
        return remediation.secureCookieMiddlewareSnippet;
      case "CONSENT_GATE":
        return remediation.consentGateScriptSnippet;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] shadow-xl p-6 sm:p-7 space-y-5 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight">
              Automated Remediation &amp; Implementation Code
            </h3>
            <p className="text-xs text-slate-400">
              Production-ready statutory disclosures, cookie security middleware, and consent-gated script controllers
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-colors duration-150 shadow-md shadow-sky-500/20 shrink-0 self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-slate-950" />
              <span>Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-950" />
              <span>Copy Fix Snippet</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("LEGAL")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors duration-150 flex items-center gap-1.5 ${
            activeTab === "LEGAL"
              ? "bg-white/[0.1] text-sky-400 border border-white/[0.15] font-semibold"
              : "bg-slate-950/60 border border-white/[0.06] text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>DPDP Legal Addendum (md)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MIDDLEWARE")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors duration-150 flex items-center gap-1.5 ${
            activeTab === "MIDDLEWARE"
              ? "bg-white/[0.1] text-sky-400 border border-white/[0.15] font-semibold"
              : "bg-slate-950/60 border border-white/[0.06] text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Secure Cookie Middleware (ts)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CONSENT_GATE")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors duration-150 flex items-center gap-1.5 ${
            activeTab === "CONSENT_GATE"
              ? "bg-white/[0.1] text-sky-400 border border-white/[0.15] font-semibold"
              : "bg-slate-950/60 border border-white/[0.06] text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Consent Controller (html)</span>
        </button>
      </div>

      {/* Code Viewer Panel (Slop-test Gate 47: No fake traffic-light dots) */}
      <div className="rounded-xl bg-slate-950 border border-white/[0.08] overflow-hidden font-mono">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-white/[0.06] text-xs text-slate-400">
          <span className="text-slate-300 font-medium text-[11px]">
            {activeTab === "LEGAL"
              ? "dpdp-notice-addendum.md"
              : activeTab === "MIDDLEWARE"
              ? "secure-cookies.middleware.ts"
              : "consent-gate.js"}
          </span>
          <span className="text-[10px] text-slate-500">READY_FOR_PASTE</span>
        </div>

        <pre className="p-4 sm:p-5 text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-[380px] selection:bg-sky-500/30">
          <code>{getActiveContent()}</code>
        </pre>
      </div>
    </div>
  );
}
