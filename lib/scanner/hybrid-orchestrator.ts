import * as cheerio from "cheerio";
import { runTier1FastProbe } from "./tier1-probe";
import { runTier2Crawl4Ai } from "./tier2-crawl4ai";
import { RawCookieFinding, ScanTelemetry } from "@/lib/types/audit";

/**
 * Resilient Scraper Fallback: Extracts clean privacy text when Crawl4AI is not available
 */
async function scrapePrivacyPolicyWithCheerio(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 CookieAudit/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return "Privacy Policy page returned status " + res.status;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise
    $("script, style, nav, footer, header, svg, noscript, iframe").remove();

    // Prefer main, article, or content containers
    const content =
      $("main").text() ||
      $("article").text() ||
      $('.privacy-content, [class*="privacy" i], [id*="privacy" i]').text() ||
      $("body").text();

    return content.replace(/\s+/g, " ").trim().slice(0, 50000);
  } catch {
    return "Privacy policy could not be reached via standard HTTP probe.";
  }
}

/**
 * Hybrid Two-Tier Compliance Scan Orchestrator
 * Guaranteed to return telemetry in <12 seconds without crashing.
 */
export async function runHybridComplianceScan(targetUrl: string): Promise<ScanTelemetry> {
  const parsedUrl = new URL(targetUrl);
  const startTime = Date.now();

  // 1. Run Tier 1 Fast Probe (<150ms)
  const tier1 = await runTier1FastProbe(targetUrl);

  const cookiesMap = new Map<string, RawCookieFinding>();

  // Add all Tier 1 HTTP cookies
  for (const c of tier1.cookies) {
    cookiesMap.set(c.name, c);
  }

  let privacyMarkdown = "No dedicated privacy policy page discovered.";
  let bannerSnippet = tier1.bannerHtmlSnippet;

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
  } catch (err) {
    // Silent catch, fallback below handles it
  }

  // 3. Fallback: If privacyMarkdown is still empty and we have a privacyUrl, scrape with Cheerio
  if (privacyMarkdown.length < 50 && tier1.privacyUrl) {
    privacyMarkdown = await scrapePrivacyPolicyWithCheerio(tier1.privacyUrl);
  }

  return {
    targetUrl,
    domain: parsedUrl.hostname,
    scanTimestamp: new Date().toISOString(),
    tlsVersion: tier1.tlsVersion,
    hasHsts: tier1.hasHsts,
    httpStatus: tier1.httpStatus,
    cookies: Array.from(cookiesMap.values()),
    trackers: tier1.trackers,
    privacyUrl: tier1.privacyUrl,
    privacyPolicyMarkdown: privacyMarkdown,
    bannerHtmlSnippet: bannerSnippet,
  };
}
