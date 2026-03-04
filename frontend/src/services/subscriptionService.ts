import { apiFetch } from "./api";

export interface Subscription {
  id?: number;
  status: string;
  planName?: string;
  requestedPlan?: string;
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
  planName: string;
  requestedPlan: string;
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

export type SubscriptionAction = "activate" | "extend" | "deactivate" | "setPlan";
export type PlanName = "starter" | "pro" | "premium";

export const subscriptionService = {
  async getMySubscription(): Promise<Subscription> {
    return apiFetch<Subscription>("/api/account/subscription", undefined, true);
  },

  async listSubscriptions(): Promise<SubscriptionWithUser[]> {
    return apiFetch<SubscriptionWithUser[]>("/api/admin/subscriptions", undefined, true);
  },

  async updateSubscription(userId: number, action: SubscriptionAction, notes?: string, planName?: PlanName): Promise<void> {
    await apiFetch<{ message: string }>(`/api/admin/subscriptions/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ action, notes: notes ?? "", planName: planName ?? "" }),
    }, true);
  },

  async requestUpgrade(planName: PlanName): Promise<void> {
    await apiFetch<{ message: string }>("/api/account/subscription/request", {
      method: "POST",
      body: JSON.stringify({ planName }),
    }, true);
  },

  async createCheckout(planName: "pro" | "premium"): Promise<string> {
    const res = await apiFetch<{ url: string }>("/api/account/subscription/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: planName }),
    }, true);
    return res.url;
  },
};
