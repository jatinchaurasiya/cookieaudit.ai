import {
  ShieldAlert,
  ServerCrash,
  Cpu,
  Layers,
  FileText,
  LockKeyhole,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function FeaturesGrid() {
  return (
    <section id="architecture" className="py-16 md:py-24 border-t border-slate-800/80 bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800 text-xs text-indigo-300 font-mono mb-3">
            <Layers className="w-3.5 h-3.5" /> ARCHITECTURAL ADVANTAGE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">
            Solving the Production Scraping &amp; Compliance Bottleneck
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
            Raw headless browsers in production suffer from zombie process leaks and OOM crashes.
            CookieAudit AI replaces raw Playwright with an ultra-reliable Two-Tier engine.
          </p>
        </div>

        {/* Comparison: Raw Playwright vs Two-Tier Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Card 1: Raw Playwright (The Pain) */}
          <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/40 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-900/40 text-rose-400">
                <ServerCrash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-rose-200 text-base">Raw Playwright in Production</h3>
                <span className="text-xs text-rose-400 font-mono">Fragile &amp; Resource Heavy</span>
              </div>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Chromium Zombie Leaks:</strong> Unrecycled tabs cause 1.2GB+ RAM exhaustion and container crashes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Messy HTML Dumps:</strong> Wastes 75% of LLM tokens on navigation headers, svgs, and bloated DOM trees.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>WAF Cloudflare Blocks:</strong> Headless browsers get blocked immediately by anti-bot walls.
                </span>
              </li>
            </ul>
          </div>

          {/* Card 2: CookieAudit AI Two-Tier Engine (The Solution) */}
          <div className="p-6 rounded-2xl bg-sky-950/20 border border-sky-800/40 relative shadow-lg shadow-sky-950/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-sky-900/40 text-sky-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sky-200 text-base">CookieAudit AI Two-Tier Engine</h3>
                <span className="text-xs text-sky-400 font-mono">Tier-1 Probe + Crawl4AI CDP</span>
              </div>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tier-1 Instant Probe (&lt;150ms):</strong> Captures Set-Cookie headers and static trackers with zero browser RAM.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Crawl4AI Fit-Markdown:</strong> Strips 80% DOM noise, generating clean LLM markdown for MiniMax M3.1.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Resilient Auto-Fallback:</strong> If the dynamic browser container is busy, Tier-1 Cheerio handles the scan without failing.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3 Pillars of Evaluation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
              <LockKeyhole className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-2">Pillar 1: OWASP Session Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Audits HttpOnly (OWASP A03 XSS prevention), Secure flags over HTTPS (OWASP A02 MITM protection), SameSite configuration, and RFC 6265bis 400-day TTL limits.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-2">Pillar 2: Pre-Consent Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flags marketing beacons (Meta Pixel, Google Tag Manager, Hotjar, Clarity) executing before affirmative consent, matching against 2,500+ OpenCookieDB patterns.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-2">Pillar 3: DPDP &amp; GDPR Legal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MiniMax M3.1 Flash audits 6 DPDP Act Rule 3 statutory provisions (Itemized notice, Grievance Officer, Board appeal rights) and flags banner dark patterns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
