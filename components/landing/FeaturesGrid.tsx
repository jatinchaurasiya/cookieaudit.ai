import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Scale,
  Radio,
  FileCode2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export function FeaturesGrid() {
  return (
    <section id="pillars" className="py-20 md:py-32 border-t border-black/[0.06] bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-black/[0.08] text-xs font-medium text-[#0066cc] shadow-sm">
            <span>Compliance Architecture</span>
            <ChevronRight className="w-3 h-3" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1d1d1f] tracking-[-0.03em]">
            Eliminate Statutory Exposure. <br />
            Secure Session Infrastructure.
          </h2>
          <p className="text-base text-[#86868b] leading-relaxed max-w-xl mx-auto font-normal">
            Continuous privacy governance and automated remediation across trackers, session cookies, and statutory disclosures.
          </p>
        </div>

        {/* Apple-style Bento Feature Grid (Light Storefront) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: 8-column Pre-Consent Tracking Guard */}
          <div className="md:col-span-8 p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#0066cc]">PILLAR 2</span>
                <span className="text-xs font-mono text-[#86868b]">35 POINTS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                Pre-Consent Tracking Interception &amp; Network Radar
              </h3>
              <p className="text-sm text-[#86868b] leading-relaxed max-w-lg font-normal">
                Intercepts ad networks, analytics beacons, and session replay scripts that fire before affirmative consent.
                Cross-references network activity against 100+ production tracker signatures.
              </p>
            </div>

            {/* Platform Tag Grid */}
            <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[#86868b] text-[11px] border-b border-black/[0.06] pb-2">
                <span>BEACON_RADAR // VERIFIED PLATFORMS</span>
                <span className="text-[#34c759] flex items-center gap-1 font-sans text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" /> Active Guard
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] text-[#1d1d1f]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" /> Meta Pixel
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" /> Google Analytics 4
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" /> TikTok Pixel
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff9500]" /> Hotjar Replay
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff9500]" /> Microsoft Clarity
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc]" /> Adobe Experience
                </span>
              </div>
            </div>

            <div className="pt-1">
              <a href="#scanner" className="apple-link text-xs font-medium">
                <span>Inspect pre-consent ad networks</span>
                <ChevronRight className="w-3.5 h-3.5 chevron" />
              </a>
            </div>
          </div>

          {/* Card 2: 4-column Statutory Notice Tile */}
          <div className="md:col-span-4 p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#0066cc]">PILLAR 3</span>
                <span className="text-xs font-mono text-[#86868b]">30 POINTS</span>
              </div>
              <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
                India DPDP Act 2023 &amp; GDPR Statutory Notice
              </h3>
              <p className="text-xs text-[#86868b] leading-relaxed font-normal">
                Verifies DPDP Rule 3 itemized personal data disclosures, purpose mapping, Grievance Officer details, and withdrawal parity.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] space-y-2 text-xs">
              <div className="text-[#86868b] flex items-center justify-between">
                <span>DPDP Grievance Officer:</span>
                <span className="text-[#34c759] font-semibold">Verified</span>
              </div>
              <div className="text-[#86868b] flex items-center justify-between">
                <span>DPDP Rule 3 Notice:</span>
                <span className="text-[#34c759] font-semibold">Verified</span>
              </div>
              <div className="text-[#86868b] flex items-center justify-between">
                <span>Withdrawal Parity:</span>
                <span className="text-[#ff9500] font-semibold">Audited</span>
              </div>
            </div>

            <div className="pt-1">
              <a href="#scanner" className="apple-link text-xs font-medium">
                <span>View DPDP Rule 3 provisions</span>
                <ChevronRight className="w-3.5 h-3.5 chevron" />
              </a>
            </div>
          </div>

          {/* Card 3: 4-column OWASP Session Security Tile */}
          <div className="md:col-span-4 p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#0066cc]">PILLAR 1</span>
                <span className="text-xs font-mono text-[#86868b]">35 POINTS</span>
              </div>
              <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
                OWASP ASVS v4.0 Session Security
              </h3>
              <p className="text-xs text-[#86868b] leading-relaxed font-normal">
                Audits cookies for `HttpOnly` (XSS protection), `Secure` flags over TLS, SameSite CSRF defense, and RFC 6265bis 400-day TTL boundaries.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] space-y-2 text-xs">
              <div className="text-[#86868b] flex items-center justify-between">
                <span>HttpOnly (XSS):</span>
                <span className="text-[#34c759] font-semibold">Active</span>
              </div>
              <div className="text-[#86868b] flex items-center justify-between">
                <span>SameSite (CSRF):</span>
                <span className="text-[#34c759] font-semibold">Lax / Strict</span>
              </div>
              <div className="text-[#86868b] flex items-center justify-between">
                <span>RFC 6265bis:</span>
                <span className="text-[#0066cc] font-semibold">__Host-</span>
              </div>
            </div>

            <div className="pt-1">
              <a href="#scanner" className="apple-link text-xs font-medium">
                <span>Review OWASP ASVS criteria</span>
                <ChevronRight className="w-3.5 h-3.5 chevron" />
              </a>
            </div>
          </div>

          {/* Card 4: 8-column Audit Ledger & Remediation Code */}
          <div className="md:col-span-8 p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#0066cc]">NON-REPUDIATION</span>
                <span className="text-xs font-mono text-[#86868b]">SHA-256</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                Cryptographic Audit Ledger &amp; Remediation Code
              </h3>
              <p className="text-sm text-[#86868b] leading-relaxed max-w-lg font-normal">
                Every completed audit computes an immutable SHA-256 seal.
                Includes production-ready Next.js/Express secure cookie middleware and consent-gated script wrappers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[11px] text-[#86868b] block font-mono">CRYPTOGRAPHIC AUDIT DIGEST:</span>
                <span className="text-[#0066cc] font-mono text-xs font-medium">
                  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#34c759]/15 text-[#248a3d] border border-[#34c759]/30 text-xs shrink-0 self-start sm:self-auto font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Immutable
              </span>
            </div>

            <div className="pt-1">
              <Link href="/verify/e3b0c44298fc1c14" className="apple-link text-xs font-medium">
                <span>Examine SHA-256 seal mechanics</span>
                <ChevronRight className="w-3.5 h-3.5 chevron" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
