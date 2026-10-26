import crypto from "node:crypto";
import Redis from "ioredis";
import {
  RATE_LIMIT_WINDOW_SECONDS,
  RateLimitScope,
  isUnlimited,
} from "@/lib/config/limits";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  backend: "redis" | "memory";
}

export function getRateLimiterStatus(): {
  configured: "redis" | "memory";
  redisUrlConfigured: boolean;
} {
  return {
    configured: process.env.REDIS_URL ? "redis" : "memory",
    redisUrlConfigured: Boolean(process.env.REDIS_URL),
  };
}

/**
 * Fixed-window counters in Redis.
 *
 * Atomicity: the INCR + first-instance EXPIRE pair runs as a single EVAL
 * script so concurrent requests from multiple app instances can never race
 * the window reset (classic two-command TOCTOU bug).
 */
const COUNT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
if redis.call('TTL', KEYS[1]) < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

let redisClient: Redis | null = null;
let redisHealthy = true;
let lastFailureLoggedAt = 0;

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!redisClient) {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      commandTimeout: 2000,
      retryStrategy: (times) => Math.min(3000, times * 250),
      lazyConnect: false,
    });
    redisClient.on("error", () => {
      // Swallow: Redis outages degrade to the in-memory limiter, they must
      // never crash request handling. Logs are throttled below.
    });
  }
  return redisClient;
}

function markRedisUnhealthy(): void {
  redisHealthy = false;
  const now = Date.now();
  if (now - lastFailureLoggedAt > 60_000) {
    lastFailureLoggedAt = now;
    console.warn(
      "[rate-limiter] Redis unavailable - degrading to per-process in-memory limiter. " +
        "Quotas are NOT globally consistent until Redis recovers."
    );
  }
}

function markRedisHealthy(): void {
  if (!redisHealthy) {
    redisHealthy = true;
    console.info("[rate-limiter] Redis connection restored - global quota active.");
  }
}

/**
 * Identifiers are hashed before they reach the store: the limiter needs a
 * collision-free stable key, not PII.
 */
function bucketKey(scope: RateLimitScope, identifier: string): string {
  const digest = crypto.createHash("sha256").update(identifier).digest("hex").slice(0, 32);
  return `rl:v1:${scope}:${digest}`;
}

// ---------------------------------------------------------------- memory store

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalForRl = globalThis as unknown as { __cookieauditMemoryRl?: Map<string, RateLimitEntry> };
const memoryStore = globalForRl.__cookieauditMemoryRl ?? new Map<string, RateLimitEntry>();
globalForRl.__cookieauditMemoryRl = memoryStore;

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetAt) memoryStore.delete(key);
    }
  }, 10 * 60 * 1000).unref?.();
}

function memoryLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
      backend: "memory",
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      backend: "memory",
    };
  }

  entry.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    resetSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    backend: "memory",
  };
}

// ------------------------------------------------------------------ public API

/**
 * Enforces `[limit] requests per [windowSeconds]` for the given scope +
 * identifier. Redis is authoritative when configured; the in-memory store is
 * a degraded-but-functional fallback, never a silent bypass.
 */
export async function checkRateLimit(
  scope: RateLimitScope,
  identifier: string,
  limit: number,
  windowSeconds: number = RATE_LIMIT_WINDOW_SECONDS
): Promise<RateLimitResult> {
  // A scope configured with limit <= 0 is uncapped (e.g. the API-key tier at
  // 0/unset-below-zero). Nothing can be enforced or counted, so skip store
  // accounting entirely instead of pretending to count against "infinity".
  if (isUnlimited(limit)) {
    return {
      success: true,
      limit: 0,
      remaining: -1, // sentinel: unlimited (no X-RateLimit-* headers emitted)
      resetSeconds: 0,
      backend: process.env.REDIS_URL ? "redis" : "memory",
    };
  }

  const key = bucketKey(scope, identifier);
  const redis = getRedis();

  // Circuit breaker: while Redis is believed down, skip the (slow) failing
  // call path and serve from the degraded limiter until a retry window passes.
  if (redis && (redisHealthy || Date.now() - lastFailureLoggedAt > 30_000)) {
    try {
      if (redis.status === "end" || redis.status === "close") {
        markRedisUnhealthy();
        return memoryLimit(key, limit, windowSeconds);
      }

      const count = (await redis.eval(COUNT_SCRIPT, 1, key, String(windowSeconds))) as number;
      markRedisHealthy();

      if (count > limit) {
        let resetSeconds = windowSeconds;
        try {
          const ttl = await redis.ttl(key);
          if (ttl > 0) resetSeconds = ttl;
        } catch {
          /* fall back to window length */
        }
        return { success: false, limit, remaining: 0, resetSeconds, backend: "redis" };
      }

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - count),
        resetSeconds: windowSeconds,
        backend: "redis",
      };
    } catch {
      markRedisUnhealthy();
      return memoryLimit(key, limit, windowSeconds);
    }
  }

  return memoryLimit(key, limit, windowSeconds);
}
