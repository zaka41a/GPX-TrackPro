import { useQuery } from "@tanstack/react-query";
import { messagingService } from "@/services/messagingService";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["messages", "unread"],
    queryFn: () => messagingService.getUnreadCount(),
    enabled: !!user && user.status === "approved",
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: 1,
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: () => messagingService.listConversations(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ["messages", "conversation", conversationId],
    queryFn: () => messagingService.listMessages(conversationId!),
    enabled: conversationId !== null,
    staleTime: 15_000,
    retry: 1,
  });
}
