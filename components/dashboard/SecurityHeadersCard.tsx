"use client";

import { SecurityHeadersFinding } from "@/lib/types/audit";
import { CheckCircle2, XCircle, Server } from "lucide-react";

interface SecurityHeadersCardProps {
  headers?: SecurityHeadersFinding;
  tlsVersion: string;
  hasHsts: boolean;
}

export function SecurityHeadersCard({ headers, tlsVersion, hasHsts }: SecurityHeadersCardProps) {
  if (!headers) return null;

  const headerItems = [
    {
      name: "Strict-Transport-Security (HSTS)",
      value: headers.strictTransportSecurity,
      passed: Boolean(headers.strictTransportSecurity),
      purpose: "Enforces encrypted HTTPS connections and mitigates SSL stripping MITM attacks.",
    },
    {
      name: "Content-Security-Policy (CSP)",
      value: headers.contentSecurityPolicy,
      passed: Boolean(headers.contentSecurityPolicy),
      purpose: "Restricts script execution sources to prevent cross-site scripting (XSS) and rogue tracking injection.",
    },
    {
      name: "X-Frame-Options",
      value: headers.xFrameOptions,
      passed: Boolean(headers.xFrameOptions || headers.contentSecurityPolicy?.includes("frame-ancestors")),
      purpose: "Blocks unauthorized iframe embedding to protect users against UI redress / clickjacking attacks.",
    },
    {
      name: "X-Content-Type-Options",
      value: headers.xContentTypeOptions,
      passed: Boolean(headers.xContentTypeOptions?.toLowerCase().includes("nosniff")),
      purpose: "Enforces strict MIME-type sniffing prevention (OWASP A05: Security Misconfiguration).",
    },
    {
      name: "Referrer-Policy",
      value: headers.referrerPolicy,
      passed: Boolean(headers.referrerPolicy),
      purpose: "Limits referrer headers sent to external trackers, preventing sensitive URL tokens from leaking.",
    },
  ];

  const passedCount = headerItems.filter((h) => h.passed).length;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] shadow-xl p-6 sm:p-7 space-y-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight">
              Web Security &amp; Infrastructure Headers
            </h3>
            <p className="text-xs text-slate-400">
              Audited against OWASP Secure Headers Project and TLS 1.3 Transport Standards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
              passedCount >= 4
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                : "bg-amber-950/80 text-amber-300 border-amber-800"
            }`}
          >
            {passedCount} / {headerItems.length} Configured
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {headerItems.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border text-xs space-y-2 flex flex-col justify-between transition-colors duration-150 ${
              item.passed
                ? "bg-slate-950/70 border-white/[0.06]"
                : "bg-amber-950/15 border-amber-900/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-slate-200 truncate text-xs">{item.name}</span>
                {item.passed ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 shrink-0 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> MISSING
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.purpose}</p>
            </div>

            {item.value && (
              <div className="mt-2 p-2 rounded-md bg-slate-900 font-mono text-[10px] text-slate-300 truncate border border-white/[0.04]">
                {item.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
