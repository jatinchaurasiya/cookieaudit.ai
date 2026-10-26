import crypto from "node:crypto";

/**
 * Optional authenticated quota tier.
 *
 * "Unauthenticated scans are limited to N per hour" is an honest posture
 * only if there is a legitimate high-volume path. Anonymous browsers get a
 * generous-but-finite quota; holders of a configured API key get their own
 * namespace (never colliding with anonymous buckets) and a separate,
 * higher-or-unlimited quota.
 *
 * Extraction accepts both common conventions:
 *   Authorization: Bearer <key>
 *   X-API-Key: <key>
 *
 * Key comparison is constant-time over a fixed-length digest so request
 * timing never leaks how much of the key matched. Keys are stored in the
 * SCAN_API_KEYS env var as a comma-separated list, optionally with IDs:
 *   SCAN_API_KEYS="demo-client:sk_demo_123,agency:sk_ag_456"
 * Key IDs appear in logs/headers only - keys themselves are never echoed.
 */

export interface ApiKeyAuth {
  /** Stable label for the key (never the key itself). */
  keyId: string;
}

const MAX_KEY_BYTES = 512;

function parseConfiguredKeys(): { key: string; keyId: string }[] {
  const raw = process.env.SCAN_API_KEYS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const sep = entry.indexOf(":");
      return sep === -1
        ? { key: entry, keyId: "api-key" }
        : { key: entry.slice(sep + 1).trim(), keyId: entry.slice(0, sep).trim() || "api-key" };
    })
    .filter((e) => e.key.length > 0);
}

/** Constant-time equality over SHA-256 digests (length-safe). */
function secureEqual(a: string, b: string): boolean {
  const da = crypto.createHash("sha256").update(a, "utf8").digest();
  const db = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(da, db);
}

function extractCandidateKey(headers: Headers): string | null {
  const bearer = headers.get("authorization");
  if (bearer) {
    const match = /^Bearer\s+(.+)$/i.exec(bearer.trim());
    if (match?.[1]) return match[1].trim();
  }
  const apiKey = headers.get("x-api-key");
  if (apiKey?.trim()) return apiKey.trim();
  return null;
}

/**
 * Resolves the API-key identity for this request, or null when the request
 * carries no key / an unconfigured key (which must continue through the
 * anonymous path - never error, so anonymous behavior is unchanged).
 */
export function resolveApiKeyAuth(headers: Headers): ApiKeyAuth | null {
  const candidate = extractCandidateKey(headers);
  if (!candidate || candidate.length > MAX_KEY_BYTES) return null;

  for (const configured of parseConfiguredKeys()) {
    if (secureEqual(candidate, configured.key)) {
      return { keyId: configured.keyId };
    }
  }
  return null;
}

/**
 * Bucket identity namespaced per auth class. The limiter hash-sinks the value,
 * so the prefix is what keeps an API key's counter from ever sharing state
 * with an anonymous client's counter.
 */
export function bucketIdentity(auth: ApiKeyAuth | null, clientIdentifier: string): string {
  return auth ? `key:${auth.keyId}` : `ip:${clientIdentifier}`;
}

/** True when the deployment has any keys configured (shown on /api/health). */
export function apiKeysConfigured(): boolean {
  return parseConfiguredKeys().length > 0;
}
