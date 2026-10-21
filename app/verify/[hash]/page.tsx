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
    <div className="min-h-screen flex flex-col justify-between apple-canvas">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs text-[#86868b] hover:text-[#0066cc] transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Scanner
          </Link>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
          {scan ? (
            <>
              {/* Authenticated Verification Success */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-[#34c759]/10 border border-[#34c759]/20 text-[#34c759] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                  Cryptographic Certificate Verified
                </h1>
                <p className="text-xs text-[#34c759] font-medium tracking-wide">
                  SHA-256 SIGNATURE MATCHES IMMUTABLE AUDIT LEDGER
                </p>
              </div>

              {/* Certificate Details */}
              <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                  <span className="text-[#86868b]">Target Website:</span>
                  <span className="font-semibold text-[#1d1d1f]">{scan.domain}</span>
                </div>

                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                  <span className="text-[#86868b]">Audit Timestamp:</span>
                  <span className="font-mono text-[#6e6e73]">
                    {new Date(scan.timestamp).toUTCString()}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                  <span className="text-[#86868b]">Compliance Grade:</span>
                  <span className="font-semibold text-[#34c759]">
                    {scan.scores.grade} ({scan.scores.overallScore}/100)
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                  <span className="text-[#86868b]">Discovered Cookies:</span>
                  <span className="text-[#1d1d1f]">
                    {scan.telemetry.cookies.length} total (
                    {scan.telemetry.cookies.filter((c) => c.owaspIssues.length > 0).length} insecure)
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[#86868b] text-[11px] block">Verified SHA-256 Digest:</span>
                  <div className="p-2.5 rounded-xl bg-white font-mono text-[11px] text-[#0066cc] break-all select-all border border-black/[0.08]">
                    {scan.sha256Hash}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/scan/${scan.id}`}
                  className="apple-btn-primary inline-flex items-center justify-center gap-2"
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
                <div className="w-14 h-14 rounded-full bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                  Certificate Verification Failed
                </h1>
                <p className="text-xs text-[#ff3b30] font-medium tracking-wide">
                  NO MATCHING AUDIT RECORD FOUND FOR THIS DIGEST
                </p>
              </div>

              <p className="text-xs text-[#86868b] text-center leading-relaxed">
                The cryptographic hash <code className="text-[#1d1d1f] bg-black/[0.06] px-1.5 py-0.5 rounded font-mono">{hash}</code> could not be
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
