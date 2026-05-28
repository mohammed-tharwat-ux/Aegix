import type { TopBrand } from "../../types/dashboard";
import { Panel } from "./Panel";

interface TopBrandsCardProps {
  brands: TopBrand[];
}

export function TopBrandsCard({ brands }: TopBrandsCardProps) {
  const maxCount = Math.max(...brands.map((brand) => brand.count), 1);

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Top Targeted Brands</h2>
      <p className="mt-1 text-sm text-slate-400">Most impersonated entities</p>

      <div className="mt-5 space-y-4">
        {brands.length === 0 ? (
          <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.025] px-4 py-8 text-center text-sm text-slate-400">
            Brand targets will populate from anti-phishing scans.
          </div>
        ) : (
          brands.map((brand, index) => (
            <div className="rounded-2xl border border-cyan-200/10 bg-white/[0.03] p-4 transition hover:border-cyan-200/20" key={brand.brand}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-300/12 text-sm font-semibold text-cyan-100">
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-100">{brand.brand}</span>
                </div>
                <span className="text-sm font-semibold text-white">{brand.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 shadow-[0_0_18px_rgba(34,211,238,0.4)]"
                  style={{ width: `${Math.max((brand.count / maxCount) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
