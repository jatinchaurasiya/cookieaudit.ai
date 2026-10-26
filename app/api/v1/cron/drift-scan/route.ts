import { NextRequest, NextResponse } from "next/server";
import { getScanById } from "@/lib/db/scan-store";
import { detectComplianceDrift, formatSlackDriftNotification } from "@/lib/drift/drift-detector";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { resolveClientIdentifier } from "@/lib/security/client-ip";
import { DRIFT_LIMIT_PER_HOUR } from "@/lib/config/limits";
import { expectedErrorPayload, errorMessage, internalErrorPayload, requestId } from "@/lib/api/error-response";

const ROUTE = "POST /api/v1/cron/drift-scan";

/**
 * Validates a Slack webhook strictly (scheme, host, path shape) instead of a
 * loose startsWith check. The route also requires a shared cron secret in
 * production so the endpoint is not an open, unauthenticated relay for
 * webhook spam.
 */
function validateSlackWebhookUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "hooks.slack.com") return null;
    if (!url.pathname.startsWith("/services/")) return null;
    return url;
  } catch {
    return null;
  }
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.DRIFT_CRON_SECRET;
  // No secret configured: allow only outside production (dev/demo convenience)
  if (!secret) return process.env.NODE_ENV !== "production";
  const provided =
    request.headers.get("x-cron-secret") ||
    (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return provided.length > 0 && provided === secret;
}

export async function POST(request: NextRequest) {
  const reqId = requestId();

  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        expectedErrorPayload({ error: "Cron authorization required.", requestId: reqId }),
        { status: process.env.DRIFT_CRON_SECRET ? 403 : 503 }
      );
    }

    const rateCheck = await checkRateLimit("drift", resolveClientIdentifier(request.headers), DRIFT_LIMIT_PER_HOUR);
    if (!rateCheck.success) {
      return NextResponse.json(
        expectedErrorPayload({
          error: "Rate limit exceeded on drift monitor.",
          resetSeconds: rateCheck.resetSeconds,
          requestId: reqId,
        }),
        { status: 429, headers: { "Retry-After": String(rateCheck.resetSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const baselineId = body.baselineScanId;
    const currentId = body.currentScanId;
    const webhookUrl = body.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!baselineId || !currentId) {
      return NextResponse.json(
        expectedErrorPayload({
          error: "Missing required parameters: 'baselineScanId' and 'currentScanId'",
          requestId: reqId,
        }),
        { status: 400 }
      );
    }

    const baselineScan = await getScanById(baselineId);
    const currentScan = await getScanById(currentId);

    if (!baselineScan || !currentScan) {
      return NextResponse.json(
        expectedErrorPayload({ error: "Specified baseline or current scan ID not found in audit storage", requestId: reqId }),
        { status: 404 }
      );
    }

    // Honest comparison: comparing a record against itself is NOT a drift
    // check - it must explicitly request selfBaseline (demo/report mode).
    if (baselineId === currentId && !body.allowSelfComparison) {
      return NextResponse.json(
        expectedErrorPayload({
          error:
            "Baseline and current scan IDs are identical - no drift comparison is possible. Run a second scan and pass its ID, or pass allowSelfComparison:true to inspect the report format.",
          requestId: reqId,
        }),
        { status: 400 }
      );
    }

    const driftReport = detectComplianceDrift(baselineScan, currentScan);
    const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/scan/${currentScan.id}`;

    let webhookDispatched = false;
    let webhookError: string | undefined;
    if (webhookUrl) {
      const validatedHook = validateSlackWebhookUrl(String(webhookUrl));
      if (!validatedHook) {
        webhookError = "Rejected webhook URL: must be https://hooks.slack.com/services/...";
      } else {
        try {
          const res = await fetch(validatedHook.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formatSlackDriftNotification(driftReport, scanUrl)),
            signal: AbortSignal.timeout(5000),
          });
          webhookDispatched = res.ok;
        } catch (err: unknown) {
          console.warn("Slack webhook dispatch failed:", errorMessage(err));
          webhookError = "Webhook dispatch failed (logged server-side).";
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      driftReport,
      webhookDispatched,
      webhookError,
      scanUrl,
      requestId: reqId,
    });
  } catch (err: unknown) {
    const internal = internalErrorPayload(ROUTE, err, reqId);
    return NextResponse.json(internal.body, { status: internal.status });
  }
}
