import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
  tone: "cyan" | "red" | "green" | "violet";
}

const toneClasses = {
  cyan: "from-cyan-300/22 text-cyan-100 shadow-cyan-400/18",
  red: "from-rose-400/22 text-rose-100 shadow-rose-400/18",
  green: "from-emerald-300/22 text-emerald-100 shadow-emerald-400/18",
  violet: "from-violet-400/22 text-violet-100 shadow-violet-400/18",
};

export function StatCard({ icon: Icon, label, value, delta, tone }: StatCardProps) {
  return (
    <article className="group rounded-[28px] border border-cyan-200/10 bg-panel px-5 py-5 shadow-[0_20px_55px_rgba(0,0,0,0.32),0_0_30px_rgba(34,211,238,0.07)] backdrop-blur-2xl transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/20">
      <div className="mb-6 flex items-start justify-between">
        <div
          className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br to-white/[0.035] shadow-lg ${toneClasses[tone]}`}
        >
          <Icon size={22} />
        </div>
        <span className="rounded-full border border-cyan-200/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-cyan-100">
          {delta}
        </span>
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{label}</p>
    </article>
  );
}
