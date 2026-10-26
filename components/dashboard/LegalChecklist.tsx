"use client";

import { ComplianceAuditOutput } from "@/lib/types/audit";
import { CheckCircle2, XCircle, Quote, Scale } from "lucide-react";

interface LegalChecklistProps {
  checklist: ComplianceAuditOutput["dpdpAndGdprChecklist"];
}

export function LegalChecklist({ checklist }: LegalChecklistProps) {
  const items = [
    {
      title: "Itemized Personal Data Notice (DPDP Rule 3)",
      rule: "DPDP Act 2023 Sec 5(1)(a) & DPDP Rules 2025 Rule 3(1)(a)",
      check: checklist.itemizedDataCollected,
    },
    {
      title: "Specific Purpose Mapping & Purpose Limitation",
      rule: "DPDP Act 2023 Sec 5(1)(b) & GDPR Article 13(1)(c)",
      check: checklist.specificPurposeMapping,
    },
    {
      title: "Grievance Redressal Officer / DPO Contact Details",
      rule: "Mandatory under DPDP Act 2023 Section 5(1)(d)",
      check: checklist.grievanceOfficerDetails,
    },
    {
      title: "Equal-Ease Consent Withdrawal Mechanism",
      rule: "DPDP Act 2023 Sec 6(4) & GDPR Article 7(3)",
      check: checklist.equalEaseConsentWithdrawal,
    },
    {
      title: "Right to Complain to Data Protection Board of India (DPBI)",
      rule: "DPDP Rules 2025 Rule 3(1)(e) & Sec 5(1)(e)",
      check: checklist.dataProtectionBoardRight,
    },
    {
      title: "Data Retention & Periodic Erasure Schedule",
      rule: "DPDP Act 2023 Section 8(7) & GDPR Article 13(2)(a)",
      check: checklist.dataRetentionSchedule,
    },
  ];

  return (
    <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#34c759]/15 border border-[#34c759]/30 flex items-center justify-center text-[#248a3d] shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight">
              India DPDP Act 2023 &amp; GDPR Statutory Checklist
            </h3>
            <p className="text-xs text-[#86868b]">
              Automated statutory compliance audit with verbatim policy documentation evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/[0.05] text-[#1d1d1f] border border-black/[0.06]">
            6 Statutory Mandates
          </span>
        </div>
      </div>

      {/* Grid of Mandate Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {items.map((item, idx) => {
          const isPassed = item.check.passed;
          const evidence =
            "evidenceQuote" in item.check
              ? String((item.check as { evidenceQuote?: string }).evidenceQuote ?? "")
              : "";

          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-colors duration-200 flex flex-col justify-between ${
                isPassed
                  ? "bg-[#f5f5f7] border-black/[0.06] hover:border-black/[0.12]"
                  : "bg-[#ff3b30]/[0.05] border-[#ff3b30]/20"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <h4 className="text-xs font-semibold text-[#1d1d1f]">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-[#86868b] block mt-0.5">
                      {item.rule}
                    </span>
                  </div>
                  {isPassed ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#34c759]/15 text-[#248a3d] border border-[#34c759]/30 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ff3b30]/15 text-[#d70015] border border-[#ff3b30]/30 flex items-center gap-1 shrink-0">
                      <XCircle className="w-3 h-3" /> FAILED
                    </span>
                  )}
                </div>

                {/* Finding */}
                <p className="text-xs text-[#6e6e73] leading-relaxed mb-3">
                  {item.check.finding}
                </p>
              </div>

              {/* Verbatim Quote Evidence if present */}
              {evidence && evidence !== "Not found in policy" && (
                <div className="p-3 rounded-xl bg-white border border-black/[0.08] text-xs text-[#1d1d1f] flex items-start gap-2 shadow-sm">
                  <Quote className="w-3.5 h-3.5 text-[#0066cc] shrink-0 mt-0.5" />
                  <span className="italic line-clamp-2">&ldquo;{evidence}&rdquo;</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
