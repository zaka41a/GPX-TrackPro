import { CommunityPost, CommunityComment, CommunityBan } from "@/types";
import { apiFetch } from "./api";

export const communityService = {
  async listPosts(cursor?: number): Promise<{ posts: CommunityPost[]; nextCursor: number | null }> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", String(cursor));
    const q = params.toString();
    return apiFetch<{ posts: CommunityPost[]; nextCursor: number | null }>(
      `/api/community/posts${q ? `?${q}` : ""}`,
      undefined,
      true,
    );
  },

  async createPost(content: string, activityId?: number): Promise<CommunityPost> {
    return apiFetch<CommunityPost>("/api/community/posts", {
      method: "POST",
      body: JSON.stringify({ content, activityId }),
    }, true);
  },

  async getPost(id: number): Promise<{ post: CommunityPost; comments: CommunityComment[] }> {
    return apiFetch<{ post: CommunityPost; comments: CommunityComment[] }>(
      `/api/community/posts/${id}`,
      undefined,
      true,
    );
  },

  async deletePost(id: number): Promise<void> {
    await apiFetch<{ message: string }>(`/api/community/posts/${id}`, { method: "DELETE" }, true);
  },

  async listComments(postId: number): Promise<CommunityComment[]> {
    const data = await this.getPost(postId);
    return data.comments;
  },

  async addComment(postId: number, content: string): Promise<CommunityComment> {
    return apiFetch<CommunityComment>(`/api/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }, true);
  },

  async deleteComment(id: number): Promise<void> {
    await apiFetch<{ message: string }>(`/api/community/comments/${id}`, { method: "DELETE" }, true);
  },

  async toggleReaction(postId: number, emoji: string): Promise<{ added: boolean }> {
    return apiFetch<{ added: boolean }>(`/api/community/posts/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }, true);
  },

  async pinPost(id: number, pinned: boolean): Promise<void> {
    await apiFetch<{ message: string }>(`/api/community/posts/${id}/pin`, {
      method: "PUT",
      body: JSON.stringify({ pinned }),
    }, true);
  },

  async banUser(userId: number, reason: string): Promise<void> {
    await apiFetch<{ message: string }>("/api/community/bans", {
      method: "POST",
      body: JSON.stringify({ userId, reason }),
    }, true);
  },

  async unbanUser(userId: number): Promise<void> {
    await apiFetch<{ message: string }>(`/api/community/bans/${userId}`, { method: "DELETE" }, true);
  },

  async listBans(): Promise<CommunityBan[]> {
    return apiFetch<CommunityBan[]>("/api/community/bans", undefined, true);
  },
};
