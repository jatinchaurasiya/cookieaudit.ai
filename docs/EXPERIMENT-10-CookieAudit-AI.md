# WEB SECURITY & COMPLIANCE

## EXPERIMENT NO. 10 — Secure Web Application Mini-Project

### CookieAudit AI — A Secure Automated Web Privacy, Cookie Security & Regulatory Compliance Scanner

---

## 1. Title

Secure Web Application Mini-Project: **CookieAudit AI** — An Automated Web Privacy, Cookie Security and Regulatory Compliance Scanner (Next.js).

---

## 2. Aim

To demonstrate a web application with relevant server-side security controls, including protection against Server-Side Request Forgery (SSRF) with DNS pinning and redirect re-validation, spoof-resistant request rate limiting backed by Redis, strict input validation, tamper-evident cryptographic audit certification using SHA-256 and HMAC, safe error handling, SQL-injection-safe persistence with row level security, and HTTP security response headers.

---

## 3. Tools and Software Required

| Tool | Purpose / Requirement |
|---|---|
| Hardware | Computer or laptop with a modern web browser. |
| Operating system | Windows 10/11; commands use PowerShell. |
| Runtime | Node.js 20+ (Node runtime API routes). |
| Framework | Next.js 16 (App Router, React 19, TypeScript, Turbopack). |
| Frontend | React Server Components, client components, Tailwind CSS, Jinja-free typed JSX. |
| Parsing / scanning libraries | Cheerio (HTML parsing), set-cookie-parser (Set-Cookie header parsing), ipaddr.js (IP range classification). |
| Validation | Zod schemas for LLM output and API inputs. |
| Crypto | Node built-in `node:crypto` (SHA-256 digests, HMAC-SHA256 signatures, `timingSafeEqual`). |
| Rate limiting | Redis 7 via `ioredis` (docker-compose), in-memory fallback. |
| Outbound browser automation (optional Tier 2) | Crawl4AI Docker microservice. |
| Database | Supabase PostgreSQL (SQLAlchemy not used; server-side REST client) with row level security. |
| PDF reporting | jsPDF with jspdf-autotable (server-side generation). |
| Editor and browser | Visual Studio Code and Google Chrome or Edge. |

---

## 4. Theory

### 4.1 Overview of CookieAudit AI

CookieAudit AI is an automated compliance scanner for websites. Given a public URL, it inspects the target site's transport (TLS, HSTS), HTTP `Set-Cookie` headers, cookie attributes, third-party tracker scripts, privacy-policy text and consent-banner DOM, and produces a graded compliance report against the India DPDP Act 2023 / Rules 2025, EU GDPR / EDPB guidance and OWASP session-security practice. Findings are scored on three pillars (OWASP 35 / Tracking 35 / Legal 30), sealed with a cryptographic digest and signature, exportable as PDF, and publicly verifiable at `/verify/[hash]`.

### 4.2 Web Application Security

Web application security protects the confidentiality, integrity and availability of information handled by an application. CookieAudit AI is itself an internet-facing application that accepts untrusted URLs from anonymous users and performs outbound requests on their behalf — a topology that introduces server-side risks (SSRF, resource abuse, spoofed identity) that must be controlled in addition to the more familiar client-facing risks.

### 4.3 SSRF Protection and Outbound Request Isolation

Unlike FinPlay, which authenticates users, CookieAudit AI's primary attack surface is the **fetching engine**: the server requests whatever URL an anonymous visitor supplies. Two classic attacks exist:

1. **SSRF via supplied URL** — users submit internal addresses (`http://127.0.0.1:6379`, `http://169.254.169.254`) to reach services that are only reachable from the server's own network.
2. **DNS rebinding / TOCTOU (Time-Of-Check to Time-Of-Use)** — the hostname is validated (safe) but re-resolved when the connection is dialed, so a malicious DNS server can return a private IP for the second lookup.

CookieAudit AI defends both. `validateUrlAgainstSsrf` enforces HTTP/HTTPS only, rejects internal hostnames, resolves DNS once, and classifies every resolved address with `ipaddr.js` (`loopback`, `private`, `linkLocal`, `carrierGradeNat`, `uniqueLocal`, `reserved` ranges are refused). The resolved IP is then **pinned at the socket** by a custom `lookup` hook, so connection-level DNS resolution can never deviate from the validated address. Redirects are followed **manually**: `redirect: "follow"` is not used; every hop's URL is re-validated through the same guard, which defeats the common "public URL that 302s to the cloud metadata service" bypass. Every fetch also carries a wall-clock deadline, a body-size cap and a bounded redirect count, so outbound work is bounded.

### 4.4 Request Rate Limiting and Identity Trust Model

Unauthenticated abuse of compute/network budgets is countered with fixed-window counters in **Redis** (`INCR` + first-instance `EXPIRE` in one atomic Lua script), which works consistently across server instances with a per-process in-memory fallback and a circuit breaker during Redis outages. Quotas are configured per scope (`scan`, `pdf-export`, `drift-cron`) and enforced **before** any DNS resolution so anonymous callers cannot consume server-side lookups for free.

Because the limiter keys on client identity, trusting headers blindly is itself a vulnerability: the previous practice of reading `x-forwarded-for` directly let an attacker mint unlimited "fresh" IP buckets. CookieAudit AI resolves identity according to the deployment's **trust model** (`IP_STRATEGY`: platform-normalized *leftmost*, reverse-proxy *rightmost-trusted* with `TRUSTED_PROXY_COUNT`, or fail-closed `none`), validating that the chosen value is a routable (non-private) IP and otherwise collapsing traffic into one shared bucket.

Separately from abuse resistance, the product distinguishes **identity classes**: anonymous browsers receive a generous interactive quota, and callers presenting a configured API key (`X-API-Key` or `Authorization: Bearer`, compare-validated in constant time) are accounted against their own key-tier namespace with a higher or unlimited quota — so high-volume integrations never compete with anonymous browsers, and scripts never drain buckets shared with humans. Clients see real budget state through the standard `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` response headers (omitted honestly, not fabricated, for uncapped scopes).

### 4.5 Input Validation

Every boundary validates shape and range before processing: the scan endpoint rejects missing/non-URL values and unexpected protocols; the PDF endpoint requires an `id`; the drift endpoint requires two scan identifiers and, additionally, refuses self-comparison requests that would produce fabricated "drift"; Slack webhook URLs are validated structurally (scheme, host `hooks.slack.com`, path prefix `/services/`). Zod schemas validate the structured output returned by the external LLM before it can reach reports or storage. The OpenCookieDB matcher compiles stored regexes once at startup and applies them only to the cookie **name** (never to values).

### 4.6 Tamper-Evident Audit Certification (SHA-256 + HMAC)

Each audit's full content — every discovered cookie and its attributes, both cookie findings and tracker findings, security headers, the banner DOM, the privacy-policy text digest and the complete statutory checklist — is serialized with recursive key-sorted **canonical JSON** and digested with SHA-256. Because a bare digest is recomputable by anyone (it is a fingerprint, not proof of origin), the deployment additionally computes `HMAC-SHA256(AUDIT_SEAL_SECRET, canonicalPayload)`; the verification page **recomputes both** the digest and the signature against the stored payload (using `crypto.timingSafeEqual`) and reports *verified*, *legacy* (payload not archived; no content claim) or *violation* (stored data does not match its seal). This is a tamper-detection control: any modification of stored rows becomes evident.

### 4.7 Error Handling and Information Disclosure

Unexpected exceptions no longer leak internal details. A central helper logs full stack detail server-side with a generated `requestId` and returns a stable generic message plus that request identifier to the caller. Only *intentional* validation failures (SSRF guard rejections, invalid input) return actionable messages.

### 4.8 Security Response Headers

The application sets `Content-Security-Policy` (`default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (legacy browsers; `frame-ancestors` supersedes it), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation disabled) and, for HTTPS deployments, `Strict-Transport-Security`. PDF downloads are served with `nosniff` and safe attachment filenames (URL-malicious characters stripped). The Next.js default `X-Powered-By` disclosure is disabled. Monitoring output is consistent with the values the scanner itself audits on target websites.

### 4.9 Persistence Security

Scan records persist to Supabase PostgreSQL. The server uses the **service role key** for writes — which legally bypasses row level security because writes are server-side — while the public anon surface remains RLS-restricted (`is_public`-only reads). Client-side code never receives the service key. Query filters are parameterized by the storage client's API (no string-built SQL), and the in-memory cache is bounded by size and TTL to prevent unbounded growth. Cookie values themselves are truncated and redacted at the scanner before anything is stored or printed.

### 4.10 Authorization Model and Scheduled Endpoints

The application is primarily public-read; state-changing endpoints are limited in budget (rate limited) and, for automation endpoints such as the drift monitor, protected by a **shared secret** (`DRIFT_CRON_SECRET`) which is required in production. Self-comparison requests are rejected because they produce meaningless "drift" reports.

### 4.11 Security Compliance and Limitations

The project demonstrates selected secure-development practices relevant to common OWASP web application risk areas (SSRF A10, identification-and-authentication failures via shared-secret endpoints and identity trust model, resource abuse via rate limiting, information disclosure via sanitized errors, tamper detection via the seal). It is not a certification or formal penetration test. Before production use, additional review is needed for: bot-detection interplay with target sites, tracker-signature coverage (the OpenCookieDB subset), LLM-path prompt robustness, CSRF posture for any future cookie-session flows, DDoS protection at the edge, and broader security testing.

---

## 5. Code

Representative excerpts. Refer to `lib/security/`, `lib/export/audit-seal.ts` and `next.config.ts` in the project source for the complete implementation.

### 5.1 SSRF Guard — URL and DNS Validation (SSRF-First Defense)

```ts
// lib/security/ssrf-guard.ts (excerpt)
if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
  throw new SsrfSecurityError("Only http: and https: are allowed.");

if (hostname === "localhost" || hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") || hostname.endsWith(".internal"))
  throw new SsrfSecurityError(`Access to internal hostname '${hostname}' is prohibited.`);

const lookupResults = await dns.promises.lookup(hostname, { all: true });
for (const ipStr of lookupResults.map((r) => r.address)) {
  const range = ipaddr.parse(ipStr).range();
  if (["loopback","private","linkLocal","carrierGradeNat",
       "multicast","broadcast","reserved","uniqueLocal","unspecified"].includes(range))
    throw new SsrfSecurityError(`Target resolved to prohibited IP ... (SSRF blocked).`);
}
```

### 5.2 DNS Pinning at the Socket (TOCTOU/DNS-Rebinding Defense)

```ts
// lib/security/ssrf-guard.ts (excerpt)
export function createPinnedLookup(resolvedIp: string): PinnedLookupFunction {
  const family = resolvedIp.includes(":") ? 6 : 4;
  return (_hostname, options, callback) => {
    process.nextTick(() => {
      // Node >= 18 invokes custom lookups with { all: true } and expects an
      // array of {address, family}; classic lookups expect (address, family).
      (options as { all?: boolean })?.all
        ? callback(null, [{ address: resolvedIp, family }])
        : callback(null, resolvedIp, family);
    });
  };
}
```

### 5.3 Manual Redirect Chasing with Per-Hop Re-Validation

```ts
// lib/security/secure-http.ts (excerpt)
// redirect: "follow" is NOT used; every hop is re-validated by the guard.
if (REDIRECT_STATUSES.has(res.statusCode) && location) {
  res.resume();                                  // discard hop body
  const nextUrl = new URL(location, validated.validUrl);
  redirectHops.push(nextUrl.toString());          // keep as audit evidence
  validated = await validateUrlAgainstSsrf(nextUrl.toString());
  pinnedIp = validated.resolvedIp;                // re-pin (TOCTOU-safe)
  continue;
}
```

### 5.4 Trust-Model-Aware Client Identity

```ts
// lib/security/client-ip.ts (excerpt)
// Spoofed x-forwarded-for values can no longer mint unlimited rate-limit
// buckets: the identity is read according to the deployment's trust model and
// must be a routable (public) IP; otherwise traffic shares one bucket.
const hopIndex = Math.max(parts.length - 1 - trustedProxyCount, 0);
for (let i = hopIndex; i >= 0; i--) if (isRoutableIp(parts[i])) return parts[i];
return "unknown"; // fail-closed aggregate bucket
```

### 5.5 Atomic Redis Rate Limiting

```ts
// lib/security/rate-limiter.ts (excerpt)
const COUNT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count`;

const count = (await redis.eval(COUNT_SCRIPT, 1, key, String(windowSeconds))) as number;
if (count > limit) return { success: false, ... };  // before ANY DNS I/O
```

### 5.6 Input Validation at API Boundaries

```ts
// app/api/v1/scan/route.ts (excerpt)
if (!rawUrl) return NextResponse.json({ error: "Missing required 'url' parameter." }, { status: 400 });
if (protocol !== "https:" && protocol !== "http:")
  return NextResponse.json({ error: "Only http: and https: protocols are supported." }, { status: 400 });
// Zod validated LLM output:
return ComplianceAuditOutputSchema.parse(JSON.parse(cleanedJson));
```

### 5.7 Tamper-Evident Seal (Canonical JSON + HMAC Signature)

```ts
// lib/export/audit-seal.ts (excerpt)
export function signAuditPayload(payload: AuditSealPayload): string {
  return crypto.createHmac("sha256", getSealSecret())
    .update(canonicalJson(payload), "utf8").digest("hex");
}

export function computeAuditSha256(payload: AuditSealPayload): string {
  return crypto.createHash("sha256")
    .update(canonicalJson(payload), "utf8").digest("hex");
}

// tamper detection with constant-time comparison
const recomputed = computeAuditSha256(record.auditPayload);
digestMatch = recomputed === record.sha256Hash;
signatureMatch = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(record.signatureHmac));
```

### 5.8 Safe Error Handling

```ts
// lib/api/error-response.ts (excerpt)
export function internalErrorPayload(route: string, err: unknown, reqId: string) {
  console.error(`[${route}] request=${reqId} failed:\n${detail}`); // full detail stays server-side
  return { status: 500, body: { error: "Internal audit orchestrator error", requestId: reqId } };
}
```

### 5.9 Security Response Headers

```ts
// next.config.ts (excerpt)
// Production CSP is strict; dev alone receives 'unsafe-eval' because React's
// development tooling requires eval() (it is never used in production).
async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' 'unsafe-inline'; ...; frame-ancestors 'none'; upgrade-insecure-requests" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options",        value: "DENY" },
      { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ],
  }];
}
```

---

## 6. Procedure to Run

```powershell
npm install                 # install dependencies (ioredis, cheerio, etc.)
docker compose up -d        # optional: Crawl4AI (deep JS cookies) + Redis
npm run dev                 # start Next.js dev server on http://localhost:3000
node scripts\security-smoke.mjs http://localhost:3000   # repeatable security checks
npm run build; npm run start  # production build and server
```

Production requires `AUDIT_SEAL_SECRET` and `DRIFT_CRON_SECRET`; templates are provided in `.env.example`.

---

## 7. Security Compliance

Perform these checks only on the local CookieAudit AI instance and against target sites you control or that permit scanning.

| Test | Procedure | Expected Result |
|---|---|---|
| SSRF — private IP | `POST /api/v1/scan` with `{"url":"http://127.0.0.1:6379"}`. | HTTP 403 "SSRF Guard ... loopback ... blocked". |
| SSRF — cloud metadata | Scan `http://169.254.169.254` or a domain resolving to it. | HTTP 403 "prohibited IP ... metadata blocked". |
| Redirection bypass | Scan a URL that 302-redirects to an internal address. | The redirect hop is re-validated and rejected (manual chasing). |
| Rate limiting | Burst the scan endpoint past `SCAN_RATE_LIMIT_PER_HOUR`. | HTTP 429 with `Retry-After`; success responses carry `X-RateLimit-Limit` / `Remaining` / `Reset`. |
| Quota transparency | Open DevTools → Network on any scan response. | `X-RateLimit-*` headers show the real budget; uncapped scopes omit them (never fabricate "infinite"). |
| API-key identity class | With `SCAN_API_KEYS` configured, run scans with `X-API-Key/<key>` after exhausting the anonymous quota. | Key requests are accounted in their own namespace and succeed (or fail only at the SSRF guard), not 429. |
| Identity spoofing | Repeat the burst with random `x-forwarded-for` values. | Still throttled (buckets are not minted from spoofable headers). |
| Protected/unknown resources | Open `/scan/00000000-...` or `/verify/deadbeef`. | "Audit Record Not Found"/verification failed state; no data leak. |
| Drift endpoint security | `POST /api/v1/cron/drift-scan` without the secret in production. | HTTP 503/403; with secret: self-comparison requests rejected as meaningless. |
| Input validation | Export PDF without `id`; scan without `url`. | HTTP 400 validation error. |
| Error hygiene | Trigger an unexpected server error. | Generic message + `requestId`; no stack traces or internal details. |
| Response headers | DevTools → Network → select a page request → Response Headers. | CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy present. |
| Tamper evidence | Load `/verify/[hash]` for a stored audit; conceptually modify the stored row. | Recomputed digest/HMAC mismatch is surfaced as INTEGRITY VIOLATION. |
| Seal discipline | Start `npm run start` without `AUDIT_SEAL_SECRET`. | Server refuses to mint certificates (fail-loud). |

**Limitations:** the tracker signature database and CMP fingerprints are heuristic subsets (a site may load additional trackers via run-time injection); there is no browser-level network observation — "pre-consent" is markup-based inference; the OpenRouter LLM path (when configured) adds richness but its findings are still advisory; HTTPS/HSTS enforcement, edge DDoS protection and formal penetration testing remain deployment responsibilities. This is an educational demonstration, not a formal security certification.

---

## 8. Output Images of the Website

Screenshots captured from the running local CookieAudit AI application:

- **Figure 1:** CookieAudit AI landing page with the instant scan input.
- **Figure 2:** Interactive audit dashboard — three-pillar scores, grade badge and OWASP cookie matrix.
- **Figure 3:** DPDP/GDPR statutory checklist with verbatim policy evidence quotes and remediation snippets.
- **Figure 4:** Tamper-evident certificate verification page (`/verify/[hash]`) showing recomputed digest and HMAC seal.

---

## 9. Conclusion

CookieAudit AI demonstrates how selected security mechanisms can be incorporated into an internet-facing application whose core function is making outbound requests on behalf of untrusted users. The project includes SSRF validation with socket-level DNS pinning and per-hop redirect re-validation, Redis-backed rate limiting built on an explicit identity trust model, strict input validation, a tamper-evident SHA-256 + HMAC audit seal with recomputed verification, sanitized error handling, RLS-safe persistence with a bounded cache, and security response headers. It provides a practical example of server-side request safety, abuse resistance, and cryptographic integrity verification. Further review and testing are required before production deployment.

---

## 10. Course Outcome

After completing this experiment, the student should be able to:

- Explain SSRF, DNS rebinding and the practice of validating outbound request targets at the socket level.
- Describe rate limiting, client-identity trust models, and why spoofable headers must not define identity.
- Explain input validation and structured output validation (Zod).
- Understand canonical JSON, SHA-256 digests and HMAC signatures, and the difference between a fingerprint and proof of origin.
- Identify the purpose of common HTTP security response headers.
- Recognize the difference between an educational demonstration and a production security audit.

---

## 11. Viva Questions with Answers

**Q. What is Server-Side Request Forgery (SSRF)?**
Answer: SSRF tricks a server into making requests to internal addresses (loopback, private ranges, cloud metadata) that only the server's network can reach — usually by supplying a crafted URL to a feature that fetches remote resources.

**Q. Why is URL validation alone not sufficient against SSRF?**
Answer: An attacker can bypass validation with redirect chains (a public URL that 302s internally) or DNS rebinding (the hostname resolves to a safe IP during validation but a private one when the connection is dialed). Validation must therefore be repeated on every redirect hop and the validated IP must be pinned at the socket.

**Q. What is DNS rebinding / TOCTOU?**
Answer: Time-Of-Check to Time-of-Use is the window between validating a hostname's DNS answer and using it. Attackers may change the DNS response in that window, so the connection lands on a different (internal) address. Socket-level pinning closes the window because DNS is never consulted again.

**Q. Why does CookieAudit AI follow redirects manually?**
Answer: So that every hop's destination can be re-validated by the SSRF guard before the request proceeds; automatic following would connect to whatever the target redirects to, without checking it.

**Q. What is the rate-limit identity trust model and why does it matter?**
Answer: It defines which input can determine "who is making this request". If a spoofable header like `x-forwarded-for` were trusted blindly, an attacker could appear as unlimited fresh clients and bypass quotas. The deployment declares its proxy structure (`IP_STRATEGY`, `TRUSTED_PROXY_COUNT`) and the chosen value must be a routable public IP; otherwise traffic shares one bucket (fail-closed).

**Q. Why use Redis for rate limiting instead of memory?**
Answer: In-memory counters are per-process; multi-instance deployments would multiply the effective quota and not share state. Redis' atomic `INCR`+`EXPIRE` script gives one consistent counter per scope across all instances.

**Q. Why is a bare SHA-256 digest not a "certificate" or proof of authenticity?**
Answer: Anyone can recompute the digest of data they know. A digest is tamper-*detection* only relative to a stored copy; adding an HMAC signature with a server-held secret makes the seal *non-forgeable* by parties without the secret.

**Q. What does `/verify/[hash]` actually recompute?**
Answer: It recomputes the SHA-256 of the stored canonical audit payload and recomputes the HMAC seal with constant-time comparison. If the stored content does not reproduce the recorded digest and signature, the page reports an integrity violation rather than success.

**Q. Why canonicalize JSON before hashing?**
Answer: So that two logically identical payloads with different key ordering (or formatting) produce the same bytes and therefore the same digest. Without canonicalization the hash depends on serialization order rather than content.

**Q. Name three security headers used by CookieAudit AI.**
Answer: Content-Security-Policy, X-Frame-Options (legacy; superseded by CSP `frame-ancestors`) and X-Content-Type-Options — plus Referrer-Policy and Permissions-Policy.
