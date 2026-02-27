package api

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

// ---------- Posts ----------

func (h *Handler) communityListPosts(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	banned, err := h.store.IsBanned(r.Context(), user.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to check ban status")
		return
	}
	if banned {
		writeErrCode(w, http.StatusForbidden, "banned", "you are banned from the community")
		return
	}

	var cursor *int64
	if c := r.URL.Query().Get("cursor"); c != "" {
		v, err := strconv.ParseInt(c, 10, 64)
		if err == nil {
			cursor = &v
		}
	}

	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}

	search := strings.TrimSpace(r.URL.Query().Get("q"))

	result, err := h.store.ListPosts(r.Context(), cursor, limit, user.ID, search)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list posts")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) communityCreatePost(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	banned, err := h.store.IsBanned(r.Context(), user.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to check ban status")
		return
	}
	if banned {
		writeErrCode(w, http.StatusForbidden, "banned", "you are banned from the community")
		return
	}

	var req struct {
		Content    string `json:"content"`
		ActivityID *int64 `json:"activityId,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Content) == "" {
		writeErr(w, http.StatusBadRequest, "content is required")
		return
	}
	if len(req.Content) > 5000 {
		writeErr(w, http.StatusBadRequest, "post content must be at most 5000 characters")
		return
	}

	post, err := h.store.CreatePost(r.Context(), user.ID, req.Content, req.ActivityID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to create post")
		return
	}
	post.AuthorName = user.FirstName + " " + user.LastName
	writeJSON(w, http.StatusCreated, post)

	// Notify all other approved users asynchronously — failure is non-fatal.
	go func() {
		ids, err := h.store.ListApprovedUserIDs(context.Background(), user.ID)
		if err != nil {
			return
		}
		authorName := strings.TrimSpace(user.FirstName + " " + user.LastName)
		preview := req.Content
		if len(preview) > 100 {
			preview = preview[:100] + "…"
		}
		for _, id := range ids {
			_ = h.store.CreateNotification(context.Background(), id,
				authorName+" posted in Community",
				preview,
			)
		}
	}()
}

func (h *Handler) communityGetPost(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	id, err := parsePostID(r.URL.Path)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid post id")
		return
	}

	post, err := h.store.GetPost(r.Context(), id)
	if err != nil {
		writeErr(w, http.StatusNotFound, "post not found")
		return
	}

	// Load reactions for this single post
	reactions, err := h.store.LoadReactionsForPosts(r.Context(), []int64{id}, user.ID)
	if err == nil {
		if r, ok := reactions[id]; ok {
			post.Reactions = r
		}
	}

	comments, err := h.store.ListComments(r.Context(), id)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list comments")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"post":     post,
		"comments": comments,
	})
}

func (h *Handler) communityDeletePost(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	id, err := parsePostID(r.URL.Path)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid post id")
		return
	}

	// Only author or admin can delete
	authorID, err := h.store.GetPostAuthorID(r.Context(), id)
	if err != nil {
		writeErr(w, http.StatusNotFound, "post not found")
		return
	}
	if authorID != user.ID && user.Role != "admin" {
		writeErrCode(w, http.StatusForbidden, "forbidden", "not authorized to delete this post")
		return
	}

	if err := h.store.DeletePost(r.Context(), id); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to delete post")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "post deleted"})
}

// ---------- Comments ----------

func (h *Handler) communityAddComment(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	banned, err := h.store.IsBanned(r.Context(), user.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to check ban status")
		return
	}
	if banned {
		writeErrCode(w, http.StatusForbidden, "banned", "you are banned from the community")
		return
	}

	postID, err := parseCommentPostID(r.URL.Path)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Content) == "" {
		writeErr(w, http.StatusBadRequest, "content is required")
		return
	}
	if len(req.Content) > 2000 {
		writeErr(w, http.StatusBadRequest, "comment content must be at most 2000 characters")
		return
	}

	comment, err := h.store.CreateComment(r.Context(), postID, user.ID, req.Content)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to add comment")
		return
	}
	comment.AuthorName = user.FirstName + " " + user.LastName

	// Notify the post author (skip if commenter is the author)
	if authorID, err := h.store.GetPostAuthorID(r.Context(), postID); err == nil && authorID != user.ID {
		_ = h.store.CreateNotification(r.Context(), authorID,
			"New comment on your post",
			user.FirstName+" "+user.LastName+" commented on your post.",
		)
	}

	writeJSON(w, http.StatusCreated, comment)
}

func (h *Handler) communityDeleteComment(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	raw := strings.TrimPrefix(r.URL.Path, "/api/community/comments/")
	id, err := strconv.ParseInt(strings.Trim(raw, "/"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid comment id")
		return
	}

	authorID, err := h.store.GetCommentAuthorID(r.Context(), id)
	if err != nil {
		writeErr(w, http.StatusNotFound, "comment not found")
		return
	}
	if authorID != user.ID && user.Role != "admin" {
		writeErrCode(w, http.StatusForbidden, "forbidden", "not authorized to delete this comment")
		return
	}

	if err := h.store.DeleteComment(r.Context(), id); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to delete comment")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "comment deleted"})
}

// ---------- Reactions ----------

func (h *Handler) communityToggleReaction(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	postID, err := parseReactionPostID(r.URL.Path)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var req struct {
		Emoji string `json:"emoji"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Emoji == "" {
		writeErr(w, http.StatusBadRequest, "emoji is required")
		return
	}

	added, err := h.store.ToggleReaction(r.Context(), postID, user.ID, req.Emoji)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to toggle reaction")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"added": added})
}

// ---------- Pin ----------

func (h *Handler) communityPinPost(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	raw := strings.TrimPrefix(r.URL.Path, "/api/community/posts/")
	parts := strings.Split(strings.Trim(raw, "/"), "/")
	if len(parts) < 1 {
		writeErr(w, http.StatusBadRequest, "invalid path")
		return
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var req struct {
		Pinned bool `json:"pinned"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.store.PinPost(r.Context(), id, req.Pinned); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to pin/unpin post")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "post updated"})
}

// ---------- Bans ----------

func (h *Handler) communityBanUser(w http.ResponseWriter, r *http.Request) {
	admin, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	var req struct {
		UserID int64  `json:"userId"`
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.UserID == 0 {
		writeErr(w, http.StatusBadRequest, "userId is required")
		return
	}

	if err := h.store.BanUser(r.Context(), req.UserID, admin.ID, req.Reason); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to ban user")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"message": "user banned"})
}

func (h *Handler) communityUnbanUser(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	raw := strings.TrimPrefix(r.URL.Path, "/api/community/bans/")
	userID, err := strconv.ParseInt(strings.Trim(raw, "/"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.store.UnbanUser(r.Context(), userID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to unban user")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "user unbanned"})
}

func (h *Handler) communityListBans(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	bans, err := h.store.ListBans(r.Context())
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list bans")
		return
	}
	writeJSON(w, http.StatusOK, bans)
}

// ---------- Path helpers ----------

func parsePostID(path string) (int64, error) {
	raw := strings.TrimPrefix(path, "/api/community/posts/")
	raw = strings.Split(strings.Trim(raw, "/"), "/")[0]
	return strconv.ParseInt(raw, 10, 64)
}

func parseCommentPostID(path string) (int64, error) {
	// /api/community/posts/{id}/comments
	raw := strings.TrimPrefix(path, "/api/community/posts/")
	parts := strings.Split(strings.Trim(raw, "/"), "/")
	if len(parts) < 1 {
		return 0, strconv.ErrSyntax
	}
	return strconv.ParseInt(parts[0], 10, 64)
}

func parseReactionPostID(path string) (int64, error) {
	// /api/community/posts/{id}/reactions
	raw := strings.TrimPrefix(path, "/api/community/posts/")
	parts := strings.Split(strings.Trim(raw, "/"), "/")
	if len(parts) < 1 {
		return 0, strconv.ErrSyntax
	}
	return strconv.ParseInt(parts[0], 10, 64)
}
