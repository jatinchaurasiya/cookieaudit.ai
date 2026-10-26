import cookieDbData from "@/data/open-cookie-database.json";
import { CookieCategory, RawCookieFinding } from "@/lib/types/audit";

interface CookieSignature {
  pattern: string;
  category: CookieCategory;
  platform: string;
  description: string;
}

interface CompiledRule {
  regex: RegExp;
  category: CookieCategory;
  platform: string;
  description: string;
}

const compiledRules: CompiledRule[] = ((cookieDbData as { cookies?: CookieSignature[] }).cookies || []).map((c) => ({
  regex: new RegExp(c.pattern, "i"),
  category: c.category as CookieCategory,
  platform: c.platform,
  description: c.description,
}));

/**
 * Classifies a cookie against the Open Cookie Database
 */
export function categorizeCookie(cookieName: string): {
  category: CookieCategory;
  description: string;
  platform: string;
} {
  for (const rule of compiledRules) {
    if (rule.regex.test(cookieName)) {
      return {
        category: rule.category,
        description: rule.description,
        platform: rule.platform,
      };
    }
  }

  return {
    category: "Unclassified",
    description: "Custom domain cookie not identified in the Open Cookie Database registry.",
    platform: "Custom / 1st Party",
  };
}

/**
 * Categorizes an array of raw cookie findings
 */
export function categorizeDiscoveredCookies(cookies: RawCookieFinding[]): RawCookieFinding[] {
  return cookies.map((cookie) => {
    const matched = categorizeCookie(cookie.name);
    return {
      ...cookie,
      category: matched.category,
      description: matched.description,
    };
  });
}
