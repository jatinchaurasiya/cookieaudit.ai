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
    <div className="rounded-3xl bg-[#161617]/90 border border-white/[0.1] shadow-2xl p-6 sm:p-7 space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center text-[#2997ff] shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#f5f5f7] tracking-tight">
              Automated Remediation &amp; Implementation Code
            </h3>
            <p className="text-xs text-[#86868b]">
              Production-ready statutory disclosures, cookie security middleware, and consent-gated script controllers
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="apple-btn-primary text-xs flex items-center gap-2 shadow-lg shadow-[#0071e3]/20 shrink-0 self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-white" />
              <span>Copy Fix Snippet</span>
            </>
          )}
        </button>
      </div>

      {/* Apple-style Segmented Pill Control */}
      <div className="p-1 rounded-full bg-[#1d1d1f] border border-white/[0.08] inline-flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("LEGAL")}
          className={`px-3.5 py-1.5 rounded-full text-xs transition-colors duration-150 flex items-center gap-1.5 ${
            activeTab === "LEGAL"
              ? "bg-[#0071e3] text-white font-medium shadow-sm"
              : "text-[#86868b] hover:text-[#f5f5f7]"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>DPDP Legal Addendum</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MIDDLEWARE")}
          className={`px-3.5 py-1.5 rounded-full text-xs transition-colors duration-150 flex items-center gap-1.5 ${
            activeTab === "MIDDLEWARE"
              ? "bg-[#0071e3] text-white font-medium shadow-sm"
              : "text-[#86868b] hover:text-[#f5f5f7]"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Secure Cookie Middleware</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CONSENT_GATE")}
          className={`px-3.5 py-1.5 rounded-full text-xs transition-colors duration-150 flex items-center gap-1.5 ${
            activeTab === "CONSENT_GATE"
              ? "bg-[#0071e3] text-white font-medium shadow-sm"
              : "text-[#86868b] hover:text-[#f5f5f7]"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Consent Controller</span>
        </button>
      </div>

      {/* Clean Code Viewer Panel (Gate 47: No fake traffic-light dots) */}
      <div className="rounded-2xl bg-[#000000] border border-white/[0.1] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161617] border-b border-white/[0.08] text-xs text-[#86868b]">
          <span className="text-[#f5f5f7] font-medium text-xs font-mono">
            {activeTab === "LEGAL"
              ? "dpdp-notice-addendum.md"
              : activeTab === "MIDDLEWARE"
              ? "secure-cookies.middleware.ts"
              : "consent-gate.js"}
          </span>
          <span className="text-[11px] text-[#86868b] font-mono">READY_FOR_PASTE</span>
        </div>

        <pre className="p-4 sm:p-5 text-xs text-[#d2d2d7] font-mono overflow-x-auto leading-relaxed max-h-[380px] selection:bg-[#0071e3]/30">
          <code>{getActiveContent()}</code>
        </pre>
      </div>
    </div>
  );
}
