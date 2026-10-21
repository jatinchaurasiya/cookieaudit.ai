"use client";

import Link from "next/link";
import { ShieldCheck, Sparkles, Terminal, FileCheck2 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
              CookieAudit <span className="text-sky-400">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
              DPDP 2025 • GDPR • OWASP
            </span>
          </div>
        </Link>

        {/* Center Nav Badges */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <Link
            href="/#scanner"
            className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
          >
            <Terminal className="w-4 h-4 text-sky-400" /> Scanner
          </Link>
          <Link
            href="/#architecture"
            className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" /> Two-Tier Engine
          </Link>
          <Link
            href="/#statutory"
            className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Statutory Frameworks
          </Link>
        </nav>


        {/* Right Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MiniMax M3.1 Flash</span>
          </div>
        </div>
      </div>
    </header>
  );
}
