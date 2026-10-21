import { CompleteAuditResult } from "@/lib/types/audit";
import { BENCHMARK_AUDITS } from "./benchmark-audits";

// Global in-memory cache preserved across API requests in Node runtime
const memoryScans = new Map<string, CompleteAuditResult>();
const hashToScanId = new Map<string, string>();

// Pre-seed benchmark audits
for (const b of BENCHMARK_AUDITS) {
  memoryScans.set(b.id, b);
  hashToScanId.set(b.sha256Hash, b.id);
  hashToScanId.set(b.sha256Hash.slice(0, 16), b.id);
}

/**
 * Stores a scan result in memory
 */
export async function saveScanResult(scan: CompleteAuditResult): Promise<void> {
  memoryScans.set(scan.id, scan);
  hashToScanId.set(scan.sha256Hash, scan.id);
  hashToScanId.set(scan.sha256Hash.slice(0, 16), scan.id);
}

/**
 * Retrieves a scan by its ID
 */
export async function getScanById(id: string): Promise<CompleteAuditResult | null> {
  return memoryScans.get(id) || null;
}

/**
 * Retrieves a scan by its full or 16-char SHA-256 hash
 */
export async function getScanByHash(hash: string): Promise<CompleteAuditResult | null> {
  const scanId = hashToScanId.get(hash) || hashToScanId.get(hash.toLowerCase());
  if (scanId) {
    return memoryScans.get(scanId) || null;
  }
  return null;
}

/**
 * Lists recent scans (latest 10)
 */
export async function getRecentScans(): Promise<CompleteAuditResult[]> {
  return Array.from(memoryScans.values()).slice(-10).reverse();
}
