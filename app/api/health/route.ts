import { NextResponse } from "next/server";


export async function GET() {
  const crawl4aiUrl = process.env.CRAWL4AI_URL || "http://localhost:11235";
  let crawl4aiStatus = "UNREACHABLE_FALLBACK_ACTIVE";

  try {
    const res = await fetch(`${crawl4aiUrl}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) crawl4aiStatus = "READY";
  } catch {
    // Expected when local Docker container is not spun up; fallback active
  }

  return NextResponse.json({
    status: "healthy",
    product: "CookieAudit AI",
    version: "1.0.0",
    engine: {
      tier1Probe: "ACTIVE",
      tier2Crawl4AI: crawl4aiStatus,
      openCookieDbRules: 2500,
      aiModel: process.env.OPENROUTER_MODEL || "minimax/minimax-m3.1-flash:free",
      cryptographicDigest: "SHA-256",
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
