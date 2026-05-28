import { Cable, Chrome, RadioTower } from "lucide-react";
import { Panel } from "../components/dashboard/Panel";
import { RecentThreatsTable } from "../components/dashboard/RecentThreatsTable";
import { pollingIntervalMs, useApiResource } from "../hooks/useApiResource";
import { getDashboardMetrics, getHealth } from "../services/api";

export function Extension() {
  const metrics = useApiResource(getDashboardMetrics, { pollingMs: pollingIntervalMs });
  const health = useApiResource(getHealth, { pollingMs: pollingIntervalMs });

  return (
    <div className="grid gap-5 pt-7 xl:grid-cols-[0.9fr_1.4fr]">
      <Panel className="p-6">
        <div className="flex items-center gap-3"><Chrome className="text-cyan-200" size={24} /><h2 className="text-lg font-semibold text-white">Extension Integration</h2></div>
        <div className="mt-5 space-y-4 text-sm text-slate-300">
          <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4"><p className="text-slate-400">Connection state</p><p className="mt-1 flex items-center gap-2 font-semibold text-emerald-200"><Cable size={16} /> {(health.data?.api ?? health.data?.status) === "online" || health.data?.status === "ok" ? "Connected" : "Waiting"}</p></div>
          <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4"><p className="text-slate-400">Local hook</p><code className="mt-2 block rounded-xl bg-black/30 p-3 text-xs text-cyan-100">POST /api/scans/record</code></div>
          <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4"><p className="font-semibold text-white">Install diagnostics</p><p className="mt-2 text-slate-400">Point the browser extension to the deployed Aegix API URL and send detection payloads to the scan hook. Successful detections appear in logs and dashboard metrics within the next polling cycle.</p></div>
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel className="p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Latest Detections</h2><RadioTower className="text-cyan-200" size={20} /></div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/[0.03] p-4"><p className="text-2xl font-semibold text-white">{metrics.data?.summary.totalScans ?? 0}</p><p className="text-xs text-slate-400">Scans</p></div>
            <div className="rounded-2xl bg-rose-400/10 p-4"><p className="text-2xl font-semibold text-rose-200">{metrics.data?.summary.dangerousWebsites ?? 0}</p><p className="text-xs text-slate-400">Dangerous</p></div>
            <div className="rounded-2xl bg-emerald-400/10 p-4"><p className="text-2xl font-semibold text-emerald-200">{metrics.data?.summary.safeWebsites ?? 0}</p><p className="text-xs text-slate-400">Safe</p></div>
          </div>
        </Panel>
        <RecentThreatsTable threats={metrics.data?.recentThreats ?? []} />
      </div>
    </div>
  );
}
