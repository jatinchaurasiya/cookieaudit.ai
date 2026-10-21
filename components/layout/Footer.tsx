"use client";

import Link from "next/link";
import { Shield, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-black/[0.08] bg-[#f5f5f7] mt-24 text-[#86868b] text-xs font-normal">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Top Mission Statement */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center text-[#0066cc]">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-[#1d1d1f] text-sm">CookieAudit AI</span>
            </div>
            <p className="text-xs text-[#86868b] leading-relaxed max-w-sm">
              Enterprise Web Privacy, Cookie Security &amp; Regulatory Compliance SaaS.
              Audits web applications against India DPDP Act 2023 / Rules 2025, EU GDPR, and OWASP ASVS v4.0.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#86868b] pt-1 font-mono">
              <Lock className="w-3 h-3 text-[#34c759]" />
              <span>SHA-256 Cryptographic Non-Repudiation Verified</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <span className="text-[11px] uppercase text-[#1d1d1f] tracking-wider block font-semibold">
              Statutory Frameworks
            </span>
            <ul className="space-y-1.5 text-xs text-[#6e6e73]">
              <li className="hover:text-[#1d1d1f] transition-colors">DPDP Act India 2023</li>
              <li className="hover:text-[#1d1d1f] transition-colors">DPDP Rules 2025 (Rule 3)</li>
              <li className="hover:text-[#1d1d1f] transition-colors">EU GDPR (Regulation 2016/679)</li>
              <li className="hover:text-[#1d1d1f] transition-colors">OWASP ASVS v4.0 Security</li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <span className="text-[11px] uppercase text-[#1d1d1f] tracking-wider block font-semibold">
              Assurance
            </span>
            <ul className="space-y-1.5 text-xs text-[#6e6e73]">
              <li className="hover:text-[#1d1d1f] transition-colors">Continuous Drift Surveillance</li>
              <li className="hover:text-[#1d1d1f] transition-colors">Cryptographic Audit Ledger</li>
              <li className="hover:text-[#1d1d1f] transition-colors">Automated Remediation Engine</li>
              <li className="hover:text-[#1d1d1f] transition-colors">Zero PII Minimization</li>
            </ul>
          </div>
        </div>

        {/* Bottom Directory / Legal Bar */}
        <div className="border-t border-black/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#86868b] gap-4">
          <p>© 2026 CookieAudit AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/#scanner" className="hover:text-[#1d1d1f] transition-colors duration-150">
              Privacy Scanner
            </Link>
            <Link href="/drift" className="hover:text-[#1d1d1f] transition-colors duration-150">
              Drift Surveillance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
