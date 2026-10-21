"use client";

import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 mt-20 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span className="font-bold text-slate-200">CookieAudit AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Automated Web Privacy, Cookie Security &amp; Statutory Compliance SaaS. Grades websites
              from 0 to 100 across OWASP ASVS Session Management, India DPDP Act 2023 &amp; Rules 2025,
              and EU GDPR Article 13.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Cryptographic Non-Repudiation Guaranteed</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Statutory Standards
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-300">DPDP Act India 2023 (Sec 5, 6, 8)</span>
              </li>
              <li>
                <span className="text-slate-300">DPDP Rules 2025 (Rule 3 Itemized Notice)</span>
              </li>
              <li>
                <span className="text-slate-300">EU GDPR (Regulation 2016/679 Art 13)</span>
              </li>
              <li>
                <span className="text-slate-300">OWASP ASVS v4.0 Session Security</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Inspection Stack
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span>Tier 1: HTTP/TLS Fast Probe</span>
              </li>
              <li>
                <span>Tier 2: Crawl4AI CDP Engine</span>
              </li>
              <li>
                <span>OpenCookieDB (2,500+ Rules)</span>
              </li>
              <li>
                <span>MiniMax M3.1 Flash (OpenRouter)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CookieAudit AI. Production-Grade Privacy &amp; Security SaaS.</p>
          <div className="flex items-center gap-4">
            <Link href="/#scanner" className="hover:text-sky-400 transition-colors">
              Live URL Scanner
            </Link>
            <Link href="/#architecture" className="hover:text-sky-400 transition-colors">
              Two-Tier Architecture
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
