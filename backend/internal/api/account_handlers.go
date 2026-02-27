package api

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"gpx-training-analyzer/backend/internal/auth"
)

// PUT /api/account/email
func (h *Handler) changeEmail(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return
	}

	var req struct {
		NewEmail        string `json:"newEmail"`
		CurrentPassword string `json:"currentPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.NewEmail = strings.ToLower(strings.TrimSpace(req.NewEmail))
	if !strings.Contains(req.NewEmail, "@") || len(req.NewEmail) > 255 {
		writeErr(w, http.StatusBadRequest, "invalid email")
		return
	}

	dbUser, err := h.store.GetUserByID(r.Context(), user.ID)
	if err != nil || !auth.VerifyPassword(req.CurrentPassword, dbUser.PasswordHash) {
		writeErrCode(w, http.StatusUnauthorized, "invalid_credentials", "incorrect password")
		return
	}

	if err := h.store.UpdateUserEmail(r.Context(), user.ID, req.NewEmail); err != nil {
		errStr := strings.ToLower(err.Error())
		if strings.Contains(errStr, "unique") || strings.Contains(errStr, "duplicate") {
			writeErr(w, http.StatusConflict, "email already in use")
			return
		}
		writeErr(w, http.StatusInternalServerError, "failed to update email")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "email updated"})
}

// PUT /api/account/password
func (h *Handler) changePassword(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return
	}

	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}

	dbUser, err := h.store.GetUserByID(r.Context(), user.ID)
	if err != nil || !auth.VerifyPassword(req.CurrentPassword, dbUser.PasswordHash) {
		writeErrCode(w, http.StatusUnauthorized, "invalid_credentials", "incorrect current password")
		return
	}

	hash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.store.UpdatePasswordHash(r.Context(), user.ID, hash); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to update password")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "password updated"})
}

// GET /auth/google/link — generate OAuth URL with signed state
func (h *Handler) googleLinkStart(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return
	}

	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")
	if clientID == "" || redirectURI == "" {
		writeErr(w, http.StatusServiceUnavailable, "Google OAuth not configured")
		return
	}

	nonce := make([]byte, 16)
	_, _ = rand.Read(nonce)
	payloadBytes, _ := json.Marshal(map[string]any{
		"uid":   user.ID,
		"nonce": base64.RawURLEncoding.EncodeToString(nonce),
		"exp":   time.Now().Add(10 * time.Minute).Unix(),
	})
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadBytes)
	mac := hmac.New(sha256.New, []byte(os.Getenv("JWT_SECRET")))
	mac.Write([]byte(payloadB64))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	state := payloadB64 + "." + sig

	authURL := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=openid+email+profile&state=%s&access_type=offline",
		url.QueryEscape(clientID),
		url.QueryEscape(redirectURI),
		url.QueryEscape(state),
	)

	writeJSON(w, http.StatusOK, map[string]string{"url": authURL})
}

// GET /auth/google/callback — exchange code, verify state, link account
func (h *Handler) googleLinkCallback(w http.ResponseWriter, r *http.Request) {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	redirect := func(params string) {
		http.Redirect(w, r, frontendURL+"/settings?"+params, http.StatusFound)
	}

	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if code == "" || state == "" {
		redirect("google=error&msg=missing+code+or+state")
		return
	}

	// Verify HMAC signature
	parts := strings.SplitN(state, ".", 2)
	if len(parts) != 2 {
		redirect("google=error&msg=invalid+state")
		return
	}
	payloadB64, sig := parts[0], parts[1]
	mac := hmac.New(sha256.New, []byte(os.Getenv("JWT_SECRET")))
	mac.Write([]byte(payloadB64))
	expectedSig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(sig), []byte(expectedSig)) {
		redirect("google=error&msg=invalid+state+signature")
		return
	}

	// Decode and validate payload
	payloadBytes, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		redirect("google=error&msg=invalid+state+payload")
		return
	}
	var stateData struct {
		UID int64 `json:"uid"`
		Exp int64 `json:"exp"`
	}
	if err := json.Unmarshal(payloadBytes, &stateData); err != nil || time.Now().Unix() > stateData.Exp {
		redirect("google=error&msg=state+expired")
		return
	}

	// Exchange authorization code for access token
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	tokenResp, err := http.PostForm("https://oauth2.googleapis.com/token", url.Values{
		"code":          {code},
		"client_id":     {clientID},
		"client_secret": {clientSecret},
		"redirect_uri":  {redirectURI},
		"grant_type":    {"authorization_code"},
	})
	if err != nil || tokenResp.StatusCode != http.StatusOK {
		redirect("google=error&msg=token+exchange+failed")
		return
	}
	defer tokenResp.Body.Close()

	var tokenData struct {
		AccessToken string `json:"access_token"`
	}
	body, _ := io.ReadAll(tokenResp.Body)
	if err := json.Unmarshal(body, &tokenData); err != nil || tokenData.AccessToken == "" {
		redirect("google=error&msg=invalid+token+response")
		return
	}

	// Fetch Google user info
	req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+tokenData.AccessToken)
	client := &http.Client{Timeout: 10 * time.Second}
	userResp, err := client.Do(req)
	if err != nil || userResp.StatusCode != http.StatusOK {
		redirect("google=error&msg=userinfo+failed")
		return
	}
	defer userResp.Body.Close()

	var googleUser struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	userBody, _ := io.ReadAll(userResp.Body)
	if err := json.Unmarshal(userBody, &googleUser); err != nil || googleUser.ID == "" {
		redirect("google=error&msg=invalid+userinfo")
		return
	}

	// Check if this Google account is already linked to a different user
	existing, err := h.store.GetUserByGoogleID(r.Context(), googleUser.ID)
	if err == nil && existing.ID != stateData.UID {
		redirect("google=error&msg=google+account+already+linked")
		return
	}

	if err := h.store.UpdateGoogleLink(r.Context(), stateData.UID, googleUser.ID, googleUser.Email); err != nil {
		slog.Error("failed to link google account", "err", err, "userID", stateData.UID)
		redirect("google=error&msg=failed+to+link")
		return
	}

	redirect("google=linked")
}

// DELETE /api/account/google
func (h *Handler) unlinkGoogle(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return
	}

	if err := h.store.UnlinkGoogle(r.Context(), user.ID); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to unlink google account")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "google account unlinked"})
}
