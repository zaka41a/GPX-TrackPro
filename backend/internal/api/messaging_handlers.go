package api

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

func (h *Handler) messagingListConversations(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	convos, err := h.store.ListConversations(r.Context(), user.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list conversations")
		return
	}
	writeJSON(w, http.StatusOK, convos)
}

func (h *Handler) messagingCreateConversation(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	var req struct {
		UserID int64 `json:"userId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.UserID == 0 || req.UserID == user.ID {
		writeErr(w, http.StatusBadRequest, "invalid userId")
		return
	}

	convo, err := h.store.GetOrCreateConversation(r.Context(), user.ID, req.UserID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to create conversation")
		return
	}
	writeJSON(w, http.StatusOK, convo)
}

func (h *Handler) messagingListMessages(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	convoID, err := parseConversationID(r.URL.Path, "/messages")
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	// Verify participant
	isParticipant, err := h.store.IsConversationParticipant(r.Context(), convoID, user.ID)
	if err != nil || !isParticipant {
		writeErrCode(w, http.StatusForbidden, "forbidden", "not a participant of this conversation")
		return
	}

	var cursor *int64
	if c := r.URL.Query().Get("cursor"); c != "" {
		v, err := strconv.ParseInt(c, 10, 64)
		if err == nil {
			cursor = &v
		}
	}

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}

	result, err := h.store.ListMessages(r.Context(), convoID, user.ID, cursor, limit)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list messages")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) messagingSendMessage(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	convoID, err := parseConversationID(r.URL.Path, "/messages")
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	isParticipant, err := h.store.IsConversationParticipant(r.Context(), convoID, user.ID)
	if err != nil || !isParticipant {
		writeErrCode(w, http.StatusForbidden, "forbidden", "not a participant of this conversation")
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
		writeErr(w, http.StatusBadRequest, "message content must be at most 2000 characters")
		return
	}

	msg, err := h.store.SendMessage(r.Context(), convoID, user.ID, req.Content)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to send message")
		return
	}
	writeJSON(w, http.StatusCreated, msg)

	// Notify the recipient asynchronously — failure is non-fatal.
	go func() {
		recipientID, err := h.store.GetConversationOtherUserID(context.Background(), convoID, user.ID)
		if err != nil {
			return
		}
		senderName := strings.TrimSpace(user.FirstName + " " + user.LastName)
		preview := req.Content
		if len(preview) > 100 {
			preview = preview[:100] + "…"
		}
		_ = h.store.CreateNotification(context.Background(), recipientID,
			"New message from "+senderName,
			preview,
		)
	}()
}

func (h *Handler) messagingMarkRead(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	convoID, err := parseConversationID(r.URL.Path, "/read")
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	isParticipant, err := h.store.IsConversationParticipant(r.Context(), convoID, user.ID)
	if err != nil || !isParticipant {
		writeErrCode(w, http.StatusForbidden, "forbidden", "not a participant of this conversation")
		return
	}

	if err := h.store.MarkRead(r.Context(), convoID, user.ID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to mark as read")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "marked as read"})
}

func (h *Handler) messagingUnreadCount(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	count, err := h.store.UnreadCount(r.Context(), user.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to get unread count")
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{"count": count})
}

func (h *Handler) messagingClearConversation(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	convoID, err := parseConversationID(r.URL.Path, "/clear")
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	isParticipant, err := h.store.IsConversationParticipant(r.Context(), convoID, user.ID)
	if err != nil || !isParticipant {
		writeErrCode(w, http.StatusForbidden, "forbidden", "not a participant of this conversation")
		return
	}

	if err := h.store.ClearConversation(r.Context(), convoID, user.ID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to clear conversation")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "conversation cleared"})
}

func (h *Handler) messagingDeleteConversation(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	convoID, err := parseConversationID(r.URL.Path, "")
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	isParticipant, err := h.store.IsConversationParticipant(r.Context(), convoID, user.ID)
	if err != nil || !isParticipant {
		writeErrCode(w, http.StatusForbidden, "forbidden", "not a participant of this conversation")
		return
	}

	if err := h.store.DeleteConversation(r.Context(), convoID, user.ID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to delete conversation")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "conversation deleted"})
}

// parseConversationID extracts the conversation ID from paths like:
// /api/messages/conversations/{id}/messages
// /api/messages/conversations/{id}/read
func parseConversationID(path, suffix string) (int64, error) {
	raw := strings.TrimPrefix(path, "/api/messages/conversations/")
	raw = strings.TrimSuffix(raw, "/"+strings.TrimPrefix(suffix, "/"))
	raw = strings.Trim(raw, "/")
	// Take just the first segment (the ID)
	parts := strings.Split(raw, "/")
	return strconv.ParseInt(parts[0], 10, 64)
}
