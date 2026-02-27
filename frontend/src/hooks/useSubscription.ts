import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService, Subscription, SubscriptionAction } from "@/services/subscriptionService";

export function useMySubscription() {
  return useQuery<Subscription | null>({
    queryKey: ["subscription", "me"],
    queryFn: async () => {
      try {
        return await subscriptionService.getMySubscription();
      } catch {
        // Endpoint unavailable (old backend) or user has no record — never error
        return null;
      }
    },
    retry: false,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => subscriptionService.listSubscriptions(),
    staleTime: 30_000,
    refetchOnMount: "always",
    retry: 2,
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, action, notes }: { userId: number; action: SubscriptionAction; notes?: string }) =>
      subscriptionService.updateSubscription(userId, action, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    },
  });
}
