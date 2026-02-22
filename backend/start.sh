#!/bin/bash
export DATABASE_URL="postgres://zakaria@localhost:5432/gpx_training_analyzer?sslmode=disable"
export JWT_SECRET="your-secret-key"
go run ./cmd/server/
