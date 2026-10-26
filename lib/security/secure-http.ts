import http from "node:http";
import https from "node:https";
import tls from "node:tls";
import { createPinnedLookup, validateUrlAgainstSsrf } from "./ssrf-guard";

/**
 * SSRF-safe HTTP transport for outbound scanning traffic.
 *
 * Guarantees that plain `fetch` cannot provide:
 *  1. Socket-level DNS pinning - the hostname is resolved once by the SSRF guard,
 *     and the TCP connection is dialed to that exact IP via a custom `lookup`
 *     hook. A DNS rebinding between validation and connection (TOCTOU) can
 *     therefore never divert traffic to a different address.
 *  2. Per-hop re-validation - redirects are followed MANUALLY. Every hop's URL
 *     goes through the SSRF guard again (redirects to 169.254.169.254,
 *     RFC 1918 ranges, or internal hostnames are rejected at the door instead
 *     of being blindly followed by the HTTP agent).
 *  3. Redirect hop visibility - Set-Cookie headers are accumulated across all
 *     hops (the way a real browser would apply them) and the hop chain is
 *     returned for audit evidence.
 *  4. Bounded resource use - wall-clock deadline, capped body size, capped
 *     redirect count.
 */

export class SecureHttpError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "DNSResolutionFailed"
      | "Timeout"
      | "TooManyRedirects"
      | "NetworkError"
      | "BodyTruncated"
  ) {
    super(message);
    this.name = "SecureHttpError";
  }
}

export interface SecureFetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number; // overall wall-clock deadline
  maxBodyBytes?: number;
  maxRedirects?: number;
}

export interface SecureFetchResult {
  status: number;
  initialUrl: string;
  finalUrl: string;
  redirectHops: string[];
  downgradedProtocol: boolean; // https -> http mid-chain
  headers: http.IncomingHttpHeaders;
  /** Raw Set-Cookie header values accumulated across every redirect hop */
  setCookies: string[];
  /** TLS protocol of the final hop (e.g. "TLSv1.3"), or null when plain HTTP */
  tlsProtocol: string | null;
  bodyText: string;
  bodyTruncated: boolean;
  elapsedMs: number;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function pickSingleHeader(
  headers: http.IncomingHttpHeaders,
  name: string
): string | null {
  const v = headers[name];
  if (!v) return null;
  return Array.isArray(v) ? v[0] : v;
}

interface HopResult {
  req: http.ClientRequest;
  res: http.IncomingMessage;
  tlsProtocol: string | null;
}

function requestWithPinnedIp(
  url: string,
  resolvedIp: string,
  options: { headers?: Record<string, string>; timeoutMs: number }
): Promise<HopResult> {  const parsed = new URL(url);
  const preemptiveAbort = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    preemptiveAbort.abort();
  }, options.timeoutMs);

  const isTls = parsed.protocol === "https:";
  const optionsFactory = isTls ? https : http;
  const port = parsed.port ? Number(parsed.port) : isTls ? 443 : 80;

  const requestOptions: http.RequestOptions & https.RequestOptions = {
    host: parsed.hostname,
    port,
    path: parsed.pathname + parsed.search,
    method: "GET",
    headers: options.headers,
    lookup: createPinnedLookup(resolvedIp) as unknown as http.RequestOptions["lookup"],
    servername: isTls ? parsed.hostname : undefined,
    signal: preemptiveAbort.signal,
  };

  return new Promise<HopResult>((resolve, reject) => {
    const req = optionsFactory.request(requestOptions, (res) => {
      clearTimeout(timer);
      // Socket TLS metadata must be captured while the socket is alive -
      // after body read/destroy it is detached and getProtocol() returns
      // nothing meaningful.
      resolve({ req, res, tlsProtocol: extractTlsProtocol(res) });
    });

    req.on("error", (err) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new SecureHttpError("Request timed out", "Timeout"));
      } else {
        reject(new SecureHttpError(`Transport failure: ${err.message}`, "NetworkError"));
      }
    });

    req.end();
  });
}

function readBodyWithCap(
  res: http.IncomingMessage,
  maxBytes: number
): Promise<{ text: string; truncated: boolean }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let truncated = false;

    res.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received <= maxBytes) {
        chunks.push(chunk);
      } else if (!truncated) {
        truncated = true;
        // Stop reading early: tear the socket down, a scanner does not need the rest
        res.destroy();
      }
    });

    res.on("end", () => finish());
    res.on("close", () => finish());
    res.on("error", () => finish());

    let settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      resolve({
        text: Buffer.concat(chunks).toString("utf8"),
        truncated,
      });
    }
  });
}

/**
 * Reads the negotiated TLS version off the live TLSSocket.
 */
function extractTlsProtocol(res: http.IncomingMessage): string | null {
  const socket = res.socket;
  if (socket && typeof (socket as tls.TLSSocket).getProtocol === "function") {
    try {
      return (socket as tls.TLSSocket).getProtocol() ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Performs an SSRF-validated GET request with manual redirect chasing.
 * Throws SsrfSecurityError (from ./ssrf-guard) when any hop is unsafe.
 */
export async function secureFetch(
  initialUrl: string,
  options: SecureFetchOptions = {}
): Promise<SecureFetchResult> {
  const {
    headers = {},
    timeoutMs = 10000,
    maxBodyBytes = 5 * 1024 * 1024, // 5 MB
    maxRedirects = 5,
  } = options;

  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;

  // Note: hops are validated via `validateUrlAgainstSsrf`, which is authoritative
  // across the chain; `validated.validUrl` is the currently-pinned URL.
  const redirectHops: string[] = [];
  const setCookies: string[] = [];
  let downgradedProtocol = false;

  let validated = await validateUrlAgainstSsrf(initialUrl);
  let pinnedIp = validated.resolvedIp;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new SecureHttpError(
        `Redirect chain exceeded the ${timeoutMs} ms deadline`,
        "Timeout"
      );
    }

    const { req, res, tlsProtocol: hopTlsProtocol } = await requestWithPinnedIp(
      validated.validUrl.toString(),
      pinnedIp,
      { headers, timeoutMs: remainingMs }
    );

    // Accumulate cookies delivered on this hop (browser-equivalent behavior)
    const hopSetCookies = res.headers["set-cookie"];
    if (hopSetCookies) {
      for (const raw of hopSetCookies) setCookies.push(raw);
    }

    // Drain & discard the body of a redirect hop
    if (REDIRECT_STATUSES.has(res.statusCode!) && pickSingleHeader(res.headers, "location")) {
      res.resume();
      const locationHeader = pickSingleHeader(res.headers, "location")!;
      let nextUrl: URL;
      try {
        nextUrl = new URL(locationHeader, validated.validUrl);
      } catch {
        throw new SecureHttpError(
          `Redirect hop contained an unparseable location: ${locationHeader}`,
          "NetworkError"
        );
      }

      if (hop >= maxRedirects) {
        req.destroy();
        throw new SecureHttpError(
          `Exceeded ${maxRedirects} redirect hops`,
          "TooManyRedirects"
        );
      }

      if (
        validated.validUrl.protocol === "https:" &&
        nextUrl.protocol === "http:"
      ) {
        downgradedProtocol = true;
      }

      // THIS is the fix redirect-based SSRF: re-validate every hop from scratch
      redirectHops.push(nextUrl.toString());
      validated = await validateUrlAgainstSsrf(nextUrl.toString());
      pinnedIp = validated.resolvedIp;
      continue;
    }

    // Final response: read the body (bounded)
    const { text, truncated } = await readBodyWithCap(res, maxBodyBytes);
    req.destroy();

    return {
      status: res.statusCode || 0,
      initialUrl,
      finalUrl: validated.validUrl.toString(),
      redirectHops,
      downgradedProtocol,
      headers: res.headers,
      setCookies,
      tlsProtocol: hopTlsProtocol,
      bodyText: text,
      bodyTruncated: truncated,
      elapsedMs: Date.now() - startedAt,
    };
  }

  // Unreachable due to loop guard, kept for exhaustiveness
  throw new SecureHttpError("Redirect loop overflow", "TooManyRedirects");
}
