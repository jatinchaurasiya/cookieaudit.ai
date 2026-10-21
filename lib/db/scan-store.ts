import { CompleteAuditResult } from "@/lib/types/audit";
import { supabase, isSupabaseConfigured } from "./supabase-client";

const globalForScans = globalThis as unknown as {
  memoryScans?: Map<string, CompleteAuditResult>;
  hashToScanId?: Map<string, string>;
};

const memoryScans = globalForScans.memoryScans ?? new Map<string, CompleteAuditResult>();
const hashToScanId = globalForScans.hashToScanId ?? new Map<string, string>();

globalForScans.memoryScans = memoryScans;
globalForScans.hashToScanId = hashToScanId;


/**
 * Stores an authentic scan result in persistent storage (Supabase + memory cache)
 */
export async function saveScanResult(scan: CompleteAuditResult): Promise<void> {
  memoryScans.set(scan.id, scan);
  hashToScanId.set(scan.sha256Hash, scan.id);
  hashToScanId.set(scan.sha256Hash.slice(0, 16), scan.id);

  // If Supabase is configured in production, persist to PostgreSQL
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("scans").insert({
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
        pre_consent_trackers: scan.telemetry.trackers.length,
        privacy_url: scan.telemetry.privacyUrl,
        sha256_hash: scan.sha256Hash,
        ai_audit_json: scan.aiAudit,
        is_public: true,
      });

      // Insert discovered cookies
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
        await supabase.from("scan_cookies").insert(cookieRows);
      }
    } catch (err: any) {
      console.warn("Supabase persistence note:", err.message);
    }
  }
}

/**
 * Retrieves a scan by its UUID
 */
export async function getScanById(id: string): Promise<CompleteAuditResult | null> {
  const cached = memoryScans.get(id);
  if (cached) return cached;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from("scans").select("*").eq("id", id).single();
      if (data) {
        // Hydrate from PostgreSQL
        const result: CompleteAuditResult = {
          id: data.id,
          targetUrl: data.target_url,
          domain: data.domain,
          timestamp: data.created_at,
          scores: {
            overallScore: data.overall_score,
            grade: data.grade,
            pillarOwaspScore: data.pillar_owasp_score,
            pillarTrackingScore: data.pillar_tracking_score,
            pillarLegalScore: data.pillar_legal_score,
          },
          telemetry: {
            targetUrl: data.target_url,
            domain: data.domain,
            scanTimestamp: data.created_at,
            tlsVersion: "TLS 1.3 / HTTPS",
            hasHsts: true,
            httpStatus: 200,
            cookies: [],
            trackers: [],
            privacyUrl: data.privacy_url,
            privacyPolicyMarkdown: "",
            bannerHtmlSnippet: "",
          },
          aiAudit: data.ai_audit_json,
          sha256Hash: data.sha256_hash,
          executionTimeMs: 0,
        };
        memoryScans.set(result.id, result);
        return result;
      }
    } catch {}
  }

  return null;
}

/**
 * Retrieves a scan by its full or 16-char SHA-256 hash
 */
export async function getScanByHash(hash: string): Promise<CompleteAuditResult | null> {
  const scanId = hashToScanId.get(hash) || hashToScanId.get(hash.toLowerCase());
  if (scanId) {
    return memoryScans.get(scanId) || null;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from("scans")
        .select("*")
        .ilike("sha256_hash", `${hash}%`)
        .single();
      if (data) {
        return getScanById(data.id);
      }
    } catch {}
  }

  return null;
}

/**
 * Lists recent authentic scans
 */
export async function getRecentScans(): Promise<CompleteAuditResult[]> {
  return Array.from(memoryScans.values()).slice(-10).reverse();
}
