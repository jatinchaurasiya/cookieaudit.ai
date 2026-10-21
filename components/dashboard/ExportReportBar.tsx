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
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Cryptographic SHA-256 Seal info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>CRYPTOGRAPHIC NON-REPUDIATION SEAL</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">
              SHA-256 VERIFIED
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-mono text-slate-400 break-all bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
              {sha256Hash}
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
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
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/verify/${sha256Hash.slice(0, 16)}`}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Verify Certificate</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Preparing PDF..." : "Download Audit PDF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
