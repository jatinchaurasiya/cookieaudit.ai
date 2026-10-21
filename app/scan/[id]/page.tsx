import { notFound } from "next/navigation";
import Link from "next/link";
import { getScanById, getScanByHash } from "@/lib/db/scan-store";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScoreOverview } from "@/components/dashboard/ScoreOverview";
import { ExportReportBar } from "@/components/dashboard/ExportReportBar";
import { CookieMatrixTable } from "@/components/dashboard/CookieMatrixTable";
import { TrackerRadar } from "@/components/dashboard/TrackerRadar";
import { LegalChecklist } from "@/components/dashboard/LegalChecklist";
import { RemediationDrawer } from "@/components/dashboard/RemediationDrawer";
import { SecurityHeadersCard } from "@/components/dashboard/SecurityHeadersCard";
import { ArrowLeft, ShieldAlert } from "lucide-react";


interface ScanPageProps {

  params: Promise<{ id: string }>;
}

export default async function ScanDetailPage({ params }: ScanPageProps) {
  const { id } = await params;

  let scan = await getScanById(id);
  if (!scan) {
    scan = await getScanByHash(id);
  }

  if (!scan) {
    return (
      <div className="min-h-screen flex flex-col justify-between apple-canvas">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#161617]/90 border border-white/[0.1] shadow-2xl space-y-4 backdrop-blur-xl">
            <ShieldAlert className="w-12 h-12 text-[#ff453a] mx-auto" />
            <h1 className="text-2xl font-semibold text-[#f5f5f7]">Audit Record Not Found</h1>
            <p className="text-sm text-[#86868b]">
              The requested scan ID or certificate hash does not exist in local cache or has expired.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="apple-btn-primary inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Scanner
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between apple-canvas">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-6 flex-1 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-[#86868b]">
          <Link
            href="/"
            className="hover:text-[#2997ff] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Scanner
          </Link>
          <span className="text-[#86868b] font-mono">
            Audit ID: {scan.id.slice(0, 18)}...
          </span>
        </div>

        {/* 1. Score Overview Radial & 3 Pillars */}
        <ScoreOverview
          scores={scan.scores}
          telemetry={scan.telemetry}
          executionTimeMs={scan.executionTimeMs}
        />

        {/* 2. Cryptographic Non-Repudiation Seal & PDF Export Action */}
        <ExportReportBar
          scanId={scan.id}
          sha256Hash={scan.sha256Hash}
          domain={scan.domain}
        />

        {/* 3. Discovered Cookies & OWASP Session Security Matrix */}
        <CookieMatrixTable cookies={scan.telemetry.cookies} />

        {/* 4. Web Security & Infrastructure Headers */}
        <SecurityHeadersCard
          headers={scan.telemetry.securityHeaders}
          tlsVersion={scan.telemetry.tlsVersion}
          hasHsts={scan.telemetry.hasHsts}
        />

        {/* 5. Pre-Consent Trackers & Banner Dark Pattern Analysis */}
        <TrackerRadar

          trackers={scan.telemetry.trackers}
          bannerAnalysis={scan.aiAudit.bannerAnalysis}
        />

        {/* 5. India DPDP Act 2023 & GDPR Statutory Checklist */}
        <LegalChecklist checklist={scan.aiAudit.dpdpAndGdprChecklist} />

        {/* 6. Automated Remediation Drawer (Markdown Clauses + Fix Code) */}
        <RemediationDrawer remediation={scan.aiAudit.remediationPackage} />
      </main>

      <Footer />
    </div>
  );
}
