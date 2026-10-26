import * as cheerio from "cheerio";
import { runTier1FastProbe } from "./tier1-probe";
import { runTier2Crawl4Ai } from "./tier2-crawl4ai";
import { RawCookieFinding, ScanTelemetry } from "@/lib/types/audit";
import { secureFetch } from "@/lib/security/secure-http";
import { SsrfSecurityError } from "@/lib/security/ssrf-guard";

/**
 * Resilient Scraper Fallback: Extracts clean privacy text when Crawl4AI is
 * unavailable. Uses the SAME SSRF-pinned transport as the main probe - the
 * privacy URL originates from the target page's own markup, so fetching it
 * with an unvalidated transport was an attacker-controlled request (the
 * original "read the status reflection of any internal service" SSRF).
 */
async function scrapePrivacyPolicyWithCheerio(url: string): Promise<string> {
  try {
    const res = await secureFetch(url, {
      timeoutMs: 6000,
      maxRedirects: 5,
      maxBodyBytes: 2 * 1024 * 1024,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 CookieAudit/1.0",
      },
    });

    if (res.status < 200 || res.status >= 400) {
      return "Privacy Policy page returned status " + res.status;
    }

    const $ = cheerio.load(res.bodyText);

    // Remove noise
    $("script, style, nav, footer, header, svg, noscript, iframe").remove();

    // Prefer main, article, or content containers
    const content =
      $("main").text() ||
      $("article").text() ||
      $('.privacy-content, [class*="privacy" i], [id*="privacy" i]').text() ||
      $("body").text();

    return content.replace(/\s+/g, " ").trim().slice(0, 50000);
  } catch (err) {
    if (err instanceof SsrfSecurityError) {
      return "Privacy policy link was blocked by the outbound SSRF guard (unsafe destination).";
    }
    return "Privacy policy could not be reached via standard HTTP probe.";
  }
}

/**
 * Hybrid Two-Tier Compliance Scan Orchestrator
 * Guaranteed to return telemetry without crashing; every outbound byte rides
 * the SSRF-pinned transport.
 */
export async function runHybridComplianceScan(targetUrl: string): Promise<ScanTelemetry> {
  const parsedUrl = new URL(targetUrl);

  // 1. Run Tier 1 Secure Probe
  const tier1 = await runTier1FastProbe(targetUrl);

  const cookiesMap = new Map<string, RawCookieFinding>();

  // Add all Tier 1 HTTP cookies (accumulated across redirect hops)
  for (const c of tier1.cookies) {
    cookiesMap.set(c.name, c);
  }

  let privacyMarkdown = "No dedicated privacy policy page discovered.";
  const bannerSnippet = tier1.bannerHtmlSnippet;

  // 2. Attempt Tier 2 Crawl4AI (Deep CDP cookies & clean markdown)
  try {
    const tier2 = await runTier2Crawl4Ai(targetUrl, tier1.privacyUrl);

    if (tier2) {
      // Merge runtime JS cookies
      for (const jsCookie of tier2.cookies) {
        if (!cookiesMap.has(jsCookie.name)) {
          cookiesMap.set(jsCookie.name, jsCookie);
        }
      }

      if (tier2.privacyMarkdown && tier2.privacyMarkdown.length > 50) {
        privacyMarkdown = tier2.privacyMarkdown;
      }
    }
  } catch {
    // Silent catch, fallback below handles it
  }

  // 3. Fallback: If privacyMarkdown is still empty and we have a privacyUrl,
  //    scrape it through the validated transport.
  if (privacyMarkdown.length < 50 && tier1.privacyUrl) {
    privacyMarkdown = await scrapePrivacyPolicyWithCheerio(tier1.privacyUrl);
  }

  return {
    targetUrl,
    domain: parsedUrl.hostname,
    scanTimestamp: new Date().toISOString(),
    tlsVersion: tier1.tlsVersion,
    tlsProtocol: tier1.tlsProtocol,
    hasHsts: tier1.hasHsts,
    httpStatus: tier1.httpStatus,
    cookies: Array.from(cookiesMap.values()),
    trackers: tier1.trackers,
    securityHeaders: tier1.securityHeaders,
    consentFrameworkDetected: tier1.consentFrameworkDetected,
    redirectHops: tier1.redirectHops.length > 0 ? tier1.redirectHops : undefined,
    privacyUrl: tier1.privacyUrl,
    privacyPolicyMarkdown: privacyMarkdown,
    bannerHtmlSnippet: bannerSnippet,
  };
}
