import {
  ComplianceAuditOutput,
  ComplianceAuditOutputSchema,
  RawCookieFinding,
  TrackerFinding,
} from "@/lib/types/audit";

interface AuditorParams {
  targetUrl: string;
  discoveredCookies: RawCookieFinding[];
  trackers: TrackerFinding[];
  bannerHtmlSnippet: string;
  privacyPolicyMarkdown: string;
}

/**
 * Extracts an authentic verbatim sentence from the scraped privacy policy text matching keywords
 */
function extractRealPolicyQuote(markdown: string, keywords: string[]): string {
  if (!markdown || markdown.length < 20 || markdown.startsWith("No dedicated") || markdown.startsWith("Privacy Policy page returned")) {
    return "Not found in policy";
  }

  const chunks = markdown.split(/[.\n\r]/).map((s) => s.trim()).filter((s) => s.length > 15);
  for (const chunk of chunks) {
    const lower = chunk.toLowerCase();
    if (keywords.some((k) => lower.includes(k))) {
      return chunk.slice(0, 220);
    }
  }

  return markdown.slice(0, 150).trim();
}

/**
 * Deterministic compliance analysis engine evaluating actual scraped DOM, cookies, and policy text
 */
function evaluateDeterministicPolicyAudit(params: AuditorParams): ComplianceAuditOutput {
  const policyText = (params.privacyPolicyMarkdown || "").toLowerCase();
  const domain = new URL(params.targetUrl).hostname;

  // Check grievance officer
  const hasGrievance =
    policyText.includes("grievance") ||
    policyText.includes("dpo") ||
    policyText.includes("data protection officer") ||
    policyText.includes("privacy officer") ||
    policyText.includes("nodal officer");

  // Check consent withdrawal
  const hasWithdrawal =
    policyText.includes("withdraw consent") ||
    policyText.includes("opt-out") ||
    policyText.includes("unsubscribe") ||
    policyText.includes("revoke consent") ||
    policyText.includes("withdraw your consent");

  // Check Data Protection Board
  const hasDpb =
    policyText.includes("data protection board") ||
    policyText.includes("supervisory authority") ||
    policyText.includes("dpbi") ||
    policyText.includes("data protection authority");

  // Check retention schedule
  const hasRetention =
    policyText.includes("retention") ||
    policyText.includes("retain") ||
    policyText.includes("delete after") ||
    policyText.includes("retention period") ||
    policyText.includes("erasure");

  // Real Dark pattern detection from actual banner DOM
  const hasBanner = params.bannerHtmlSnippet.length > 20;
  const lowerBanner = params.bannerHtmlSnippet.toLowerCase();
  const hasRejectButton =
    lowerBanner.includes("reject") ||
    lowerBanner.includes("decline") ||
    lowerBanner.includes("deny") ||
    lowerBanner.includes("refuse");

  const darkPatterns: Array<{
    type: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM";
    explanation: string;
  }> = [];

  if (hasBanner && !hasRejectButton) {
    darkPatterns.push({
      type: "MISSING_REJECT_BUTTON",
      severity: "CRITICAL",
      explanation:
        "The cookie consent banner provides an 'Accept' action but lacks an equally prominent 'Reject' button, violating EU EDPB Guidelines 3/2022 and India DPDP Section 6.",
    });
  }

  const insecureCookieNames = params.discoveredCookies
    .filter((c) => c.owaspIssues.length > 0)
    .map((c) => c.name);

  const trackerNames = params.trackers.map((t) => t.domain);

  // Extract authentic verbatim quotes from the scraped policy
  const collectionQuote = extractRealPolicyQuote(params.privacyPolicyMarkdown, [
    "collect",
    "information",
    "personal data",
    "identifiers",
    "cookies",
  ]);

  const grievanceQuote = extractRealPolicyQuote(params.privacyPolicyMarkdown, [
    "grievance",
    "dpo",
    "officer",
    "contact",
  ]);

  const retentionQuote = extractRealPolicyQuote(params.privacyPolicyMarkdown, [
    "retention",
    "retain",
    "period",
    "store",
  ]);

  return {
    dpdpAndGdprChecklist: {
      itemizedDataCollected: {
        passed: policyText.length > 200 && collectionQuote !== "Not found in policy",
        evidenceQuote: collectionQuote,
        finding:
          policyText.length > 200
            ? "Policy contains disclosures on personal data categories collected."
            : "Policy fails to provide a clear itemized breakdown of collected personal data.",
      },
      specificPurposeMapping: {
        passed: policyText.includes("purpose") || policyText.includes("how we use") || policyText.includes("use of data"),
        vagueClausesDetected: policyText.includes("enhance user experience")
          ? ["'to enhance user experience'"]
          : [],
        finding: policyText.includes("purpose")
          ? "Purpose disclosures identified in policy documentation."
          : "Policy lacks explicit, purpose-limited processing boundaries.",
      },
      grievanceOfficerDetails: {
        passed: hasGrievance,
        contactExtracted: hasGrievance ? grievanceQuote : null,
        finding: hasGrievance
          ? `Grievance Redressal Officer / DPO contact mechanism discovered: ${grievanceQuote.slice(0, 100)}`
          : "CRITICAL VIOLATION (DPDP Act 2023 Sec 5): No Grievance Redressal Officer name, designation, or email found.",
      },
      equalEaseConsentWithdrawal: {
        passed: hasWithdrawal,
        finding: hasWithdrawal
          ? "Policy mentions explicit mechanisms to withdraw or revoke consent."
          : "VIOLATION (DPDP Act Sec 6(4)): Consent withdrawal mechanism not documented as equal in ease to granting consent.",
      },
      dataProtectionBoardRight: {
        passed: hasDpb,
        finding: hasDpb
          ? "Explicit reference to complaint rights before the Data Protection Board of India / Supervisory Authority."
          : "VIOLATION (DPDP Rule 3(1)(e)): Fails to inform data principal of statutory right to complain to the Data Protection Board of India.",
      },
      dataRetentionSchedule: {
        passed: hasRetention,
        retentionStated: hasRetention ? retentionQuote : null,
        finding: hasRetention
          ? `Data retention criteria documented: ${retentionQuote.slice(0, 80)}`
          : "VIOLATION (DPDP Sec 8(7)): Missing definite data retention timeline or erasure trigger schedule.",
      },
      unconsentedTrackerDisclosure: {
        passed: trackerNames.length === 0,
        undisclosedTrackers: trackerNames,
        finding:
          trackerNames.length > 0
            ? `Found ${trackerNames.length} third-party tracker(s) (${trackerNames.join(
                ", "
              )}) initializing prior to affirmative consent.`
            : "No pre-consent third-party tracking beacons detected.",
      },
    },
    bannerAnalysis: {
      bannerDetected: hasBanner,
      hasOneClickReject: hasRejectButton,
      darkPatterns,
    },
    remediationPackage: {
      dpdpCompliantNoticeMarkdown: `### DPDP Act 2023 & Rules 2025 Privacy Notice Addendum for ${domain}

**1. Itemized Data Collection Notice (DPDP Rule 3)**:
We collect: (a) Technical Identifiers (IP address, browser type), (b) Cookies for session management, and (c) Usage metrics.

**2. Purpose Limitation**:
Data is processed strictly for providing authenticated services, securing transactions, and measuring aggregate traffic with your prior affirmative consent.

**3. Grievance Redressal Officer (Mandatory under Section 5)**:
- **Officer**: Data Protection Officer / Grievance Redressal Officer
- **Email**: privacy@${domain}
- **Address**: Registered Office, Compliance Division
- **Response SLA**: Grievances resolved within 30 days.

**4. Right to Complain to Data Protection Board of India (DPBI)**:
If you are unsatisfied with our grievance resolution, you possess the statutory right to appeal directly to the **Data Protection Board of India** under Section 5(1)(e) and Section 27 of the DPDP Act 2023.

**5. Consent Withdrawal with Equal Ease (Section 6(4))**:
You may revoke consent at any time via the 1-click 'Privacy Preferences' link located in our website footer.`,

      secureCookieMiddlewareSnippet: `// Next.js / Express Secure Cookie Remediation Middleware
// Enforces OWASP ASVS Chapter 3 (Secure, HttpOnly, SameSite=Lax, TTL <= 400d)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Remediation for: ${insecureCookieNames.join(", ") || "session cookies"}
  response.cookies.set({
    name: 'session_token',
    value: request.cookies.get('session_token')?.value || '',
    httpOnly: true,                // OWASP A03: Blocks JavaScript XSS theft
    secure: process.env.NODE_ENV === 'production', // OWASP A02: Requires HTTPS
    sameSite: 'lax',               // OWASP A01: Mitigates CSRF exploits
    maxAge: 60 * 60 * 24 * 30,     // 30 days (Strictly <= 400 days limit)
    path: '/',
  });

  return response;
}`,

      consentGateScriptSnippet: `<!-- CookieAudit AI: Consent-Gated Script Wrapper -->
<!-- Prevents ${trackerNames.join(", ") || "Google Analytics / Meta Pixel"} from firing prior to consent -->

<script>
  function hasUserConsented() {
    return localStorage.getItem('cookieaudit_consent_analytics') === 'true';
  }

  function loadAnalytics() {
    if (!hasUserConsented()) {
      console.log('[CookieAudit Guard] Trackers paused pending affirmative user consent.');
      return;
    }

    // Initialize trackers safely post-consent
    var script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
    script.async = true;
    document.head.appendChild(script);
  }

  // Bind to Consent Banner 'Accept' button
  window.grantPrivacyConsent = function() {
    localStorage.setItem('cookieaudit_consent_analytics', 'true');
    loadAnalytics();
  };

  // Check on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', loadAnalytics);
</script>`,
    },
  };
}

/**
 * Runs MiniMax M3.1 Compliance Audit using OpenRouter API with automated failover
 */
export async function runMiniMaxComplianceAudit(
  params: AuditorParams
): Promise<ComplianceAuditOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Utilize deterministic compliance evaluator when API key is not configured
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("xxxxxxxx")) {
    return evaluateDeterministicPolicyAudit(params);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://cookieaudit.space",
        "X-Title": "CookieAudit AI - WSC & DPDP Compliance Scanner",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "minimax/minimax-m3.1-flash:free",
        models: [
          "minimax/minimax-m3.1-flash:free",
          "minimax/minimax-m3.1-flash",
          "google/gemini-2.0-flash-exp:free",
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert Data Protection Officer (DPO) and OWASP Web Security Auditor specializing in India Digital Personal Data Protection (DPDP) Act 2023 & Rules 2025, EU GDPR, and OWASP Session Management.
Analyze the provided website telemetry, discovered cookies, cookie banner DOM, and scraped Privacy Policy Markdown.
Return ONLY a valid JSON object matching the requested schema. Quote verbatim from the privacy policy for evidenceQuote fields (or write "Not found in policy").`,
          },
          {
            role: "user",
            content: JSON.stringify({
              targetUrl: params.targetUrl,
              discoveredCookies: params.discoveredCookies.map((c) => ({
                name: c.name,
                category: c.category,
                secure: c.secure,
                httpOnly: c.httpOnly,
                owaspIssues: c.owaspIssues,
              })),
              thirdPartyTrackersFiredPreConsent: params.trackers.map((t) => t.domain),
              cookieBannerDom: params.bannerHtmlSnippet.slice(0, 5000),
              privacyPolicyMarkdown: params.privacyPolicyMarkdown.slice(0, 40000),
              requiredJsonStructure: {
                dpdpAndGdprChecklist: {
                  itemizedDataCollected: { passed: true, evidenceQuote: "string", finding: "string" },
                  specificPurposeMapping: { passed: false, vagueClausesDetected: ["string"], finding: "string" },
                  grievanceOfficerDetails: { passed: false, contactExtracted: null, finding: "string" },
                  equalEaseConsentWithdrawal: { passed: false, finding: "string" },
                  dataProtectionBoardRight: { passed: false, finding: "string" },
                  dataRetentionSchedule: { passed: false, retentionStated: null, finding: "string" },
                  unconsentedTrackerDisclosure: { passed: false, undisclosedTrackers: ["string"], finding: "string" },
                },
                bannerAnalysis: {
                  bannerDetected: false,
                  hasOneClickReject: false,
                  darkPatterns: [{ type: "MISSING_REJECT_BUTTON", severity: "CRITICAL", explanation: "string" }],
                },
                remediationPackage: {
                  dpdpCompliantNoticeMarkdown: "Complete markdown privacy clauses...",
                  secureCookieMiddlewareSnippet: "Express/Next.js code fixing cookies...",
                  consentGateScriptSnippet: "JavaScript wrapper gating trackers...",
                },
              },
            }),
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`OpenRouter API returned ${response.status}, utilizing deterministic evaluator.`);
      return evaluateDeterministicPolicyAudit(params);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";
    const cleanedJson = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    return ComplianceAuditOutputSchema.parse(JSON.parse(cleanedJson));
  } catch (err: any) {
    console.warn("OpenRouter API error/timeout, utilizing deterministic evaluator:", err.message);
    return evaluateDeterministicPolicyAudit(params);
  }
}
