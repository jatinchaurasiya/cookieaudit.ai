"use client";

import { ComplianceAuditOutput } from "@/lib/types/audit";
import { CheckCircle2, XCircle, FileText, Quote, Scale } from "lucide-react";

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
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              India DPDP Act 2023 &amp; GDPR Statutory Checklist
            </h3>
            <p className="text-xs text-slate-400">
              Automated legal analysis conducted by MiniMax M3.1 Flash with verbatim policy evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            6 Statutory Mandates
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => {
          const isPassed = item.check.passed;
          const evidence = (item.check as any).evidenceQuote;

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                isPassed
                  ? "bg-slate-950/60 border-slate-800/80"
                  : "bg-rose-950/20 border-rose-900/40"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {item.rule}
                  </span>
                </div>
                {isPassed ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> PASSED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1 shrink-0">
                    <XCircle className="w-3 h-3" /> FAILED
                  </span>
                )}
              </div>

              {/* Finding */}
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {item.check.finding}
              </p>

              {/* Verbatim Quote Evidence if present */}
              {evidence && evidence !== "Not found in policy" && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
                  <Quote className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span className="italic line-clamp-2">"{evidence}"</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
