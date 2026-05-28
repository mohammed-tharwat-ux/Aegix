import { Database } from "bun:sqlite";

export type ThreatStatus = "Dangerous" | "Suspicious" | "Safe";
export type ThreatCategory = "Fake Login" | "Suspicious Domain" | "Phishing" | "Urgency Language";
export type NotificationSeverity = "info" | "warning" | "danger" | "success";

export interface ScanRecord {
  id: string;
  url: string;
  risk: number;
  category: ThreatCategory;
  status: ThreatStatus;
  brand: string | null;
  createdAt: string;
}

export interface AppNotificationRecord {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  read: number;
}

const dbPath = Bun.env.AEGIX_DB_PATH ?? "./aegix.sqlite";
export const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    risk INTEGER NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    brand TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export function insertScan(scan: ScanRecord) {
  db.query(
    `INSERT INTO scans (id, url, risk, category, status, brand, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(scan.id, scan.url, scan.risk, scan.category, scan.status, scan.brand, scan.createdAt);
}

export function listScans(limit = 250): ScanRecord[] {
  return db.query(`SELECT * FROM scans ORDER BY datetime(createdAt) DESC LIMIT ?`).all(limit) as ScanRecord[];
}

export function queryScans(whereClause = "", params: any[] = []): ScanRecord[] {
  return db.query(`SELECT * FROM scans ${whereClause} ORDER BY datetime(createdAt) DESC`).all(...params) as ScanRecord[];
}

export function getNotifications(limit = 50): AppNotificationRecord[] {
  return db.query(`SELECT * FROM notifications ORDER BY datetime(createdAt) DESC LIMIT ?`).all(limit) as AppNotificationRecord[];
}

export function upsertNotification(notification: AppNotificationRecord) {
  db.query(
    `INSERT INTO notifications (id, title, message, severity, createdAt, read)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title=excluded.title, message=excluded.message, severity=excluded.severity, createdAt=excluded.createdAt, read=excluded.read`,
  ).run(notification.id, notification.title, notification.message, notification.severity, notification.createdAt, notification.read);
}

export function clearNotifications() {
  db.query(`DELETE FROM notifications`).run();
}

export function markNotificationRead(id: string) {
  db.query(`UPDATE notifications SET read = 1 WHERE id = ?`).run(id);
}

export function markAllNotificationsRead() {
  db.query(`UPDATE notifications SET read = 1`).run();
}

export function getSetting(key: string) {
  const row = db.query(`SELECT value FROM settings WHERE key = ?`).get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  db.query(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value);
}

export function dbHealth() {
  try {
    db.query(`SELECT 1`).get();
    return "healthy" as const;
  } catch {
    return "unhealthy" as const;
  }
}
