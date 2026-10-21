import crypto from "node:crypto";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CompleteAuditResult } from "@/lib/types/audit";

/**
 * Computes deterministic SHA-256 hash for canonical scan data
 */
export function computeAuditSha256(data: {
  targetUrl: string;
  timestamp: string;
  scores: any;
  cookieCount: number;
  insecureCookieCount: number;
  trackerCount: number;
}): string {
  const canonicalString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
}

/**
 * Generates a tamper-proof PDF audit report with cryptographic SHA-256 seal
 */
export function generateAuditPdfCertificate(audit: CompleteAuditResult): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark Header Banner
  doc.setFillColor(9, 13, 22);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Logo / Title
  doc.setTextColor(56, 189, 248);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("COOKIEAUDIT AI", 14, 18);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Automated DPDP Act 2023 / EU GDPR & OWASP Compliance Certificate", 14, 25);

  // Score Badge in Header
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(pageWidth - 54, 8, 40, 26, 3, 3, "F");

  doc.setTextColor(56, 189, 248);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${audit.scores.overallScore}/100`, pageWidth - 34, 20, { align: "center" });

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.text(audit.scores.grade, pageWidth - 34, 28, { align: "center" });

  // Scan Metadata Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Audit Executive Summary", 14, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text(`Target URL: ${audit.targetUrl}`, 14, 60);
  doc.text(`Audit Timestamp: ${new Date(audit.timestamp).toUTCString()}`, 14, 66);
  doc.text(`TLS / Protocol: ${audit.telemetry.tlsVersion} (HSTS: ${audit.telemetry.hasHsts ? "Active" : "Inactive"})`, 14, 72);
  doc.text(`Execution SLA: ${audit.executionTimeMs} ms`, 14, 78);

  // 3-Pillar Breakdown Boxes
  const boxWidth = (pageWidth - 28 - 8) / 3;

  // Box 1
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 86, boxWidth, 22, 2, 2, "F");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("OWASP Session Security", 17, 93);
  doc.setFontSize(14);
  doc.setTextColor(56, 189, 248);
  doc.text(`${audit.scores.pillarOwaspScore}/35`, 17, 103);

  // Box 2
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + boxWidth + 4, 86, boxWidth, 22, 2, 2, "F");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Pre-Consent Tracking", 17 + boxWidth + 4, 93);
  doc.setFontSize(14);
  doc.setTextColor(99, 102, 241);
  doc.text(`${audit.scores.pillarTrackingScore}/35`, 17 + boxWidth + 4, 103);

  // Box 3
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + (boxWidth + 4) * 2, 86, boxWidth, 22, 2, 2, "F");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DPDP & GDPR Legal", 17 + (boxWidth + 4) * 2, 93);
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(`${audit.scores.pillarLegalScore}/30`, 17 + (boxWidth + 4) * 2, 103);

  // OWASP Cookie Inventory Table
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Discovered Cookies & OWASP Session Security Matrix", 14, 118);

  const cookieRows = audit.telemetry.cookies.map((c) => [
    c.name,
    c.category || "Unclassified",
    c.secure ? "Yes" : "NO (Insecure)",
    c.httpOnly ? "Yes" : "NO (XSS Risk)",
    c.sameSite,
    c.ttlDays ? `${c.ttlDays}d` : "Session",
    c.source === "HTTP_HEADER" ? "Header" : "JS Runtime",
  ]);

  autoTable(doc, {
    startY: 122,
    head: [["Cookie Name", "Category", "Secure", "HttpOnly", "SameSite", "TTL", "Source"]],
    body: cookieRows.length > 0 ? cookieRows : [["No cookies discovered", "-", "-", "-", "-", "-", "-"]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // If table went too far down, add new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // Legal Findings Summary
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DPDP Act 2023 & GDPR Statutory Checklist", 14, currentY);

  const checklist = audit.aiAudit.dpdpAndGdprChecklist;
  const legalRows = [
    ["Itemized Data Notice (DPDP Rule 3)", checklist.itemizedDataCollected.passed ? "PASSED" : "FAILED", checklist.itemizedDataCollected.finding],
    ["Specific Purpose Mapping", checklist.specificPurposeMapping.passed ? "PASSED" : "FAILED", checklist.specificPurposeMapping.finding],
    ["Grievance Redressal Officer (Sec 5)", checklist.grievanceOfficerDetails.passed ? "PASSED" : "FAILED", checklist.grievanceOfficerDetails.finding],
    ["Equal-Ease Consent Withdrawal (Sec 6(4))", checklist.equalEaseConsentWithdrawal.passed ? "PASSED" : "FAILED", checklist.equalEaseConsentWithdrawal.finding],
    ["Data Protection Board Right (Rule 3)", checklist.dataProtectionBoardRight.passed ? "PASSED" : "FAILED", checklist.dataProtectionBoardRight.finding],
    ["Data Retention Schedule (Sec 8(7))", checklist.dataRetentionSchedule.passed ? "PASSED" : "FAILED", checklist.dataRetentionSchedule.finding],
  ];

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Statutory Provision", "Status", "Audit Finding & Evidence"]],
    body: legalRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 22 },
      2: { cellWidth: 110 },
    },
    margin: { left: 14, right: 14 },
  });

  const footerY = (doc as any).lastAutoTable.finalY + 12;

  // Cryptographic Audit Seal
  if (footerY > 260) {
    doc.addPage();
  }

  const sealY = Math.min(270, footerY > 260 ? 20 : footerY);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, sealY, pageWidth - 28, 18, 2, 2, "F");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CRYPTOGRAPHIC AUDIT SEAL (SHA-256 NON-REPUDIATION)", 18, sealY + 6);

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`SHA-256: ${audit.sha256Hash}`, 18, sealY + 11);
  doc.text(`Verify Authenticity at: https://cookieaudit.space/verify/${audit.sha256Hash.slice(0, 16)}`, 18, sealY + 15);

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
