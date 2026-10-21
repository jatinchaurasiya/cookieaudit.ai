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
    <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Apple-styled Card Header */}
      <div className="p-6 sm:p-7 border-b border-black/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#0066cc]">
              SESSION SECURITY MATRIX
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-black/[0.05] text-[#1d1d1f] border border-black/[0.06] font-medium">
              {cookies.length} Discovered
            </span>
            {insecureCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#ff3b30]/10 text-[#d70015] border border-[#ff3b30]/25 font-semibold">
                {insecureCount} Flagged
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
            Discovered Cookies &amp; OWASP Attributes
          </h3>
          <p className="text-xs text-[#86868b] font-normal">
            Audited for HttpOnly (XSS), Secure flags (TLS), SameSite (CSRF), and RFC 6265bis 400-day TTL limits.
          </p>
        </div>

        {/* Search & Insecure filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name..."
              className="pl-9 pr-3.5 py-1.5 rounded-full bg-[#f5f5f7] border border-black/[0.08] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:bg-white transition-all duration-200 w-44 sm:w-52"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterInsecureOnly(!filterInsecureOnly)}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-colors duration-200 flex items-center gap-1.5 ${
              filterInsecureOnly
                ? "bg-[#ff3b30]/15 border border-[#ff3b30]/30 text-[#d70015] font-semibold"
                : "bg-black/[0.04] border border-black/[0.08] text-[#1d1d1f] hover:bg-black/[0.08]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#ff3b30]" />
            <span>Flagged Only</span>
          </button>
        </div>
      </div>

      {/* Apple-styled Segmented Filter Pill Strip */}
      <div className="px-6 py-3 bg-[#f5f5f7] border-b border-black/[0.06] flex flex-wrap items-center gap-2">
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
            className={`px-3 py-1 rounded-full text-xs transition-colors duration-200 ${
              selectedCategory === cat
                ? "bg-[#0071e3] text-white font-medium shadow-sm"
                : "bg-transparent text-[#1d1d1f] hover:bg-black/[0.05]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Precision Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#f5f5f7] text-[#86868b] text-[11px] font-semibold border-b border-black/[0.06]">
            <tr>
              <th className="py-3 px-5">Cookie Identifier</th>
              <th className="py-3 px-5">Category</th>
              <th className="py-3 px-5">Secure</th>
              <th className="py-3 px-5">HttpOnly</th>
              <th className="py-3 px-5">SameSite</th>
              <th className="py-3 px-5">Lifespan</th>
              <th className="py-3 px-5">Origin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#86868b] text-xs">
                  No cookies match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((cookie, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-black/[0.02] transition-colors duration-150 ${
                    cookie.owaspIssues.length > 0 ? "bg-[#ff3b30]/[0.03]" : ""
                  }`}
                >
                  {/* Name + Issues */}
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-[#1d1d1f]">
                      {cookie.name}
                    </div>
                    {cookie.description && (
                      <div className="text-[11px] text-[#86868b] max-w-xs truncate mt-0.5">
                        {cookie.description}
                      </div>
                    )}
                    {cookie.owaspIssues.length > 0 && (
                      <div className="mt-1 space-y-0.5 font-mono">
                        {cookie.owaspIssues.map((iss, i) => (
                          <div
                            key={i}
                            className="text-[10px] text-[#d70015] flex items-center gap-1 font-semibold"
                          >
                            <ShieldAlert className="w-3 h-3 shrink-0" />
                            <span>{iss}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        cookie.category === "Strictly Necessary"
                          ? "bg-black/[0.05] text-[#1d1d1f]"
                          : cookie.category === "Marketing"
                          ? "bg-[#ff3b30]/10 text-[#d70015] border border-[#ff3b30]/20"
                          : cookie.category === "Analytics"
                          ? "bg-[#0071e3]/10 text-[#0066cc] border border-[#0071e3]/20"
                          : "bg-black/[0.04] text-[#86868b]"
                      }`}
                    >
                      {cookie.category || "Unclassified"}
                    </span>
                  </td>

                  {/* Secure */}
                  <td className="py-3.5 px-5">
                    {cookie.secure ? (
                      <span className="text-[#248a3d] flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-[#d70015] flex items-center gap-1 font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" /> Insecure
                      </span>
                    )}
                  </td>

                  {/* HttpOnly */}
                  <td className="py-3.5 px-5">
                    {cookie.httpOnly ? (
                      <span className="text-[#248a3d] flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-[#c93400] flex items-center gap-1 font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>

                  {/* SameSite */}
                  <td className="py-3.5 px-5 font-mono text-xs text-[#1d1d1f]">
                    {cookie.sameSite}
                  </td>

                  {/* TTL */}
                  <td className="py-3.5 px-5 font-mono text-xs">
                    {cookie.ttlDays ? (
                      <span className={cookie.ttlDays > 400 ? "text-[#d70015] font-bold" : "text-[#1d1d1f]"}>
                        {cookie.ttlDays}d
                      </span>
                    ) : (
                      <span className="text-[#86868b]">Session</span>
                    )}
                  </td>

                  {/* Origin */}
                  <td className="py-3.5 px-5 text-[#86868b] text-[11px]">
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
