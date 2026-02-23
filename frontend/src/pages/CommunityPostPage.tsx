import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { communityService } from "@/services/communityService";
import { useAuth } from "@/hooks/useAuth";
import { CommunityPost, CommunityComment } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pin, Send, Trash2, Loader2 } from "lucide-react";
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

export default function CommunityPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id ? Number(user.id) : 0;

  const fetchPost = async () => {
    if (!id) return;
    try {
      const data = await communityService.getPost(Number(id));
      setPost(data.post);
      setComments(data.comments);
    } catch {
      navigate("/community");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleReaction = async (emoji: string) => {
    if (!post) return;
    try {
      await communityService.toggleReaction(post.id, emoji);
      await fetchPost();
    } catch {
      // silently fail
    }
  };

  const handleAddComment = async () => {
    if (!post || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await communityService.addComment(post.id, commentText.trim());
      setCommentText("");
      await fetchPost();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await communityService.deleteComment(commentId);
      await fetchPost();
    } catch {
      // silently fail
    }
  };

  const handleDeletePost = async () => {
    if (!post || !confirm("Delete this post? This will also delete all comments.")) return;
    try {
      await communityService.deletePost(post.id);
      navigate("/community");
    } catch {
      // silently fail
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/community")} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Community
          </Button>

          {loading ? (
            <div className="glass-card rounded-xl p-6 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
              <div className="h-24 bg-muted rounded" />
            </div>
          ) : post ? (
            <>
              {/* Post */}
              <div className={cn("glass-card rounded-xl p-6", post.pinned && "ring-1 ring-accent/30")}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-white">{getInitials(post.authorName)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{post.authorName}</p>
                        {post.pinned && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-accent/10 text-accent border-accent/20">
                            <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  {(post.authorId === currentUserId || isAdmin) && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={handleDeletePost}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <p className="text-foreground whitespace-pre-wrap mb-5">{post.content}</p>

                {/* Reactions */}
                <div className="flex items-center gap-1 border-t border-border pt-3">
                  {REACTION_EMOJIS.map((emoji) => {
                    const reaction = post.reactions.find((r) => r.emoji === emoji);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                          reaction?.reacted
                            ? "bg-accent/15 text-accent"
                            : "hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <span>{emoji}</span>
                        {reaction && reaction.count > 0 && (
                          <span className="font-medium text-xs">{reaction.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Comments ({comments.length})
                </h3>

                {comments.map((comment) => (
                  <div key={comment.id} className="glass-surface rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent/80 to-accent/40 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{getInitials(comment.authorName)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{comment.authorName}</p>
                          <p className="text-[11px] text-muted-foreground">{timeAgo(comment.createdAt)}</p>
                        </div>
                      </div>
                      {(comment.authorId === currentUserId || isAdmin) && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteComment(comment.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-2 ml-[38px]">{comment.content}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                )}

                {/* Comment input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    placeholder="Write a comment..."
                    className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <Button size="sm" onClick={handleAddComment} disabled={submitting || !commentText.trim()}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </PageTransition>
    </AppShell>
  );
}
