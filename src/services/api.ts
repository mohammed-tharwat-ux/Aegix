import type {
  AnalyticsResponse,
  DashboardMetrics,
  HealthResponse,
  LogsResponse,
  NotificationItem,
  SearchResponse,
  ThreatCategoryGroup,
} from "../types/dashboard";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? window.location.origin;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getDashboardMetrics() {
  return request<DashboardMetrics>("/api/dashboard/metrics");
}

export function getLogs(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return request<LogsResponse>(`/api/logs?${search.toString()}`);
}

export function getAnalytics() {
  return request<AnalyticsResponse>("/api/analytics");
}

export function getThreatCategories() {
  return request<ThreatCategoryGroup[]>("/api/threat-categories");
}

export function getHealth() {
  return request<HealthResponse>("/api/settings/health");
}

export function getNotifications() {
  return request<NotificationItem[]>("/api/notifications");
}

export function markNotificationRead(id: string) {
  return request(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return request("/api/notifications/read-all", { method: "PATCH" });
}

export function clearNotifications() {
  return request("/api/notifications", { method: "DELETE" });
}

export function getSettings() {
  return request("/api/settings");
}

export function updateSettings(payload: { riskThreshold?: number; pollingInterval?: number; theme?: string }) {
  return request("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function searchPlatform(query: string) {
  return request<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
}

export function recordScan(payload: {
  url: string;
  risk?: number;
  trustScore?: number;
  category?: string;
  status?: string;
  brand?: string | null;
  createdAt?: string;
}) {
  return request<DashboardMetrics>("/api/scans/record", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
