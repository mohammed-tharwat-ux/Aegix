import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import {
  clearNotifications as clearNotificationsApi,
  getDashboardMetrics,
  getHealth,
  getNotifications as getNotificationsApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
} from "../services/api";
import type { AppNotification } from "../types/notifications";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useApiResource, pollingIntervalMs } from "../hooks/useApiResource";
import type { DashboardMetrics, HealthResponse } from "../types/dashboard";

type ThemeMode = "dark" | "light";

interface AppContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  recentSearches: string[];
  pushSearchHistory: (query: string) => void;
  searchHistory: string[];
  metrics: DashboardMetrics | null;
  health: HealthResponse | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorageState<ThemeMode>("aegix-theme", "dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorageState("aegix-sidebar-collapsed", false);
  const [notifications, setNotifications] = useLocalStorageState<AppNotification[]>("aegix-notifications", []);
  const [searchHistory, setSearchHistory] = useLocalStorageState<string[]>("aegix-search-history", []);
  const lastMetricsRef = useRef<DashboardMetrics | null>(null);
  const lastHealthRef = useRef<string | null>(null);
  const dedupeRef = useRef(new Set<string>());

  const metricsResource = useApiResource(getDashboardMetrics, { pollingMs: pollingIntervalMs });
  const healthResource = useApiResource(getHealth, { pollingMs: pollingIntervalMs });
  const notificationsResource = useApiResource(getNotificationsApi, { pollingMs: pollingIntervalMs });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const stored = window.localStorage.getItem("aegix-theme");
    if (!stored) setTheme(mq.matches ? "light" : "dark");
    const onChange = (event: MediaQueryListEvent) => {
      if (!window.localStorage.getItem("aegix-theme")) setTheme(event.matches ? "light" : "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setTheme]);

  useEffect(() => {
    const latestMetrics = metricsResource.data;
    if (!latestMetrics) return;

    const previous = lastMetricsRef.current;
    if (previous) {
      const delta = latestMetrics.summary.totalScans - previous.summary.totalScans;
      if (delta > 0) {
        const newestThreat = latestMetrics.recentThreats[0];
        addNotificationInternal(
          newestThreat?.status === "Dangerous" ? "danger" : newestThreat?.status === "Suspicious" ? "warning" : "success",
          newestThreat?.status === "Dangerous" ? "Dangerous website detected" : newestThreat?.status === "Suspicious" ? "Suspicious login page" : "Scan completed",
          newestThreat
            ? `${newestThreat.url} was added to scan history.`
            : "New scan results were received from the backend.",
        );
      }
    }
    const latestThreat = latestMetrics.recentThreats[0];
    if (latestThreat?.category === "Fake Login") {
      addNotificationInternal("warning", "Suspicious login page", `${latestThreat.url} looks like a credential capture attempt.`);
    }
    lastMetricsRef.current = latestMetrics;
  }, [metricsResource.data]);

  useEffect(() => {
    if (!notificationsResource.data) return;
    setNotifications((current) => {
      const backendItems = notificationsResource.data ?? [];
      const backendById = new Map(backendItems.map((item: any) => [item.id, item]));
      const merged = backendItems.map((item: any) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        severity: item.severity,
        createdAt: item.createdAt,
        read: Boolean(item.read),
      }));
      for (const local of current) {
        if (!backendById.has(local.id)) merged.push(local);
      }
      return merged.slice(0, 50);
    });
  }, [notificationsResource.data]);

  useEffect(() => {
    const status = healthResource.data?.api ?? (healthResource.data?.status === "ok" ? "online" : "unknown");
    if (lastHealthRef.current && lastHealthRef.current !== status) {
      addNotificationInternal(
        status === "online" ? "success" : "danger",
        status === "online" ? "Backend connected" : "Backend disconnected",
        status === "online" ? "Live API polling resumed." : "The dashboard lost contact with the backend.",
      );
    }
    lastHealthRef.current = status;
  }, [healthResource.data?.api]);

  useEffect(() => {
    if (healthResource.data?.gemini === "missing-key") {
      addNotificationInternal("warning", "Gemini/API unavailable", "Set GEMINI_API_KEY to restore AI-backed analysis.");
    }
    if ((healthResource.data?.api ?? healthResource.data?.status) === "offline") {
      addNotificationInternal("danger", "Backend disconnected", "The polling layer cannot reach the API server.");
    }
  }, [healthResource.data?.api, healthResource.data?.status, healthResource.data?.gemini]);

  function addNotificationInternal(
    severity: AppNotification["severity"],
    title: string,
    message: string,
  ) {
    const key = `${severity}:${title}:${message}`;
    if (dedupeRef.current.has(key)) return;
    dedupeRef.current.add(key);
    setNotifications((current) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        read: false,
        severity,
        title,
        message,
      },
      ...current,
    ].slice(0, 50));
  }

  function markNotificationRead(id: string) {
    void markNotificationReadApi(id);
    setNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
  }

  function markAllNotificationsRead() {
    void markAllNotificationsReadApi();
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }

  function clearNotifications() {
    void clearNotificationsApi();
    setNotifications([]);
  }

  function addNotification(notification: Omit<AppNotification, "id" | "createdAt" | "read">) {
    addNotificationInternal(notification.severity, notification.title, notification.message);
  }

  function pushSearchHistory(query: string) {
    const cleaned = query.trim();
    if (!cleaned) return;
    setSearchHistory((current) => [cleaned, ...current.filter((item) => item !== cleaned)].slice(0, 8));
  }

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
      sidebarCollapsed,
      setSidebarCollapsed,
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      addNotification,
      recentSearches: searchHistory,
      pushSearchHistory,
      searchHistory,
      metrics: metricsResource.data,
      health: healthResource.data,
    }),
    [theme, sidebarCollapsed, notifications, searchHistory, metricsResource.data, healthResource.data],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
