import { NextRequest, NextResponse } from "next/server";
import { getScanById } from "@/lib/db/scan-store";
import { generateAuditPdfCertificate } from "@/lib/export/pdf-certificate";
import { checkRateLimit, RateLimitResult } from "@/lib/security/rate-limiter";
import { resolveClientIdentifier } from "@/lib/security/client-ip";
import { resolveApiKeyAuth, bucketIdentity } from "@/lib/security/api-auth";
import { PDF_LIMIT_PER_HOUR, isUnlimited } from "@/lib/config/limits";
import { expectedErrorPayload, internalErrorPayload, requestId } from "@/lib/api/error-response";

const ROUTE = "GET /api/v1/export-pdf";

function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (isUnlimited(result.limit) || result.remaining < 0) return {};
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetSeconds),
  };
}

export async function GET(request: NextRequest) {
  const reqId = requestId();

  try {
    // Rate limit: PDF generation is CPU-bound (jsPDF layout + serialization)
    // and was previously unbounded - an unauthenticated caller could spin
    // server CPU for free. API keys get their own namespace so a key holder
    // never competes with anonymous traffic sharing the same IP.
    const apiKeyAuth = resolveApiKeyAuth(request.headers);
    const rateCheck = await checkRateLimit(
      "pdf",
      bucketIdentity(apiKeyAuth, resolveClientIdentifier(request.headers)),
      PDF_LIMIT_PER_HOUR
    );
    if (!rateCheck.success) {
      return NextResponse.json(
        expectedErrorPayload({
          error: apiKeyAuth
            ? `PDF export quota exceeded for API key '${apiKeyAuth.keyId}'. Limited to ${PDF_LIMIT_PER_HOUR} per hour.`
            : `Rate limit exceeded on PDF export. PDF certificates are limited to ${PDF_LIMIT_PER_HOUR} per hour.`,
          resetSeconds: rateCheck.resetSeconds,
          requestId: reqId,
        }),
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.resetSeconds),
            ...rateLimitHeaders(rateCheck),
          },
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const scanId = searchParams.get("id");

    if (!scanId) {
      return NextResponse.json(
        expectedErrorPayload({ error: "Missing required 'id' query parameter", requestId: reqId }),
        { status: 400, headers: rateLimitHeaders(rateCheck) }
      );
    }

    const scan = await getScanById(scanId);

    if (!scan) {
      return NextResponse.json(
        expectedErrorPayload({ error: "Scan record not found or expired", requestId: reqId }),
        { status: 404, headers: rateLimitHeaders(rateCheck) }
      );
    }

    const pdfBytes = generateAuditPdfCertificate(scan);
    const filename = `CookieAudit-${scan.domain.replace(/[^\w.-]/g, "")}-${
      new Date(scan.timestamp).toISOString().slice(0, 10)
    }.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        ...rateLimitHeaders(rateCheck),
      },
    });
  } catch (err: unknown) {
    const internal = internalErrorPayload(ROUTE, err, reqId);
    return NextResponse.json(internal.body, { status: internal.status });
  }
}
