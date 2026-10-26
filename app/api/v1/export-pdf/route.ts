import { NextRequest, NextResponse } from "next/server";
import { getScanById } from "@/lib/db/scan-store";
import { generateAuditPdfCertificate } from "@/lib/export/pdf-certificate";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { resolveClientIdentifier } from "@/lib/security/client-ip";
import { PDF_LIMIT_PER_HOUR } from "@/lib/config/limits";
import { expectedErrorPayload, internalErrorPayload, requestId } from "@/lib/api/error-response";

const ROUTE = "GET /api/v1/export-pdf";

export async function GET(request: NextRequest) {
  const reqId = requestId();

  try {
    // Rate limit: PDF generation is CPU-bound (jsPDF layout + serialization)
    // and was previously unbounded - an unauthenticated caller could spin
    // server CPU for free. Throttled now alongside every other endpoint.
    const rateCheck = await checkRateLimit("pdf", resolveClientIdentifier(request.headers), PDF_LIMIT_PER_HOUR);
    if (!rateCheck.success) {
      return NextResponse.json(
        expectedErrorPayload({
          error: "Rate limit exceeded on PDF export.",
          resetSeconds: rateCheck.resetSeconds,
          requestId: reqId,
        }),
        { status: 429, headers: { "Retry-After": String(rateCheck.resetSeconds) } }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const scanId = searchParams.get("id");

    if (!scanId) {
      return NextResponse.json(
        expectedErrorPayload({ error: "Missing required 'id' query parameter", requestId: reqId }),
        { status: 400 }
      );
    }

    const scan = await getScanById(scanId);

    if (!scan) {
      return NextResponse.json(
        expectedErrorPayload({ error: "Scan record not found or expired", requestId: reqId }),
        { status: 404 }
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
      },
    });
  } catch (err: unknown) {
    const internal = internalErrorPayload(ROUTE, err, reqId);
    return NextResponse.json(internal.body, { status: internal.status });
  }
}
