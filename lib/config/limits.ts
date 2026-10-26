/**
 * Centralized rate-limit policy. All quotas are env-overridable so that
 * deployments can tune them without code changes. Previously the scan route
 * hard-coded `10`, the limiter default was `5`, and the docstring said `3` -
 * drift in three places. Now there is a single source of truth.
 */

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value || "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Anonymous (unauthenticated) scan requests per client per hour.
 * 100/hour is deliberately generous for human use (an interactive session
 * burns a handful), while still bounding anonymous egress/DNS spend. Abuse
 * resistance now lives primarily in the API-key tier below, which separates
 * high-volume integrations from anonymous browsers instead of punishing
 * regular users with a toy quota they will hit mid-demo.
 */
export const SCAN_LIMIT_PER_HOUR = parsePositiveInt(
  process.env.SCAN_RATE_LIMIT_PER_HOUR,
  100
);

/** PDF certificate generations per client per hour. */
export const PDF_LIMIT_PER_HOUR = parsePositiveInt(
  process.env.PDF_RATE_LIMIT_PER_HOUR,
  60
);

/** Drift monitor invocations per client per hour. */
export const DRIFT_LIMIT_PER_HOUR = parsePositiveInt(
  process.env.DRIFT_RATE_LIMIT_PER_HOUR,
  10
);

/**
 * Authenticated API-key scans per key per hour. `0` is meaningful here and
 * means UNLIMITED - the parser below must therefore accept zeroes, unlike
 * parsePositiveInt, which treats non-positives as "unset".
 */
export const SCAN_API_LIMIT_PER_HOUR = parseApiKeyLimit(
  process.env.SCAN_API_RATE_LIMIT_PER_HOUR
);

function parseApiKeyLimit(value: string | undefined): number {
  const n = parseInt(value || "", 10);
  if (!Number.isFinite(n) || n < 0) return 2000; // unset default: effectively unlimited for demos
  return n;
}

/**
 * `true` when a limit is configured as "no cap". The limiter bypasses store
 * accounting entirely for unlimited scopes - there is nothing left to track.
 */
export function isUnlimited(limit: number): boolean {
  return limit <= 0;
}

export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export type RateLimitScope = "scan" | "pdf" | "drift";
