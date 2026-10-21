import { CompleteAuditResult, RawCookieFinding, TrackerFinding } from "@/lib/types/audit";

export interface DriftReport {
  domain: string;
  hasRegression: boolean;
  scoreChange: number;
  gradeChange: {
    previous: string;
    current: string;
  };
  newCookies: RawCookieFinding[];
  removedCookies: string[];
  newTrackers: TrackerFinding[];
  newOwaspIssues: Array<{
    cookieName: string;
    issue: string;
  }>;
  summary: string;
}

/**
 * Compares a baseline scan against the latest scan to detect compliance & security drift
 */
export function detectComplianceDrift(
  baselineScan: CompleteAuditResult,
  currentScan: CompleteAuditResult
): DriftReport {
  const previousCookieNames = new Set(baselineScan.telemetry.cookies.map((c) => c.name));
  const currentCookieNames = new Set(currentScan.telemetry.cookies.map((c) => c.name));

  // 1. Identify newly added cookies
  const newCookies = currentScan.telemetry.cookies.filter((c) => !previousCookieNames.has(c.name));

  // 2. Identify removed cookies
  const removedCookies = baselineScan.telemetry.cookies
    .filter((c) => !currentCookieNames.has(c.name))
    .map((c) => c.name);

  // 3. Identify newly introduced third-party trackers
  const previousTrackerDomains = new Set(baselineScan.telemetry.trackers.map((t) => t.domain));
  const newTrackers = currentScan.telemetry.trackers.filter(
    (t) => !previousTrackerDomains.has(t.domain)
  );

  // 4. Identify new OWASP security vulnerabilities on existing cookies
  const baselineIssuesMap = new Map<string, Set<string>>();
  for (const c of baselineScan.telemetry.cookies) {
    baselineIssuesMap.set(c.name, new Set(c.owaspIssues));
  }

  const newOwaspIssues: Array<{ cookieName: string; issue: string }> = [];
  for (const c of currentScan.telemetry.cookies) {
    const prevIssues = baselineIssuesMap.get(c.name) || new Set();
    for (const issue of c.owaspIssues) {
      if (!prevIssues.has(issue)) {
        newOwaspIssues.push({ cookieName: c.name, issue });
      }
    }
  }

  // 5. Score changes
  const scoreChange = currentScan.scores.overallScore - baselineScan.scores.overallScore;
  const hasRegression =
    scoreChange < 0 ||
    newTrackers.length > 0 ||
    newCookies.some((c) => c.category === "Marketing") ||
    newOwaspIssues.length > 0;

  // Build Human-readable summary
  let summary = `Drift scan completed for ${currentScan.domain}. `;
  if (!hasRegression) {
    summary += "No privacy regressions or newly injected tracking beacons detected.";
  } else {
    const reasons: string[] = [];
    if (newTrackers.length > 0) {
      reasons.push(`${newTrackers.length} new pre-consent tracker(s) detected (${newTrackers.map((t) => t.domain).join(", ")})`);
    }
    if (newOwaspIssues.length > 0) {
      reasons.push(`${newOwaspIssues.length} new OWASP session security vulnerability flagged`);
    }
    if (scoreChange < 0) {
      reasons.push(`Overall compliance score dropped by ${Math.abs(scoreChange)} pts (${baselineScan.scores.grade} -> ${currentScan.scores.grade})`);
    }
    summary += `ALERT: Compliance regression detected: ${reasons.join("; ")}.`;
  }

  return {
    domain: currentScan.domain,
    hasRegression,
    scoreChange,
    gradeChange: {
      previous: baselineScan.scores.grade,
      current: currentScan.scores.grade,
    },
    newCookies,
    removedCookies,
    newTrackers,
    newOwaspIssues,
    summary,
  };
}

/**
 * Formats a drift report into a Slack Incoming Webhook blocks payload
 */
export function formatSlackDriftNotification(report: DriftReport, scanUrl: string) {
  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: report.hasRegression
            ? `🚨 [CookieAudit AI] Compliance Drift Detected: ${report.domain}`
            : `✅ [CookieAudit AI] Weekly Drift Check Clean: ${report.domain}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Domain*: <${scanUrl}|${report.domain}>\n*Status*: ${
            report.hasRegression ? "*REGRESSION DETECTED*" : "*COMPLIANT*"
          }\n*Score*: ${report.gradeChange.current} (${report.scoreChange >= 0 ? "+" : ""}${
            report.scoreChange
          } pts)`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `>${report.summary}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Full Audit Report",
            },
            url: scanUrl,
            style: report.hasRegression ? "danger" : "primary",
          },
        ],
      },
    ],
  };
}
