import {
  ShieldAlert,
  ShieldCheck,
  LockKeyhole,
  FileCheck,
  Scale,
  Activity,
  AlertOctagon,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function FeaturesGrid() {
  return (
    <section id="pillars" className="py-16 md:py-24 border-t border-slate-800/80 bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800 text-xs text-indigo-300 font-mono mb-3">
            <Scale className="w-3.5 h-3.5" /> ENTERPRISE COMPLIANCE INTELLIGENCE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">
            Eliminate Statutory Exposure &amp; Secure Session Infrastructure
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            Traditional compliance audits are manual, slow, and outdated the moment a marketing tag is
            injected. CookieAudit AI delivers real-time, evidence-based privacy telemetry and automated
            remediation.
          </p>
        </div>

        {/* Comparison: The Compliance Blindspot vs Continuous Governance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Card 1: The Risk */}
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-900/40 relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-rose-900/40 text-rose-400">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-rose-200 text-base">The Enterprise Blindspot</h3>
                <span className="text-xs text-rose-400/90 font-mono">Unmonitored Tracking &amp; Insecure Cookies</span>
              </div>
            </div>
            <ul className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Unconsented Tag Injections:</strong> Marketing teams routinely deploy Meta Pixel, TikTok, or analytics beacons via Google Tag Manager that fire before explicit consent is granted.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Severe Statutory Penalties:</strong> India's DPDP Act 2023 mandates penalties up to ₹250 Crores (Section 33) for failing to deploy reasonable security safeguards and itemized notices.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Session Hijacking Vulnerabilities:</strong> Authentication tokens deployed without `HttpOnly` and `Secure` attributes expose corporate users to XSS session theft.
                </span>
              </li>
            </ul>
          </div>

          {/* Card 2: The Solution */}
          <div className="p-6 sm:p-8 rounded-3xl bg-sky-950/20 border border-sky-800/40 relative shadow-xl shadow-sky-950/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-sky-900/40 text-sky-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sky-200 text-base">Continuous Automated Governance</h3>
                <span className="text-xs text-sky-400/90 font-mono">Evidence-Based Telemetry &amp; Fixes</span>
              </div>
            </div>
            <ul className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Automated Telemetry Audit:</strong> Instant verification of cookies, third-party network beacons, consent banners, and transport security headers.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Statutory Notice Alignment:</strong> Automatically validates DPDP Rule 3 itemized personal data disclosures, purpose mapping, and grievance redressal officer publication.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Cryptographic Audit Ledger:</strong> Every completed audit generates a tamper-evident SHA-256 seal providing an immutable record for DPOs and compliance auditors.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3 Pillars of Compliance */}
        <div id="statutory" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
              <LockKeyhole className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Pillar 1: OWASP Session Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Audits `HttpOnly` flags (OWASP A03 XSS prevention), `Secure` over HTTPS (OWASP A02 MITM mitigation), SameSite attributes, RFC 6265bis prefixes (`__Host-`), and lifespan boundaries.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Pillar 2: Tracker Governance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intercepts tracking beacons (Meta, Google, TikTok, Hotjar, Clarity) initializing before affirmative consent, verifying compliance against 45+ enterprise tracking networks.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Pillar 3: DPDP &amp; GDPR Statutory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Audits 6 statutory provisions of India DPDP Act 2023 / Rules 2025 (Rule 3 Itemized notice, Grievance Officer, Board appeal rights) and eliminates banner dark patterns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
