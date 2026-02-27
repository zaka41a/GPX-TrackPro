package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// GET /api/account/subscription
func (h *Handler) getMySubscription(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return
	}

	sub, err := h.store.GetSubscription(r.Context(), user.ID)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
			writeJSON(w, http.StatusOK, map[string]any{
				"status":   "none",
				"isActive": false,
			})
			return
		}
		writeErr(w, http.StatusInternalServerError, "failed to get subscription")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"id":          sub.ID,
		"status":      sub.Status,
		"periodStart": sub.PeriodStart,
		"periodEnd":   sub.PeriodEnd,
		"notes":       sub.Notes,
		"activatedBy": sub.ActivatedBy,
		"createdAt":   sub.CreatedAt,
		"updatedAt":   sub.UpdatedAt,
		"isActive":    sub.IsActive(),
	})
}

// GET /api/admin/subscriptions
func (h *Handler) adminListSubscriptions(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	subs, err := h.store.ListSubscriptions(r.Context())
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list subscriptions")
		return
	}

	type subJSON struct {
		ID            int64      `json:"id"`
		UserID        int64      `json:"userId"`
		Status        string     `json:"status"`
		PeriodStart   *time.Time `json:"periodStart"`
		PeriodEnd     *time.Time `json:"periodEnd"`
		Notes         string     `json:"notes"`
		ActivatedBy   string     `json:"activatedBy"`
		CreatedAt     time.Time  `json:"createdAt"`
		UpdatedAt     time.Time  `json:"updatedAt"`
		IsActive      bool       `json:"isActive"`
		UserFirstName string     `json:"userFirstName"`
		UserLastName  string     `json:"userLastName"`
		UserEmail     string     `json:"userEmail"`
	}

	result := make([]subJSON, len(subs))
	for i, s := range subs {
		result[i] = subJSON{
			ID:            s.ID,
			UserID:        s.UserID,
			Status:        s.Status,
			PeriodStart:   s.PeriodStart,
			PeriodEnd:     s.PeriodEnd,
			Notes:         s.Notes,
			ActivatedBy:   s.ActivatedBy,
			CreatedAt:     s.CreatedAt,
			UpdatedAt:     s.UpdatedAt,
			IsActive:      s.IsActive(),
			UserFirstName: s.UserFirstName,
			UserLastName:  s.UserLastName,
			UserEmail:     s.UserEmail,
		}
	}

	writeJSON(w, http.StatusOK, result)
}

// PUT /api/admin/subscriptions/{userID}
func (h *Handler) adminUpdateSubscription(w http.ResponseWriter, r *http.Request) {
	_, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}

	raw := strings.TrimPrefix(r.URL.Path, "/api/admin/subscriptions/")
	userID, err := strconv.ParseInt(strings.Trim(raw, "/"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req struct {
		Action string `json:"action"` // activate | extend | deactivate
		Notes  string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}

	now := time.Now()
	var (
		status      string
		periodStart *time.Time
		periodEnd   *time.Time
	)

	switch req.Action {
	case "activate":
		status = "active"
		periodStart = &now
		end := now.AddDate(0, 0, 30)
		periodEnd = &end

	case "extend":
		status = "active"
		var base time.Time
		existing, existErr := h.store.GetSubscription(r.Context(), userID)
		if existErr == nil && existing.PeriodEnd != nil && existing.PeriodEnd.After(now) {
			base = *existing.PeriodEnd
			periodStart = existing.PeriodStart
		} else {
			base = now
			periodStart = &now
		}
		end := base.AddDate(0, 0, 30)
		periodEnd = &end

	case "deactivate":
		status = "inactive"

	default:
		writeErr(w, http.StatusBadRequest, "unsupported action: use activate, extend or deactivate")
		return
	}

	if err := h.store.UpsertSubscription(r.Context(), userID, status, periodStart, periodEnd, "admin", req.Notes); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to update subscription")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "subscription updated"})
}
