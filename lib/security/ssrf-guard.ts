import dns from "node:dns";
import ipaddr from "ipaddr.js";

export class SsrfSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfSecurityError";
  }
}

/**
 * Validates a target URL against Server-Side Request Forgery (SSRF).
 * Blocks:
 * - Loopback (127.0.0.0/8, ::1)
 * - RFC 1918 Private Ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - RFC 3927 Link-Local (169.254.0.0/16, fe80::/10)
 * - Cloud Metadata IP (169.254.169.254)
 * - Carrier Grade NAT (100.64.0.0/10)
 * - Multicast & Broadcast addresses
 * - Non-HTTP/HTTPS protocols (file://, gopher://, ftp://)
 */
export async function validateUrlAgainstSsrf(inputUrl: string): Promise<{
  validUrl: URL;
  resolvedIp: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    throw new SsrfSecurityError("Invalid URL format. Provide a valid HTTP or HTTPS URL.");
  }

  // 1. Enforce HTTP/HTTPS protocols
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfSecurityError(
      `Disallowed protocol '${parsed.protocol}'. Only http: and https: are allowed.`
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject obvious dangerous hostnames
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal"
  ) {
    throw new SsrfSecurityError(`Access to internal/private hostname '${hostname}' is prohibited.`);
  }

  // 3. Resolve DNS to verify all underlying IP addresses
  let resolvedIps: string[] = [];
  try {
    const lookupResults = await dns.promises.lookup(hostname, { all: true });
    resolvedIps = lookupResults.map((r) => r.address);
  } catch (err: any) {
    throw new SsrfSecurityError(`DNS resolution failed for hostname '${hostname}': ${err.message}`);
  }

  if (resolvedIps.length === 0) {
    throw new SsrfSecurityError(`No IP address resolved for hostname '${hostname}'.`);
  }

  // 4. Validate every resolved IP
  for (const ipStr of resolvedIps) {
    let parsedIp: ipaddr.IPv4 | ipaddr.IPv6;
    try {
      parsedIp = ipaddr.parse(ipStr);
    } catch {
      throw new SsrfSecurityError(`Unparseable IP address '${ipStr}' resolved for '${hostname}'.`);
    }

    const range = parsedIp.range();

    // Check prohibited IP ranges
    const prohibitedRanges = [
      "loopback",
      "private",
      "linkLocal",
      "carrierGradeNat",
      "multicast",
      "broadcast",
      "reserved",
      "uniqueLocal",
      "unspecified",
    ];

    if (prohibitedRanges.includes(range)) {
      throw new SsrfSecurityError(
        `Target '${hostname}' resolved to prohibited IP '${ipStr}' in range '${range}'. SSRF attack blocked.`
      );
    }

    // Specific check for AWS / GCP / Azure metadata 169.254.169.254
    if (ipStr === "169.254.169.254") {
      throw new SsrfSecurityError(
        `Target resolved to cloud instance metadata service (169.254.169.254). Access blocked.`
      );
    }
  }

  return {
    validUrl: parsed,
    resolvedIp: resolvedIps[0],
  };
}

/**
 * Creates a custom DNS lookup callback pinned to the validated IP address,
 * completely mitigating Time-Of-Check to Time-Of-Use (TOCTOU) DNS Rebinding attacks.
 */
export function createPinnedLookup(resolvedIp: string) {
  const family = resolvedIp.includes(":") ? 6 : 4;
  return (
    _hostname: string,
    _options: any,
    callback: (err: Error | null, address: string, family: number) => void
  ) => {
    callback(null, resolvedIp, family);
  };
}

