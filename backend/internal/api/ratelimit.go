package api

import (
	"net/http"
	"sync"
	"time"
)

// tokenBucket holds tokens for a single key (IP address).
type tokenBucket struct {
	mu       sync.Mutex
	tokens   float64
	lastFill time.Time
	rate     float64 // tokens per second
	capacity float64
}

func newBucket(rate, capacity float64) *tokenBucket {
	return &tokenBucket{
		tokens:   capacity,
		lastFill: time.Now(),
		rate:     rate,
		capacity: capacity,
	}
}

// allow consumes one token. Returns true if the request is allowed.
func (b *tokenBucket) allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastFill).Seconds()
	b.lastFill = now

	b.tokens += elapsed * b.rate
	if b.tokens > b.capacity {
		b.tokens = b.capacity
	}

	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// rateLimiter holds per-IP buckets and performs periodic cleanup.
type rateLimiter struct {
	mu       sync.Mutex
	buckets  map[string]*tokenBucket
	rate     float64
	capacity float64
}

func newRateLimiter(requestsPerMinute int) *rateLimiter {
	rl := &rateLimiter{
		buckets:  make(map[string]*tokenBucket),
		rate:     float64(requestsPerMinute) / 60.0,
		capacity: float64(requestsPerMinute),
	}
	go rl.cleanup()
	return rl
}

func (rl *rateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		rl.mu.Lock()
		threshold := time.Now().Add(-10 * time.Minute)
		for ip, b := range rl.buckets {
			b.mu.Lock()
			stale := b.lastFill.Before(threshold)
			b.mu.Unlock()
			if stale {
				delete(rl.buckets, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *rateLimiter) getBucket(ip string) *tokenBucket {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	b, ok := rl.buckets[ip]
	if !ok {
		b = newBucket(rl.rate, rl.capacity)
		rl.buckets[ip] = b
	}
	return b
}

// limit returns an HTTP middleware that rate-limits by remote IP.
func (rl *rateLimiter) limit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := realIP(r)
		if !rl.getBucket(ip).allow() {
			w.Header().Set("Retry-After", "60")
			writeErr(w, http.StatusTooManyRequests, "too many requests, please try again later")
			return
		}
		next(w, r)
	}
}

// realIP extracts the client IP, respecting X-Forwarded-For / X-Real-IP.
func realIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first (leftmost) address
		for i := 0; i < len(xff); i++ {
			if xff[i] == ',' {
				return xff[:i]
			}
		}
		return xff
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	// Strip port from RemoteAddr
	addr := r.RemoteAddr
	for i := len(addr) - 1; i >= 0; i-- {
		if addr[i] == ':' {
			return addr[:i]
		}
	}
	return addr
}
