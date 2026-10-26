import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateUrlAgainstSsrf, SsrfSecurityError } from "@/lib/security/ssrf-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { resolveClientIdentifier } from "@/lib/security/client-ip";
import { SCAN_LIMIT_PER_HOUR } from "@/lib/config/limits";
import { runHybridComplianceScan } from "@/lib/scanner/hybrid-orchestrator";
import { categorizeDiscoveredCookies } from "@/lib/scanner/cookie-categorizer";
import { gradeOwaspSessionSecurity } from "@/lib/scanner/owasp-grader";
import { calculateScanScores } from "@/lib/scanner/scoring-engine";
import { runMiniMaxComplianceAudit } from "@/lib/ai/openrouter-auditor";
import {
  buildSealPayload,
  computeAuditSha256,
  signAuditPayload,
} from "@/lib/export/audit-seal";
import { saveScanResult } from "@/lib/db/scan-store";
import { CompleteAuditResult } from "@/lib/types/audit";
import {
  errorMessage,
  expectedErrorPayload,
  internalErrorPayload,
  requestId,
} from "@/lib/api/error-response";

const ROUTE = "POST /api/v1/scan";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const reqId = requestId();

  try {
    const body = await request.json();
    const rawUrl = body.url?.trim();

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing required 'url' parameter." }, { status: 400 });
    }

    // Ensure protocol prefix if user typed "example.com"
    const targetUrl = rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
      ? rawUrl
      : `https://${rawUrl}`;

    // 0. Cheap URL shape validation FIRST (JWT-parse-level no-I/O checks)
    let protocolCheckedUrl: URL;
    try {
      protocolCheckedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }
    if (
      protocolCheckedUrl.protocol !== "https:" &&
      protocolCheckedUrl.protocol !== "http:"
    ) {
      return NextResponse.json(
        expectedErrorPayload({ error: "Only http: and https: protocols are supported." }),
        { status: 400 }
      );
    }

    // 1. Rate limiting BEFORE any network I/O. The DNS-resolving SSRF check is
    //    relatively expensive, so unauthenticated callers must not be able to
    //    spend server DNS/egress budget without first passing a quota.
    //    The identity is spoof-resistant (see lib/security/client-ip.ts):
    //    a header-trusting strategy previously allowed unlimited fresh buckets.
    const clientIdentifier = resolveClientIdentifier(request.headers);
    const rateCheck = await checkRateLimit("scan", clientIdentifier, SCAN_LIMIT_PER_HOUR);

    if (!rateCheck.success) {
      return NextResponse.json(
        expectedErrorPayload({
          error: "Rate limit exceeded. Unauthenticated scans are limited to "
            + SCAN_LIMIT_PER_HOUR + " per hour.",
          resetSeconds: rateCheck.resetSeconds,
          requestId: reqId,
        }),
        { status: 429, headers: { "Retry-After": String(rateCheck.resetSeconds) } }
      );
    }

    // 2. SSRF Guard: validate URL & pin DNS resolution
    let validated: { validUrl: URL; resolvedIp: string };
    try {
      validated = await validateUrlAgainstSsrf(targetUrl);
    } catch (err: unknown) {
      if (err instanceof SsrfSecurityError) {
        return NextResponse.json(
          expectedErrorPayload({ error: `SSRF Guard: ${err.message}`, requestId: reqId }),
          { status: 403 }
        );
      }
      return NextResponse.json(
        expectedErrorPayload({ error: `URL validation error: ${errorMessage(err)}`, requestId: reqId }),
        { status: 400 }
      );
    }

    // 3. Two-Tier Hybrid Inspection Engine (secure, SSRF-pinned transport)
    const telemetry = await runHybridComplianceScan(validated.validUrl.toString());

    // 4. OpenCookieDB Categorization
    const categorizedCookies = categorizeDiscoveredCookies(telemetry.cookies);

    // 5. OWASP ASVS Session Security Grader
    const isHttps = telemetry.tlsProtocol !== null && validated.validUrl.protocol === "https:";
    const gradedCookies = gradeOwaspSessionSecurity(categorizedCookies, isHttps);
    telemetry.cookies = gradedCookies;

    // 6. Compliance Audit (OpenRouter via MiniMax / deterministic fallback)
    const aiAudit = await runMiniMaxComplianceAudit({
      targetUrl: telemetry.targetUrl,
      discoveredCookies: gradedCookies,
      trackers: telemetry.trackers,
      bannerHtmlSnippet: telemetry.bannerHtmlSnippet,
      privacyPolicyMarkdown: telemetry.privacyPolicyMarkdown,
    });

    // 7. Deterministic 3-Pillar Scoring
    const scores = calculateScanScores(gradedCookies, telemetry.trackers, aiAudit);

    // 8. Tamper-evident seal (v2): digest + HMAC over the COMPLETE audit
    //    payload. Digest alone is recomputable by anyone; the HMAC makes the
    //    seal non-forgeable without the server secret, and /verify re-runs the
    //    computation instead of pattern-matching strings.
    const auditPayload = buildSealPayload({
      targetUrl: telemetry.targetUrl,
      domain: telemetry.domain,
      timestamp: telemetry.scanTimestamp,
      scores,
      telemetry,
      aiAudit,
      consentFrameworkDetected: telemetry.consentFrameworkDetected,
    });
    const sha256Hash = computeAuditSha256(auditPayload);
    const signatureHmac = signAuditPayload(auditPayload);

    const scanId = crypto.randomUUID();
    const executionTimeMs = Date.now() - startTime;

    const completeResult: CompleteAuditResult = {
      id: scanId,
      targetUrl: telemetry.targetUrl,
      domain: telemetry.domain,
      timestamp: telemetry.scanTimestamp,
      scores,
      telemetry,
      aiAudit,
      sha256Hash,
      executionTimeMs,
      auditPayload,
      signatureHmac,
    };

    // 9. Persistence - outcome is checked and surfaced, never silent
    const saveOutcome = await saveScanResult(completeResult);
    completeResult.persisted = saveOutcome.persisted;

    return NextResponse.json(completeResult);
  } catch (err: unknown) {
    // Target unreachable / timeouts are client-facing conditions, not bugs
    const internal = internalErrorPayload(ROUTE, err, reqId);
    return NextResponse.json(internal.body, { status: internal.status });
  }
}
