import { RawCookieFinding } from "@/lib/types/audit";

export interface Crawl4AiResponse {
  cookies: RawCookieFinding[];
  privacyMarkdown: string | null;
  bannerSnippet: string | null;
}

/**
 * Tier 2: Deep Dynamic & Markdown Engine via Crawl4AI Docker / CDP Sandbox
 */
export async function runTier2Crawl4Ai(
  targetUrl: string,
  privacyUrl: string | null
): Promise<Crawl4AiResponse | null> {
  const crawl4aiBase = process.env.CRAWL4AI_URL || "http://localhost:11235";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000); // 7s timeout max

  try {
    const urlsToCrawl = privacyUrl && privacyUrl !== targetUrl
      ? [targetUrl, privacyUrl]
      : [targetUrl];

    const response = await fetch(`${crawl4aiBase}/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: urlsToCrawl,
        browser_config: {
          headless: true,
          verbose: false,
        },
        crawler_config: {
          page_timeout: 6000,
          wait_for_images: false,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const mainPage = data.results?.[0];
    const privacyPage = data.results?.[1] || mainPage;

    const parsedCookies: RawCookieFinding[] = [];
    const hostname = new URL(targetUrl).hostname;

    for (const c of mainPage?.cookies || []) {
      const ttlDays = c.expires
        ? Math.round((c.expires * 1000 - Date.now()) / 86400000)
        : null;

      parsedCookies.push({
        name: c.name,
        valuePreview: c.value ? `${c.value.slice(0, 6)}...` : "(empty)",
        domain: c.domain || hostname,
        secure: Boolean(c.secure),
        httpOnly: Boolean(c.httpOnly),
        sameSite: c.sameSite || "None (Unset)",
        ttlDays,
        source: "JS_RUNTIME",
        owaspIssues: [],
      });
    }

    let privacyMarkdown: string | null = null;
    if (privacyPage?.markdown) {
      privacyMarkdown =
        typeof privacyPage.markdown === "string"
          ? privacyPage.markdown
          : privacyPage.markdown.fit_markdown || privacyPage.markdown.raw_markdown;
    }

    return {
      cookies: parsedCookies,
      privacyMarkdown,
      bannerSnippet: null,
    };
  } catch {
    // Graceful degradation when Crawl4AI container is not active or times out
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
