import { Smartphone } from "lucide-react";
import { Panel } from "../components/dashboard/Panel";
import { statusClasses } from "../components/dashboard/constants";
import { pollingIntervalMs, useApiResource } from "../hooks/useApiResource";
import { getDashboardMetrics } from "../services/api";

export function Mobile() {
  const { data, isLoading } = useApiResource(getDashboardMetrics, { pollingMs: pollingIntervalMs });

  return (
    <div className={`mx-auto max-w-md pt-7 ${isLoading ? "animate-pulse opacity-60" : ""}`}>
      <Panel className="p-5">
        <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-white">Mobile Monitor</h2><p className="text-sm text-slate-400">Compact live security view</p></div><Smartphone className="text-cyan-200" /></div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.03] p-4"><p className="text-3xl font-semibold text-white">{data?.summary.totalScans ?? 0}</p><p className="text-xs text-slate-400">Total</p></div>
          <div className="rounded-2xl bg-rose-400/10 p-4"><p className="text-3xl font-semibold text-rose-200">{data?.summary.avgRiskScore ?? 0}%</p><p className="text-xs text-slate-400">Risk</p></div>
        </div>
      </Panel>
      <Panel className="mt-5 p-5">
        <h2 className="text-lg font-semibold text-white">Alerts</h2>
        <div className="mt-4 space-y-3">
          {(data?.recentThreats ?? []).length === 0 ? <p className="text-sm text-slate-400">No recent scans.</p> : data?.recentThreats.slice(0, 6).map((item) => (
            <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-3" key={item.id ?? item.url}>
              <p className="truncate text-sm font-medium text-slate-100">{item.url}</p>
              <div className="mt-2 flex items-center justify-between"><span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClasses[item.status]}`}>{item.status}</span><span className="text-xs text-slate-400">{item.risk}%</span></div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
