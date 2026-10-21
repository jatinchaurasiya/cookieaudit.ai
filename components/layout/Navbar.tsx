"use client";

import Link from "next/link";
import { Shield, Terminal, Activity, FileCheck2 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6">
      <div className="max-w-5xl mx-auto h-13 px-4 sm:px-6 rounded-full bg-slate-950/75 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400/60 transition-colors duration-150">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm text-slate-100 tracking-tight">
              CookieAudit
            </span>
            <span className="text-[10px] font-mono font-bold text-sky-400 px-1 py-0.2 rounded bg-sky-500/10 border border-sky-500/20">
              AI
            </span>
          </div>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <Link
            href="/#scanner"
            className="hover:text-slate-100 transition-colors duration-150 flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Scanner</span>
          </Link>
          <Link
            href="/#pillars"
            className="hover:text-slate-100 transition-colors duration-150 flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Governance</span>
          </Link>
          <Link
            href="/drift"
            className="hover:text-slate-100 transition-colors duration-150 flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Drift Surveillance</span>
          </Link>
          <Link
            href="/#statutory"
            className="hover:text-slate-100 transition-colors duration-150 flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>DPDP &amp; GDPR</span>
          </Link>
        </nav>

        {/* Right Status Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-white/[0.08] text-[11px] font-mono text-slate-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Grid:</span>
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
