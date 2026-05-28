import { Bell, ChevronDown, MoonStar, Menu, Search, SunMedium, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { searchPlatform } from "../../services/api";
import type { SearchResponse } from "../../types/dashboard";
import { segmentItems } from "./constants";

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const {
    theme,
    toggleTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    pushSearchHistory,
    searchHistory,
  } = useAppContext();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    let active = true;
    if (debouncedQuery.trim().length < 2) {
      setResults(null);
      setLoadingSearch(false);
      return undefined;
    }
    setLoadingSearch(true);
    searchPlatform(debouncedQuery)
      .then((data) => active && setResults(data))
      .catch(() => active && setResults(null))
      .finally(() => active && setLoadingSearch(false));
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenNotifications(false);
        setSidebarCollapsed(true);
        setMobileSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenNotifications(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return searchHistory.slice(0, 5);
    return results?.records.slice(0, 5).map((record) => record.url) ?? [];
  }, [query, results?.records, searchHistory]);

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open menu"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/10 bg-white/[0.04] text-cyan-100 transition hover:bg-white/[0.08] lg:hidden"
          onClick={() => setSidebarCollapsed(false)}
          type="button"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl data-[theme=light]:text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400 data-[theme=light]:text-slate-600">Live phishing intelligence and scan telemetry</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input
            aria-label="Search scans, threats, brands, and categories"
            className="h-11 w-[260px] rounded-2xl border border-cyan-200/10 bg-white/[0.04] pl-10 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/30 focus:bg-white/[0.06] data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400"
            onChange={(event) => {
              setQuery(event.target.value);
              setFocusedIndex(0);
            }}
            onFocus={() => setOpenNotifications(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && query.trim()) {
                pushSearchHistory(query.trim());
                navigate(`/logs?q=${encodeURIComponent(query.trim())}`);
                setQuery("");
                setResults(null);
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setFocusedIndex((current) => Math.min(current + 1, suggestions.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setFocusedIndex((current) => Math.max(current - 1, 0));
              }
            }}
            placeholder="Search threats..."
            value={query}
          />
          {query && (
            <button
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:text-cyan-100"
              onClick={() => {
                setQuery("");
                setResults(null);
              }}
              type="button"
            >
              <X size={15} />
            </button>
          )}
          {(loadingSearch || suggestions.length > 0) && (
            <div className="absolute right-0 top-13 z-50 w-[360px] overflow-hidden rounded-2xl border border-cyan-200/12 bg-[#08101d]/95 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl data-[theme=light]:bg-white/95">
              <div className="flex items-center justify-between border-b border-cyan-200/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                <span>{loadingSearch ? "Searching..." : "Search Results"}</span>
                {searchHistory.length > 0 && <span>{searchHistory.length} recent</span>}
              </div>
              {loadingSearch ? (
                <div className="space-y-3 px-4 py-4">
                  <div className="h-4 rounded bg-white/10" />
                  <div className="h-4 rounded bg-white/10" />
                  <div className="h-4 rounded bg-white/10" />
                </div>
              ) : (
                <div className="max-h-72 overflow-auto">
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-slate-400">No suggestions yet.</div>
                  ) : (
                    suggestions.map((item, index) => (
                      <button
                        className={`block w-full border-b border-cyan-200/6 px-4 py-3 text-left transition hover:bg-cyan-300/8 ${index === focusedIndex ? "bg-cyan-300/8" : ""}`}
                        key={item}
                        onClick={() => {
                          pushSearchHistory(item);
                          navigate(`/logs?q=${encodeURIComponent(item)}`);
                          setQuery("");
                          setResults(null);
                        }}
                        type="button"
                      >
                        <p className="truncate text-sm font-medium text-slate-100">{item}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          aria-label="Search"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/10 bg-white/[0.04] text-slate-300 transition hover:text-cyan-100 sm:hidden"
          onClick={() => setMobileSearchOpen((current) => !current)}
          type="button"
        >
          <Search size={18} />
        </button>

        <button
          aria-label="Toggle theme"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/10 bg-white/[0.04] text-slate-300 transition hover:text-cyan-100"
          onClick={toggleTheme}
          type="button"
        >
          {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            aria-label="Notifications"
            aria-expanded={openNotifications}
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/10 bg-white/[0.04] text-slate-300 transition hover:text-cyan-100"
            onClick={() => setOpenNotifications((current) => !current)}
            type="button"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-400" />}
          </button>
          {openNotifications && (
            <div className="absolute right-0 top-13 z-50 w-[360px] overflow-hidden rounded-2xl border border-cyan-200/12 bg-[#08101d]/95 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl data-[theme=light]:bg-white/95">
              <div className="flex items-center justify-between border-b border-cyan-200/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white data-[theme=light]:text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-500">{unreadCount} unread</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs text-cyan-200 hover:text-cyan-100" onClick={markAllNotificationsRead} type="button">
                    Mark all read
                  </button>
                  <button className="text-xs text-slate-500 hover:text-cyan-100" onClick={clearNotifications} type="button">
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-slate-400">No notifications yet.</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      className={`block w-full border-b border-cyan-200/6 px-4 py-3 text-left transition hover:bg-cyan-300/8 ${notification.read ? "" : "bg-cyan-300/5"}`}
                      key={notification.id}
                      onClick={() => markNotificationRead(notification.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100 data-[theme=light]:text-slate-900">{notification.title}</p>
                        <span className="text-[11px] text-slate-500">{new Date(notification.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden rounded-[18px] border border-cyan-200/10 bg-[#0d1424]/80 p-1 shadow-[0_0_24px_rgba(34,211,238,0.08)] sm:flex">
          {segmentItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `grid h-9 place-items-center rounded-[14px] px-4 text-xs font-semibold transition sm:text-sm ${
                  isActive || (item === "Dashboard" && location.pathname === "/")
                    ? "bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                    : "text-slate-400 hover:text-cyan-100"
                }`
              }
              key={item}
              onClick={() => pushSearchHistory(item)}
              to={item === "Dashboard" ? "/dashboard" : `/${item.toLowerCase()}`}
            >
              {item}
            </NavLink>
          ))}
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="sm:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              className="h-11 w-full rounded-2xl border border-cyan-200/10 bg-white/[0.04] pl-10 pr-10 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search threats..."
              value={query}
            />
          </div>
        </div>
      )}
    </header>
  );
}
