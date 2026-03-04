import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService, SubscriptionAction, PlanName } from "@/services/subscriptionService";

export function useMySubscription() {
  return useQuery<Subscription | null>({
    queryKey: ["subscription", "me"],
    queryFn: async () => {
      try {
        return await subscriptionService.getMySubscription();
      } catch {
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
    mutationFn: ({ userId, action, notes, planName }: { userId: number; action: SubscriptionAction; notes?: string; planName?: PlanName }) =>
      subscriptionService.updateSubscription(userId, action, notes, planName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    },
  });
}

export function useRequestUpgrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planName: PlanName) => subscriptionService.requestUpgrade(planName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription", "me"] });
    },
  });
}
