import { NextRequest, NextResponse } from "next/server";
import { getScanById, getScanByHash } from "@/lib/db/scan-store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let scan = await getScanById(id);

  // If not found by ID, attempt lookup by SHA-256 hash
  if (!scan) {
    scan = await getScanByHash(id);
  }

  if (!scan) {
    return NextResponse.json({ error: "Audit record not found" }, { status: 404 });
  }

  return NextResponse.json(scan);
}
