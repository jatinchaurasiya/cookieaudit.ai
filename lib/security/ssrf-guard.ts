import dns from "node:dns";
import ipaddr from "ipaddr.js";
import { errorMessage } from "@/lib/api/error-response";

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
  } catch (err: unknown) {
    throw new SsrfSecurityError(`DNS resolution failed for hostname '${hostname}': ${errorMessage(err)}`);
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
 * Creates a DNS lookup callback pinned to the validated IP address.
 *
 * This hook is handed to Node's `net`/`tls` socket machinery (see
 * lib/security/secure-http.ts, which wires it into every outbound request) so
 * the TCP connection can be dialed to exactly the address that was validated.
 * A DNS rebinding between validation and connection - the TOCTOU window - is
 * closed because the resolver hook simply never consults DNS again.
 */
/**
 * A Node-compatible custom DNS lookup hook. Typed locally (instead of relying
 * on version-specific stdlib type exports) so the pinning contract is explicit.
 *
 * Node >= 18 invokes custom lookups in "all" mode (`options.all === true`) and
 * then expects the callback to receive `(err, addresses[])` where addresses is
 * an array of {address, family}. In classic mode it expects the
 * `(err, address, family)` triple. This hook supports BOTH shapes so pinning
 * works across Node versions.
 */
type PinnedLookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | Array<{ address: string; family: number }>,
  family?: number
) => void;

type PinnedLookupFunction = (
  hostname: string,
  options: unknown,
  callback: PinnedLookupCallback
) => void;

export function createPinnedLookup(resolvedIp: string): PinnedLookupFunction {
  const family = resolvedIp.includes(":") ? 6 : 4;
  const lookup: PinnedLookupFunction = (
    _hostname: string,
    options: unknown,
    callback: PinnedLookupCallback
  ) => {
    process.nextTick(() => {
      const all = (options as { all?: boolean } | undefined)?.all === true;
      if (all) {
        callback(null, [{ address: resolvedIp, family }]);
      } else {
        callback(null, resolvedIp, family);
      }
    });
  };
  return lookup;
}

