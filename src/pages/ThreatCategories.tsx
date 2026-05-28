import { ShieldAlert } from "lucide-react";
import { Panel } from "../components/dashboard/Panel";
import { pollingIntervalMs, useApiResource } from "../hooks/useApiResource";
import { getThreatCategories } from "../services/api";

const severityClass = {
  Low: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20",
  Medium: "text-amber-100 bg-amber-400/10 border-amber-300/20",
  High: "text-rose-200 bg-rose-400/10 border-rose-300/20",
};

export function ThreatCategories() {
  const { data, isLoading, error } = useApiResource(getThreatCategories, { pollingMs: pollingIntervalMs });

  return (
    <div className={`pt-7 ${isLoading ? "animate-pulse opacity-60" : ""}`}>
      {error && <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>}
      <div className="grid gap-5 md:grid-cols-2">
        {(data ?? []).map((category) => (
          <Panel className="p-6" key={category.name}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-100"><ShieldAlert size={22} /></div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{category.name}</h2>
                  <p className="text-sm text-slate-400">{category.percentage}% of scan history</p>
                </div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClass[category.severity]}`}>{category.severity}</span>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">{category.count}</p>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-700/40"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.max(category.percentage, 4)}%` }} /></div>
            </div>
            <div className="mt-5 space-y-3">
              {category.recentItems.length === 0 ? <p className="rounded-2xl border border-cyan-200/10 bg-white/[0.025] p-4 text-sm text-slate-400">No recent items.</p> : category.recentItems.map((item) => (
                <div className="rounded-2xl border border-cyan-200/8 bg-white/[0.025] p-3" key={item.id ?? item.url}>
                  <p className="truncate text-sm font-medium text-slate-200">{item.url}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.status} · {item.risk}% risk</p>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
