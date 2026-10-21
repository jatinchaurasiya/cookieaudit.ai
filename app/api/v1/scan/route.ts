import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { validateUrlAgainstSsrf, SsrfSecurityError } from "@/lib/security/ssrf-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";

import { runHybridComplianceScan } from "@/lib/scanner/hybrid-orchestrator";
import { categorizeDiscoveredCookies } from "@/lib/scanner/cookie-categorizer";
import { gradeOwaspSessionSecurity } from "@/lib/scanner/owasp-grader";
import { calculateScanScores } from "@/lib/scanner/scoring-engine";
import { runMiniMaxComplianceAudit } from "@/lib/ai/openrouter-auditor";
import { computeAuditSha256 } from "@/lib/export/pdf-certificate";
import { saveScanResult } from "@/lib/db/scan-store";
import { CompleteAuditResult } from "@/lib/types/audit";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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

    // 1. SSRF Guard: Validate URL & DNS
    let validated: { validUrl: URL; resolvedIp: string };
    try {
      validated = await validateUrlAgainstSsrf(targetUrl);
    } catch (err: any) {
      if (err instanceof SsrfSecurityError) {
        return NextResponse.json({ error: `SSRF Guard: ${err.message}` }, { status: 403 });
      }
      return NextResponse.json({ error: `URL validation error: ${err.message}` }, { status: 400 });
    }

    // 2. IP Rate Limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = await checkRateLimit(clientIp, 10);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Unauthenticated scans are limited to 10 per hour.",
          resetSeconds: rateCheck.resetSeconds,
        },
        { status: 429 }
      );
    }

    // 3. Two-Tier Hybrid Inspection Engine
    const telemetry = await runHybridComplianceScan(validated.validUrl.toString());

    // 4. OpenCookieDB Categorization
    const categorizedCookies = categorizeDiscoveredCookies(telemetry.cookies);

    // 5. OWASP ASVS Session Security Grader
    const isHttps = validated.validUrl.protocol === "https:";
    const gradedCookies = gradeOwaspSessionSecurity(categorizedCookies, isHttps);
    telemetry.cookies = gradedCookies;

    // 6. MiniMax M3.1 AI Legal & Dark Pattern Audit
    const aiAudit = await runMiniMaxComplianceAudit({
      targetUrl: telemetry.targetUrl,
      discoveredCookies: gradedCookies,
      trackers: telemetry.trackers,
      bannerHtmlSnippet: telemetry.bannerHtmlSnippet,
      privacyPolicyMarkdown: telemetry.privacyPolicyMarkdown,
    });

    // 7. Deterministic 3-Pillar Scoring
    const scores = calculateScanScores(gradedCookies, telemetry.trackers, aiAudit);

    // 8. Cryptographic Non-Repudiation Seal (SHA-256)
    const insecureCookieCount = gradedCookies.filter((c) => c.owaspIssues.length > 0).length;
    const sha256Hash = computeAuditSha256({
      targetUrl: telemetry.targetUrl,
      timestamp: telemetry.scanTimestamp,
      scores,
      cookieCount: gradedCookies.length,
      insecureCookieCount,
      trackerCount: telemetry.trackers.length,
    });

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
    };

    // Store for retrieval and PDF export
    await saveScanResult(completeResult);

    return NextResponse.json(completeResult);
  } catch (err: any) {
    console.error("Scan pipeline execution error:", err);
    return NextResponse.json(
      { error: "Internal scan orchestrator error", details: err.message },
      { status: 500 }
    );
  }
}
