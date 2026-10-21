import { NextRequest, NextResponse } from "next/server";
import { getScanById } from "@/lib/db/scan-store";
import { generateAuditPdfCertificate } from "@/lib/export/pdf-certificate";


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const scanId = searchParams.get("id");

  if (!scanId) {
    return NextResponse.json({ error: "Missing required 'id' query parameter" }, { status: 400 });
  }

  const scan = await getScanById(scanId);

  if (!scan) {
    return NextResponse.json({ error: "Scan record not found or expired" }, { status: 404 });
  }

  try {
    const pdfBytes = generateAuditPdfCertificate(scan);
    const filename = `CookieAudit-${scan.domain}-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate PDF audit report", details: err.message },
      { status: 500 }
    );
  }
}
