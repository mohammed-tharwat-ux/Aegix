import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyActivityPoint } from "../../types/dashboard";
import { Panel } from "./Panel";

interface WeeklyActivityChartProps {
  data: WeeklyActivityPoint[];
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  return (
    <Panel className="min-h-[360px] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Weekly Activity</h2>
          <p className="mt-1 text-sm text-slate-400">Scans detected from Mon to Sun</p>
        </div>
        <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">
          Live
        </span>
      </div>
      <div className="h-[265px]">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={data} margin={{ bottom: 0, left: -20, right: 8, top: 14 }}>
            <defs>
              <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff4d8d" stopOpacity={0.44} />
                <stop offset="62%" stopColor="#ff4d8d" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#ff4d8d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 8" vertical={false} />
            <XAxis axisLine={false} dataKey="day" tick={{ fill: "#7d8aa3", fontSize: 12 }} tickLine={false} />
            <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(8, 12, 21, 0.96)",
                border: "1px solid rgba(34, 211, 238, 0.2)",
                borderRadius: 16,
                color: "#e5f8ff",
              }}
              cursor={{ stroke: "rgba(34, 211, 238, 0.25)", strokeWidth: 1 }}
            />
            <Area
              activeDot={{ fill: "#ff4d8d", r: 5, stroke: "#ffe4ef", strokeWidth: 2 }}
              dataKey="value"
              fill="url(#activityFill)"
              stroke="#ff4d8d"
              strokeWidth={3}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
