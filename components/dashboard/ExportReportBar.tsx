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
    <div className="rounded-3xl bg-white border border-black/[0.08] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Cryptographic SHA-256 Seal info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Lock className="w-3.5 h-3.5 text-[#34c759] shrink-0" />
            <span className="font-semibold text-[#1d1d1f]">Non-Repudiation Ledger</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#34c759]/15 text-[#248a3d] text-[10px] border border-[#34c759]/30 font-semibold">
              SEALED
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#86868b] break-all bg-[#f5f5f7] px-3 py-1.5 rounded-full border border-black/[0.06] select-all font-mono">
              {sha256Hash}
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="p-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 text-[#1d1d1f] transition-all duration-150"
              title="Copy full SHA-256 hash"
            >
              {copiedHash ? (
                <Check className="w-3.5 h-3.5 text-[#34c759]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#86868b]" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/verify/${sha256Hash.slice(0, 16)}`}
            className="apple-btn-secondary text-xs flex items-center gap-1.5 font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Verify Seal</span>
            <ExternalLink className="w-3 h-3 text-[#86868b]" />
          </Link>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="apple-btn-primary text-xs flex items-center gap-2 shadow-sm disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>{downloading ? "Preparing..." : "Download Certificate PDF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
