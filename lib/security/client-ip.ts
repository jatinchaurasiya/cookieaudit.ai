import ipaddr from "ipaddr.js";

/**
 * Resolves the true client IP for rate-limiting, following the trust model
 * of the actual deployment. Directly trusting `x-forwarded-for` is what made
 * the previous limiter trivially bypassable - every spoofed value minted a
 * fresh bucket.
 *
 * Deployment matrix (configured via env, see .env.example):
 *
 *  - Behind 1 trusted reverse proxy (nginx "$proxy_add_x_forwarded_for",
 *    self-hosted VPS): spoofable junk sits at the LEFT; the proxy's observed
 *    address is the RIGHTMOST untrust-checked entry.
 *      -> IP_STRATEGY=rightmost-trusted, TRUSTED_PROXY_COUNT=1 (default)
 *
 *  - PaaS platforms (Vercel, Fly, Render) normalize x-forwarded-for so the
 *    LEFTMOST entry is the client.
 *      -> IP_STRATEGY=leftmost
 *
 *  - No proxy at all: there is no reliable IP signal from headers, so all
 *    traffic shares one coarse bucket instead of silently trusting spoofable
 *    headers (fail-closed bucketing).
 *      -> IP_STRATEGY=none
 */
export type IpStrategy = "rightmost-trusted" | "leftmost" | "none";

function readStrategy(): IpStrategy {
  const raw = (process.env.IP_STRATEGY || "rightmost-trusted").toLowerCase();
  if (raw === "leftmost_trusted" || raw === "leftmost") return "leftmost";
  if (raw === "none" || raw === "no_proxy") return "none";
  return "rightmost-trusted";
}

function readTrustedProxyCount(): number {
  const n = parseInt(process.env.TRUSTED_PROXY_COUNT || "1", 10);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

function isRoutableIp(value: string): boolean {
  try {
    const addr = ipaddr.parse(value);
    // A public client IP is what we key quotas on. RFC 1918 / loopback peers
    // collapse into the "unknown" aggregate bucket instead of free buckets.
    return !["loopback", "private", "linkLocal", "reserved", "unspecified"].includes(addr.range());
  } catch {
    return false;
  }
}

/**
 * Picks the client IP from a comma/space separated forwarding chain.
 */
function pickFromForwardedHeader(
  headerValue: string,
  strategy: IpStrategy,
  trustedProxyCount: number
): string | null {
  const parts = headerValue.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  if (strategy === "leftmost") {
    return isRoutableIp(parts[0]) ? parts[0] : null;
  }

  // rightmost-trusted: walk from the right past the trusted proxy hops;
  // the first address beyond the trusted boundary is the client IP.
  const hopIndex = Math.max(parts.length - 1 - trustedProxyCount, 0);
  for (let i = hopIndex; i >= 0; i--) {
    if (isRoutableIp(parts[i])) return parts[i];
  }
  return null;
}

/**
 * Resolves a stable, spoof-resistant client identifier for rate limiting.
 * Returns "unknown" (shared aggregate bucket) when no trustworthy signal
 * exists - coarse but secure, never attacker-minted per-request buckets.
 */
export function resolveClientIdentifier(headers: Headers): string {
  const strategy = readStrategy();

  if (strategy === "none") {
    // No trusted proxy in front of this deployment: no header is trustworthy.
    return "unknown";
  }

  const headerList = (process.env.CLIENT_IP_HEADERS || "x-forwarded-for")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  for (const headerName of headerList) {
    const raw = headers.get(headerName);
    if (!raw) continue;
    const picked =
      headerName === "x-forwarded-for"
        ? pickFromForwardedHeader(raw, strategy, readTrustedProxyCount())
        : isRoutableIp(raw.trim())
          ? raw.trim()
          : null;
    if (picked) return picked;
  }

  // No usable signal: shared aggregate bucket (fail-closed).
  return "unknown";
}
