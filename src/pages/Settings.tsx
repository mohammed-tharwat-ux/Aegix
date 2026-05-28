import { Activity, CheckCircle2, Server, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel } from "../components/dashboard/Panel";
import { pollingIntervalMs, useApiResource } from "../hooks/useApiResource";
import { getHealth, getSettings, updateSettings } from "../services/api";

export function Settings() {
  const { data, error } = useApiResource(getHealth, { pollingMs: pollingIntervalMs });
  const [polling, setPolling] = useState(Number(import.meta.env.VITE_POLLING_INTERVAL_MS ?? 5000));
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [enhancedTheme, setEnhancedTheme] = useState(true);

  useEffect(() => {
    getSettings().then((settings) => {
      setPolling(Number((settings as { pollingInterval?: number }).pollingInterval ?? 5000));
      setRiskThreshold(Number((settings as { riskThreshold?: number }).riskThreshold ?? 70));
      setEnhancedTheme(((settings as { theme?: string }).theme ?? "dark") === "dark");
    });
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void updateSettings({
        pollingInterval: polling,
        riskThreshold,
        theme: enhancedTheme ? "dark" : "light",
      });
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [enhancedTheme, polling, riskThreshold]);

  return (
    <div className="grid gap-5 pt-7 xl:grid-cols-[1fr_1fr]">
      {error && <div className="xl:col-span-2 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>}
      <Panel className="p-6">
        <h2 className="text-lg font-semibold text-white">System Health</h2>
        <div className="mt-5 grid gap-3">
          {[["API", data?.api ?? data?.status], ["Backend", data?.backend ?? data?.database], ["Gemini", data?.gemini]].map(([label, value]) => (
            <div className="flex items-center justify-between rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4" key={label}>
              <span className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="text-cyan-200" size={18} />{label}</span>
              <span className="text-sm font-semibold text-white">{value ?? "checking"}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="p-6">
        <h2 className="text-lg font-semibold text-white">Detection Settings</h2>
        <div className="mt-5 space-y-5">
          <label className="block text-sm text-slate-300"><span className="mb-2 flex items-center gap-2"><Activity size={16} /> Polling interval: {polling}ms</span><input className="w-full accent-cyan-300" max={15000} min={2000} onChange={(event) => setPolling(Number(event.target.value))} step={1000} type="range" value={polling} /></label>
          <label className="block text-sm text-slate-300"><span className="mb-2 flex items-center gap-2"><SlidersHorizontal size={16} /> Dangerous threshold: {riskThreshold}%</span><input className="w-full accent-rose-300" max={95} min={35} onChange={(event) => setRiskThreshold(Number(event.target.value))} type="range" value={riskThreshold} /></label>
          <label className="flex items-center justify-between rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4 text-sm text-slate-300">Cyber glow theme<input checked={enhancedTheme} className="h-5 w-5 accent-cyan-300" onChange={(event) => setEnhancedTheme(event.target.checked)} type="checkbox" /></label>
        </div>
      </Panel>
      <Panel className="p-6 xl:col-span-2">
        <h2 className="text-lg font-semibold text-white">Environment Diagnostics</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4"><Server className="mb-3 text-cyan-200" size={20} /><p className="text-sm text-slate-400">Runtime</p><p className="font-semibold text-white">{data?.environment.runtime ?? "-"}</p></div>
          <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4"><p className="text-sm text-slate-400">Uptime</p><p className="mt-3 font-semibold text-white">{data?.uptime ?? 0}s</p></div>
          <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4"><p className="text-sm text-slate-400">Tracked scans</p><p className="mt-3 font-semibold text-white">{data?.scanCount ?? 0}</p></div>
        </div>
      </Panel>
    </div>
  );
}
