import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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

export function useInfiniteActivities(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ["activities", "infinite", pageSize],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      activityService.getActivitiesPage(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
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
