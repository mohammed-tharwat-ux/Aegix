import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Panel } from "../components/dashboard/Panel";
import { statusClasses } from "../components/dashboard/constants";
import { pollingIntervalMs, useApiResource } from "../hooks/useApiResource";
import { getLogs } from "../services/api";

const statuses = ["all", "Dangerous", "Suspicious", "Safe"];
const categories = ["all", "Fake Login", "Suspicious Domain", "Phishing", "Urgency Language"];
const riskLevels = ["all", "high", "medium", "low"];

export function Logs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const page = Number(searchParams.get("page") ?? 1);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const riskLevel = searchParams.get("riskLevel") ?? "all";
  const date = searchParams.get("date") ?? "";

  const params = useMemo(
    () => ({ page, pageSize: 10, q, status, category, riskLevel, date, sortBy, sortOrder }),
    [category, date, page, q, riskLevel, sortBy, sortOrder, status],
  );
  const { data, isLoading, error } = useApiResource(() => getLogs(params), { pollingMs: pollingIntervalMs });
  const totalPages = Math.max(Math.ceil((data?.total ?? 0) / 10), 1);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  function toggleSort(key: string) {
    if (sortBy === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortBy(key);
      setSortOrder("desc");
    }
  }

  return (
    <div className="pt-7">
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Scan Logs</h2>
            <p className="mt-1 text-sm text-slate-400">Search, sort, and filter all captured scan activity.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input className="h-11 w-full rounded-2xl border border-cyan-200/10 bg-white/[0.04] pl-9 pr-3 text-sm outline-none focus:border-cyan-300/30" onChange={(event) => updateParam("q", event.target.value)} placeholder="Search logs" value={q} />
            </label>
            <select className="h-11 rounded-2xl border border-cyan-200/10 bg-[#0b1322] px-3 text-sm" onChange={(event) => updateParam("status", event.target.value)} value={status}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
            <select className="h-11 rounded-2xl border border-cyan-200/10 bg-[#0b1322] px-3 text-sm" onChange={(event) => updateParam("category", event.target.value)} value={category}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
            <select className="h-11 rounded-2xl border border-cyan-200/10 bg-[#0b1322] px-3 text-sm" onChange={(event) => updateParam("riskLevel", event.target.value)} value={riskLevel}>{riskLevels.map((item) => <option key={item}>{item}</option>)}</select>
            <input className="h-11 rounded-2xl border border-cyan-200/10 bg-[#0b1322] px-3 text-sm" onChange={(event) => updateParam("date", event.target.value)} type="date" value={date} />
          </div>
        </div>
      </Panel>

      {error && <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>}

      <Panel className={`mt-5 overflow-hidden ${isLoading ? "animate-pulse opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse">
            <thead className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>{["url", "risk", "category", "status", "createdAt"].map((key) => <th className="px-6 py-4 font-semibold" key={key}><button onClick={() => toggleSort(key)} type="button">{key === "createdAt" ? "Created At" : key}</button></th>)}</tr>
            </thead>
            <tbody>
              {(data?.items.length ?? 0) === 0 ? (
                <tr><td className="px-6 py-12 text-center text-sm text-slate-400" colSpan={5}>No logs match the current filters.</td></tr>
              ) : data?.items.map((item) => (
                <tr className="border-t border-cyan-200/8 text-sm hover:bg-white/[0.025]" key={item.id ?? item.url}>
                  <td className="max-w-[320px] truncate px-6 py-4 font-medium text-slate-200">{item.url}</td>
                  <td className="px-6 py-4 text-rose-200">{item.risk}%</td>
                  <td className="px-6 py-4 text-slate-400">{item.category}</td>
                  <td className="px-6 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[item.status]}`}>{item.status}</span></td>
                  <td className="px-6 py-4 text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-cyan-200/10 px-5 py-4 text-sm text-slate-400">
          <span>{data?.total ?? 0} records</span>
          <div className="flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-200/10 disabled:opacity-40" disabled={page <= 1} onClick={() => updateParam("page", String(page - 1))} type="button"><ChevronLeft size={16} /></button>
            <span>Page {page} of {totalPages}</span>
            <button className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-200/10 disabled:opacity-40" disabled={page >= totalPages} onClick={() => updateParam("page", String(page + 1))} type="button"><ChevronRight size={16} /></button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
