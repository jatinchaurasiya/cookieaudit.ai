import { NextRequest, NextResponse } from "next/server";
import { getScanById } from "@/lib/db/scan-store";
import { detectComplianceDrift, formatSlackDriftNotification } from "@/lib/drift/drift-detector";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const baselineId = body.baselineScanId;
    const currentId = body.currentScanId;
    const webhookUrl = body.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;


    if (!baselineId || !currentId) {
      return NextResponse.json(
        { error: "Missing required parameters: 'baselineScanId' and 'currentScanId'" },
        { status: 400 }
      );
    }

    const baselineScan = await getScanById(baselineId);
    const currentScan = await getScanById(currentId);

    if (!baselineScan || !currentScan) {
      return NextResponse.json(
        { error: "Specified baseline or current scan ID not found in audit storage" },
        { status: 404 }
      );
    }


    const driftReport = detectComplianceDrift(baselineScan, currentScan);
    const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/scan/${currentScan.id}`;

    let webhookDispatched = false;
    if (webhookUrl && webhookUrl.startsWith("https://hooks.slack.com")) {
      const payload = formatSlackDriftNotification(driftReport, scanUrl);
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        webhookDispatched = true;
      } catch (err: any) {
        console.warn("Slack webhook dispatch failed:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      driftReport,
      webhookDispatched,
      scanUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Drift monitor cron failed", details: err.message },
      { status: 500 }
    );
  }
}
