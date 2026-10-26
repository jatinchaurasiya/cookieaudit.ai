import setCookieParser from "set-cookie-parser";
import * as cheerio from "cheerio";
import { REDACTED_COOKIE_PREVIEW, RawCookieFinding, TrackerFinding, SecurityHeadersFinding } from "@/lib/types/audit";
import { secureFetch } from "@/lib/security/secure-http";

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

/**
 * Consent Management Platform (CMP) fingerprints. A CMP in the page's markup
 * is a strong (though not perfect) signal that tracker scripts are gated
 * behind a consent event - which is exactly what our previous code murdered
 * by assuming every tracker fired pre-consent. Presence of a CMP flips the
 * finding to "gating detected" so compliant sites stop being scored as
 * violators purely on script presence.
 */
const CMP_SIGNATURES: RegExp[] = [
  /onetrust/i,
  /cookiebot|cookie declaration|cybot/i,
  /consent-management/i,
  /complianz/i,
  /borlabs/i,
  /tarteaucitron/i,
  /klaro/i,
  /cookieyes/i,
  /termly/i,
  /osano/i,
  /didomi/i,
  /usercentrics/i,
  /quantiz\.qc_|quanti\.qc_/i,
  /cookieconsent|cookie-consent/i,
  /consent mode|default.*consent.*ad_storage|dataLayerPush.*consent/i,
];

export interface Tier1ProbeResult {
  cookies: RawCookieFinding[];
  trackers: TrackerFinding[];
  securityHeaders: SecurityHeadersFinding;
  consentFrameworkDetected: boolean;
  privacyUrl: string | null;
  bannerHtmlSnippet: string;
  hasHsts: boolean;
  tlsVersion: string;
  tlsProtocol: string | null;
  redirectHops: string[];
  httpStatus: number;
  finalUrl: string;
}


/**
 * Tier 1: Secure HTTP & TLS probe. Bounded wall-clock (<~8s), zero browser
 * overhead, and every byte arrives through the SSRF-pinned transport.
 * Never crashes on dead targets - errors bubble as typed SecureHttpError /
 * SsrfSecurityError for the orchestrator to classify.
 */
export async function runTier1FastProbe(targetUrl: string): Promise<Tier1ProbeResult> {
  const parsedUrl = new URL(targetUrl);

  const response = await secureFetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 CookieAudit/1.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeoutMs: 8000,
    maxRedirects: 5,
    maxBodyBytes: 4 * 1024 * 1024,
  });

  const httpStatus = response.status;
  const hasHsts = Boolean(
    response.headers["strict-transport-security"]
  );
  const tlsProtocol = response.tlsProtocol;
  const tlsVersion =
    tlsProtocol ?? (parsedUrl.protocol === "https:" ? "HTTPS (TLS handshake verified)" : "Insecure HTTP");

  // 1. Parse Set-Cookie headers (accumulated across every redirect hop)
  const parsedCookies = setCookieParser.parse(response.setCookies);
  const cookies: RawCookieFinding[] = parsedCookies.map((c) => {
    let ttlDays: number | null = null;
    if (c.expires) {
      ttlDays = Math.round((c.expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } else if (c.maxAge !== undefined) {
      ttlDays = Math.round(c.maxAge / 86400);
    }

    return {
      name: c.name,
      valuePreview: REDACTED_COOKIE_PREVIEW,
      domain: c.domain || parsedUrl.hostname,
      secure: Boolean(c.secure),
      httpOnly: Boolean(c.httpOnly),
      sameSite: c.sameSite || "None (Unset)",
      ttlDays,
      source: "HTTP_HEADER",
      owaspIssues: [],
    };
  });

  // 2. Parse HTML for static scripts, privacy link, banner DOM, and CMP gating
  const html = response.bodyText;
  const $ = cheerio.load(html);

  const consentFrameworkDetected = CMP_SIGNATURES.some((pattern) => pattern.test(html));

  const trackerMap = new Map<string, TrackerFinding>();

  const reportTracker = (domain: string, category: TrackerFinding["category"], scriptUrl?: string) => {
    trackerMap.set(domain, {
      domain,
      category,
      scriptUrl,
      // Honest semantics: pre-consent firing is claimed ONLY when no CMP is
      // present (script loaded with no gating mechanism in the markup).
      firedBeforeConsent: !consentFrameworkDetected,
    });
  };

  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    for (const tracker of KNOWN_TRACKER_SIGNATURES) {
      if (tracker.pattern.test(src)) {
        reportTracker(tracker.domain, tracker.category, src);
      }
    }
  });

  $("script:not([src])").each((_, el) => {
    const inlineContent = $(el).html() || "";
    for (const tracker of KNOWN_TRACKER_SIGNATURES) {
      if (tracker.pattern.test(inlineContent)) {
        reportTracker(tracker.domain, tracker.category);
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

  if (!privacyUrl) {
    const commonPrivacyPath = "/privacy";
    try {
      privacyUrl = new URL(commonPrivacyPath, targetUrl).toString();
    } catch {
      privacyUrl = null;
    }
  }

  // 4. Banner DOM discovery heuristic
  let bannerHtmlSnippet = "";
  const bannerCandidates = $(
    '[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [aria-label*="cookie" i]'
  );
  if (bannerCandidates.length > 0) {
    bannerHtmlSnippet = $.html(bannerCandidates.first()).slice(0, 5000);
  }

  // 5. Audit Web Security & Infrastructure Headers (from the final hop)
  const cspHeader = response.headers["content-security-policy"] ?? null;
  const hstsHeader = response.headers["strict-transport-security"] ?? null;
  const xfoHeader = response.headers["x-frame-options"] ?? null;
  const xctoHeader = response.headers["x-content-type-options"] ?? null;
  const refHeader = response.headers["referrer-policy"] ?? null;
  const permHeader = response.headers["permissions-policy"] ?? null;

  const headerIssues: string[] = [];
  if (!cspHeader) {
    headerIssues.push("Missing Content-Security-Policy: vulnerable to cross-site script injections.");
  }
  if (parsedUrl.protocol === "https:" && !hstsHeader) {
    headerIssues.push("Missing Strict-Transport-Security: site vulnerable to SSL-stripping downgrades.");
  }
  if (!xfoHeader && (!cspHeader || !cspHeader.toString().includes("frame-ancestors"))) {
    headerIssues.push("Missing X-Frame-Options: vulnerable to clickjacking iframe embedding.");
  }
  if (!xctoHeader || !xctoHeader.toString().toLowerCase().includes("nosniff")) {
    headerIssues.push("Missing X-Content-Type-Options: nosniff: MIME-type sniffing enabled.");
  }
  if (response.downgradedProtocol) {
    headerIssues.push(
      "HTTPS-to-HTTP redirect downgrade detected mid-navigation: transport security is not enforced end-to-end."
    );
  }

  const securityHeaders: SecurityHeadersFinding = {
    contentSecurityPolicy: cspHeader && typeof cspHeader === "string" ? cspHeader : null,
    strictTransportSecurity: hasHsts && hstsHeader && typeof hstsHeader === "string" ? hstsHeader : null,
    xFrameOptions: xfoHeader && typeof xfoHeader === "string" ? xfoHeader : null,
    xContentTypeOptions: xctoHeader && typeof xctoHeader === "string" ? xctoHeader : null,
    referrerPolicy: refHeader && typeof refHeader === "string" ? refHeader : null,
    permissionsPolicy: permHeader && typeof permHeader === "string" ? permHeader : null,
    headerIssues,
  };

  return {
    cookies,
    trackers: Array.from(trackerMap.values()),
    securityHeaders,
    consentFrameworkDetected,
    privacyUrl,
    bannerHtmlSnippet,
    hasHsts,
    tlsVersion,
    tlsProtocol,
    redirectHops: response.redirectHops,
    httpStatus,
    finalUrl: response.finalUrl,
  };
}
