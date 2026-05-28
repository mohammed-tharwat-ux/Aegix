import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw, Shield, ShieldAlert, ShieldCheck, ExternalLink, Settings2 } from "lucide-react";
import "./styles/popup.css";
import { getCurrentTab, loadExtensionConfig, saveScanResult, scanPageForTab } from "./services/extension";
import type { ScanResult, ExtensionConfig, ThreatSeverity } from "./types";

function scoreTone(score: number): ThreatSeverity {
  if (score >= 75) return "safe";
  if (score >= 40) return "warning";
  return "danger";
}

function App() {
  const [config, setConfig] = useState<ExtensionConfig>({ backendUrl: "http://localhost:3000", autoScan: true });
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExtensionConfig().then((next) => setConfig(next));
    getCurrentTab().then((tab) => setCurrentUrl(tab?.url ?? ""));
    scanPageForTab()
      .then(async (scan) => {
        setResult(scan);
        await saveScanResult(scan);
      })
      .catch((scanError) => setError(scanError instanceof Error ? scanError.message : "Scan failed"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      chrome.runtime.sendMessage({ type: "update-config", config }).catch(() => {});
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [config]);

  const tone = useMemo(() => scoreTone(result?.trustScore ?? 0), [result?.trustScore]);

  async function runRescan() {
    setLoading(true);
    setError(null);
    try {
      const scan = await scanPageForTab();
      setResult(scan);
      await saveScanResult(scan);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Unable to scan page");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="popup-shell">
      <header className="popup-header">
        <div className="brand-mark"><Shield size={20} /></div>
        <div>
          <h1>Aegix</h1>
          <p>Live phishing protection</p>
        </div>
        <button className="icon-button" onClick={() => setShowConfig((open) => !open)} type="button" aria-label="Open settings">
          <Settings2 size={16} />
        </button>
      </header>

      {showConfig && (
        <section className="card config-card">
          <label>
            Backend URL
            <input
              value={config.backendUrl}
              onChange={(event) => setConfig({ ...config, backendUrl: event.target.value })}
            />
          </label>
          <label className="toggle-row">
            <span>Auto scan</span>
            <input
              checked={config.autoScan}
              onChange={(event) => setConfig({ ...config, autoScan: event.target.checked })}
              type="checkbox"
            />
          </label>
        </section>
      )}

      <section className={`card score-card ${tone}`}>
        <div className="score-row">
          <div>
            <span className="eyebrow">Trust Score</span>
            <div className="score-value">{loading ? "..." : `${result?.trustScore ?? 0}/100`}</div>
          </div>
          <div className={`status-badge ${tone}`}>
            {tone === "safe" ? <ShieldCheck size={14} /> : tone === "warning" ? <AlertTriangle size={14} /> : <ShieldAlert size={14} />}
            <span>{result?.riskLevel ?? "Safe"}</span>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${result?.trustScore ?? 0}%` }} />
        </div>
      </section>

      <section className="card info-card">
        <div className="info-row">
          <span className="label">Current Page</span>
          <span className="value truncate">{currentUrl || "No active page"}</span>
        </div>
        <div className="info-row">
          <span className="label">Status</span>
          <span className={`pill ${tone}`}>{result?.status ?? "Scanning"}</span>
        </div>
        {result?.brand && (
          <div className="info-row">
            <span className="label">Brand</span>
            <span className="value truncate">{result.brand}</span>
          </div>
        )}
      </section>

      <section className="card threats-card">
        <div className="section-heading">
          <span>Detected Threats</span>
          <span className="muted">{result?.category ?? "None"}</span>
        </div>
        <div className="threat-list">
          {(result?.threats?.length ? result.threats : ["Awaiting analysis"]).map((item) => (
            <div className="threat-item" key={String(item)}>
              <span>{String(item)}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="popup-footer">
        <div>
          <span className="muted">Protected by Aegix</span>
          <div className="connection-row">
            <span className={`dot ${result ? "connected" : "offline"}`} />
            <span>{error ? "Connection issue" : "Live backend sync"}</span>
          </div>
        </div>
        <div className="footer-actions">
          <a className="text-link" href={config.backendUrl ? config.backendUrl.replace(/\/$/, "") : "#"} rel="noreferrer" target="_blank" onClick={(event) => !config.backendUrl && event.preventDefault()}>
            <ExternalLink size={14} /> Dashboard
          </a>
          <button className="primary-button" onClick={runRescan} type="button">
            <RefreshCcw size={14} className={loading ? "spin" : ""} />
            Rescan Page
          </button>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
