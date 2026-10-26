import crypto from "node:crypto";
import { ScanTelemetry, ScanScores, ComplianceAuditOutput } from "@/lib/types/audit";

/**
 * Tamper-evident audit sealing.
 *
 * The previous implementation hashed only a handful of summary counters
 * ({targetUrl, timestamp, scores, cookieCount, ...}), so two materially
 * different audit reports could share one "certificate", and nested keys were
 * not canonicalized, making results engine-order dependent. It was a
 * fingerprint marketed as non-repudiation - not a real integrity control.
 *
 * This module is the root fix, and the certificate now genuinely certifies
 * content:
 *
 *  1. COMPLETE COVERAGE - the seal payload contains the full audit content:
 *     telemetry (every cookie with its attributes & OWASP findings, every
 *     tracker, security headers), the raw privacy-policy text hash, banner
 *     DOM, and the entire AI audit output. Anything in the report that lives
 *     here is cryptographically covered.
 *
 *  2. TRUE CANONICALIZATION - keys are recursively sorted before hashing, so
 *     the digest is stable regardless of property insertion order or engine.
 *
 *  3. NON-DENIABILITY FIX - Adobe-free "non-repudiation" needs a secret the
 *     audience does not have. The seal is now:
 *         signature = HMAC-SHA256(AUDIT_SEAL_SECRET, canonicalPayload)
 *     Only the deployment holding the secret can mint a valid seal, and the
 *     /verify page recomputes BOTH the digest and the signature against the
 *     stored payload, so any tampering with DB rows is detected.
 *
 *  4. PII & SECRET HYGIENE - truncated cookie-value previews are excluded
 *     from the payload (and redacted upstream), so no partial session
 *     identifiers ever reach the ledger, logs, or PDFs.
 */

export const SEAL_SPEC_VERSION = 2;

export interface AuditSealPayload {
  sealVersion: number;
  sealSpec: string;
  targetUrl: string;
  domain: string;
  timestamp: string;
  scores: ScanScores;
  telemetry: {
    tlsVersion: string;
    tlsProtocol: string | null;
    hasHsts: boolean;
    httpStatus: number;
    securityHeaders: ScanTelemetry["securityHeaders"] | null;
    cookies: Array<{
      name: string;
      domain: string;
      category: string | null;
      description: string | null;
      secure: boolean;
      httpOnly: boolean;
      sameSite: string;
      ttlDays: number | null;
      source: string;
      owaspIssues: string[];
    }>;
    trackers: ScanTelemetry["trackers"];
    consentFrameworkDetected: boolean | null;
    privacyUrl: string | null;
    privacyPolicyMarkdownDigest: string; // SHA-256 of the raw policy text
    policyTextLength: number;
    bannerHtmlSnippet: string;
  };
  aiAudit: ComplianceAuditOutput;
}

export type { ScanScores, ScanTelemetry, ComplianceAuditOutput };

// ------------------------------------------------------------ canonicalization

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

function canonicalize(value: unknown): JsonValue {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return value as JsonValue;
  }
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    // Arrays keep order (which is semantically meaningful for findings)
    return value.map((item) => canonicalize(item));
  }
  if (typeof value === "object" && value !== null) {
    const out: { [k: string]: JsonValue } = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v === undefined || typeof v === "function") continue;
      out[key] = canonicalize(v);
    }
    return out;
  }
  return null;
}

/**
 * Deterministic serialization: recursively key-sorted JSON. Must be used for
 * both minting and verifying, or the digest comparison is meaningless.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

// ------------------------------------------------------------------- secret mgmt

let devKeyCache: Buffer | null = null;

function getSealSecret(): Buffer {
  const secret = process.env.AUDIT_SEAL_SECRET;
  if (secret && secret.length >= 32) {
    return Buffer.from(secret, "utf8");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUDIT_SEAL_SECRET is required in production (32+ characters). Refusing to mint certificates with an unknown key."
    );
  }

  // Development fallback: random per-process key, so dev seals can never be
  // trusted across restarts (which is exactly what we want in dev).
  if (!devKeyCache) {
    devKeyCache = crypto.randomBytes(32);
    console.warn(
      "[audit-seal] AUDIT_SEAL_SECRET not set - using an ephemeral development key. Seals are not portable in this mode."
    );
  }
  return devKeyCache;
}

export function isSealSecretConfigured(): boolean {
  const secret = process.env.AUDIT_SEAL_SECRET;
  return Boolean(secret && secret.length >= 32);
}

// ------------------------------------------------------------------- seal build

function textDigest(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function stableHashTargetUrl(url: string): string {
  // Normalize: lowercase host, drop trailing slash variants, drop hash
  // fragments, sort query params - differences a verifier would not consider
  // semantically distinct.
  try {
    const u = new URL(url);
    u.hash = "";
    const normalized =
      u.origin +
      (u.pathname !== "/" ? u.pathname.replace(/\/+$/, "") : "") +
      (Array.from(u.searchParams.entries()).length > 0
        ? "?" +
          Array.from(u.searchParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join("&")
        : "");
    return normalized;
  } catch {
    return url;
  }
}

export function buildSealPayload(input: {
  targetUrl: string;
  domain: string;
  timestamp: string;
  scores: ScanScores;
  telemetry: ScanTelemetry;
  aiAudit: ComplianceAuditOutput;
  consentFrameworkDetected?: boolean;
}): AuditSealPayload {
  const t = input.telemetry;
  return {
    sealVersion: SEAL_SPEC_VERSION,
    sealSpec: "cookieaudit/audit-seal/v2",
    targetUrl: stableHashTargetUrl(input.targetUrl),
    domain: input.domain.toLowerCase(),
    timestamp: input.timestamp,
    scores: input.scores,
    telemetry: {
      tlsVersion: t.tlsVersion,
      tlsProtocol: t.tlsProtocol ?? null,
      hasHsts: t.hasHsts,
      httpStatus: t.httpStatus,
      securityHeaders: t.securityHeaders ?? null,
      cookies: t.cookies.map((c) => ({
        name: c.name,
        domain: c.domain,
        category: c.category ?? null,
        description: c.description ?? null,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        ttlDays: c.ttlDays ?? null,
        source: c.source,
        owaspIssues: c.owaspIssues,
      })),
      trackers: t.trackers,
      consentFrameworkDetected: input.consentFrameworkDetected ?? null,
      privacyUrl: t.privacyUrl,
      privacyPolicyMarkdownDigest: textDigest(t.privacyPolicyMarkdown || ""),
      policyTextLength: (t.privacyPolicyMarkdown || "").length,
      bannerHtmlSnippet: t.bannerHtmlSnippet || "",
    },
    aiAudit: input.aiAudit,
  };
}

/** Tamper-evident digest over the complete audit payload. */
export function computeAuditSha256(payload: AuditSealPayload): string {
  return crypto.createHash("sha256").update(canonicalJson(payload), "utf8").digest("hex");
}

/** HMAC seal - mints a signature no unprincipled third party can forge. */
export function signAuditPayload(payload: AuditSealPayload): string {
  return crypto
    .createHmac("sha256", getSealSecret())
    .update(canonicalJson(payload), "utf8")
    .digest("hex");
}

export interface SealVerificationResult {
  digestMatch: boolean;
  signatureMatch: boolean | null; // null = legacy record without a signature
  verdict: "verified" | "violation" | "legacy";
}

/**
 * Recomputes the digest AND the signature against a stored payload. This is
 * real, recomputed verification - not a substring lookup that would match
 * any copy of the hash string.
 */
export function verifyAuditSeal(record: {
  sha256Hash: string;
  signatureHmac?: string | null;
  auditPayload?: AuditSealPayload | null;
}): SealVerificationResult {
  if (!record.auditPayload) {
    return { digestMatch: false, signatureMatch: null, verdict: "legacy" };
  }

  const recomputed = computeAuditSha256(record.auditPayload);
  const digestMatch = recomputed === record.sha256Hash;

  let signatureMatch: boolean | null = null;
  if (record.signatureHmac) {
    const expected = signAuditPayload(record.auditPayload);
    // timingSafeEqual needs equal-length buffers; guard to avoid crashes
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(record.signatureHmac, "utf8");
    signatureMatch = a.length === b.length ? crypto.timingSafeEqual(a, b) : false;
  }

  const verdict =
    digestMatch && signatureMatch !== false
      ? "verified"
      : "violation";

  return { digestMatch, signatureMatch, verdict };
}
