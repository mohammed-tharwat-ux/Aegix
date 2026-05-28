import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ThreatDistributionItem } from "../../types/dashboard";
import { distributionColors } from "./constants";
import { Panel } from "./Panel";

interface ThreatDistributionChartProps {
  data: ThreatDistributionItem[];
}

export function ThreatDistributionChart({ data }: ThreatDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Panel className="min-h-[360px] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Threat Distribution</h2>
      <p className="mt-1 text-sm text-slate-400">Category breakdown</p>

      <div className="relative mx-auto mt-3 h-[205px] max-w-[260px]">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              endAngle={-270}
              innerRadius="68%"
              outerRadius="92%"
              paddingAngle={4}
              startAngle={90}
              stroke="rgba(5, 7, 13, 0.9)"
              strokeWidth={5}
            >
              {data.map((entry) => (
                <Cell fill={distributionColors[entry.name]} key={entry.name} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(8, 12, 21, 0.96)",
                border: "1px solid rgba(34, 211, 238, 0.2)",
                borderRadius: 16,
                color: "#e5f8ff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-3xl font-semibold text-white">{total}</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Threats</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        {data.map((item) => (
          <div className="flex items-center justify-between text-sm" key={item.name}>
            <span className="flex items-center gap-2 text-slate-300">
              <span
                className="h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]"
                style={{ backgroundColor: distributionColors[item.name], color: distributionColors[item.name] }}
              />
              {item.name}
            </span>
            <span className="font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
