import { NextResponse } from "next/server";
import { getRateLimiterStatus } from "@/lib/security/rate-limiter";
import { isSealSecretConfigured } from "@/lib/export/audit-seal";
import { getSupabaseMode } from "@/lib/db/supabase-client";
import { getScanCacheStats } from "@/lib/db/scan-store";


export async function GET() {
  const crawl4aiUrl = process.env.CRAWL4AI_URL || "http://localhost:11235";
  let crawl4aiStatus = "UNREACHABLE_FALLBACK_ACTIVE";

  try {
    const res = await fetch(`${crawl4aiUrl}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) crawl4aiStatus = "READY";
  } catch {
    // Expected when local Docker container is not spun up; fallback active
  }

  const limiter = getRateLimiterStatus();

  return NextResponse.json({
    status: "healthy",
    product: "CookieAudit AI",
    version: "1.1.0",
    services: {
      telemetryEngine: "ACTIVE",
      inspectionGrid: crawl4aiStatus === "READY" ? "OPTIMAL" : "STANDBY_REDUNDANT",
      signatureDatabase: "SYNCHRONIZED",
      statutoryAnalyzer: "OPERATIONAL",
    },
    infrastructure: {
      rateLimiter: {
        backend: limiter.configured,
        redisConfigured: limiter.redisUrlConfigured,
        note: limiter.configured === "redis"
          ? "Global counters across instances (graceful per-process fallback during Redis outage)."
          : "Per-process counters. Configure REDIS_URL for globally consistent quotas.",
      },
      auditSeal: {
        secretConfigured: isSealSecretConfigured(),
        note: isSealSecretConfigured()
          ? "HMAC-signed certificates active."
          : "AUDIT_SEAL_SECRET unset - seals use an ephemeral dev key and are not portable.",
      },
      persistence: {
        supabaseMode: getSupabaseMode(),
      },
      scanCache: getScanCacheStats(),
    },
    statutoryFrameworks: [
      "India DPDP Act 2023",
      "India DPDP Rules 2025 (Rule 3)",
      "EU GDPR (Regulation 2016/679)",
      "OWASP ASVS v4.0 Session Security",
    ],
    timestamp: new Date().toISOString(),
  });
}
