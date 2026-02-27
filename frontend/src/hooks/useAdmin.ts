import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { communityService } from "@/services/communityService";
import { AdminStats } from "@/types";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminService.getUsers(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAdminStats() {
  const { data: users, isLoading } = useAdminUsers();
  const stats: AdminStats | null = users
    ? {
        totalUsers: users.length,
        pendingUsers: users.filter((u) => u.status === "pending").length,
        approvedUsers: users.filter((u) => u.status === "approved").length,
        rejectedUsers: users.filter((u) => u.status === "rejected").length,
      }
    : null;
  return { data: stats, isLoading };
}

export function useAdminBans() {
  return useQuery({
    queryKey: ["admin", "bans"],
    queryFn: () => communityService.listBans(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAdminActions() {
  return useMutation({
    mutationFn: async ({
      type,
      userId,
    }: {
      type: "approve" | "reject" | "delete";
      userId: string;
    }) => {
      if (type === "approve") return adminService.approveUser(userId);
      if (type === "reject") return adminService.rejectUser(userId);
      return adminService.deleteUser(userId);
    },
    onSettled: (_data, _err, _vars, _ctx) => {
      // Caller invalidates as needed
    },
  });
}

export function useAdminBanMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "bans"] });
  };

  const unban = useMutation({
    mutationFn: (userId: number) => communityService.unbanUser(userId),
    onSuccess: invalidate,
  });

  return { unban };
}
