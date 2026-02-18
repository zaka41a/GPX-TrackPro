package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Claims struct {
	Subject string `json:"sub"`
	Role    string `json:"role"`
	Status  string `json:"status"`
	Email   string `json:"email"`
	Exp     int64  `json:"exp"`
	Iat     int64  `json:"iat"`
}

func IssueToken(userID int64, role, status, email string, ttl time.Duration) (string, error) {
	secret := jwtSecret()
	if secret == "" {
		return "", errors.New("JWT_SECRET is not configured")
	}

	now := time.Now().UTC()
	claims := Claims{
		Subject: strconv.FormatInt(userID, 10),
		Role:    role,
		Status:  status,
		Email:   email,
		Exp:     now.Add(ttl).Unix(),
		Iat:     now.Unix(),
	}

	headerJSON, _ := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	payloadJSON, _ := json.Marshal(claims)

	header := base64.RawURLEncoding.EncodeToString(headerJSON)
	payload := base64.RawURLEncoding.EncodeToString(payloadJSON)
	unsigned := header + "." + payload
	sig := sign(unsigned, secret)
	return unsigned + "." + sig, nil
}

func ParseToken(token string) (Claims, error) {
	secret := jwtSecret()
	if secret == "" {
		return Claims{}, errors.New("JWT_SECRET is not configured")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return Claims{}, errors.New("invalid token format")
	}

	unsigned := parts[0] + "." + parts[1]
	expectedSig := sign(unsigned, secret)
	if !hmac.Equal([]byte(parts[2]), []byte(expectedSig)) {
		return Claims{}, errors.New("invalid token signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return Claims{}, fmt.Errorf("invalid token payload: %w", err)
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return Claims{}, fmt.Errorf("invalid token claims: %w", err)
	}

	if claims.Exp <= time.Now().UTC().Unix() {
		return Claims{}, errors.New("token expired")
	}

	return claims, nil
}

func sign(input, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(input))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func jwtSecret() string {
	return strings.TrimSpace(os.Getenv("JWT_SECRET"))
}
