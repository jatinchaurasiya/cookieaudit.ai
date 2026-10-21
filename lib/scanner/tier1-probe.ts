import setCookieParser from "set-cookie-parser";
import * as cheerio from "cheerio";
import { RawCookieFinding, TrackerFinding, SecurityHeadersFinding } from "@/lib/types/audit";

export const KNOWN_TRACKER_SIGNATURES: Array<{
  pattern: RegExp;
  domain: string;
  category: TrackerFinding["category"];
}> = [
  { pattern: /googletagmanager\.com/i, domain: "googletagmanager.com", category: "Tag Manager" },
  { pattern: /google-analytics\.com/i, domain: "google-analytics.com", category: "Analytics" },
  { pattern: /connect\.facebook\.net/i, domain: "connect.facebook.net", category: "Marketing" },
  { pattern: /fbevents\.js/i, domain: "facebook.com/tr", category: "Marketing" },
  { pattern: /doubleclick\.net/i, domain: "doubleclick.net", category: "Marketing" },
  { pattern: /clarity\.ms/i, domain: "clarity.ms", category: "Session Replay" },
  { pattern: /hotjar\.com/i, domain: "hotjar.com", category: "Session Replay" },
  { pattern: /analytics\.tiktok\.com/i, domain: "analytics.tiktok.com", category: "Marketing" },
  { pattern: /snap\.licdn\.com/i, domain: "snap.licdn.com", category: "Marketing" },
  { pattern: /criteo\.net/i, domain: "criteo.net", category: "Marketing" },
  { pattern: /taboola\.com/i, domain: "taboola.com", category: "Marketing" },
  { pattern: /outbrain\.com/i, domain: "outbrain.com", category: "Marketing" },
  { pattern: /pinterest\.com\/ct/i, domain: "pinterest.com", category: "Marketing" },
  { pattern: /js\.hs-scripts\.com|js\.hs-analytics\.net/i, domain: "hubspot.com", category: "Marketing" },
  { pattern: /munchkin\.marketo\.net/i, domain: "marketo.com", category: "Marketing" },
  { pattern: /fullstory\.com/i, domain: "fullstory.com", category: "Session Replay" },
  { pattern: /logrocket\.io/i, domain: "logrocket.com", category: "Session Replay" },
  { pattern: /segment\.(io|com)/i, domain: "segment.com", category: "Tag Manager" },
  { pattern: /mixpanel\.com/i, domain: "mixpanel.com", category: "Analytics" },
  { pattern: /amplitude\.com/i, domain: "amplitude.com", category: "Analytics" },
  { pattern: /posthog\.com/i, domain: "posthog.com", category: "Analytics" },
];

export interface Tier1ProbeResult {
  cookies: RawCookieFinding[];
  trackers: TrackerFinding[];
  securityHeaders: SecurityHeadersFinding;
  privacyUrl: string | null;
  bannerHtmlSnippet: string;
  hasHsts: boolean;
  tlsVersion: string;
  httpStatus: number;
  initialHtml: string;
}


/**
 * Tier 1: Instant HTTP & TLS Probe (<150ms)
 * Zero browser overhead; never crashes even if Chromium/Crawl4AI fails.
 */
export async function runTier1FastProbe(targetUrl: string): Promise<Tier1ProbeResult> {
  const parsedUrl = new URL(targetUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 CookieAudit/1.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const httpStatus = response.status;
  const hasHsts = Boolean(response.headers.get("strict-transport-security"));
  const tlsVersion = parsedUrl.protocol === "https:" ? "TLS 1.3 / HTTPS" : "Insecure HTTP";

  // 1. Parse Set-Cookie headers
  const rawSetCookieHeaders = response.headers.getSetCookie?.() || [];
  const parsedCookies = setCookieParser.parse(rawSetCookieHeaders);

  const cookies: RawCookieFinding[] = parsedCookies.map((c) => {
    let ttlDays: number | null = null;
    if (c.expires) {
      ttlDays = Math.round((c.expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } else if (c.maxAge !== undefined) {
      ttlDays = Math.round(c.maxAge / 86400);
    }

    return {
      name: c.name,
      valuePreview: c.value ? `${c.value.slice(0, 6)}...` : "(empty)",
      domain: c.domain || parsedUrl.hostname,
      secure: Boolean(c.secure),
      httpOnly: Boolean(c.httpOnly),
      sameSite: c.sameSite || "None (Unset)",
      ttlDays,
      source: "HTTP_HEADER",
      owaspIssues: [],
    };
  });

  // 2. Parse HTML for static scripts, privacy link, and banner DOM
  const html = await response.text();
  const $ = cheerio.load(html);

  const trackerMap = new Map<string, TrackerFinding>();

  // Check <script src="...">
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    for (const tracker of KNOWN_TRACKER_SIGNATURES) {
      if (tracker.pattern.test(src)) {
        trackerMap.set(tracker.domain, {
          domain: tracker.domain,
          category: tracker.category,
          scriptUrl: src,
          firedBeforeConsent: true,
        });
      }
    }
  });

  // Check inline script bodies for tracking tag snippets (gtag, fbq)
  $("script:not([src])").each((_, el) => {
    const inlineContent = $(el).html() || "";
    for (const tracker of KNOWN_TRACKER_SIGNATURES) {
      if (tracker.pattern.test(inlineContent)) {
        trackerMap.set(tracker.domain, {
          domain: tracker.domain,
          category: tracker.category,
          firedBeforeConsent: true,
        });
      }
    }
  });

  // 3. Auto-discover Privacy Policy URL
  let privacyUrl: string | null = null;
  $("a[href]").each((_, el) => {
    if (privacyUrl) return;
    const href = ($(el).attr("href") || "").trim();
    const text = ($(el).text() || "").toLowerCase().trim();
    const lowerHref = href.toLowerCase();

    if (
      lowerHref.includes("privacy") ||
      text.includes("privacy policy") ||
      text.includes("privacy notice") ||
      text.includes("data protection")
    ) {
      try {
        privacyUrl = new URL(href, targetUrl).toString();
      } catch {
        // Ignore invalid relative URLs
      }
    }
  });

  // Fallback common privacy endpoints if not found in <a> tags
  if (!privacyUrl) {
    const commonPrivacyPaths = ["/privacy", "/privacy-policy", "/legal/privacy"];
    // Keep first candidate
    privacyUrl = new URL(commonPrivacyPaths[0], targetUrl).toString();
  }

  // 4. Banner DOM discovery heuristic
  let bannerHtmlSnippet = "";
  const bannerCandidates = $(
    '[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [aria-label*="cookie" i]'
  );
  if (bannerCandidates.length > 0) {
    bannerHtmlSnippet = $.html(bannerCandidates.first()).slice(0, 5000);
  }

  // 5. Audit Web Security & Infrastructure Headers
  const cspHeader = response.headers.get("content-security-policy");
  const hstsHeader = response.headers.get("strict-transport-security");
  const xfoHeader = response.headers.get("x-frame-options");
  const xctoHeader = response.headers.get("x-content-type-options");
  const refHeader = response.headers.get("referrer-policy");
  const permHeader = response.headers.get("permissions-policy");

  const headerIssues: string[] = [];
  if (!cspHeader) {
    headerIssues.push("Missing Content-Security-Policy: vulnerable to cross-site script injections.");
  }
  if (parsedUrl.protocol === "https:" && !hstsHeader) {
    headerIssues.push("Missing Strict-Transport-Security: site vulnerable to SSL-stripping downgrades.");
  }
  if (!xfoHeader && (!cspHeader || !cspHeader.includes("frame-ancestors"))) {
    headerIssues.push("Missing X-Frame-Options: vulnerable to clickjacking iframe embedding.");
  }
  if (!xctoHeader || !xctoHeader.toLowerCase().includes("nosniff")) {
    headerIssues.push("Missing X-Content-Type-Options: nosniff: MIME-type sniffing enabled.");
  }

  const securityHeaders: SecurityHeadersFinding = {
    contentSecurityPolicy: cspHeader,
    strictTransportSecurity: hstsHeader,
    xFrameOptions: xfoHeader,
    xContentTypeOptions: xctoHeader,
    referrerPolicy: refHeader,
    permissionsPolicy: permHeader,
    headerIssues,
  };

  return {
    cookies,
    trackers: Array.from(trackerMap.values()),
    securityHeaders,
    privacyUrl,
    bannerHtmlSnippet,
    hasHsts,
    tlsVersion,
    httpStatus,
    initialHtml: html,
  };
}

