import { apiFetch } from "./api";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const notificationService = {
  async list(): Promise<Notification[]> {
    return apiFetch<Notification[]>("/api/notifications", undefined, true);
  },
  async markAllRead(): Promise<void> {
    await apiFetch<{ message: string }>("/api/notifications/read-all", { method: "POST" }, true);
  },
  async unreadCount(): Promise<number> {
    const data = await apiFetch<{ count: number }>("/api/notifications/unread-count", undefined, true);
    return data.count;
  },
  async clearAll(): Promise<void> {
    await apiFetch<{ message: string }>("/api/notifications", { method: "DELETE" }, true);
  },
};
