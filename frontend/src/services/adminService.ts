import { AdminAction, AdminStats, User } from "@/types";
import { apiFetch } from "./api";

type BackendUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected";
  avatarUrl: string;
  createdAt: string;
};

type BackendAction = {
  id: number;
  adminId: number;
  targetUserId: number;
  action: "approve" | "reject";
  createdAt: string;
  adminEmail: string;
  targetEmail: string;
};

type PaginatedUsers = {
  items: BackendUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

let cacheUsers: User[] = [];

function mapUser(u: BackendUser): User {
  return {
    id: String(u.id),
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    role: u.role,
    status: u.status,
    avatarUrl: u.avatarUrl || "",
    createdAt: u.createdAt,
  };
}

export const adminService = {
  async getUsers(page = 1, pageSize = 50): Promise<User[]> {
    const result = await apiFetch<PaginatedUsers>(
      `/api/admin/users?page=${page}&pageSize=${pageSize}`,
      undefined,
      true,
    );
    cacheUsers = result.items.map(mapUser);
    return cacheUsers;
  },

  async getDashboardStats(): Promise<AdminStats> {
    const users = cacheUsers.length > 0 ? cacheUsers : await this.getUsers();
    return {
      totalUsers: users.length,
      pendingUsers: users.filter((u) => u.status === "pending").length,
      approvedUsers: users.filter((u) => u.status === "approved").length,
      rejectedUsers: users.filter((u) => u.status === "rejected").length,
    };
  },

  async approveUser(userId: string): Promise<void> {
    await apiFetch<{ message: string }>(`/api/admin/users/${userId}/approve`, { method: "PATCH" }, true);
  },

  async rejectUser(userId: string): Promise<void> {
    await apiFetch<{ message: string }>(`/api/admin/users/${userId}/reject`, { method: "PATCH" }, true);
  },

  async deleteUser(userId: string): Promise<void> {
    await apiFetch<{ message: string }>(`/api/admin/users/${userId}`, { method: "DELETE" }, true);
  },

  async getActionTimeline(): Promise<AdminAction[]> {
    const items = await apiFetch<BackendAction[]>("/api/admin/actions", undefined, true);
    return items.map((a) => ({
      id: String(a.id),
      action: a.action === "approve" ? "Approved" : "Rejected",
      targetUser: a.targetEmail,
      timestamp: a.createdAt,
    }));
  },
};
