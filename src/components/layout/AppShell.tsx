import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Sidebar } from "../dashboard/Sidebar";
import { ToastStack } from "../dashboard/ToastStack";
import { Topbar } from "../dashboard/Topbar";

export function AppShell() {
  const { sidebarCollapsed, theme } = useAppContext();

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "theme-dark" : "theme-light"} transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.15),transparent_28%),radial-gradient(circle_at_82%_4%,rgba(255,77,141,0.13),transparent_30%),linear-gradient(135deg,#05070d_0%,#09111f_48%,#05070d_100%)] text-slate-100"
          : "bg-[radial-gradient(circle_at_18%_10%,rgba(47,128,255,0.12),transparent_28%),radial-gradient(circle_at_82%_4%,rgba(255,82,120,0.12),transparent_30%),linear-gradient(135deg,#eff6ff_0%,#dbeafe_52%,#f8fafc_100%)] text-slate-900"
      }`}
    >
      <Sidebar />
      <main className={`min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-7 ${sidebarCollapsed ? "lg:ml-[84px]" : "lg:ml-[270px]"}`}>
        <Topbar />
        <Outlet />
      </main>
      <ToastStack />
    </div>
  );
}
