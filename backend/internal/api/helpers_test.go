package api

import (
	"math"
	"testing"
)

func TestParseAllowedOrigins(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want []string
	}{
		{"empty", "", nil},
		{"single", "https://a.com", []string{"https://a.com"}},
		{"multiple with spaces", " https://a.com , https://b.com ", []string{"https://a.com", "https://b.com"}},
		{"trailing comma and blanks", "https://a.com,,", []string{"https://a.com"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseAllowedOrigins(tt.in)
			if len(got) != len(tt.want) {
				t.Fatalf("got %v, want %v", got, tt.want)
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Fatalf("got %v, want %v", got, tt.want)
				}
			}
		})
	}
}

func TestResolveOrigin(t *testing.T) {
	allowed := []string{"https://app.com", "https://admin.com"}

	if got := resolveOrigin("https://evil.com", nil); got != "*" {
		t.Errorf("no allow-list should yield wildcard, got %q", got)
	}
	if got := resolveOrigin("https://app.com", allowed); got != "https://app.com" {
		t.Errorf("matching origin should be echoed, got %q", got)
	}
	if got := resolveOrigin("https://evil.com", allowed); got != "https://app.com" {
		t.Errorf("non-matching origin should fall back to first allowed, got %q", got)
	}
}

func TestInt64StrRoundTrip(t *testing.T) {
	for _, n := range []int64{0, 1, -7, 9223372036854775807} {
		s := int64ToStr(n)
		got, err := strToInt64(s)
		if err != nil {
			t.Fatalf("strToInt64(%q) error: %v", s, err)
		}
		if got != n {
			t.Fatalf("round trip failed: %d -> %q -> %d", n, s, got)
		}
	}
	if _, err := strToInt64("not-a-number"); err == nil {
		t.Error("expected error for non-numeric input")
	}
}

func TestComputeTRIMP(t *testing.T) {
	// Zero or negative duration => 0.
	if got := computeTRIMP(0, 150, 190); got != 0 {
		t.Errorf("zero duration should give 0, got %v", got)
	}
	// With valid HR data, TRIMP is positive and finite.
	got := computeTRIMP(3600, 150, 190)
	if got <= 0 || math.IsNaN(got) || math.IsInf(got, 0) {
		t.Errorf("expected positive finite TRIMP, got %v", got)
	}
	// Without usable HR data it falls back to the moderate-intensity estimate
	// (~0.65 TRIMP/min) => 60 min ~ 39.
	noHR := computeTRIMP(3600, 0, 0)
	if math.Abs(noHR-39) > 0.5 {
		t.Errorf("no-HR fallback expected ~39, got %v", noHR)
	}
}
