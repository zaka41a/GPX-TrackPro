package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

func HashPassword(raw string) (string, error) {
	if len(strings.TrimSpace(raw)) < 8 {
		return "", errors.New("password must contain at least 8 characters")
	}

	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	digest := derive(raw, salt)
	return base64.RawURLEncoding.EncodeToString(salt) + ":" + base64.RawURLEncoding.EncodeToString(digest), nil
}

func VerifyPassword(raw, encoded string) bool {
	parts := strings.Split(encoded, ":")
	if len(parts) != 2 {
		return false
	}

	salt, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return false
	}
	expected, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return false
	}

	actual := derive(raw, salt)
	return subtle.ConstantTimeCompare(actual, expected) == 1
}

func derive(raw string, salt []byte) []byte {
	h := sha256.New()
	_, _ = h.Write(salt)
	_, _ = h.Write([]byte(raw))
	return h.Sum(nil)
}
