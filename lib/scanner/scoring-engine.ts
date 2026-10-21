import {
  RawCookieFinding,
  TrackerFinding,
  ComplianceAuditOutput,
  ScanScores,
  ComplianceGrade,
} from "@/lib/types/audit";

export function calculateScanScores(
  cookies: RawCookieFinding[],
  trackers: TrackerFinding[],
  aiAudit?: ComplianceAuditOutput
): ScanScores {
  // --- PILLAR 1: OWASP Session Security (Max 35 pts) ---
  let pillarOwasp = 35;

  for (const cookie of cookies) {
    if (cookie.owaspIssues.length > 0) {
      for (const issue of cookie.owaspIssues) {
        if (issue.includes("Missing 'Secure'")) pillarOwasp -= 6;
        else if (issue.includes("Missing 'HttpOnly'")) pillarOwasp -= 7;
        else if (issue.includes("SameSite")) pillarOwasp -= 3;
        else if (issue.includes("Excessive lifespan")) pillarOwasp -= 2;
      }
    }
  }
  pillarOwasp = Math.max(0, Math.min(35, pillarOwasp));

  // --- PILLAR 2: Pre-Consent Tracking & Tracker Governance (Max 35 pts) ---
  let pillarTracking = 35;

  // Trackers fired pre-consent
  const preConsentTrackers = trackers.filter((t) => t.firedBeforeConsent);
  for (const tracker of preConsentTrackers) {
    if (tracker.category === "Marketing") pillarTracking -= 10;
    else if (tracker.category === "Analytics") pillarTracking -= 5;
    else if (tracker.category === "Session Replay") pillarTracking -= 7;
    else pillarTracking -= 4;
  }

  // Pre-consent marketing/analytics cookies
  for (const cookie of cookies) {
    if (cookie.category === "Marketing") pillarTracking -= 4;
    else if (cookie.category === "Analytics") pillarTracking -= 2;
  }
  pillarTracking = Math.max(0, Math.min(35, pillarTracking));

  // --- PILLAR 3: DPDP Act & GDPR Regulatory Governance (Max 30 pts) ---
  let pillarLegal = 30;

  if (aiAudit) {
    const list = aiAudit.dpdpAndGdprChecklist;
    if (!list.itemizedDataCollected.passed) pillarLegal -= 5;
    if (!list.specificPurposeMapping.passed) pillarLegal -= 4;
    if (!list.grievanceOfficerDetails.passed) pillarLegal -= 6;
    if (!list.equalEaseConsentWithdrawal.passed) pillarLegal -= 5;
    if (!list.dataProtectionBoardRight.passed) pillarLegal -= 4;
    if (!list.dataRetentionSchedule.passed) pillarLegal -= 3;
    if (!list.unconsentedTrackerDisclosure.passed) pillarLegal -= 3;

    if (aiAudit.bannerAnalysis.darkPatterns.length > 0) {
      pillarLegal -= Math.min(6, aiAudit.bannerAnalysis.darkPatterns.length * 2);
    }
  } else {
    // Default baseline when AI evaluation is pending
    pillarLegal = 20;
  }
  pillarLegal = Math.max(0, Math.min(30, pillarLegal));

  // Overall Score (0 - 100)
  const overallScore = Math.round(pillarOwasp + pillarTracking + pillarLegal);

  // Grade Assignment
  let grade: ComplianceGrade = "Grade F";
  if (overallScore >= 90) grade = "Grade A+";
  else if (overallScore >= 80) grade = "Grade A";
  else if (overallScore >= 65) grade = "Grade B";
  else if (overallScore >= 50) grade = "Grade C";
  else grade = "Grade F";

  return {
    overallScore,
    grade,
    pillarOwaspScore: pillarOwasp,
    pillarTrackingScore: pillarTracking,
    pillarLegalScore: pillarLegal,
  };
}
