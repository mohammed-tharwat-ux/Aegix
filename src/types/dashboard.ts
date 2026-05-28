export type ThreatStatus = "Dangerous" | "Suspicious" | "Safe";

export interface DashboardSummary {
  totalScans: number;
  dangerousWebsites: number;
  safeWebsites: number;
  avgRiskScore: number;
}

export interface WeeklyActivityPoint {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  value: number;
}

export interface ThreatDistributionItem {
  name: "Fake Login" | "Suspicious Domain" | "Phishing" | "Urgency Language";
  value: number;
}

export interface RecentThreat {
  id?: string;
  url: string;
  risk: number;
  category: string;
  status: ThreatStatus;
  createdAt?: string;
  brand?: string | null;
}

export interface TopBrand {
  brand: string;
  count: number;
}

export interface DashboardMetrics {
  summary: DashboardSummary;
  weeklyActivity: WeeklyActivityPoint[];
  threatDistribution: ThreatDistributionItem[];
  recentThreats: RecentThreat[];
  topBrands: TopBrand[];
}

export interface LogsResponse {
  items: RecentThreat[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnalyticsResponse extends DashboardMetrics {
  dailyTrends: Array<{ day: string; scans: number }>;
  weeklyTrends: WeeklyActivityPoint[];
  safePercentage: number;
  dangerousPercentage: number;
  suspiciousPercentage: number;
  riskHeatmap: Array<{ day: string; low: number; medium: number; high: number }>;
}

export interface ThreatCategoryGroup {
  name: ThreatDistributionItem["name"];
  count: number;
  percentage: number;
  severity: "Low" | "Medium" | "High";
  recentItems: RecentThreat[];
}

export interface HealthResponse {
  status: string;
  api?: string;
  backend?: string;
  uptime: number;
  version: string;
  database: string;
  gemini: string;
  scanCount?: number;
  environment: {
    runtime: string;
    nodeEnv: string;
    port: number;
    appUrl: string;
    apiUrl: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger" | "success";
  createdAt: string;
  read: number | boolean;
}

export interface SearchResponse {
  query: string;
  records: RecentThreat[];
  brands: string[];
  categories: string[];
}
