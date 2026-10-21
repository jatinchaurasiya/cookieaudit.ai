"use client";

import { useState } from "react";
import { RawCookieFinding, CookieCategory } from "@/lib/types/audit";
import { Search, ShieldAlert, ShieldCheck, Filter, AlertTriangle } from "lucide-react";

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
    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>OWASP ASVS Cookie Security Matrix</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-sky-400 border border-slate-700">
              {cookies.length} Discovered
            </span>
            {insecureCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-950/80 text-rose-300 border border-rose-800">
                {insecureCount} Insecure
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Audited for HttpOnly (XSS), Secure flags (MITM), SameSite (CSRF), and RFC 6265bis TTL
            limits.
          </p>
        </div>

        {/* Search & Insecure filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter cookie name..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/80"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterInsecureOnly(!filterInsecureOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filterInsecureOnly
                ? "bg-rose-900/30 border-rose-700 text-rose-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Insecure Only
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
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
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === cat
                ? "bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20"
                : "bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 font-mono border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Cookie Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Secure</th>
              <th className="py-3 px-4">HttpOnly</th>
              <th className="py-3 px-4">SameSite</th>
              <th className="py-3 px-4">TTL</th>
              <th className="py-3 px-4">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No cookies match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((cookie, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    cookie.owaspIssues.length > 0 ? "bg-rose-950/10" : ""
                  }`}
                >
                  {/* Name + Issues */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-medium text-slate-200">
                      {cookie.name}
                    </div>
                    {cookie.description && (
                      <div className="text-[11px] text-slate-400 max-w-xs truncate">
                        {cookie.description}
                      </div>
                    )}
                    {cookie.owaspIssues.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {cookie.owaspIssues.map((iss, i) => (
                          <div
                            key={i}
                            className="text-[10px] text-rose-400 font-mono flex items-center gap-1"
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
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                        cookie.category === "Strictly Necessary"
                          ? "bg-slate-800 text-slate-300"
                          : cookie.category === "Marketing"
                          ? "bg-rose-950 text-rose-400 border border-rose-800/60"
                          : cookie.category === "Analytics"
                          ? "bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                          : "bg-slate-800/80 text-slate-400"
                      }`}
                    >
                      {cookie.category || "Unclassified"}
                    </span>
                  </td>

                  {/* Secure */}
                  <td className="py-3 px-4">
                    {cookie.secure ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-mono font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" /> Insecure
                      </span>
                    )}
                  </td>

                  {/* HttpOnly */}
                  <td className="py-3 px-4">
                    {cookie.httpOnly ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-mono">
                        <ShieldAlert className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>

                  {/* SameSite */}
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {cookie.sameSite}
                  </td>

                  {/* TTL */}
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {cookie.ttlDays ? (
                      <span className={cookie.ttlDays > 400 ? "text-rose-400 font-bold" : ""}>
                        {cookie.ttlDays}d
                      </span>
                    ) : (
                      <span className="text-slate-500">Session</span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
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
