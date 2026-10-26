import crypto from "node:crypto";

/**
 * Central error sanitization. The previous routes returned raw `err.message`
 * in 500-level responses, leaking internal stack, DNS errors, and service
 * topology to anonymous callers over the public internet.
 *
 * Policy:
 *  - Expected, validated failures (SSRF guard, bad input) DO return their
 *    message; that text is intentional and user-actionable.
 *  - Everything unexpected is reduced to a stable, generic message plus a
 *    `requestId` that is logged server-side with full detail for correlation.
 */
export interface SanitizedErrorBody {
  error: string;
  requestId?: string;
  [key: string]: unknown;
}

export function requestId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** Extracts a sanitized message from an unknown thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

export function logServerError(route: string, err: unknown, reqId: string): void {
  const detail = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ""}` : String(err);
  console.error(`[${route}] request=${reqId} failed:\n${detail}`);
}

export function expectedErrorPayload(body: Record<string, unknown>): SanitizedErrorBody {
  return body as SanitizedErrorBody;
}

export function internalErrorPayload(
  route: string,
  err: unknown,
  reqId: string
): { status: number; body: SanitizedErrorBody } {
  logServerError(route, err, reqId);
  return {
    status: 500,
    body: {
      error: "Internal audit orchestrator error",
      requestId: reqId,
    },
  };
}
