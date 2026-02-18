package auth

import (
	"os"
	"strings"
	"testing"
	"time"
)

func TestHashPassword_And_Verify(t *testing.T) {
	password := "MySecure123!"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error: %v", err)
	}

	parts := strings.Split(hash, ":")
	if len(parts) != 2 {
		t.Fatalf("expected salt:hash format, got %q", hash)
	}

	if !VerifyPassword(password, hash) {
		t.Fatal("VerifyPassword() should return true for correct password")
	}

	if VerifyPassword("wrongpassword", hash) {
		t.Fatal("VerifyPassword() should return false for wrong password")
	}
}

func TestHashPassword_TooShort(t *testing.T) {
	_, err := HashPassword("short")
	if err == nil {
		t.Fatal("expected error for short password")
	}
	if !strings.Contains(err.Error(), "at least 8") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestHashPassword_UniqueSalts(t *testing.T) {
	h1, _ := HashPassword("password123")
	h2, _ := HashPassword("password123")
	if h1 == h2 {
		t.Fatal("two hashes of same password should differ due to random salt")
	}
}

func TestVerifyPassword_InvalidFormat(t *testing.T) {
	if VerifyPassword("test", "nocolon") {
		t.Fatal("should return false for invalid hash format")
	}
	if VerifyPassword("test", "invalidbase64:invalidbase64") {
		t.Fatal("should return false for invalid base64")
	}
}

func TestIssueToken_And_Parse(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key-123")
	defer os.Unsetenv("JWT_SECRET")

	token, err := IssueToken(42, "admin", "approved", "admin@test.com", time.Hour)
	if err != nil {
		t.Fatalf("IssueToken() error: %v", err)
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		t.Fatalf("expected 3-part JWT, got %d parts", len(parts))
	}

	claims, err := ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken() error: %v", err)
	}

	if claims.Subject != "42" {
		t.Fatalf("expected subject '42', got %q", claims.Subject)
	}
	if claims.Role != "admin" {
		t.Fatalf("expected role 'admin', got %q", claims.Role)
	}
	if claims.Status != "approved" {
		t.Fatalf("expected status 'approved', got %q", claims.Status)
	}
	if claims.Email != "admin@test.com" {
		t.Fatalf("expected email 'admin@test.com', got %q", claims.Email)
	}
}

func TestParseToken_Expired(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key-123")
	defer os.Unsetenv("JWT_SECRET")

	token, _ := IssueToken(1, "user", "approved", "u@t.com", -time.Hour)
	_, err := ParseToken(token)
	if err == nil {
		t.Fatal("expected error for expired token")
	}
	if !strings.Contains(err.Error(), "expired") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestParseToken_InvalidSignature(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key-123")
	defer os.Unsetenv("JWT_SECRET")

	token, _ := IssueToken(1, "user", "approved", "u@t.com", time.Hour)
	tampered := token[:len(token)-5] + "XXXXX"
	_, err := ParseToken(tampered)
	if err == nil {
		t.Fatal("expected error for tampered token")
	}
	if !strings.Contains(err.Error(), "signature") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestParseToken_InvalidFormat(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key-123")
	defer os.Unsetenv("JWT_SECRET")

	_, err := ParseToken("not.a.valid.token")
	if err == nil {
		t.Fatal("expected error for invalid token format")
	}
}

func TestIssueToken_NoSecret(t *testing.T) {
	os.Unsetenv("JWT_SECRET")
	_, err := IssueToken(1, "user", "approved", "u@t.com", time.Hour)
	if err == nil {
		t.Fatal("expected error when JWT_SECRET is not set")
	}
}
