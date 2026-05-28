/*
  ==========================================================================
 🛡️ AEGIX - INTELLIGENT CYBERSECURITY SYSTEM
  ==========================================================================
  🧠 Core Backend Logic & AI Integration
  👨‍💻 Developed by : Sohaila Mohammed & Fearo
 🎯 Purpose      : Smart URL Validation, Image Forensics & AI Phishing Analysis
  🚀 Tech Stack   : TypeScript, Bun, ElysiaJS, Google Gemini API
  ==========================================================================
 */

import swagger from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { GoogleGenAI } from "@google/genai";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import {
  dbHealth,
  getNotifications,
  getSetting,
  insertScan,
  markAllNotificationsRead,
  markNotificationRead,
  queryScans,
  setSetting,
  type AppNotificationRecord,
  type ScanRecord,
  type ThreatCategory,
  type ThreatStatus,
  type NotificationSeverity,
  clearNotifications,
  upsertNotification,
} from "./db";

const ai = new GoogleGenAI({
  apiKey: Bun.env.GEMINI_API_KEY ?? "",
});
const port = Number(Bun.env.PORT ?? 3000);
const version = "1.0.0";
type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
const weekDays: WeekDay[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dashboardWeekDays: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const threatCategories: ThreatCategory[] = [
  "Fake Login",
  "Suspicious Domain",
  "Phishing",
  "Urgency Language",
];

function getStatusFromTrustScore(trustScore: number): ThreatStatus {
  if (trustScore >= 75) return "Safe";
  if (trustScore >= 40) return "Suspicious";
  return "Dangerous";
}

function getCategory(url: string, aiResult: Record<string, unknown>): ThreatCategory {
  const riskLevel = String(aiResult.riskLevel ?? "").toLowerCase();
  const analysis = String(aiResult.analysis ?? "").toLowerCase();
  const redFlags = Array.isArray(aiResult.redFlags)
    ? aiResult.redFlags.map((flag) => String(flag).toLowerCase()).join(" ")
    : "";
  const searchableText = `${url} ${riskLevel} ${analysis} ${redFlags}`.toLowerCase();

  if (searchableText.includes("login") || searchableText.includes("credential")) return "Fake Login";
  if (searchableText.includes("urgent") || searchableText.includes("suspend") || searchableText.includes("immediate")) {
    return "Urgency Language";
  }
  if (searchableText.includes("domain") || searchableText.includes("typosquat") || searchableText.includes("tld")) {
    return "Suspicious Domain";
  }
  return "Phishing";
}

function recordScan(url: string, aiResult: Record<string, unknown>) {
  const trustScore = Number(aiResult.trustScore ?? 0);
  const normalizedTrustScore = Number.isFinite(trustScore)
    ? Math.min(Math.max(Math.round(trustScore), 0), 100)
    : 0;
  const risk = 100 - normalizedTrustScore;
  const brand = typeof aiResult.impersonatedBrand === "string" && aiResult.impersonatedBrand.trim()
    ? aiResult.impersonatedBrand.trim()
    : null;

  insertScan({
    id: crypto.randomUUID(),
    url,
    risk,
    brand,
    category: getCategory(url, aiResult),
    status: getStatusFromTrustScore(normalizedTrustScore),
    createdAt: new Date().toISOString(),
  });

  const notificationTitle = statusNotificationTitle(normalizedTrustScore, brand);
  upsertNotification({
    id: crypto.randomUUID(),
    title: notificationTitle,
    message: `${brand ?? url} scored ${normalizedTrustScore}/100`,
    severity: normalizedTrustScore >= 75 ? "success" : normalizedTrustScore >= 40 ? "warning" : "danger",
    createdAt: new Date().toISOString(),
    read: 0,
  });
}

function addManualScan(input: {
  url: string;
  risk?: number;
  trustScore?: number;
  category?: ThreatCategory;
  status?: ThreatStatus;
  brand?: string | null;
  createdAt?: string;
}) {
  const trustScore = input.trustScore ?? (typeof input.risk === "number" ? 100 - input.risk : 50);
  const normalizedTrustScore = Math.min(Math.max(Math.round(trustScore), 0), 100);
  const risk = typeof input.risk === "number" ? Math.min(Math.max(Math.round(input.risk), 0), 100) : 100 - normalizedTrustScore;

  insertScan({
    id: crypto.randomUUID(),
    url: input.url,
    risk,
    brand: input.brand?.trim() || null,
    category: input.category ?? getCategory(input.url, { trustScore: normalizedTrustScore }),
    status: input.status ?? getStatusFromTrustScore(normalizedTrustScore),
    createdAt: input.createdAt ?? new Date().toISOString(),
  });
  upsertNotification({
    id: crypto.randomUUID(),
    title: `Scan recorded`,
    message: `${input.url} synced to dashboard history.`,
    severity: normalizedTrustScore >= 75 ? "success" : normalizedTrustScore >= 40 ? "warning" : "info",
    createdAt: input.createdAt ?? new Date().toISOString(),
    read: 0,
  });
}

function statusNotificationTitle(trustScore: number, brand: string | null) {
  if (trustScore >= 75) return `Scan completed`;
  if (trustScore >= 40) return brand ? `Suspicious login page` : `System warning`;
  return `Dangerous website detected`;
}

function getDashboardMetrics() {
  const scanRecords = queryScans();
  const totalScans = scanRecords.length;
  const dangerousWebsites = scanRecords.filter((record) => record.status === "Dangerous").length;
  const safeWebsites = scanRecords.filter((record) => record.status === "Safe").length;
  const avgRiskScore =
    totalScans === 0
      ? 0
      : Math.round(scanRecords.reduce((sum, record) => sum + record.risk, 0) / totalScans);

  const weeklyCounts = new Map<WeekDay, number>(dashboardWeekDays.map((day) => [day, 0]));
  const distributionCounts = new Map<ThreatCategory, number>(threatCategories.map((category) => [category, 0]));
  const brandCounts = new Map<string, number>();

  for (const record of scanRecords) {
    const day = weekDays[new Date(record.createdAt).getDay()] ?? "Sun";
    weeklyCounts.set(day, (weeklyCounts.get(day) ?? 0) + 1);
    distributionCounts.set(record.category, (distributionCounts.get(record.category) ?? 0) + 1);

    if (record.brand) {
      brandCounts.set(record.brand, (brandCounts.get(record.brand) ?? 0) + 1);
    }
  }

  return {
    summary: {
      totalScans,
      dangerousWebsites,
      safeWebsites,
      avgRiskScore,
    },
    weeklyActivity: dashboardWeekDays.map((day) => ({ day, value: weeklyCounts.get(day) ?? 0 })),
    threatDistribution: threatCategories.map((name) => ({ name, value: distributionCounts.get(name) ?? 0 })),
    recentThreats: scanRecords.slice(0, 8).map(({ id, url, risk, category, status, createdAt, brand }) => ({
      id,
      url,
      risk,
      category,
      status,
      createdAt,
      brand,
    })),
    topBrands: Array.from(brandCounts.entries())
      .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count })),
  };
}

function matchesSearch(record: ScanRecord, query: string) {
  const searchText = `${record.url} ${record.category} ${record.status} ${record.brand ?? ""}`.toLowerCase();
  return searchText.includes(query.toLowerCase());
}

function filteredRecords(query: Record<string, string | undefined>) {
  let records = queryScans();
  const q = query.q?.trim();
  const status = query.status?.trim();
  const category = query.category?.trim();
  const riskLevel = query.riskLevel?.trim();
  const date = query.date?.trim();

  if (q) records = records.filter((record) => matchesSearch(record, q));
  if (status && status !== "all") records = records.filter((record) => record.status === status);
  if (category && category !== "all") records = records.filter((record) => record.category === category);
  if (riskLevel && riskLevel !== "all") {
    records = records.filter((record) => {
      if (riskLevel === "high") return record.risk >= 70;
      if (riskLevel === "medium") return record.risk >= 35 && record.risk < 70;
      return record.risk < 35;
    });
  }
  if (date) records = records.filter((record) => record.createdAt.startsWith(date));

  return records;
}

function getLogs(query: Record<string, string | undefined>) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10), 1), 50);
  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const records = filteredRecords(query);

  records.sort((a, b) => {
    const direction = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "risk") return (a.risk - b.risk) * direction;
    if (sortBy === "url") return a.url.localeCompare(b.url) * direction;
    if (sortBy === "category") return a.category.localeCompare(b.category) * direction;
    if (sortBy === "status") return a.status.localeCompare(b.status) * direction;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
  });

  const start = (page - 1) * pageSize;
  return {
    items: records.slice(start, start + pageSize),
    total: records.length,
    page,
    pageSize,
  };
}

function getAnalytics() {
  const metrics = getDashboardMetrics();
  const total = metrics.summary.totalScans || 1;
  const scanRecords = queryScans();
  const suspicious = scanRecords.filter((record) => record.status === "Suspicious").length;
  const dailyTrends = dashboardWeekDays.map((day) => ({
    day,
    scans: metrics.weeklyActivity.find((point) => point.day === day)?.value ?? 0,
  }));
  const heatmap = dashboardWeekDays.map((day) => ({
    day,
    low: scanRecords.filter((record) => weekDays[new Date(record.createdAt).getDay()] === day && record.risk < 35).length,
    medium: scanRecords.filter((record) => weekDays[new Date(record.createdAt).getDay()] === day && record.risk >= 35 && record.risk < 70).length,
    high: scanRecords.filter((record) => weekDays[new Date(record.createdAt).getDay()] === day && record.risk >= 70).length,
  }));

  return {
    ...metrics,
    dailyTrends,
    weeklyTrends: metrics.weeklyActivity,
    safePercentage: Math.round((metrics.summary.safeWebsites / total) * 100),
    dangerousPercentage: Math.round((metrics.summary.dangerousWebsites / total) * 100),
    suspiciousPercentage: Math.round((suspicious / total) * 100),
    riskHeatmap: heatmap,
  };
}

function getThreatCategories() {
  const scanRecords = queryScans();
  const total = scanRecords.length || 1;
  return threatCategories.map((category) => {
    const items = scanRecords.filter((record) => record.category === category);
    const avgRisk = items.length === 0 ? 0 : Math.round(items.reduce((sum, record) => sum + record.risk, 0) / items.length);
    return {
      name: category,
      count: items.length,
      percentage: Math.round((items.length / total) * 100),
      severity: avgRisk >= 70 ? "High" : avgRisk >= 35 ? "Medium" : "Low",
      recentItems: items.slice(0, 4),
    };
  });
}

function getSearchResults(q: string) {
  const records = q ? queryScans().filter((record) => matchesSearch(record, q)).slice(0, 12) : [];
  const brands = Array.from(new Set(records.map((record) => record.brand).filter(Boolean)));
  const categories = Array.from(new Set(records.map((record) => record.category)));

  return {
    query: q,
    records,
    brands,
    categories,
  };
}

const frontendDist = join(process.cwd(), "dist");
const frontendIndex = join(frontendDist, "index.html");

function serveFrontend(pathname: string) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = join(frontendDist, safePath.replace(/^\//, ""));
  if (existsSync(filePath) && extname(filePath)) {
    return Bun.file(filePath);
  }
  return Bun.file(frontendIndex);
}

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get("/health", () => ({
    status: "ok",
    uptime: Math.round(process.uptime()),
    version,
    database: dbHealth(),
    gemini: Bun.env.GEMINI_API_KEY ? "configured" : "missing-key",
    environment: {
      runtime: `Bun ${Bun.version}`,
      nodeEnv: Bun.env.NODE_ENV ?? "production",
      port,
      appUrl: Bun.env.APP_URL ?? "",
      apiUrl: Bun.env.API_URL ?? "",
    },
  }))

  .onAfterHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
  })
  .onError(({ code, error, set }) => {
    console.error(error);
    set.status = code === "NOT_FOUND" ? 404 : 500;
    return {
      success: false,
      error: code,
      message: error instanceof Error ? error.message : "Unexpected server error",
    };
  })

  .get("/api/dashboard/metrics", () => getDashboardMetrics())

  .get("/api/logs", ({ query }) => getLogs(query))

  .get("/api/analytics", () => getAnalytics())

  .get("/api/threat-categories", () => getThreatCategories())

  .get("/api/settings/health", () => ({
    status: "ok",
    api: "online",
    backend: "online",
    uptime: Math.round(process.uptime()),
    version,
    database: dbHealth(),
    gemini: Bun.env.GEMINI_API_KEY ? "configured" : "missing-key",
    scanCount: queryScans().length,
    environment: {
      runtime: `Bun ${Bun.version}`,
      nodeEnv: Bun.env.NODE_ENV ?? "production",
      port,
      appUrl: Bun.env.APP_URL ?? "",
      apiUrl: Bun.env.API_URL ?? "",
    },
  }))

  .get("/api/search", ({ query }) => getSearchResults(query.q?.trim() ?? ""))

  .get("/api/notifications", () => getNotifications())

  .patch("/api/notifications/:id/read", ({ params }) => {
    markNotificationRead(params.id);
    return { success: true };
  })

  .patch("/api/notifications/read-all", () => {
    markAllNotificationsRead();
    return { success: true };
  })

  .delete("/api/notifications", () => {
    clearNotifications();
    return { success: true };
  })

  .get("/api/settings", () => ({
    riskThreshold: Number(getSetting("riskThreshold") ?? 70),
    pollingInterval: Number(getSetting("pollingInterval") ?? 5000),
    theme: getSetting("theme") ?? "dark",
  }))

  .put(
    "/api/settings",
    ({ body }) => {
      if (typeof body.riskThreshold === "number") setSetting("riskThreshold", String(body.riskThreshold));
      if (typeof body.pollingInterval === "number") setSetting("pollingInterval", String(body.pollingInterval));
      if (typeof body.theme === "string") setSetting("theme", body.theme);
      return {
        success: true,
        settings: {
          riskThreshold: Number(getSetting("riskThreshold") ?? 70),
          pollingInterval: Number(getSetting("pollingInterval") ?? 5000),
          theme: getSetting("theme") ?? "dark",
        },
      };
    },
    {
      body: t.Object({
        riskThreshold: t.Optional(t.Number()),
        pollingInterval: t.Optional(t.Number()),
        theme: t.Optional(t.String()),
      }),
    },
  )

  .post(
    "/api/scans/record",
    ({ body }) => {
      addManualScan(body);
      return { success: true, metrics: getDashboardMetrics() };
    },
    {
      body: t.Object({
        url: t.String(),
        risk: t.Optional(t.Number()),
        trustScore: t.Optional(t.Number()),
        category: t.Optional(t.Union(threatCategories.map((category) => t.Literal(category)))),
        status: t.Optional(t.Union([t.Literal("Dangerous"), t.Literal("Suspicious"), t.Literal("Safe")])),
        brand: t.Optional(t.Nullable(t.String())),
        createdAt: t.Optional(t.String()),
      }),
    },
  )

  .post(
    "/api/analyze-site/Anti-Phishing",
    async ({ body }) => {
      const { url, screenshot } = body;

      const cleanedUrl = url.trim().replace(/\n/g, "").replace(/\r/g, "");
      const isValidUrl = /^https?:\/\//.test(cleanedUrl);

      if (!isValidUrl) {
        return {
          success: false,
          error: "INVALID_URL",
          message:
            "ERROR: Invalid URL! Please enter a real link starting with http:// or https://",
        };
      }

      const cleanBase64 = screenshot.replace(
        /^data:image\/(png|jpeg|webp);base64,/,
        "",
      );

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: [
            {
              role: "user",
              parts: [
                { text: `Please check this URL: ${cleanedUrl}` },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            systemInstruction: `You are an elite Cybersecurity Threat Analyst and Anti-Phishing Specialist. Your objective is to analyze a provided URL alongside a screenshot of the webpage to determine if the site is a phishing attempt, a scam, or a legitimate service. 

You must specifically look for attempts to impersonate popular, high-traffic websites (e.g., Google, Microsoft, Apple, Amazon, PayPal, major banks, and social media platforms).

Apply the following analytical framework before making your decision:
1. URL Forensics: Detect typosquatting (e.g., "paypa1.com" instead of "paypal.com"), suspicious top-level domains (.xyz, .tk), misleading subdomains (e.g., "secure-login.apple.com.scamdomain.net"), or character homoglyphs.
2. Visual & Brand Impersonation: Cross-reference the screenshot's UI, logos, and layout against the established design standards of popular brands. Look for pixelated assets, outdated styling, mismatched typography, or misplaced elements.
3. Behavioral Intent: Identify credential harvesting forms, requests for sensitive data (seed phrases, credit cards), and urgency triggers ("Your account will be suspended immediately").

You MUST output your final evaluation STRICTLY as a valid JSON object. Do not wrap the output in markdown blocks (e.g., \`\`\`json) and do not include any conversational text.

Use the exact JSON schema below:
{
  "isPhishing": <boolean, true if it is a scam or impersonation attempt>,
  "trustScore": <number between 0 and 100, where 0 is malicious and 100 is fully legitimate>,
  "impersonatedBrand": "<string, the name of the popular brand being spoofed, or null if none>",
  "riskLevel": "<Critical High Low Medium Safe |>",
}`,
          },
        });

        const aiResult = JSON.parse(response.text!);

        const currentScore = aiResult.trustScore || 0;
        let status = "";

        if (currentScore >= 75) {
          status = "🟢 [SAFE] - This website is secure to use.";
        } else if (currentScore >= 40) {
          status =
            "🟡 [WARNING] - Caution: The website has some suspicious elements.";
        } else {
          status = "🔴 [DANGEROUS] - Alert: High risk of phishing or malware!";
        }

        recordScan(cleanedUrl, aiResult);

        return {
          success: true,
          status: status,
          result: aiResult,
        };
      } catch (error) {
        console.error(error);
        return {
          success: false,
          error: "حاول في وقت لاحق",
        };
      }
    },
    {
      body: t.Object({
        url: t.String(),
        screenshot: t.String(),
      }),
    },
  )

  .post(
    "/api/analyze-site/trusted",
    async ({ body }) => {
      const { url, screenshot } = body;

      const cleanedUrl = url.trim().replace(/\n/g, "").replace(/\r/g, "");
      const isValidUrl = /^https?:\/\//.test(cleanedUrl);

      if (!isValidUrl) {
        return {
          success: false,
          error: "INVALID_URL",
          message:
            "ERROR: Invalid URL! Please enter a real link starting with http:// or https://",
        };
      }

      const cleanBase64 = screenshot.replace(
        /^data:image\/(png|jpeg|webp);base64,/,
        "",
      );

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: [
            {
              role: "user",
              parts: [
                { text: `Please check this URL: ${cleanedUrl}` },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            systemInstruction: `You are an expert Cybersecurity Auditor and Phishing Detection Specialist. Your task is to analyze the provided website URL and the screenshot of the webpage to determine if it is a legitimate site, a phishing attempt, or a scam.

Evaluate the following strictly:
1. URL Analysis: Check for typosquatting (e.g., g00gle.com instead of google.com), suspicious TLDs, or mismatched brand names.
2. Visual & Content Analysis (Screenshot): Look for poor design, pixelated logos, grammatical errors, or mismatched branding.
3. Intent Analysis: Does the site aggressively ask for sensitive information (passwords, credit cards, crypto phrases) or create a false sense of urgency?

Provide a "Trust Score" from 0 to 100, where:
- 0 = Absolute Scam / Malicious
- 100 = Completely Safe / Legitimate

You MUST respond ONLY with a valid JSON object. Do not include any markdown formatting (like \`\`\`json), explanations outside the JSON, or conversational text. Use the exact structure below:

{
  "trustScore": <number between 0 and 100>,
  "isScam": <boolean, true if score is below 50>,
  "riskLevel": "<Critical High Low Medium |>",
  "analysis": "<A 2-sentence concise, detailing explanation in reasoning the>",
  "redFlags": ["<list of specific suspicious elements found>"]
}`,
          },
        });

        const aiResult = JSON.parse(response.text!);

        const currentScore = aiResult.trustScore || 0;
        let status = "";

        if (currentScore >= 75) {
          status = "🟢 [SAFE] - This website is secure to use.";
        } else if (currentScore >= 40) {
          status =
            "🟡 [WARNING] - Caution: The website has some suspicious elements.";
        } else {
          status = "🔴 [DANGEROUS] - Alert: High risk of phishing or malware!";
        }

        recordScan(cleanedUrl, aiResult);

        return {
          success: true,
          status: status,
          result: aiResult,
        };
      } catch (error) {
        console.error(error);
        return {
          success: false,
          error: "حاول في وقت لاحق",
        };
      }
    },
    {
      body: t.Object({
        url: t.String(),
        screenshot: t.String(),
      }),
    },
  )

  .get("/*", ({ request }) => {
    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith("/api")) {
      return new Response("Not Found", { status: 404 });
    }
    return serveFrontend(pathname);
  })

  .listen(port);

console.log(`🚀 Server running on ${Bun.env.APP_URL ?? `http://localhost:${port}`}`);
