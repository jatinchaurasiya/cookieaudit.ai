import Link from "next/link";
import { getScanByHash } from "@/lib/db/scan-store";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, ShieldAlert, ArrowLeft, ExternalLink, Lock } from "lucide-react";

interface VerifyPageProps {

  params: Promise<{ hash: string }>;
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { hash } = await params;
  const scan = await getScanByHash(hash);

  return (
    <div className="min-h-screen flex flex-col justify-between gloom-canvas">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-sky-400 transition-colors inline-flex items-center gap-1.5 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Scanner
          </Link>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          {scan ? (
            <>
              {/* Authenticated Verification Success */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100">
                  Cryptographic Certificate Verified
                </h1>
                <p className="text-xs text-emerald-400 font-mono">
                  SHA-256 SIGNATURE MATCHES IMMUTABLE AUDIT LEDGER
                </p>
              </div>

              {/* Certificate Details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-400">Target Website:</span>
                  <span className="font-bold text-slate-200">{scan.domain}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-400">Audit Timestamp:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(scan.timestamp).toUTCString()}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-400">Compliance Grade:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {scan.scores.grade} ({scan.scores.overallScore}/100)
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-400">Discovered Cookies:</span>
                  <span className="text-slate-300">
                    {scan.telemetry.cookies.length} total (
                    {scan.telemetry.cookies.filter((c) => c.owaspIssues.length > 0).length} insecure)
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-slate-400 text-[11px] block">Verified SHA-256 Digest:</span>
                  <div className="p-2 rounded-lg bg-slate-900 font-mono text-[11px] text-sky-400 break-all select-all">
                    {scan.sha256Hash}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/scan/${scan.id}`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors duration-150 shadow-md shadow-sky-500/20"
                >
                  <span>View Full Interactive Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Verification Failed */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100">
                  Certificate Verification Failed
                </h1>
                <p className="text-xs text-rose-400 font-mono">
                  NO MATCHING AUDIT RECORD FOUND FOR THIS DIGEST
                </p>
              </div>

              <p className="text-xs text-slate-400 text-center leading-relaxed">
                The cryptographic hash <code className="text-slate-200">{hash}</code> could not be
                verified against our active audit records. The report may have been forged, altered,
                or purged.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
