export type ThreatSeverity = "safe" | "warning" | "danger";

export interface ScanResult {
  url: string;
  trustScore: number;
  riskLevel: string;
  status: string;
  category: string;
  threats: string[];
  brand?: string | null;
  backendUrl?: string;
}

export interface ExtensionConfig {
  backendUrl: string;
  autoScan: boolean;
}

export interface PageMeta {
  url: string;
  title: string;
  forms: number;
  loginHints: boolean;
}
