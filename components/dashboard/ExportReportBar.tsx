"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Lock, Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";

interface ExportReportBarProps {
  scanId: string;
  sha256Hash: string;
  domain: string;
}

export function ExportReportBar({ scanId, sha256Hash, domain }: ExportReportBarProps) {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const handleDownloadPdf = () => {
    setDownloading(true);
    window.location.href = `/api/v1/export-pdf?id=${scanId}`;
    setTimeout(() => setDownloading(false), 3000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] p-5 sm:p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Cryptographic SHA-256 Seal info */}
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200">NON-REPUDIATION LEDGER // SHA-256</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800 font-bold">
              SEALED
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 break-all bg-slate-950 px-2.5 py-1 rounded-md border border-white/[0.06] select-all">
              {sha256Hash}
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-colors duration-150"
              title="Copy full SHA-256 hash"
            >
              {copiedHash ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/verify/${sha256Hash.slice(0, 16)}`}
            className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/[0.08] text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5 transition-colors duration-150"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Verify Seal</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-colors duration-150 shadow-md shadow-sky-500/20 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span>{downloading ? "Preparing..." : "Download Certificate PDF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
