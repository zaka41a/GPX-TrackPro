package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gpx-training-analyzer/backend/internal/api"
	"gpx-training-analyzer/backend/internal/store"
)

func main() {
	// Structured JSON logging
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	// JWT secret validation
	jwtSecret := os.Getenv("JWT_SECRET")
	goEnv := os.Getenv("GO_ENV")
	if jwtSecret == "" {
		if goEnv == "production" {
			log.Fatal("JWT_SECRET must be set in production")
		}
		slog.Warn("JWT_SECRET is not set, using insecure development default")
		_ = os.Setenv("JWT_SECRET", "dev-only-change-me")
	}

	ctx := context.Background()
	db, err := store.New(ctx)
	if err != nil {
		slog.Error("database initialization failed", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	h := api.NewHandler(db)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           h.Routes(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("backend started", "addr", "http://localhost:"+port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
	<-stop

	slog.Info("shutting down gracefully")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful shutdown failed", "err", err)
	}
}
