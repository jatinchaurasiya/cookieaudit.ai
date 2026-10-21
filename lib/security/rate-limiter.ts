interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory token bucket store with automatic cleanup
const ipStore = new Map<string, RateLimitEntry>();

// Purge expired tokens every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipStore.entries()) {
      if (now > entry.resetAt) {
        ipStore.delete(key);
      }
    }
  }, 10 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * IP Rate Limiter: Enforces 3 scans per IP per hour for public guest users.
 */
export async function checkRateLimit(
  clientIp: string,
  maxScansPerHour: number = 5
): Promise<RateLimitResult> {
  // If Redis is configured in production, Upstash/Redis can be plugged here
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour

  const entry = ipStore.get(clientIp);

  if (!entry || now > entry.resetAt) {
    ipStore.set(clientIp, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit: maxScansPerHour,
      remaining: maxScansPerHour - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (entry.count >= maxScansPerHour) {
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      success: false,
      limit: maxScansPerHour,
      remaining: 0,
      resetSeconds,
    };
  }

  entry.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

  return {
    success: true,
    limit: maxScansPerHour,
    remaining: maxScansPerHour - entry.count,
    resetSeconds,
  };
}
