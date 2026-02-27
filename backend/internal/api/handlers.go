package api

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"gpx-training-analyzer/backend/internal/auth"
	"gpx-training-analyzer/backend/internal/gpx"
	"gpx-training-analyzer/backend/internal/metrics"
	"gpx-training-analyzer/backend/internal/store"
)

type Handler struct {
	store  *store.Store
	authRL *rateLimiter
}

type registerRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	Token string     `json:"token"`
	User  store.User `json:"user"`
}

func NewHandler(store *store.Store) *Handler {
	return &Handler{
		store:  store,
		authRL: newRateLimiter(10), // 10 requests/minute on auth routes
	}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", h.health)

	mux.HandleFunc("POST /api/auth/register", h.authRL.limit(h.register))
	mux.HandleFunc("POST /api/auth/login", h.authRL.limit(h.login))
	mux.HandleFunc("POST /api/auth/logout", h.logout)
	mux.HandleFunc("GET /api/auth/me", h.me)
	mux.HandleFunc("POST /api/auth/forgot-password", h.authRL.limit(h.forgotPassword))
	mux.HandleFunc("POST /api/auth/reset-password", h.authRL.limit(h.resetPassword))

	// Account settings (no subscription check)
	mux.HandleFunc("PUT /api/account/email", h.changeEmail)
	mux.HandleFunc("PUT /api/account/password", h.changePassword)
	mux.HandleFunc("DELETE /api/account/google", h.unlinkGoogle)
	mux.HandleFunc("GET /api/account/subscription", h.getMySubscription)

	// Google OAuth (no subscription check, browser redirects)
	mux.HandleFunc("GET /auth/google/link", h.googleLinkStart)
	mux.HandleFunc("GET /auth/google/callback", h.googleLinkCallback)

	mux.HandleFunc("GET /api/notifications", h.listNotifications)
	mux.HandleFunc("POST /api/notifications/read-all", h.markNotificationsRead)
	mux.HandleFunc("DELETE /api/notifications", h.clearNotifications)
	mux.HandleFunc("GET /api/notifications/unread-count", h.notificationUnreadCount)

	mux.HandleFunc("GET /api/admin/users", h.adminListUsers)
	mux.HandleFunc("PATCH /api/admin/users/", h.adminUpdateUserStatus)
	mux.HandleFunc("DELETE /api/admin/users/", h.adminDeleteUser)
	mux.HandleFunc("GET /api/admin/actions", h.adminListActions)
	mux.HandleFunc("GET /api/admin/subscriptions", h.adminListSubscriptions)
	mux.HandleFunc("PUT /api/admin/subscriptions/", h.adminUpdateSubscription)

	mux.HandleFunc("POST /api/activities/upload", h.upload)
	mux.HandleFunc("GET /api/activities", h.list)
	mux.HandleFunc("GET /api/activities/", h.getByID)

	mux.HandleFunc("GET /api/users/approved", h.listApprovedUsers)
	mux.HandleFunc("PUT /api/users/avatar", h.updateAvatar)
	mux.HandleFunc("DELETE /api/users/me", h.deleteAccount)

	mux.HandleFunc("GET /api/profile", h.getProfile)
	mux.HandleFunc("PUT /api/profile", h.updateProfile)

	// Community
	mux.HandleFunc("GET /api/community/posts", h.communityListPosts)
	mux.HandleFunc("POST /api/community/posts", h.communityCreatePost)
	mux.HandleFunc("GET /api/community/posts/", h.communityGetPost)
	mux.HandleFunc("DELETE /api/community/posts/", h.communityDeletePost)
	mux.HandleFunc("POST /api/community/posts/{id}/comments", h.communityAddComment)
	mux.HandleFunc("DELETE /api/community/comments/", h.communityDeleteComment)
	mux.HandleFunc("POST /api/community/posts/{id}/reactions", h.communityToggleReaction)
	mux.HandleFunc("PUT /api/community/posts/{id}/pin", h.communityPinPost)

	// Community moderation
	mux.HandleFunc("POST /api/community/bans", h.communityBanUser)
	mux.HandleFunc("DELETE /api/community/bans/", h.communityUnbanUser)
	mux.HandleFunc("GET /api/community/bans", h.communityListBans)

	// Messaging
	mux.HandleFunc("GET /api/messages/conversations", h.messagingListConversations)
	mux.HandleFunc("POST /api/messages/conversations", h.messagingCreateConversation)
	mux.HandleFunc("GET /api/messages/conversations/{id}/messages", h.messagingListMessages)
	mux.HandleFunc("POST /api/messages/conversations/{id}/messages", h.messagingSendMessage)
	mux.HandleFunc("POST /api/messages/conversations/{id}/read", h.messagingMarkRead)
	mux.HandleFunc("POST /api/messages/conversations/{id}/clear", h.messagingClearConversation)
	mux.HandleFunc("DELETE /api/messages/conversations/{id}", h.messagingDeleteConversation)
	mux.HandleFunc("GET /api/messages/unread-count", h.messagingUnreadCount)

	return requestIDMiddleware(requestLogger(cors(mux)))
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	dbStatus := "connected"
	if err := h.store.Ping(r.Context()); err != nil {
		slog.Error("health check db ping failed", "err", err)
		dbStatus = "unavailable"
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "degraded", "db": dbStatus})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "db": dbStatus})
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(req.FirstName) == "" || strings.TrimSpace(req.LastName) == "" {
		writeErr(w, http.StatusBadRequest, "firstName and lastName are required")
		return
	}
	if len(req.FirstName) > 100 || len(req.LastName) > 100 {
		writeErr(w, http.StatusBadRequest, "firstName and lastName must be at most 100 characters")
		return
	}
	if len(req.Email) > 255 {
		writeErr(w, http.StatusBadRequest, "email must be at most 255 characters")
		return
	}
	if !strings.Contains(req.Email, "@") {
		writeErr(w, http.StatusBadRequest, "invalid email")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.store.CreateUser(r.Context(), req.FirstName, req.LastName, req.Email, hash)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			writeErr(w, http.StatusConflict, "email already registered")
			return
		}
		writeErr(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"message": "registration successful, waiting for admin approval",
		"user":    user,
	})
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.store.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		writeErrCode(w, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
		return
	}
	if !auth.VerifyPassword(req.Password, user.PasswordHash) {
		writeErrCode(w, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
		return
	}

	// Transparent rehash from legacy SHA-256 to bcrypt
	if auth.NeedsRehash(user.PasswordHash) {
		if newHash, err := auth.HashPassword(req.Password); err == nil {
			if err := h.store.UpdatePasswordHash(r.Context(), user.ID, newHash); err != nil {
				slog.Warn("failed to rehash password", "userID", user.ID, "err", err)
			}
		}
	}

	switch user.Status {
	case "pending":
		writeErrCode(w, http.StatusForbidden, "pending_approval", "account is pending admin approval")
		return
	case "rejected":
		writeErrCode(w, http.StatusForbidden, "rejected_account", "account has been rejected")
		return
	}

	token, err := auth.IssueToken(user.ID, user.Role, user.Status, user.Email, 24*time.Hour)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to issue token")
		return
	}

	writeJSON(w, http.StatusOK, authResponse{Token: token, User: user})
}

func (h *Handler) logout(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"message": "logged out"})
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h *Handler) adminListUsers(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	search := r.URL.Query().Get("search")
	status := r.URL.Query().Get("status")
	page, pageSize := parsePageParams(r)
	result, err := h.store.ListUsers(r.Context(), search, status, page, pageSize)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list users")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) adminUpdateUserStatus(w http.ResponseWriter, r *http.Request) {
	admin, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	raw := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	parts := strings.Split(strings.Trim(raw, "/"), "/")
	if len(parts) != 2 {
		writeErr(w, http.StatusBadRequest, "invalid admin user path")
		return
	}

	targetID, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid user id")
		return
	}

	action := parts[1]
	newStatus := ""
	switch action {
	case "approve":
		newStatus = "approved"
	case "reject":
		newStatus = "rejected"
	default:
		writeErr(w, http.StatusBadRequest, "unsupported admin action")
		return
	}

	if err := h.store.UpdateUserStatus(r.Context(), admin.ID, targetID, newStatus); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to update user status")
		return
	}

	// Notify the user of the status change
	title := "Account Approved"
	body := "Your GPX TrackPro account has been approved. You can now sign in."
	if newStatus == "rejected" {
		title = "Account Rejected"
		body = "Your GPX TrackPro account application has been rejected. Contact support for assistance."
	}
	_ = h.store.CreateNotification(r.Context(), targetID, title, body)

	writeJSON(w, http.StatusOK, map[string]string{"message": "status updated"})
}

func (h *Handler) adminDeleteUser(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	raw := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	targetID, err := strconv.ParseInt(strings.Trim(raw, "/"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.store.DeleteUser(r.Context(), targetID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to delete user")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "user deleted"})
}

func (h *Handler) adminListActions(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	actions, err := h.store.ListAdminActions(r.Context(), 100)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list admin actions")
		return
	}
	writeJSON(w, http.StatusOK, actions)
}

func (h *Handler) upload(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	if err := r.ParseMultipartForm(25 << 20); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		writeErr(w, http.StatusBadRequest, "missing file field")
		return
	}
	defer file.Close()

	payload, err := io.ReadAll(file)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "failed to read uploaded file")
		return
	}

	parsed, err := gpx.Parse(payload)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}

	sportType := strings.TrimSpace(r.FormValue("sportType"))
	if sportType == "" {
		sportType = "unknown"
	}

	computed := metrics.Compute(parsed.Points)
	activity, err := h.store.CreateActivity(r.Context(), user.ID, fileHeader.Filename, sportType, parsed, computed)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to persist activity")
		return
	}

	writeJSON(w, http.StatusCreated, activity)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	page, pageSize := parsePageParams(r)
	result, err := h.store.ListActivities(r.Context(), user.ID, page, pageSize)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list activities")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) getByID(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}

	rawID := strings.TrimPrefix(r.URL.Path, "/api/activities/")
	if rawID == "" {
		writeErr(w, http.StatusBadRequest, "missing activity id")
		return
	}
	id, err := strconv.ParseInt(rawID, 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid activity id")
		return
	}

	activity, err := h.store.GetActivity(r.Context(), id, user.ID)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") || errors.Is(err, io.EOF) {
			writeErr(w, http.StatusNotFound, "activity not found")
			return
		}
		writeErr(w, http.StatusInternalServerError, "failed to fetch activity")
		return
	}

	writeJSON(w, http.StatusOK, activity)
}

func (h *Handler) updateAvatar(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}
	var req struct {
		AvatarURL string `json:"avatarUrl"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.store.UpdateUserAvatar(r.Context(), user.ID, req.AvatarURL); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to update avatar")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "avatar updated"})
}

func (h *Handler) listApprovedUsers(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}
	page, pageSize := parsePageParams(r)
	if pageSize == 20 {
		pageSize = 100 // default larger page for the user-picker dropdown
	}
	result, err := h.store.ListApprovedUsers(r.Context(), page, pageSize)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list users")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) getProfile(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}
	profile, err := h.store.GetProfile(r.Context(), user.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to get profile")
		return
	}
	writeJSON(w, http.StatusOK, profile)
}

func (h *Handler) updateProfile(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireSubscribedUser(w, r)
	if !ok {
		return
	}
	var req store.AthleteProfile
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	profile, err := h.store.UpsertProfile(r.Context(), user.ID, req)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to update profile")
		return
	}
	writeJSON(w, http.StatusOK, profile)
}

func (h *Handler) deleteAccount(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return
	}
	if err := h.store.DeleteUser(r.Context(), user.ID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to delete account")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "account deleted"})
}

func (h *Handler) requireApprovedUser(w http.ResponseWriter, r *http.Request) (store.User, bool) {
	user, ok := h.requireAuthenticated(w, r)
	if !ok {
		return store.User{}, false
	}
	if user.Status != "approved" {
		writeErrCode(w, http.StatusForbidden, "pending_approval", "user is not approved")
		return store.User{}, false
	}
	return user, true
}

// requireSubscribedUser verifies the user is approved and has an active subscription.
// Admins bypass the subscription check. Returns 402 Payment Required if the
// subscription is missing, expired, or inactive.
func (h *Handler) requireSubscribedUser(w http.ResponseWriter, r *http.Request) (store.User, bool) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return store.User{}, false
	}
	if user.Role == "admin" {
		return user, true
	}
	sub, err := h.store.GetSubscription(r.Context(), user.ID)
	if err != nil || !sub.IsActive() {
		writeErrCode(w, http.StatusPaymentRequired, "subscription_required", "active subscription required")
		return store.User{}, false
	}
	return user, true
}

func (h *Handler) requireAdmin(w http.ResponseWriter, r *http.Request) (store.User, bool) {
	user, ok := h.requireAuthenticated(w, r)
	if !ok {
		return store.User{}, false
	}
	if user.Role != "admin" {
		writeErrCode(w, http.StatusForbidden, "forbidden", "admin access required")
		return store.User{}, false
	}
	return user, true
}

func (h *Handler) requireAuthenticated(w http.ResponseWriter, r *http.Request) (store.User, bool) {
	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
		writeErrCode(w, http.StatusUnauthorized, "unauthorized", "missing bearer token")
		return store.User{}, false
	}
	token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	if token == "" {
		token = strings.TrimSpace(strings.TrimPrefix(header, "bearer "))
	}
	claims, err := auth.ParseToken(token)
	if err != nil {
		writeErrCode(w, http.StatusUnauthorized, "unauthorized", "invalid token")
		return store.User{}, false
	}
	userID, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		writeErrCode(w, http.StatusUnauthorized, "unauthorized", "invalid token subject")
		return store.User{}, false
	}

	user, err := h.store.GetUserByID(r.Context(), userID)
	if err != nil {
		writeErrCode(w, http.StatusUnauthorized, "unauthorized", "user not found")
		return store.User{}, false
	}
	return user, true
}

func parsePageParams(r *http.Request) (page, pageSize int) {
	page = 1
	pageSize = 20
	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if ps := r.URL.Query().Get("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 200 {
			pageSize = v
		}
	}
	return
}

func writeErr(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeErrCode(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{"code": code, "error": message})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func cors(next http.Handler) http.Handler {
	allowedOrigins := parseAllowedOrigins(os.Getenv("ALLOWED_ORIGINS"))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowedOrigin := resolveOrigin(origin, allowedOrigins)

		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func parseAllowedOrigins(env string) []string {
	if env == "" {
		return nil
	}
	parts := strings.Split(env, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if s := strings.TrimSpace(p); s != "" {
			result = append(result, s)
		}
	}
	return result
}

func resolveOrigin(origin string, allowed []string) string {
	// No allowed list configured → dev mode, allow all
	if len(allowed) == 0 {
		return "*"
	}
	for _, o := range allowed {
		if o == origin {
			return origin
		}
	}
	// Origin not in allowlist → reflect first allowed origin as a safe fallback
	return allowed[0]
}

// requestLogger is a simple middleware that logs method, path, status and duration.
type responseRecorder struct {
	http.ResponseWriter
	status int
}

func (rr *responseRecorder) WriteHeader(code int) {
	rr.status = code
	rr.ResponseWriter.WriteHeader(code)
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &responseRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}
