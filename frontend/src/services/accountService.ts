import { apiFetch } from "./api";

export const accountService = {
  async changeEmail(newEmail: string, currentPassword: string): Promise<void> {
    await apiFetch<{ message: string }>("/api/account/email", {
      method: "PUT",
      body: JSON.stringify({ newEmail, currentPassword }),
    }, true);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiFetch<{ message: string }>("/api/account/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }, true);
  },

  async startGoogleLink(): Promise<{ url: string }> {
    return apiFetch<{ url: string }>("/auth/google/link", undefined, true);
  },

  async unlinkGoogle(): Promise<void> {
    await apiFetch<{ message: string }>("/api/account/google", {
      method: "DELETE",
    }, true);
  },
};
