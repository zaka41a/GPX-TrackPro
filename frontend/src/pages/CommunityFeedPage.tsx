import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { communityService } from "@/services/communityService";
import { useAuth } from "@/hooks/useAuth";
import { CommunityPost } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Users, Pin, Send, MessageSquare, Trash2, Loader2, Search, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["\u{1F44D}", "\u{1F525}", "\u{1F4AA}", "\u{1F3C6}"];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [banned, setBanned] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  };

  const fetchPosts = useCallback(async (cursor?: number, q?: string) => {
    try {
      const result = await communityService.listPosts(cursor, q);
      if (cursor) {
        setPosts((prev) => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }
      setNextCursor(result.nextCursor);
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && (err as { code: string }).code === "banned") {
        setBanned(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setNextCursor(null);
    fetchPosts(undefined, debouncedSearch);
  }, [fetchPosts, debouncedSearch]);

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    setPosting(true);
    try {
      await communityService.createPost(newContent.trim());
      setNewContent("");
      setComposerOpen(false);
      await fetchPosts();
    } catch {
      // silently fail
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (postId: number, emoji: string) => {
    try {
      await communityService.toggleReaction(postId, emoji);
      await fetchPosts();
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Delete this post?")) return;
    try {
      await communityService.deletePost(postId);
      await fetchPosts();
    } catch {
      // silently fail
    }
  };

  const handlePin = async (postId: number, pinned: boolean) => {
    try {
      await communityService.pinPost(postId, !pinned);
      await fetchPosts();
    } catch {
      // silently fail
    }
  };

  const handleLoadMore = () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    fetchPosts(nextCursor, debouncedSearch);
  };

  const handleBan = async (authorId: number, authorName: string) => {
    const reason = prompt(`Ban reason for ${authorName} (optional):`);
    if (reason === null) return; // cancelled
    try {
      await communityService.banUser(authorId, reason.trim());
      await fetchPosts();
    } catch {
      // silently fail
    }
  };

  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id ? Number(user.id) : 0;

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="glass-surface rounded-xl p-5 accent-line-top space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="section-icon-bg">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Community</h1>
                  <p className="text-xs text-muted-foreground">Share your training, get feedback</p>
                </div>
              </div>
              {!banned && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {posts.length} posts
                </Badge>
              )}
            </div>
            {!banned && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 text-sm"
                />
              </div>
            )}
          </div>

          {banned ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-destructive font-medium">You are banned from the community.</p>
              <p className="text-sm text-muted-foreground mt-2">Contact an admin if you believe this is a mistake.</p>
            </div>
          ) : (
            <>
              {/* Composer */}
              {!composerOpen ? (
                <Button onClick={() => setComposerOpen(true)} className="w-full" variant="outline">
                  Share something with the community...
                </Button>
              ) : (
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-muted/50 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent min-h-[100px]"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setComposerOpen(false); setNewContent(""); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreatePost} disabled={posting || !newContent.trim()}>
                      {posting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                      Post
                    </Button>
                  </div>
                </div>
              )}

              {/* Posts */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
                      <div className="flex gap-3 mb-3">
                        <div className="h-9 w-9 rounded-full bg-muted" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-3 w-20 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-16 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className={cn("glass-card rounded-xl p-5", post.pinned && "ring-1 ring-accent/30")}>
                      {/* Post header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={post.authorName} avatarUrl={post.authorAvatar} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{post.authorName}</p>
                              {post.pinned && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-accent/10 text-accent border-accent/20">
                                  <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-accent" onClick={() => handlePin(post.id, post.pinned)} title={post.pinned ? "Unpin" : "Pin"}>
                              <Pin className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isAdmin && post.authorId !== currentUserId && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleBan(post.authorId, post.authorName)} title="Ban user">
                              <ShieldOff className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(post.authorId === currentUserId || isAdmin) && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(post.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{post.content}</p>

                      {/* Reactions + comments */}
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <div className="flex items-center gap-1">
                          {REACTION_EMOJIS.map((emoji) => {
                            const reaction = post.reactions.find((r) => r.emoji === emoji);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(post.id, emoji)}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                                  reaction?.reacted
                                    ? "bg-accent/15 text-accent"
                                    : "hover:bg-muted text-muted-foreground"
                                )}
                              >
                                <span>{emoji}</span>
                                {reaction && reaction.count > 0 && (
                                  <span className="font-medium">{reaction.count}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <Link
                          to={`/community/${post.id}`}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
                        </Link>
                      </div>
                    </div>
                  ))}

                  {posts.length === 0 && (
                    <div className="glass-card rounded-xl p-8 text-center">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-foreground font-medium">No posts yet</p>
                      <p className="text-sm text-muted-foreground">Be the first to share something!</p>
                    </div>
                  )}

                  {nextCursor && (
                    <Button variant="outline" className="w-full" onClick={handleLoadMore} disabled={loadingMore}>
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Load more
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
