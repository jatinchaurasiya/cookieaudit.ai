import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Scale,
  Activity,
  AlertTriangle,
  Radio,
  FileCode2,
  CheckCircle2,
} from "lucide-react";

export function FeaturesGrid() {
  return (
    <section id="pillars" className="py-16 md:py-24 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] text-sky-400 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>3-PILLAR COMPLIANCE MATRIX // BENTO ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight">
            Eliminate Statutory Exposure &amp; Secure Session Infrastructure
          </h2>
          <p className="text-sm text-slate-400 max-w-[65ch] leading-relaxed">
            Traditional privacy audits are manual, slow, and outdated the moment a marketing script is pushed.
            CookieAudit AI automates real-time verification across session architecture, tracker telemetry, and legal mandates.
          </p>
        </div>

        {/* 01 Bento Grid Layout (Slop-test Gate 3: Irregular asymmetric spans, NO 3-equal-column tiles) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Bento Cell 1: 8-column Hero Feature (Tracker Interception) */}
          <div className="md:col-span-8 p-6 sm:p-7 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="font-mono text-[11px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  PILLAR 2 // 35 PTS
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                Pre-Consent Tracking Interception &amp; Network Radar
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[55ch]">
                Intercepts ad networks, analytics beacons, and session replay tools that fire prior to explicit user consent.
                Cross-references network calls against 100+ production tracker signatures across Meta, Google, TikTok, Clarity, and Adobe.
              </p>
            </div>

            {/* Interactive Telemetry Sample Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.05] font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/[0.06] pb-2">
                <span>BEACON_RADAR // VERIFIED PLATFORMS</span>
                <span className="text-emerald-400">STATUS: INTERCEPTING</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Meta Pixel
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Google Analytics 4
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> TikTok Pixel
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Hotjar Replay
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Microsoft Clarity
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Adobe Experience
                </span>
              </div>
            </div>
          </div>

          {/* Bento Cell 2: 4-column Statutory Notice Tile */}
          <div className="md:col-span-4 p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Scale className="w-5 h-5" />
                </div>
                <span className="font-mono text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  PILLAR 3 // 30 PTS
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 tracking-tight">
                India DPDP Act 2023 &amp; GDPR Statutory Notice Check
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated legal parsing verifying DPDP Rule 3 itemized personal data notice, Grievance Redressal Officer disclosures, withdrawal parity, and Board appeal rights.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-400 flex items-center justify-between">
                <span>DPDP Sec 5 Grievance Officer:</span>
                <span className="text-emerald-400 font-bold">VERIFIED</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>DPDP Rule 3 Itemized Notice:</span>
                <span className="text-emerald-400 font-bold">VERIFIED</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Equal-Ease Withdrawal (Sec 6):</span>
                <span className="text-amber-400 font-bold">CHECKED</span>
              </div>
            </div>
          </div>

          {/* Bento Cell 3: 4-column OWASP Session Security Tile */}
          <div className="md:col-span-4 p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  PILLAR 1 // 35 PTS
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 tracking-tight">
                OWASP ASVS v4.0 Session Security
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Audits authentication tokens for `HttpOnly` (XSS mitigation), `Secure` flags over TLS, SameSite CSRF defense, and RFC 6265bis 400-day TTL limits.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-400 flex items-center justify-between">
                <span>HttpOnly (OWASP A03):</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>SameSite (OWASP A01):</span>
                <span className="text-emerald-400">LAX / STRICT</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>RFC 6265bis Prefixes:</span>
                <span className="text-sky-400">__Host-</span>
              </div>
            </div>
          </div>

          {/* Bento Cell 4: 8-column Audit Ledger & Remediation Code Tile */}
          <div className="md:col-span-8 p-6 sm:p-7 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  NON-REPUDIATION LEDGER
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                Cryptographic Audit Ledger &amp; Production Remediation Code
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[55ch]">
                Every completed audit computes a deterministic SHA-256 seal stored on an immutable ledger.
                Includes ready-to-paste Next.js/Express cookie security middleware and consent-gated script controllers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.05] font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">TAMPER-EVIDENT CERTIFICATION HASH:</span>
                <span className="text-sky-400 text-xs">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] shrink-0 self-start sm:self-auto font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
