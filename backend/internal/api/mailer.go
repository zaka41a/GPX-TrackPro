package api

import (
	"fmt"
	"log/slog"
	"net/smtp"
	"os"
	"strings"
)

// sendPasswordResetEmail sends a password-reset link via SMTP.
// If SMTP_HOST is unset it logs the link instead (dev mode).
func sendPasswordResetEmail(toEmail, resetURL string) error {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		slog.Info("dev mode — password reset link (no SMTP configured)", "email", toEmail, "url", resetURL)
		return nil
	}

	port := os.Getenv("SMTP_PORT")
	if port == "" {
		port = "587"
	}
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = os.Getenv("SMTP_USER")
	}
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")

	body := strings.Join([]string{
		"From: " + from,
		"To: " + toEmail,
		"Subject: Reset your GPX TrackPro password",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		"You requested a password reset for your GPX TrackPro account.",
		"",
		"Click the link below (valid for 1 hour):",
		resetURL,
		"",
		"If you did not request this, you can safely ignore this email.",
	}, "\r\n")

	addr := host + ":" + port
	var auth smtp.Auth
	if user != "" && pass != "" {
		auth = smtp.PlainAuth("", user, pass, host)
	}

	if err := smtp.SendMail(addr, auth, from, []string{toEmail}, []byte(body)); err != nil {
		return fmt.Errorf("smtp send: %w", err)
	}
	return nil
}
