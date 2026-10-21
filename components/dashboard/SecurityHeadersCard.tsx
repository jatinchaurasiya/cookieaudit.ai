"use client";

import { SecurityHeadersFinding } from "@/lib/types/audit";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Lock, Server } from "lucide-react";

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
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-950 text-sky-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Web Security &amp; Infrastructure Headers
            </h3>
            <p className="text-xs text-slate-400">
              Audited against OWASP Secure Headers Project and TLS 1.3 Transport Standards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              passedCount >= 4
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                : "bg-amber-950/80 text-amber-300 border-amber-800"
            }`}
          >
            {passedCount} of {headerItems.length} Headers Configured
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {headerItems.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border text-xs space-y-2 flex flex-col justify-between ${
              item.passed
                ? "bg-slate-950/60 border-slate-800/80"
                : "bg-amber-950/20 border-amber-900/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-slate-200 truncate">{item.name}</span>
                {item.passed ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 shrink-0 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> MISSING
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.purpose}</p>
            </div>

            {item.value && (
              <div className="mt-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300 truncate">
                {item.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
