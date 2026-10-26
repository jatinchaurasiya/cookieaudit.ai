import { z } from "zod";

export type CookieCategory =
  | "Strictly Necessary"
  | "Functional"
  | "Analytics"
  | "Marketing"
  | "Unclassified";

export interface RawCookieFinding {
  name: string;
  /** Redacted at the scanner: partial cookie values were leaking 6-char prefixes of possible session tokens into reports, storage, and PDFs. */
  valuePreview: string;
  domain: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  ttlDays: number | null;
  source: "HTTP_HEADER" | "JS_RUNTIME";
  category?: CookieCategory;
  description?: string;
  owaspIssues: string[];
}

export const REDACTED_COOKIE_PREVIEW = "(redacted)";

export interface TrackerFinding {
  domain: string;
  category: "Analytics" | "Marketing" | "Tag Manager" | "Session Replay" | "Unknown";
  scriptUrl?: string;
  firedBeforeConsent: boolean;
}

export const ComplianceAuditOutputSchema = z.object({
  dpdpAndGdprChecklist: z.object({
    itemizedDataCollected: z.object({
      passed: z.boolean(),
      evidenceQuote: z.string(),
      finding: z.string(),
    }),
    specificPurposeMapping: z.object({
      passed: z.boolean(),
      vagueClausesDetected: z.array(z.string()),
      finding: z.string(),
    }),
    grievanceOfficerDetails: z.object({
      passed: z.boolean(),
      contactExtracted: z.string().nullable(),
      finding: z.string(),
    }),
    equalEaseConsentWithdrawal: z.object({
      passed: z.boolean(),
      finding: z.string(),
    }),
    dataProtectionBoardRight: z.object({
      passed: z.boolean(),
      finding: z.string(),
    }),
    dataRetentionSchedule: z.object({
      passed: z.boolean(),
      retentionStated: z.string().nullable(),
      finding: z.string(),
    }),
    unconsentedTrackerDisclosure: z.object({
      passed: z.boolean(),
      undisclosedTrackers: z.array(z.string()),
      finding: z.string(),
    }),
  }),
  bannerAnalysis: z.object({
    bannerDetected: z.boolean(),
    hasOneClickReject: z.boolean(),
    darkPatterns: z.array(
      z.object({
        type: z.string(),
        severity: z.enum(["CRITICAL", "HIGH", "MEDIUM"]),
        explanation: z.string(),
      })
    ),
  }),
  remediationPackage: z.object({
    dpdpCompliantNoticeMarkdown: z.string(),
    secureCookieMiddlewareSnippet: z.string(),
    consentGateScriptSnippet: z.string(),
  }),
});

export type ComplianceAuditOutput = z.infer<typeof ComplianceAuditOutputSchema>;

export type ComplianceGrade = "Grade A+" | "Grade A" | "Grade B" | "Grade C" | "Grade F";

export interface ScanScores {
  overallScore: number;
  grade: ComplianceGrade;
  pillarOwaspScore: number;      // 0 - 35 pts
  pillarTrackingScore: number;   // 0 - 35 pts
  pillarLegalScore: number;      // 0 - 30 pts
}

export interface SecurityHeadersFinding {
  contentSecurityPolicy: string | null;
  strictTransportSecurity: string | null;
  xFrameOptions: string | null;
  xContentTypeOptions: string | null;
  referrerPolicy: string | null;
  permissionsPolicy: string | null;
  headerIssues: string[];
}

export interface ScanTelemetry {
  targetUrl: string;
  domain: string;
  scanTimestamp: string;
  tlsVersion: string;
  /** Actual negotiated TLS protocol of the final hop (e.g. "TLSv1.3"), null when plain HTTP */
  tlsProtocol?: string | null;
  hasHsts: boolean;
  httpStatus: number;
  cookies: RawCookieFinding[];
  trackers: TrackerFinding[];
  securityHeaders?: SecurityHeadersFinding;
  /** True when a Consent Management Platform (OneTrust, Cookiebot, Consent Mode v2, ...) was detected gating scripts */
  consentFrameworkDetected?: boolean;
  /** Absolute URLs of every redirect hop followed during the probe (repudiation evidence) */
  redirectHops?: string[];
  privacyUrl: string | null;
  privacyPolicyMarkdown: string;
  bannerHtmlSnippet: string;
}


// Late import cycle avoidance: AuditSealPayload is defined in lib/export/audit-seal
import type { AuditSealPayload } from "@/lib/export/audit-seal";

export interface CompleteAuditResult {
  id: string;
  targetUrl: string;
  domain: string;
  timestamp: string;
  scores: ScanScores;
  telemetry: ScanTelemetry;
  aiAudit: ComplianceAuditOutput;
  sha256Hash: string;
  executionTimeMs: number;
  /** Full canonical seal payload - its digest is sha256Hash. Enables independent re-verification. */
  auditPayload?: AuditSealPayload;
  /** HMAC-SHA256(AUDIT_SEAL_SECRET, canonical auditPayload) */
  signatureHmac?: string;
  /** True when a legacy row was loaded WITHOUT a stored payload (summary only, no fabricated fields) */
  partialTelemetry?: boolean;
  /** Whether the persistence layer confirmed the write (never silently assumed) */
  persisted?: boolean;
  /** Result of recomputed integrity verification for records loaded from storage */
  integrityVerdict?: "verified" | "violation" | "legacy" | null;
}
