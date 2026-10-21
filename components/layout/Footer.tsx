"use client";

import Link from "next/link";
import { Shield, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-slate-950/80 mt-20 text-slate-400 text-xs font-mono">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Top Statement & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-6 space-y-3 font-sans">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-200 text-sm">CookieAudit AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Enterprise Web Privacy, Cookie Security &amp; Regulatory Compliance SaaS.
              Audits web applications against India DPDP Act 2023 / Rules 2025, EU GDPR, and OWASP ASVS v4.0.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 pt-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>SHA-256 Cryptographic Non-Repudiation Verified</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <span className="text-[10px] uppercase text-slate-500 tracking-wider block font-semibold">
              STATUTORY FRAMEWORKS
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>DPDP Act India 2023 (Sec 5, 6, 8)</li>
              <li>DPDP Rules 2025 (Rule 3 Notice)</li>
              <li>EU GDPR (Regulation 2016/679)</li>
              <li>OWASP ASVS v4.0 Session Security</li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2">
            <span className="text-[10px] uppercase text-slate-500 tracking-wider block font-semibold">
              ENTERPRISE ASSURANCE
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>Continuous Drift Surveillance</li>
              <li>Cryptographic Audit Ledger</li>
              <li>Automated Remediation Engine</li>
              <li>Zero PII &amp; Data Minimization</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© 2026 CookieAudit AI. Production-Grade Privacy &amp; Security SaaS.</p>
          <div className="flex items-center gap-5">
            <Link href="/#scanner" className="hover:text-slate-200 transition-colors duration-150">
              Privacy Scanner
            </Link>
            <Link href="/drift" className="hover:text-slate-200 transition-colors duration-150">
              Drift Surveillance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
