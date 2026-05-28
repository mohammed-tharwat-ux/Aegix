import type { RecentThreat } from "../../types/dashboard";
import { riskColor, statusClasses } from "./constants";
import { Panel } from "./Panel";

interface RecentThreatsTableProps {
  threats: RecentThreat[];
}

function getRiskTone(risk: number) {
  if (risk >= 70) return riskColor.dangerous;
  if (risk >= 35) return riskColor.suspicious;
  return riskColor.safe;
}

export function RecentThreatsTable({ threats }: RecentThreatsTableProps) {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-cyan-200/10 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-white">Recent Threats</h2>
        <p className="mt-1 text-sm text-slate-400">Latest analyzed URLs</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="px-6 py-4 font-semibold">URL</th>
              <th className="px-6 py-4 font-semibold">Risk</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {threats.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-center text-sm text-slate-400" colSpan={4}>
                  No scan activity yet. New analysis results will appear here automatically.
                </td>
              </tr>
            ) : (
              threats.map((threat) => (
                <tr className="border-t border-cyan-200/8 text-sm transition hover:bg-white/[0.025]" key={`${threat.url}-${threat.risk}-${threat.category}`}>
                  <td className="max-w-[260px] truncate px-6 py-4 font-medium text-slate-200">{threat.url}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold" style={{ color: getRiskTone(threat.risk) }}>
                      {threat.risk}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{threat.category}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[threat.status]}`}>
                      {threat.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
