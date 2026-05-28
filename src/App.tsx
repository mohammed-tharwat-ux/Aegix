import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";

const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const Logs = lazy(() => import("./pages/Logs").then((module) => ({ default: module.Logs })));
const Analytics = lazy(() => import("./pages/Analytics").then((module) => ({ default: module.Analytics })));
const ThreatCategories = lazy(() => import("./pages/ThreatCategories").then((module) => ({ default: module.ThreatCategories })));
const Settings = lazy(() => import("./pages/Settings").then((module) => ({ default: module.Settings })));
const Extension = lazy(() => import("./pages/Extension").then((module) => ({ default: module.Extension })));
const Mobile = lazy(() => import("./pages/Mobile").then((module) => ({ default: module.Mobile })));

export function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05070d] text-slate-100" />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route element={<Dashboard />} index />
          <Route element={<Dashboard />} path="/dashboard" />
          <Route element={<Logs />} path="/logs" />
          <Route element={<Analytics />} path="/analytics" />
          <Route element={<ThreatCategories />} path="/threat-categories" />
          <Route element={<Settings />} path="/settings" />
          <Route element={<Extension />} path="/extension" />
          <Route element={<Mobile />} path="/mobile" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  );
}
