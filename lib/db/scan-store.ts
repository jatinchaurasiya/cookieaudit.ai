import { CompleteAuditResult, REDACTED_COOKIE_PREVIEW, RawCookieFinding } from "@/lib/types/audit";
import type { AuditSealPayload } from "@/lib/export/audit-seal";
import { supabase, isSupabaseConfigured, isServiceRoleConfigured } from "./supabase-client";
import { verifyAuditSeal } from "@/lib/export/audit-seal";
import { errorMessage } from "@/lib/api/error-response";

/**
 * Scan store with HONEST persistence semantics:
 *
 *  - supabase-js returns `{ error }` rather than throwing; the previous code
 *    inspected neither, so persistence silently no-oped. Outcomes are checked
 *    and surfaced via the returned `SaveScanOutcome` / `persisted` flag.
 *  - Full audit payloads are persisted (`audit_payload` JSONB), so hydration
 *    uses REAL collected data instead of fabricated constants
 *    (tlsVersion "TLS 1.3 / HTTPS", hasHsts: true, httpStatus: 200, empty
 *    cookie lists) that previously appeared on report pages.
 *  - The in-memory cache is bounded (size eviction + TTL sweep), fixing the
 *    unbounded-growth leak in long-lived processes.
 *  - Hydrated records are integrity-checked (digest + HMAC) and annotated
 *    with `integrityVerdict` so tampering with storage becomes visible.
 */

const MEMORY_CACHE_MAX = Number.isFinite(parseInt(process.env.MEMORY_CACHE_MAX_SCANS || "250", 10))
  ? parseInt(process.env.MEMORY_CACHE_MAX_SCANS || "250", 10)
  : 250;
const MEMORY_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const HASH_SWEEP_INTERVAL_MS = 10 * 60 * 1000;

interface MemoryEntry {
  value: CompleteAuditResult;
  storedAt: number;
}

class BoundedScanCache {
  private store = new Map<string, MemoryEntry>();

  get(key: string): CompleteAuditResult | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.storedAt > MEMORY_TTL_MS) {
      this.store.delete(key);
      return null;
    }
    // Refresh recency; insertion order drives eviction
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: CompleteAuditResult): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, storedAt: Date.now() });

    while (this.store.size > MEMORY_CACHE_MAX) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  collectExpired(): string[] {
    const now = Date.now();
    const expired: string[] = [];
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.storedAt > MEMORY_TTL_MS) expired.push(key);
    }
    return expired;
  }

  entries(): IterableIterator<[string, MemoryEntry]> {
    return this.store.entries();
  }

  get size(): number {
    return this.store.size;
  }
}

const globalForScans = globalThis as unknown as {
  __cookieauditScanCache?: BoundedScanCache;
  __cookieauditHashIndex?: Map<string, string>;
};

const memoryScans = globalForScans.__cookieauditScanCache ?? new BoundedScanCache();
const hashToScanId = globalForScans.__cookieauditHashIndex ?? new Map<string, string>();

globalForScans.__cookieauditScanCache = memoryScans;
globalForScans.__cookieauditHashIndex = hashToScanId;

const hashPrefixKey = (hash: string) => hash.toLowerCase().slice(0, 16);

// Periodic TTL sweep: evict expired scans and their hash index entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    for (const expiredId of memoryScans.collectExpired()) {
      memoryScans.delete(expiredId);
      for (const [hash, mappedId] of Array.from(hashToScanId.entries())) {
        if (mappedId === expiredId) hashToScanId.delete(hash);
      }
    }
  }, HASH_SWEEP_INTERVAL_MS).unref?.();
}

export interface SaveScanOutcome {
  persisted: boolean;
  persistenceDetail?: string;
}

/** Minimal shape of a persisted `scans` row (Supabase). */
interface ScanRow {
  id: string;
  target_url: string;
  domain: string;
  created_at: string;
  overall_score: number;
  grade: string;
  pillar_owasp_score: number;
  pillar_tracking_score: number;
  pillar_legal_score: number;
  privacy_url: string | null;
  sha256_hash: string;
  signature_hmac: string | null;
  audit_payload: AuditSealPayload | null;
  ai_audit_json: unknown;
}

/**
 * Stores an authentic scan result (Supabase when configured + memory cache).
 * Returns an outcome the caller can surface - persistence never fails
 * silently.
 */
export async function saveScanResult(scan: CompleteAuditResult): Promise<SaveScanOutcome> {
  memoryScans.set(scan.id, scan);
  hashToScanId.set(scan.sha256Hash, scan.id);
  hashToScanId.set(hashPrefixKey(scan.sha256Hash), scan.id);

  if (!isSupabaseConfigured || !supabase) {
    return { persisted: false, persistenceDetail: "supabase_not_configured" };
  }

  try {
    const { error: scanError } = await supabase.from("scans").insert({
      id: scan.id,
      target_url: scan.targetUrl,
      domain: scan.domain,
      overall_score: scan.scores.overallScore,
      grade: scan.scores.grade,
      pillar_owasp_score: scan.scores.pillarOwaspScore,
      pillar_tracking_score: scan.scores.pillarTrackingScore,
      pillar_legal_score: scan.scores.pillarLegalScore,
      total_cookies: scan.telemetry.cookies.length,
      insecure_cookies: scan.telemetry.cookies.filter((c) => c.owaspIssues.length > 0).length,
      pre_consent_trackers: scan.telemetry.trackers.filter((t) => t.firedBeforeConsent).length,
      privacy_url: scan.telemetry.privacyUrl,
      sha256_hash: scan.sha256Hash,
      signature_hmac: scan.signatureHmac ?? null,
      audit_payload: scan.auditPayload ?? null,
      ai_audit_json: scan.aiAudit,
      is_public: true,
    });

    if (scanError) {
      console.error(
        "[scan-store] Supabase scans insert REJECTED:",
        scanError.message,
        `service_role=${isServiceRoleConfigured}`
      );
      return { persisted: false, persistenceDetail: scanError.message };
    }

    if (scan.telemetry.cookies.length > 0) {
      const cookieRows = scan.telemetry.cookies.map((c) => ({
        scan_id: scan.id,
        name: c.name,
        domain: c.domain,
        category: c.category || "Unclassified",
        is_secure: c.secure,
        is_http_only: c.httpOnly,
        same_site: c.sameSite,
        ttl_days: c.ttlDays,
        source: c.source,
        owasp_issues: c.owaspIssues,
      }));
      const { error: cookieError } = await supabase.from("scan_cookies").insert(cookieRows);      if (cookieError) {
        console.error("[scan-store] scan_cookies insert REJECTED:", cookieError.message);
        // Scan row persisted; cookie rows are supplementary detail
        return { persisted: true, persistenceDetail: `cookie_rows_failed: ${cookieError.message}` };
      }
    }

    return { persisted: true };
  } catch (err: unknown) {
    console.error("[scan-store] Supabase persistence threw:", errorMessage(err));
    return { persisted: false, persistenceDetail: errorMessage(err) };
  }
}

/**
 * Builds a CompleteAuditResult from a persisted row using the REAL stored
 * payload. Legacy rows without a payload produce a summary-only result
 * explicitly flagged `partialTelemetry` - no fabricated constants.
 */
function hydrateFromRow(row: ScanRow): CompleteAuditResult {
  const payload = row.audit_payload;
  const sealedTelemetry: AuditSealPayload["telemetry"] | undefined = payload?.telemetry;

  const result: CompleteAuditResult = {
    id: row.id,
    targetUrl: row.target_url,
    domain: row.domain,
    timestamp: payload?.timestamp ?? row.created_at,
    scores: {
      overallScore: row.overall_score,
      grade: row.grade as CompleteAuditResult["scores"]["grade"],
      pillarOwaspScore: row.pillar_owasp_score,
      pillarTrackingScore: row.pillar_tracking_score,
      pillarLegalScore: row.pillar_legal_score,
    },
    telemetry: {
      targetUrl: row.target_url,
      domain: row.domain,
      scanTimestamp: payload?.timestamp ?? row.created_at,
      tlsVersion: sealedTelemetry?.tlsVersion ?? "(summary record - full payload not stored)",
      tlsProtocol: sealedTelemetry?.tlsProtocol ?? null,
      hasHsts: Boolean(sealedTelemetry?.hasHsts),
      httpStatus: Number(sealedTelemetry?.httpStatus) || 0,
      cookies: (sealedTelemetry?.cookies ?? []).map((c) => ({
        name: c.name,
        valuePreview: REDACTED_COOKIE_PREVIEW,
        domain: c.domain,
        secure: Boolean(c.secure),
        httpOnly: Boolean(c.httpOnly),
        sameSite: c.sameSite,
        ttlDays: c.ttlDays ?? null,
        source: c.source as RawCookieFinding["source"],
        category: (c.category ?? undefined) as RawCookieFinding["category"],
        description: c.description ?? undefined,
        owaspIssues: c.owaspIssues ?? [],
      })),
      trackers: sealedTelemetry?.trackers ?? [],
      securityHeaders: sealedTelemetry?.securityHeaders ?? undefined,
      consentFrameworkDetected: sealedTelemetry?.consentFrameworkDetected ?? undefined,
      privacyUrl: sealedTelemetry?.privacyUrl ?? row.privacy_url,
      privacyPolicyMarkdown: "",
      bannerHtmlSnippet: sealedTelemetry?.bannerHtmlSnippet ?? "",
    },
    aiAudit: row.ai_audit_json as CompleteAuditResult["aiAudit"],
    sha256Hash: row.sha256_hash,
    executionTimeMs: 0,
    signatureHmac: row.signature_hmac ?? undefined,
    auditPayload: payload ?? undefined,
    partialTelemetry: !payload,
    persisted: true,
  };

  return result;
}

/**
 * Retrieves a scan by its UUID, integrity-checked when a payload exists.
 */
export async function getScanById(id: string): Promise<CompleteAuditResult | null> {
  const cached = memoryScans.get(id);
  if (cached) return cached;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("scans").select("*").eq("id", id).single();
      if (!error && data) {
        const result = hydrateFromRow(data);
        result.integrityVerdict = verifyAuditSeal(result).verdict;
        memoryScans.set(result.id, result);
        if (result.sha256Hash) {
          hashToScanId.set(result.sha256Hash, result.id);
          hashToScanId.set(hashPrefixKey(result.sha256Hash), result.id);
        }
        return result;
      }
    } catch {}
  }

  return null;
}

/**
 * Retrieves a scan by its full or 16-char SHA-256 hash.
 */
export async function getScanByHash(hash: string): Promise<CompleteAuditResult | null> {
  const normalized = hash.toLowerCase();
  const candidates = [hash, normalized, hashPrefixKey(normalized)];
  for (const candidateKey of candidates) {
    const scanId = hashToScanId.get(candidateKey);
    if (!scanId) continue;
    const cached = memoryScans.get(scanId);
    if (cached) return cached;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .ilike("sha256_hash", `${normalized}%`)
        .limit(1);
      const row = Array.isArray(data) ? data[0] : data;
      if (!error && row) {
        const result = hydrateFromRow(row);
        result.integrityVerdict = verifyAuditSeal(result).verdict;
        memoryScans.set(result.id, result);
        hashToScanId.set(result.sha256Hash, result.id);
        hashToScanId.set(hashPrefixKey(result.sha256Hash), result.id);
        return result;
      }
    } catch {}
  }

  return null;
}

/**
 * Lists recent scans from the bounded in-memory cache.
 */
export async function getRecentScans(): Promise<CompleteAuditResult[]> {
  return memoryScansCacheValues().slice(-10).reverse();
}

function memoryScansCacheValues(): CompleteAuditResult[] {
  const values: CompleteAuditResult[] = [];
  for (const [, entry] of memoryScans.entries()) {
    values.push(entry.value);
  }
  return values;
}

/** Diagnostics for /api/health */
export function getScanCacheStats(): { memoryCacheSize: number; hashIndexSize: number } {
  return { memoryCacheSize: memoryScans.size, hashIndexSize: hashToScanId.size };
}
