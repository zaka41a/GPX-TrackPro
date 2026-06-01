package api

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/webhook"
)

func stripeSecretKey() string {
	return os.Getenv("STRIPE_SECRET_KEY")
}

func stripePriceID(plan string) string {
	switch plan {
	case "pro":
		return os.Getenv("STRIPE_PRICE_ID_PRO")
	case "premium":
		return os.Getenv("STRIPE_PRICE_ID_PREMIUM")
	}
	return ""
}

func (h *Handler) stripeCreateCheckout(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireApprovedUser(w, r)
	if !ok {
		return
	}

	var req struct {
		Plan string `json:"plan"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Plan != "pro" && req.Plan != "premium" {
		writeErr(w, http.StatusBadRequest, "plan must be pro or premium")
		return
	}

	priceID := stripePriceID(req.Plan)
	if priceID == "" {
		writeErr(w, http.StatusInternalServerError, "Stripe price not configured for this plan")
		return
	}

	secretKey := stripeSecretKey()
	if secretKey == "" {
		writeErr(w, http.StatusInternalServerError, "Stripe not configured")
		return
	}
	stripe.Key = secretKey

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL:        stripe.String(frontendURL + "/settings?tab=subscription&checkout=success"),
		CancelURL:         stripe.String(frontendURL + "/settings?tab=subscription&checkout=cancelled"),
		ClientReferenceID: stripe.String(int64ToStr(user.ID)),
		CustomerEmail:     stripe.String(user.Email),
		Metadata: map[string]string{
			"user_id":   int64ToStr(user.ID),
			"plan_name": req.Plan,
		},
	}

	s, err := session.New(params)
	if err != nil {
		slog.Error("stripe checkout session error", "err", err)
		writeErr(w, http.StatusInternalServerError, "failed to create checkout session")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"url": s.URL})
}

func (h *Handler) stripeWebhook(w http.ResponseWriter, r *http.Request) {
	const maxBody = 65536
	body, err := io.ReadAll(io.LimitReader(r.Body, maxBody))
	if err != nil {
		writeErr(w, http.StatusBadRequest, "failed to read body")
		return
	}

	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	sig := r.Header.Get("Stripe-Signature")

	// In production the signature MUST be verified, otherwise anyone could
	// forge a webhook and activate a paid subscription for free. We only allow
	// the unverified JSON fallback in development (e.g. local manual testing).
	if os.Getenv("GO_ENV") == "production" && (webhookSecret == "" || sig == "") {
		slog.Error("stripe webhook rejected: STRIPE_WEBHOOK_SECRET or signature missing in production")
		writeErr(w, http.StatusServiceUnavailable, "webhook not configured")
		return
	}

	var event stripe.Event
	if webhookSecret != "" && sig != "" {
		event, err = webhook.ConstructEvent(body, sig, webhookSecret)
		if err != nil {
			slog.Error("stripe webhook signature verification failed", "err", err)
			writeErr(w, http.StatusBadRequest, "invalid signature")
			return
		}
	} else {
		if err := json.Unmarshal(body, &event); err != nil {
			writeErr(w, http.StatusBadRequest, "invalid JSON")
			return
		}
	}

	// Idempotency: skip events we've already processed (Stripe may retry the
	// same delivery). Done after signature verification so unverified payloads
	// never poison the dedup table.
	if event.ID != "" {
		claimed, err := h.store.TryClaimStripeEvent(r.Context(), event.ID, string(event.Type))
		if err != nil {
			slog.Error("stripe: idempotency check failed", "eventID", event.ID, "err", err)
			writeErr(w, http.StatusInternalServerError, "internal error")
			return
		}
		if !claimed {
			slog.Info("stripe: duplicate event ignored", "eventID", event.ID, "type", event.Type)
			w.WriteHeader(http.StatusOK)
			return
		}
	}

	switch event.Type {
	case "checkout.session.completed":
		var cs stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &cs); err != nil {
			slog.Error("stripe: failed to parse checkout.session.completed", "err", err)
			break
		}
		h.handleCheckoutCompleted(r, &cs)

	case "invoice.payment_succeeded":
		var inv stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
			slog.Error("stripe: failed to parse invoice.payment_succeeded", "err", err)
			break
		}
		h.handleInvoicePaid(r, &inv)

	case "invoice.payment_failed":
		var inv stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
			slog.Error("stripe: failed to parse invoice.payment_failed", "err", err)
			break
		}
		h.handleInvoiceFailed(r, &inv)

	case "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			slog.Error("stripe: failed to parse customer.subscription.deleted", "err", err)
			break
		}
		h.handleSubscriptionDeleted(r, &sub)
	}

	w.WriteHeader(http.StatusOK)
}

// handleInvoicePaid extends the subscription period on a successful recurring
// payment. The very first invoice also fires here, which simply re-confirms the
// active state set by checkout.session.completed (harmless).
func (h *Handler) handleInvoicePaid(r *http.Request, inv *stripe.Invoice) {
	if inv.Customer == nil {
		return
	}
	userID, err := h.store.GetUserIDByStripeCustomer(r.Context(), inv.Customer.ID)
	if err != nil {
		slog.Warn("stripe: invoice.payment_succeeded — no user for customer", "customerID", inv.Customer.ID)
		return
	}
	end := time.Now().AddDate(0, 1, 0)
	if err := h.store.RenewSubscription(r.Context(), userID, end, "renewal:"+inv.ID); err != nil {
		slog.Error("stripe: failed to renew subscription", "userID", userID, "err", err)
		return
	}
	slog.Info("stripe: subscription renewed", "userID", userID)
}

// handleInvoiceFailed notifies the user when a recurring payment fails. Stripe
// retries on its own dunning schedule before eventually cancelling, which is
// handled by customer.subscription.deleted.
func (h *Handler) handleInvoiceFailed(r *http.Request, inv *stripe.Invoice) {
	if inv.Customer == nil {
		return
	}
	userID, err := h.store.GetUserIDByStripeCustomer(r.Context(), inv.Customer.ID)
	if err != nil {
		slog.Warn("stripe: invoice.payment_failed — no user for customer", "customerID", inv.Customer.ID)
		return
	}
	_ = h.store.CreateNotification(r.Context(), userID,
		"Payment failed",
		"Your subscription payment could not be processed. Please update your payment method to keep your access.",
	)
	slog.Info("stripe: payment failed notification sent", "userID", userID)
}

func (h *Handler) handleCheckoutCompleted(r *http.Request, cs *stripe.CheckoutSession) {
	userIDStr, ok := cs.Metadata["user_id"]
	if !ok || userIDStr == "" {
		slog.Error("stripe: checkout.session.completed missing user_id metadata")
		return
	}
	planName, _ := cs.Metadata["plan_name"]
	if planName == "" {
		planName = "pro"
	}

	userID, err := strToInt64(userIDStr)
	if err != nil {
		slog.Error("stripe: invalid user_id in metadata", "raw", userIDStr, "err", err)
		return
	}

	now := time.Now()
	end := now.AddDate(0, 1, 0)
	notes := "stripe:" + cs.ID
	if err := h.store.UpsertSubscription(r.Context(), userID, "active", &now, &end, "stripe", notes); err != nil {
		slog.Error("stripe: failed to upsert subscription", "userID", userID, "err", err)
		return
	}
	if err := h.store.UpdateSubscriptionPlan(r.Context(), userID, planName); err != nil {
		slog.Error("stripe: failed to set plan", "userID", userID, "plan", planName, "err", err)
	}
	customerID := ""
	subID := ""
	if cs.Customer != nil {
		customerID = cs.Customer.ID
	}
	if cs.Subscription != nil {
		subID = cs.Subscription.ID
	}
	if customerID != "" || subID != "" {
		if err := h.store.UpdateStripeIDs(r.Context(), userID, customerID, subID); err != nil {
			slog.Error("stripe: failed to update stripe IDs", "userID", userID, "err", err)
		}
	}

	slog.Info("stripe: subscription activated", "userID", userID, "plan", planName)
}

func (h *Handler) handleSubscriptionDeleted(r *http.Request, sub *stripe.Subscription) {
	if sub.Customer == nil {
		return
	}
	userID, err := h.store.GetUserIDByStripeCustomer(r.Context(), sub.Customer.ID)
	if err != nil {
		slog.Warn("stripe: subscription.deleted — no user found for customer", "customerID", sub.Customer.ID)
		return
	}
	if err := h.store.UpsertSubscription(r.Context(), userID, "inactive", nil, nil, "stripe", "cancelled:"+sub.ID); err != nil {
		slog.Error("stripe: failed to deactivate subscription", "userID", userID, "err", err)
		return
	}
	slog.Info("stripe: subscription deactivated", "userID", userID)
}

func int64ToStr(n int64) string {
	return strconv.FormatInt(n, 10)
}

func strToInt64(s string) (int64, error) {
	return strconv.ParseInt(s, 10, 64)
}
