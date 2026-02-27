package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"gpx-training-analyzer/backend/internal/auth"
)

// ---------- Notifications ----------

func (h *Handler) listNotifications(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}
	items, err := h.store.ListNotifications(r.Context(), user.ID, 20)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list notifications")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) markNotificationsRead(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}
	if err := h.store.MarkAllNotificationsRead(r.Context(), user.ID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to mark notifications read")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "ok"})
}

func (h *Handler) clearNotifications(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}
	if err := h.store.DeleteAllNotifications(r.Context(), user.ID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to clear notifications")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "ok"})
}

func (h *Handler) notificationUnreadCount(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}
	count, err := h.store.NotificationUnreadCount(r.Context(), user.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to get unread count")
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{"count": count})
}

// ---------- Password Reset ----------

func (h *Handler) forgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		writeErr(w, http.StatusBadRequest, "email is required")
		return
	}

	// Always return success to prevent email enumeration
	user, err := h.store.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]string{"message": "if the email exists you will receive a reset link"})
		return
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to generate token")
		return
	}
	token := hex.EncodeToString(tokenBytes)
	expiresAt := time.Now().Add(1 * time.Hour)

	if err := h.store.CreatePasswordResetToken(r.Context(), user.ID, token, expiresAt); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to create reset token")
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	resetURL := frontendURL + "/reset-password?token=" + token

	if err := sendPasswordResetEmail(user.Email, resetURL); err != nil {
		// Don't expose SMTP errors to the client
		writeErr(w, http.StatusInternalServerError, "failed to send email")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "if the email exists you will receive a reset link"})
}

func (h *Handler) resetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Token) == "" {
		writeErr(w, http.StatusBadRequest, "token is required")
		return
	}
	if len(req.Password) < 8 {
		writeErr(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}

	userID, err := h.store.GetPasswordResetUserID(r.Context(), req.Token)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid or expired token")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	if err := h.store.UpdatePasswordHash(r.Context(), userID, hash); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to update password")
		return
	}

	_ = h.store.DeletePasswordResetToken(r.Context(), req.Token)

	writeJSON(w, http.StatusOK, map[string]string{"message": "password updated successfully"})
}
