package auth

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

// HashPassword hashes a password using bcrypt.
func HashPassword(raw string) (string, error) {
	if len(strings.TrimSpace(raw)) < 8 {
		return "", errors.New("password must contain at least 8 characters")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(raw), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// VerifyPassword checks a raw password against an encoded hash.
// Supports bcrypt ($2a$/$2b$) and legacy SHA-256 (salt:digest) formats.
func VerifyPassword(raw, encoded string) bool {
	if isBcrypt(encoded) {
		return bcrypt.CompareHashAndPassword([]byte(encoded), []byte(raw)) == nil
	}
	return verifySHA256(raw, encoded)
}

// NeedsRehash returns true if the hash is not bcrypt (i.e. legacy SHA-256).
func NeedsRehash(encoded string) bool {
	return !isBcrypt(encoded)
}

func isBcrypt(encoded string) bool {
	return strings.HasPrefix(encoded, "$2a$") || strings.HasPrefix(encoded, "$2b$")
}

func verifySHA256(raw, encoded string) bool {
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

	h := sha256.New()
	_, _ = h.Write(salt)
	_, _ = h.Write([]byte(raw))
	actual := h.Sum(nil)
	return subtle.ConstantTimeCompare(actual, expected) == 1
}
