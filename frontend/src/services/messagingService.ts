import { DMConversation, DMMessage, User } from "@/types";
import { apiFetch } from "./api";

type BackendUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export const messagingService = {
  async listConversations(): Promise<DMConversation[]> {
    return apiFetch<DMConversation[]>("/api/messages/conversations", undefined, true);
  },

  async getOrCreateConversation(userId: number): Promise<DMConversation> {
    return apiFetch<DMConversation>("/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }, true);
  },

  async listMessages(conversationId: number, cursor?: number): Promise<{ messages: DMMessage[]; nextCursor: number | null }> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", String(cursor));
    const q = params.toString();
    return apiFetch<{ messages: DMMessage[]; nextCursor: number | null }>(
      `/api/messages/conversations/${conversationId}/messages${q ? `?${q}` : ""}`,
      undefined,
      true,
    );
  },

  async sendMessage(conversationId: number, content: string): Promise<DMMessage> {
    return apiFetch<DMMessage>(`/api/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }, true);
  },

  async markRead(conversationId: number): Promise<void> {
    await apiFetch<{ message: string }>(`/api/messages/conversations/${conversationId}/read`, {
      method: "POST",
    }, true);
  },

  async getUnreadCount(): Promise<number> {
    const data = await apiFetch<{ count: number }>("/api/messages/unread-count", undefined, true);
    return data.count;
  },

  async listApprovedUsers(): Promise<User[]> {
    const users = await apiFetch<BackendUser[]>("/api/users/approved", undefined, true);
    return users.map((u) => ({
      id: String(u.id),
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      role: u.role as User["role"],
      status: u.status as User["status"],
      createdAt: u.createdAt,
    }));
  },
};
