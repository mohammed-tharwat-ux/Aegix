import { ChevronLeft, Menu, Shield } from "lucide-react";
import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { navItems } from "./constants";

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppContext();

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarCollapsed(false);
  }, [location.pathname, setSidebarCollapsed]);

  const widthClass = sidebarCollapsed ? "lg:w-[84px]" : "lg:w-[270px]";

  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-black/45 transition-opacity lg:hidden ${sidebarCollapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}
        onClick={() => setSidebarCollapsed(true)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[270px] flex-col border-r border-cyan-200/10 bg-[#080c15]/90 px-4 py-5 shadow-[18px_0_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition-all duration-300 data-[theme=light]:bg-white/90 data-[theme=light]:shadow-[18px_0_60px_rgba(15,23,42,0.08)] lg:translate-x-0 ${widthClass} ${sidebarCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}`}
        aria-label="Sidebar navigation"
      >
        <div className="mb-8 flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.24)]">
              <Shield size={25} strokeWidth={2.3} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="text-xl font-semibold tracking-wide text-white data-[theme=light]:text-slate-900">Aegix</p>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/44 data-[theme=light]:text-slate-500">Security</p>
              </div>
            )}
          </div>
          <button
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden rounded-xl border border-cyan-200/10 bg-white/[0.035] p-2 text-slate-400 transition hover:text-cyan-100 lg:grid"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            type="button"
          >
            <ChevronLeft className={sidebarCollapsed ? "rotate-180" : ""} size={18} />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  `group flex h-12 w-full items-center gap-3 rounded-[18px] px-4 text-sm font-medium transition duration-200 ${
                    isActive || (item.path === "/dashboard" && location.pathname === "/")
                      ? "border border-cyan-300/24 bg-cyan-400/12 text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.16)]"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-cyan-100 data-[theme=light]:hover:bg-slate-100"
                  } ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`
                }
                key={item.label}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarCollapsed(true);
                }}
                to={item.path}
              >
                <Icon className="shrink-0 text-current" size={19} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <button
          aria-label="Sidebar menu"
          className="mt-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/10 bg-white/[0.035] text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-100 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
          type="button"
        >
          <Menu size={20} />
        </button>
      </aside>
    </>
  );
}
