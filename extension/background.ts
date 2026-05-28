import type { ScanResult, ExtensionConfig, PageMeta } from "./types";
import { loadExtensionConfig, saveExtensionConfig, saveScanResult, scanPageForTab } from "./services/extension";

async function notifyDangerous(result: ScanResult) {
  const severity = result.trustScore >= 75 ? "safe" : result.trustScore >= 40 ? "warning" : "danger";
  await chrome.action.setBadgeText({
    text: severity === "safe" ? "OK" : severity === "warning" ? "!" : "!!",
  });
  await chrome.action.setBadgeBackgroundColor({
    color: severity === "safe" ? "#16a34a" : severity === "warning" ? "#f59e0b" : "#ef4444",
  });
  if (severity !== "danger") return;
  await chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.svg",
    title: "Aegix detected a dangerous page",
    message: `${result.url} scored ${result.trustScore}/100`,
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const config = await loadExtensionConfig();
  await saveExtensionConfig(config);
});

chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  if (message?.type === "update-config") {
    saveExtensionConfig(message.config as ExtensionConfig).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "scan-active-tab") {
    scanPageForTab(message.tabId ?? sender.tab?.id)
      .then(async (result) => {
        await notifyDangerous(result);
        await saveScanResult(result);
        sendResponse({ ok: true, result });
      })
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Scan failed" }));
    return true;
  }

  return false;
});

chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any, tab: any) => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  const config = await loadExtensionConfig();
  if (!config.autoScan) return;
  if (!/^https?:\/\//.test(tab.url)) return;
  try {
    const result = await scanPageForTab(tabId);
    await notifyDangerous(result);
    await saveScanResult(result);
  } catch {
    // Keep silent for background auto-scan failures.
  }
});
