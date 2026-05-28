import { useMemo } from "react";
import { RecentThreatsTable } from "../components/dashboard/RecentThreatsTable";
import { StatCard } from "../components/dashboard/StatCard";
import { statIcons } from "../components/dashboard/constants";
import { ThreatDistributionChart } from "../components/dashboard/ThreatDistributionChart";
import { TopBrandsCard } from "../components/dashboard/TopBrandsCard";
import { WeeklyActivityChart } from "../components/dashboard/WeeklyActivityChart";
import { pollingIntervalMs, useApiResource } from "../hooks/useApiResource";
import { getDashboardMetrics } from "../services/api";
import type { DashboardMetrics } from "../types/dashboard";

const emptyMetrics: DashboardMetrics = {
  summary: {
    totalScans: 0,
    dangerousWebsites: 0,
    safeWebsites: 0,
    avgRiskScore: 0,
  },
  weeklyActivity: [
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ],
  threatDistribution: [
    { name: "Fake Login", value: 0 },
    { name: "Suspicious Domain", value: 0 },
    { name: "Phishing", value: 0 },
    { name: "Urgency Language", value: 0 },
  ],
  recentThreats: [],
  topBrands: [],
};

const formatNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function Dashboard() {
  const { data, isLoading, error } = useApiResource(getDashboardMetrics, { pollingMs: pollingIntervalMs });
  const metrics = data ?? emptyMetrics;

  const statCards = useMemo(
    () => [
      {
        icon: statIcons.totalScans,
        label: "Total Scans",
        value: formatNumber.format(metrics.summary.totalScans),
        delta: "+12.4%",
        tone: "cyan" as const,
      },
      {
        icon: statIcons.dangerousWebsites,
        label: "Dangerous Websites",
        value: formatNumber.format(metrics.summary.dangerousWebsites),
        delta: "+8.1%",
        tone: "red" as const,
      },
      {
        icon: statIcons.safeWebsites,
        label: "Safe Websites",
        value: formatNumber.format(metrics.summary.safeWebsites),
        delta: "+18.6%",
        tone: "green" as const,
      },
      {
        icon: statIcons.avgRiskScore,
        label: "Avg Risk Score",
        value: `${metrics.summary.avgRiskScore}%`,
        delta: "-3.2%",
        tone: "violet" as const,
      },
    ],
    [metrics.summary],
  );

  return (
    <div className="pt-7">
        {error && (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Dashboard API is unavailable: {error}. Showing an empty state until the backend responds.
          </div>
        )}

        <div className={`mt-7 grid gap-5 transition ${isLoading ? "animate-pulse opacity-60" : "opacity-100"}`}>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard {...card} key={card.label} />
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.58fr)_minmax(340px,0.82fr)]">
            <WeeklyActivityChart data={metrics.weeklyActivity} />
            <ThreatDistributionChart data={metrics.threatDistribution} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
            <RecentThreatsTable threats={metrics.recentThreats} />
            <TopBrandsCard brands={metrics.topBrands} />
          </section>
        </div>
    </div>
  );
}
