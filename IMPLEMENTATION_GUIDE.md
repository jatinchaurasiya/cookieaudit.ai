# CookieAudit AI: Complete End-to-End Build Guideline & Phase Implementation Plan

> **Product**: CookieAudit AI — Automated Web Privacy, Cookie Security & Regulatory Compliance SaaS  
> **Target Regulations**: DPDP Act India 2023 / Rules 2025 + EU GDPR + OWASP Session Security  
> **LLM Engine**: `minimax/minimax-m3.1-flash:free` via OpenRouter (with automatic fallback routing)  
> **Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Cheerio, set-cookie-parser, jsPDF, Crawl4AI, Redis, Supabase  

---

## Workspace Directory Architecture

```
cookieaudit.ai/
├── docker-compose.yml              # Self-hosted Crawl4AI + Redis containers
├── .env.example                    # Template environment variables
├── .env.local                      # Local environment configuration
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind design tokens & dark mode styling
├── postcss.config.mjs              # PostCSS configuration
├── public/                         # Static assets, logos, sample reports
│   └── favicon.ico
├── data/
│   └── open-cookie-database.json   # 2,500+ curated cookie signatures & categories
├── lib/
│   ├── types/
│   │   └── audit.ts                # TypeScript interfaces & Zod schemas
│   ├── security/
│   │   ├── ssrf-guard.ts           # DNS pre-resolution & private IP blocking
│   │   └── rate-limiter.ts         # In-memory & Redis rate limiting
│   ├── scanner/
│   │   ├── tier1-probe.ts          # <150ms HTTP headers, Set-Cookie, static <script>
│   │   ├── tier2-crawl4ai.ts       # Crawl4AI CDP JS cookies & fit_markdown extraction
│   │   ├── hybrid-orchestrator.ts  # Two-tier orchestrator with resilient fallback
│   │   ├── cookie-categorizer.ts   # OpenCookieDB pattern matcher
│   │   ├── owasp-grader.ts         # OWASP ASVS session security evaluator
│   │   └── scoring-engine.ts       # 3-Pillar 0-100 scoring algorithm
│   ├── ai/
│   │   ├── openrouter-auditor.ts   # MiniMax M3.1 Flash legal & dark pattern audit
│   │   └── prompt-templates.ts     # DPDP Rule 3 & GDPR Art 13 audit prompts
│   ├── export/
│   │   └── pdf-certificate.ts      # Cryptographic SHA-256 PDF generator
│   └── db/
│       ├── supabase-client.ts      # Supabase connection & helpers
│       └── schema.sql              # PostgreSQL DDL with RLS policies
├── components/
│   ├── ui/                         # Glassmorphism cards, badges, buttons, modal drawers
│   ├── landing/
│   │   ├── HeroScanner.tsx         # Instant URL scan input bar with validation
│   │   ├── FeaturesGrid.tsx        # Value prop & OWASP/DPDP compliance explanation
│   │   └── SampleAudits.tsx        # 1-click live demo audits
│   ├── dashboard/
│   │   ├── ScoreOverview.tsx       # 3-Pillar ring gauges & Grade badge (A+ to F)
│   │   ├── CookieMatrixTable.tsx   # Filterable OWASP cookie table
│   │   ├── TrackerRadar.tsx        # Third-party beacon radar & dark pattern flags
│   │   ├── LegalChecklist.tsx      # DPDP & GDPR requirement cards with evidence quotes
│   │   ├── RemediationDrawer.tsx   # Code snippets (Next.js/Express) & legal clauses
│   │   └── ExportReportBar.tsx     # PDF download & SHA-256 copy actions
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
└── app/
    ├── layout.tsx                  # Root layout with fonts & theme provider
    ├── page.tsx                    # Landing page with instant scan interface
    ├── scan/
    │   └── [id]/
    │       └── page.tsx            # Full interactive audit report dashboard
    ├── verify/
    │   └── [hash]/
    │       └── page.tsx            # Public SHA-256 audit certificate verification
    └── api/
        ├── v1/
        │   ├── scan/
        │   │   └── route.ts        # POST: Execute full scan pipeline
        │   └── export-pdf/
        │       └── route.ts        # GET: Download signed PDF report
        └── health/
            └── route.ts            # System health & crawler status
```

---

## Phase-by-Phase Implementation Plan

### Phase 1: Foundation & Project Scaffolding
- [x] Initialize Next.js 15 with TypeScript, Tailwind CSS, and ESLint.
- [x] Configure `package.json` with required production dependencies:
  - `cheerio`, `set-cookie-parser`, `zod`, `lucide-react`, `recharts`, `jspdf`, `jspdf-autotable`, `ipaddr.js`.
- [x] Create `docker-compose.yml` for self-hosted `crawl4ai` and `redis`.
- [x] Configure `.env.example` and `.env.local` for OpenRouter and application settings.
- [x] Establish design system tokens in `app/globals.css` (modern dark/light mode palette, glassmorphism, glowing compliance grades).

### Phase 2: Security, SSRF Prevention & Rate Limiting
- [x] Create `lib/security/ssrf-guard.ts`:
  - Enforce `http:` / `https:` protocols only.
  - Asynchronously resolve DNS to IPv4/IPv6 addresses via `dns.promises.lookup`.
  - Block all private, loopback, link-local, carrier-grade NAT, and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
- [x] Create `lib/security/rate-limiter.ts`:
  - Token-bucket limiter (in-memory LRU with Redis support).
  - Limit unauthenticated scans to 10 per IP per hour.

### Phase 3: Two-Tier Hybrid Inspection Engine
- [x] Create `lib/scanner/tier1-probe.ts`:
  - Execute zero-browser HTTP request (<150ms).
  - Extract `Set-Cookie` headers via `set-cookie-parser`.
  - Inspect TLS version, HSTS headers, and security flags.
  - Parse HTML via `cheerio` for static `<script>` trackers (Google Analytics, Meta Pixel, Hotjar, TikTok, Clarity) and discover Privacy Policy links.
- [x] Create `lib/scanner/tier2-crawl4ai.ts`:
  - Communicate with Crawl4AI Docker `/crawl` endpoint.
  - Retrieve dynamic JavaScript runtime cookies (`document.cookie` via CDP).
  - Intercept network beacons.
  - Extract clean LLM-ready `fit_markdown` for `/privacy` policies.
  - Extract cookie consent banner DOM.
- [x] Create `lib/scanner/hybrid-orchestrator.ts`:
  - Coordinate Tier 1 and Tier 2 scans.
  - Implement resilient fallback: If Crawl4AI times out (>8s) or fails, gracefully scrape `/privacy` with Cheerio and combine with Tier 1 telemetry so scans never fail.

### Phase 4: OpenCookieDB & Deterministic OWASP Scorer
- [x] Build `data/open-cookie-database.json` and `lib/scanner/cookie-categorizer.ts`:
  - Classify cookies into: Strictly Necessary, Functional, Analytics, Marketing, Unclassified.
  - Regex matching for dynamic tracker cookies (`_ga_*`, `_gid`, `__cf_bm`, etc.).
- [x] Build `lib/scanner/owasp-grader.ts`:
  - Audit `HttpOnly` (prevent XSS session theft - OWASP A03).
  - Audit `Secure` (prevent MITM cleartext sniffing - OWASP A02).
  - Audit `SameSite` (prevent CSRF - OWASP A01).
  - Flag excessive TTL (>400 days).
- [x] Build `lib/scanner/scoring-engine.ts`:
  - 3-Pillar 0-100 scoring algorithm (OWASP 35 pts, Tracking 35 pts, Legal 30 pts).
  - Compute Letter Grade (A+, A, B, C, F) and risk severity.

### Phase 5: OpenRouter MiniMax M3.1 AI Compliance Engine
- [x] Create `lib/ai/openrouter-auditor.ts`:
  - Connect to OpenRouter API with `minimax/minimax-m3.1-flash:free` and fallback array (`minimax/minimax-m3.1-flash`, `google/gemini-2.0-flash-exp:free`).
  - Validate with strict `zod` schema.
- [x] Implement DPDP Act 2023 & Rules 2025 Audit:
  - Itemized notice of personal data collected (Rule 3).
  - Purpose specification and limitation.
  - Grievance Redressal Officer contact details.
  - Equal-ease consent withdrawal mechanism.
  - Data Protection Board of India complaint right.
  - Data retention schedule.
- [x] Implement GDPR Article 13 & Banner Dark Pattern Audit:
  - One-click Reject button equality.
  - Asymmetric styling and visual nudging detection.
- [x] Implement AI Auto-Remediation Generator:
  - Copy-paste DPDP-compliant privacy markdown notice.
  - Secure cookie configuration snippet for Express / Next.js / Nginx.
  - Consent-gated tracker JavaScript wrapper.

### Phase 6: Tamper-Proof Cryptographic PDF Report
- [x] Build `lib/export/pdf-certificate.ts`:
  - Serialize canonical scan audit JSON.
  - Compute cryptographic `SHA-256` hash using `crypto.createHash('sha256')`.
  - Generate multi-page PDF with `jspdf` and `jspdf-autotable`.
  - Embed SHA-256 audit fingerprint and verification URL.
- [x] Create `/api/v1/export-pdf` route to serve downloadable PDF audits.

### Phase 7: Next.js 15 Interactive UI & Dashboard
- [x] Build `components/layout/Navbar.tsx` and `Footer.tsx` with modern branding.
- [x] Build `app/page.tsx` (Landing Page):
  - High-impact hero with live URL input and instant scan button.
  - Value proposition breakdown (DPDP 2023, GDPR, OWASP).
  - Interactive sample scan showcase with 1-click preview.
- [x] Build `app/scan/[id]/page.tsx` (Interactive Audit Dashboard):
  - 3-Pillar score cards with circular progress visualizers.
  - Compliance Grade banner (`Grade A+` to `Grade F`).
  - Interactive, searchable, filterable OWASP Cookie Matrix.
  - Tracker Radar & Dark Pattern Visualizer.
  - DPDP & GDPR Legal Compliance Checklist with verbatim quote highlights.
  - Auto-Remediation Drawer with 1-click copy for legal clauses and code fixes.
  - PDF Certificate Download & SHA-256 Hash Verification badge.
- [x] Build `app/verify/[hash]/page.tsx` (Public Verification Page):
  - Validates any SHA-256 hash and confirms authentic timestamp and score.

### Phase 8: Data Persistence & Production Storage
- [x] Create Supabase schema in `lib/db/schema.sql` for PostgreSQL with Row-Level Security.
- [x] Implement persistent scan store (`lib/db/scan-store.ts`) with Supabase and global memory caching for authentic scans.
- [x] Expanded OpenCookieDB database to 100+ production signatures across 45+ platforms.

### Phase 9: Verification & Testing
- [x] Build verified cleanly via `npm run build` (Turbopack, Next.js 16/React 19).
- [x] SSRF guard verified (Blocks 127.0.0.1, 169.254.169.254, localhost).
- [x] Real PDF certificate generation verified via `/api/v1/export-pdf?id=[scanId]`.
- [x] SHA-256 public non-repudiation verified via `/api/v1/scan/[hash]` and `/verify/[hash]`.

### Phase 10: Enterprise B2B SaaS Copywriting & Model Concealment
- [x] Concealed all internal LLM model identifiers (`minimax/minimax-m3.1-flash`) and container scraper infrastructure names (`Crawl4AI`, `Cheerio`, `Tier 1/2`) from frontend UI and public API responses.
- [x] Rewrote all dashboard cards, checklist headers, remediation drawers, navbar badges, and footer columns with authoritative enterprise SaaS copywriting (comparable to Vanta, OneTrust, and Drata).
- [x] Refactored `/api/health` to expose enterprise security grid telemetry without exposing internal microservice mechanics.
- [x] Re-verified full production compilation (`npm run build`) with zero lint or TypeScript warnings.
