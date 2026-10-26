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

/** Public (unauthenticated) scan requests per client per hour. */
export const SCAN_LIMIT_PER_HOUR = parsePositiveInt(
  process.env.SCAN_RATE_LIMIT_PER_HOUR,
  10
);

/** PDF certificate generations per client per hour. */
export const PDF_LIMIT_PER_HOUR = parsePositiveInt(
  process.env.PDF_RATE_LIMIT_PER_HOUR,
  30
);

/** Drift monitor invocations per client per hour. */
export const DRIFT_LIMIT_PER_HOUR = parsePositiveInt(
  process.env.DRIFT_RATE_LIMIT_PER_HOUR,
  5
);

export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export type RateLimitScope = "scan" | "pdf" | "drift";
