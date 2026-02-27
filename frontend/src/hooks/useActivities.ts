import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/activityService";

export const ACTIVITIES_KEY = ["activities"] as const;

export function useActivities() {
  return useQuery({
    queryKey: ACTIVITIES_KEY,
    queryFn: () => activityService.getActivities(1, 100),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ["activity", id],
    queryFn: () => activityService.getActivityById(id),
    staleTime: 30_000,
    retry: 1,
    enabled: !!id,
  });
}
