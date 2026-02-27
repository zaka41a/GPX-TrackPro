import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@/services/accountService";

export function useChangeEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ newEmail, currentPassword }: { newEmail: string; currentPassword: string }) =>
      accountService.changeEmail(newEmail, currentPassword),
    onSuccess: () => {
      // Refresh auth/me so the email updates everywhere
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      accountService.changePassword(currentPassword, newPassword),
  });
}

export function useUnlinkGoogle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => accountService.unlinkGoogle(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
