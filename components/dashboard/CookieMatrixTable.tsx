"use client";

import { useState } from "react";
import { RawCookieFinding } from "@/lib/types/audit";
import { Search, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

interface CookieMatrixTableProps {
  cookies: RawCookieFinding[];
}

export function CookieMatrixTable({ cookies }: CookieMatrixTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [filterInsecureOnly, setFilterInsecureOnly] = useState<boolean>(false);

  const filtered = cookies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.domain.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "ALL" || c.category === selectedCategory;

    const matchesInsecure = !filterInsecureOnly || c.owaspIssues.length > 0;

    return matchesSearch && matchesCategory && matchesInsecure;
  });

  const insecureCount = cookies.filter((c) => c.owaspIssues.length > 0).length;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] shadow-xl overflow-hidden backdrop-blur-md">
      {/* Workbench Header */}
      <div className="p-5 sm:p-6 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-sky-400 uppercase tracking-wider">
              OWASP_ASVS // SESSION_SECURITY_MATRIX
            </span>
            <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-slate-800 text-slate-300 border border-white/[0.08]">
              {cookies.length} Discovered
            </span>
            {insecureCount > 0 && (
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">
                {insecureCount} Flagged
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-100 tracking-tight">
            Session Cookie Security &amp; Attribute Verification
          </h3>
          <p className="text-xs text-slate-400">
            Audited for HttpOnly (XSS), Secure flags (TLS), SameSite (CSRF), and RFC 6265bis 400-day TTL limits.
          </p>
        </div>

        {/* Search & Insecure filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/80 transition-colors duration-150 w-44 sm:w-52"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterInsecureOnly(!filterInsecureOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors duration-150 flex items-center gap-1.5 ${
              filterInsecureOnly
                ? "bg-rose-950/80 border-rose-700 text-rose-300 font-semibold"
                : "bg-slate-950 border-white/[0.08] text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Flagged Only</span>
          </button>
        </div>
      </div>

      {/* Segmented Category Filter Strip */}
      <div className="px-5 py-2.5 bg-slate-950/60 border-b border-white/[0.06] flex flex-wrap items-center gap-1.5">
        {[
          "ALL",
          "Strictly Necessary",
          "Functional",
          "Analytics",
          "Marketing",
          "Unclassified",
        ].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors duration-150 ${
              selectedCategory === cat
                ? "bg-white/[0.1] text-white border border-white/[0.2] font-semibold"
                : "bg-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Precision Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/90 text-slate-400 font-mono text-[10px] tracking-wider uppercase border-b border-white/[0.06]">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Cookie Identifier</th>
              <th className="py-2.5 px-4 font-semibold">Category</th>
              <th className="py-2.5 px-4 font-semibold">Secure</th>
              <th className="py-2.5 px-4 font-semibold">HttpOnly</th>
              <th className="py-2.5 px-4 font-semibold">SameSite</th>
              <th className="py-2.5 px-4 font-semibold">TTL</th>
              <th className="py-2.5 px-4 font-semibold">Origin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                  No cookies match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((cookie, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-white/[0.02] transition-colors duration-150 ${
                    cookie.owaspIssues.length > 0 ? "bg-rose-950/[0.08]" : ""
                  }`}
                >
                  {/* Name + Diagnostic issues */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">
                      {cookie.name}
                    </div>
                    {cookie.description && (
                      <div className="text-[11px] text-slate-400 font-sans max-w-xs truncate mt-0.5">
                        {cookie.description}
                      </div>
                    )}
                    {cookie.owaspIssues.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {cookie.owaspIssues.map((iss, i) => (
                          <div
                            key={i}
                            className="text-[10px] text-rose-400 flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3 h-3 shrink-0" />
                            <span>{iss}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        cookie.category === "Strictly Necessary"
                          ? "bg-slate-800 text-slate-300"
                          : cookie.category === "Marketing"
                          ? "bg-rose-950 text-rose-300 border border-rose-800/40"
                          : cookie.category === "Analytics"
                          ? "bg-indigo-950 text-indigo-300 border border-indigo-800/40"
                          : "bg-slate-800/80 text-slate-400"
                      }`}
                    >
                      {cookie.category || "Unclassified"}
                    </span>
                  </td>

                  {/* Secure */}
                  <td className="py-3 px-4">
                    {cookie.secure ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 text-[11px] font-bold">
                        <ShieldAlert className="w-3.5 h-3.5" /> Insecure
                      </span>
                    )}
                  </td>

                  {/* HttpOnly */}
                  <td className="py-3 px-4">
                    {cookie.httpOnly ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>

                  {/* SameSite */}
                  <td className="py-3 px-4 text-slate-300 text-[11px]">
                    {cookie.sameSite}
                  </td>

                  {/* TTL */}
                  <td className="py-3 px-4 text-[11px]">
                    {cookie.ttlDays ? (
                      <span className={cookie.ttlDays > 400 ? "text-rose-400 font-bold" : "text-slate-300"}>
                        {cookie.ttlDays}d
                      </span>
                    ) : (
                      <span className="text-slate-500">Session</span>
                    )}
                  </td>

                  {/* Origin */}
                  <td className="py-3 px-4 text-slate-400 text-[10px]">
                    {cookie.source === "HTTP_HEADER" ? "HTTP Header" : "JS Runtime"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
