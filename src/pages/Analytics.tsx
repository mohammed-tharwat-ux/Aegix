import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "../components/dashboard/Panel";
import { distributionColors } from "../components/dashboard/constants";
import { pollingIntervalMs, useApiResource } from "../hooks/useApiResource";
import { getAnalytics } from "../services/api";

export function Analytics() {
  const { data, isLoading, error } = useApiResource(getAnalytics, { pollingMs: pollingIntervalMs });
  const distribution = data?.threatDistribution ?? [];

  return (
    <div className={`pt-7 ${isLoading ? "animate-pulse opacity-60" : ""}`}>
      {error && <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{error}</div>}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel className="p-6">
          <h2 className="text-lg font-semibold text-white">Daily Scan Trends</h2>
          <div className="mt-5 h-72"><ResponsiveContainer><AreaChart data={data?.dailyTrends ?? []}><CartesianGrid stroke="rgba(148,163,184,.12)" strokeDasharray="3 8" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#7d8aa3" }} /><YAxis allowDecimals={false} tick={{ fill: "#64748b" }} /><Tooltip contentStyle={{ background: "#08101d", border: "1px solid rgba(34,211,238,.2)", borderRadius: 16 }} /><Area dataKey="scans" fill="rgba(34,211,238,.18)" stroke="#22d3ee" strokeWidth={3} type="monotone" /></AreaChart></ResponsiveContainer></div>
        </Panel>
        <Panel className="p-6">
          <h2 className="text-lg font-semibold text-white">Safe vs Dangerous</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-emerald-400/10 p-4 text-center"><p className="text-3xl font-semibold text-emerald-200">{data?.safePercentage ?? 0}%</p><p className="text-xs text-slate-400">Safe</p></div>
            <div className="rounded-2xl bg-amber-400/10 p-4 text-center"><p className="text-3xl font-semibold text-amber-100">{data?.suspiciousPercentage ?? 0}%</p><p className="text-xs text-slate-400">Suspicious</p></div>
            <div className="rounded-2xl bg-rose-400/10 p-4 text-center"><p className="text-3xl font-semibold text-rose-200">{data?.dangerousPercentage ?? 0}%</p><p className="text-xs text-slate-400">Dangerous</p></div>
          </div>
          <p className="mt-6 text-sm text-slate-400">Average risk score</p>
          <p className="mt-1 text-5xl font-semibold text-white">{data?.summary.avgRiskScore ?? 0}%</p>
        </Panel>
        <Panel className="p-6">
          <h2 className="text-lg font-semibold text-white">Category Distribution</h2>
          <div className="mt-5 h-72"><ResponsiveContainer><PieChart><Pie data={distribution} dataKey="value" innerRadius="58%" outerRadius="86%" paddingAngle={4}>{distribution.map((entry) => <Cell fill={distributionColors[entry.name]} key={entry.name} />)}</Pie><Tooltip contentStyle={{ background: "#08101d", border: "1px solid rgba(34,211,238,.2)", borderRadius: 16 }} /></PieChart></ResponsiveContainer></div>
        </Panel>
        <Panel className="p-6">
          <h2 className="text-lg font-semibold text-white">Risk Heatmap</h2>
          <div className="mt-5 h-72"><ResponsiveContainer><BarChart data={data?.riskHeatmap ?? []}><CartesianGrid stroke="rgba(148,163,184,.12)" strokeDasharray="3 8" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#7d8aa3" }} /><YAxis allowDecimals={false} tick={{ fill: "#64748b" }} /><Tooltip contentStyle={{ background: "#08101d", border: "1px solid rgba(34,211,238,.2)", borderRadius: 16 }} /><Bar dataKey="low" stackId="risk" fill="#34d399" /><Bar dataKey="medium" stackId="risk" fill="#f59e0b" /><Bar dataKey="high" stackId="risk" fill="#ff4d8d" /></BarChart></ResponsiveContainer></div>
        </Panel>
      </div>
    </div>
  );
}
