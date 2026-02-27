import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { communityService } from "@/services/communityService";

export function useCommunityPosts(search?: string) {
  return useInfiniteQuery({
    queryKey: ["community", "posts", search ?? ""],
    queryFn: ({ pageParam }: { pageParam?: number }) =>
      communityService.listPosts(pageParam, search),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => communityService.createPost(content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => communityService.deletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: number; emoji: string }) =>
      communityService.toggleReaction(postId, emoji),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });
}
