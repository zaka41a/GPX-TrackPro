import { apiFetch } from "./api";

export interface Subscription {
  id?: number;
  status: string; // trial | active | inactive | expired | none
  periodStart?: string | null;
  periodEnd?: string | null;
  notes?: string;
  activatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface SubscriptionWithUser {
  id: number;
  userId: number;
  status: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  notes?: string;
  activatedBy?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

export type SubscriptionAction = "activate" | "extend" | "deactivate";

export const subscriptionService = {
  async getMySubscription(): Promise<Subscription> {
    return apiFetch<Subscription>("/api/account/subscription", undefined, true);
  },

  async listSubscriptions(): Promise<SubscriptionWithUser[]> {
    return apiFetch<SubscriptionWithUser[]>("/api/admin/subscriptions", undefined, true);
  },

  async updateSubscription(userId: number, action: SubscriptionAction, notes?: string): Promise<void> {
    await apiFetch<{ message: string }>(`/api/admin/subscriptions/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ action, notes: notes ?? "" }),
    }, true);
  },
};
