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
    <div className="rounded-3xl bg-[#161617]/90 border border-white/[0.1] shadow-2xl p-6 sm:p-7 space-y-6 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center text-[#2997ff] shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#f5f5f7] tracking-tight">
              Web Security &amp; Infrastructure Headers
            </h3>
            <p className="text-xs text-[#86868b]">
              Audited against OWASP Secure Headers Project and TLS 1.3 Transport Standards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              passedCount >= 4
                ? "bg-[#34c759]/15 text-[#34c759] border-[#34c759]/30"
                : "bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30"
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
            className={`p-4 rounded-2xl border text-xs space-y-2.5 flex flex-col justify-between transition-colors duration-200 ${
              item.passed
                ? "bg-[#1d1d1f]/60 border-white/[0.06] hover:border-white/[0.12]"
                : "bg-[#ff9f0a]/[0.06] border-[#ff9f0a]/20"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-[#f5f5f7] truncate text-xs">{item.name}</span>
                {item.passed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#34c759]/15 text-[#34c759] border border-[#34c759]/30 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/30 shrink-0 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> MISSING
                  </span>
                )}
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed">{item.purpose}</p>
            </div>

            {item.value && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#000000]/60 font-mono text-[11px] text-[#86868b] truncate border border-white/[0.06]">
                {item.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
