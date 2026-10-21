"use client";

import Link from "next/link";
import { Shield, Terminal, Activity, FileCheck2 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#000000]/80 backdrop-blur-xl border-b border-white/[0.12] transition-colors duration-250">
      <div className="max-w-5xl mx-auto h-11 px-4 sm:px-6 flex items-center justify-between text-xs tracking-tight">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <Shield className="w-4 h-4 text-[#f5f5f7] group-hover:text-[#2997ff] transition-colors duration-250" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-[#f5f5f7] tracking-tight">
              CookieAudit
            </span>
            <span className="text-[10px] font-mono font-medium text-[#86868b] px-1.5 py-0.2 rounded-full bg-white/[0.08] border border-white/[0.08]">
              AI
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Apple 12px style) */}
        <nav className="hidden md:flex items-center gap-7 text-[12px] text-[#d2d2d7] font-normal">
          <Link
            href="/#scanner"
            className="hover:text-white transition-colors duration-250 flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-[#2997ff]" />
            <span>Scanner</span>
          </Link>
          <Link
            href="/#pillars"
            className="hover:text-white transition-colors duration-250 flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#2997ff]" />
            <span>Governance</span>
          </Link>
          <Link
            href="/drift"
            className="hover:text-white transition-colors duration-250 flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-[#34c759]" />
            <span>Surveillance</span>
          </Link>
          <Link
            href="/#statutory"
            className="hover:text-white transition-colors duration-250 flex items-center gap-1.5"
          >
            <span>DPDP &amp; GDPR</span>
          </Link>
        </nav>

        {/* Right Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] text-[#86868b]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
            <span className="hidden sm:inline">Grid:</span>
            <span className="text-[#f5f5f7] font-medium">Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
