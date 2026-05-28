import {
  Activity,
  BarChart3,
  ChevronLeft,
  Gauge,
  LayoutDashboard,
  ListTree,
  LockKeyhole,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react";
import type { ThreatDistributionItem, ThreatStatus } from "../../types/dashboard";

export const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Logs", icon: ListTree, path: "/logs" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Threat Categories", icon: Target, path: "/threat-categories" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export const sidebarFooterIcon = ChevronLeft;

export const segmentItems = ["Dashboard", "Extension", "Mobile"] as const;

export const statIcons = {
  totalScans: Activity,
  dangerousWebsites: ShieldAlert,
  safeWebsites: ShieldCheck,
  avgRiskScore: Gauge,
};

export const distributionColors: Record<ThreatDistributionItem["name"], string> = {
  "Fake Login": "#22d3ee",
  "Suspicious Domain": "#8b5cf6",
  Phishing: "#ff4d8d",
  "Urgency Language": "#f59e0b",
};

export const statusClasses: Record<ThreatStatus, string> = {
  Dangerous: "border-red-400/30 bg-red-500/14 text-red-200",
  Suspicious: "border-amber-300/30 bg-amber-400/14 text-amber-100",
  Safe: "border-emerald-300/30 bg-emerald-400/14 text-emerald-100",
};

export const riskColor = {
  dangerous: "#ff4d8d",
  suspicious: "#f59e0b",
  safe: "#34d399",
};
