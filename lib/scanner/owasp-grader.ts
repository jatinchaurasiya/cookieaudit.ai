import { RawCookieFinding } from "@/lib/types/audit";

const SESSION_COOKIE_INDICATORS = [
  "session",
  "sess",
  "sid",
  "auth",
  "jwt",
  "token",
  "phpsessid",
  "jsessionid",
  "connect.sid",
  "id_token",
  "access_token",
  "remember",
  "user",
];

/**
 * Audits cookies against OWASP Application Security Verification Standard (ASVS) Chapter 3
 */
export function gradeOwaspSessionSecurity(
  cookies: RawCookieFinding[],
  isHttps: boolean
): RawCookieFinding[] {
  return cookies.map((cookie) => {
    const issues: string[] = [];
    const lowerName = cookie.name.toLowerCase();

    // 1. Missing Secure flag on HTTPS (OWASP A02: Cryptographic Failures)
    if (isHttps && !cookie.secure) {
      issues.push("Missing 'Secure' flag on HTTPS: Cookie transmits in plaintext on downgrade.");
    }

    // 2. Missing HttpOnly on potential session identifiers (OWASP A03: XSS Session Theft)
    const looksLikeSessionCookie =
      cookie.category === "Strictly Necessary" ||
      SESSION_COOKIE_INDICATORS.some((pattern) => lowerName.includes(pattern));

    if (looksLikeSessionCookie && !cookie.httpOnly) {
      issues.push(
        "Missing 'HttpOnly' flag on session/auth cookie: Vulnerable to JavaScript XSS theft."
      );
    }

    // 3. SameSite issues (OWASP A01: CSRF Risk)
    const sameSiteLower = (cookie.sameSite || "").toLowerCase();
    if (sameSiteLower.includes("none") && !cookie.secure) {
      issues.push("Critical: SameSite=None without Secure flag is rejected by modern browsers.");
    } else if (sameSiteLower.includes("none") || sameSiteLower.includes("unset")) {
      issues.push("Permissive SameSite configuration: Potential cross-site request exposure.");
    }

    // 4. Excessive TTL (> 400 days violation of RFC 6265bis)
    if (cookie.ttlDays && cookie.ttlDays > 400) {
      issues.push(
        `Excessive lifespan (${cookie.ttlDays} days): Violates RFC 6265bis 400-day upper bound.`
      );
    }

    return {
      ...cookie,
      owaspIssues: issues,
    };
  });
}
