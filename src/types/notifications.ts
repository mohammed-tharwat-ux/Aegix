export type NotificationSeverity = "info" | "warning" | "danger" | "success";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
}
