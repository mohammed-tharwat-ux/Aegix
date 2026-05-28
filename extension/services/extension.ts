import type { ExtensionConfig, ScanResult } from "../types";

const STORAGE_KEY = "aegix-extension-config";

async function getStorage<T>(key: string, fallback: T): Promise<T> {
  const data = await chrome.storage.sync.get(key);
  return (data[key] as T | undefined) ?? fallback;
}

export async function loadExtensionConfig(): Promise<ExtensionConfig> {
  return getStorage<ExtensionConfig>(STORAGE_KEY, {
    backendUrl: import.meta.env.VITE_API_URL ?? "",
    autoScan: true,
  });
}

export async function saveExtensionConfig(config: ExtensionConfig) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: config });
}

export async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function captureVisibleTab() {
  const windowId = (await getCurrentTab())?.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
  return chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 80 });
}

async function analyzeWithBackend(backendUrl: string, url: string, screenshot: string) {
  const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/analyze-site/Anti-Phishing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, screenshot }),
  });

  if (!response.ok) {
    throw new Error(`Backend responded with ${response.status}`);
  }

  return response.json();
}

export async function scanPageForTab(tabId?: number) {
  const config = await loadExtensionConfig();
  const tab = tabId ? await chrome.tabs.get(tabId) : await getCurrentTab();
  if (!tab?.url) throw new Error("No active tab to scan");
  if (!/^https?:\/\//.test(tab.url)) throw new Error("Unsupported URL");
  const screenshot = await captureVisibleTab();
  const response = await analyzeWithBackend(config.backendUrl, tab.url, screenshot);
  const result = {
    url: tab.url,
    trustScore: Number(response?.result?.trustScore ?? 0),
    riskLevel: String(response?.result?.riskLevel ?? "Safe"),
    status: String(response?.status ?? "Scan completed"),
    category: String(response?.result?.riskLevel ?? "Phishing"),
    threats: Array.isArray(response?.result?.redFlags) ? response.result.redFlags.map((item: unknown) => String(item)) : [],
    brand: response?.result?.impersonatedBrand ? String(response.result.impersonatedBrand) : null,
    backendUrl: config.backendUrl,
  };
  return result satisfies ScanResult;
}

export async function saveScanResult(result: ScanResult) {
  const config = await loadExtensionConfig();
  await fetch(`${config.backendUrl.replace(/\/$/, "")}/api/scans/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: result.url,
      trustScore: result.trustScore,
      category: result.category || "Phishing",
      status: result.trustScore >= 75 ? "Safe" : result.trustScore >= 40 ? "Suspicious" : "Dangerous",
      risk: Math.max(0, 100 - result.trustScore),
      brand: result.brand ?? null,
    }),
  });
}
