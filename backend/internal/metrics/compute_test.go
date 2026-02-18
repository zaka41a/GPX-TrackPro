package metrics

import (
	"math"
	"testing"
	"time"

	"gpx-training-analyzer/backend/internal/gpx"
)

func TestCompute_WithTimeElevationAndSensors(t *testing.T) {
	t0 := mustTime("2026-02-15T08:00:00Z")
	t1 := mustTime("2026-02-15T08:10:00Z")
	t2 := mustTime("2026-02-15T08:20:00Z")

	hr1, hr2 := 140, 150
	cad1, cad2 := 82, 86

	points := []gpx.Point{
		{Lat: 50.7700, Lon: 6.0900, Ele: 120, Time: &t0},
		{Lat: 50.7800, Lon: 6.1000, Ele: 150, Time: &t1, HR: &hr1, Cadence: &cad1},
		{Lat: 50.7900, Lon: 6.1100, Ele: 130, Time: &t2, HR: &hr2, Cadence: &cad2},
	}

	result := Compute(points)

	if result.DurationSec != 20*60 {
		t.Fatalf("expected duration 1200 sec, got %d", result.DurationSec)
	}
	if result.DistanceKM <= 0 {
		t.Fatalf("expected positive distance, got %.2f", result.DistanceKM)
	}
	if result.AvgSpeedKMH <= 0 {
		t.Fatalf("expected positive avg speed, got %.2f", result.AvgSpeedKMH)
	}
	if result.PaceMinPerKM <= 0 {
		t.Fatalf("expected positive pace, got %.2f", result.PaceMinPerKM)
	}
	if result.ElevGainM != 30 {
		t.Fatalf("expected elevation gain 30, got %.2f", result.ElevGainM)
	}
	if result.ElevLossM != 20 {
		t.Fatalf("expected elevation loss 20, got %.2f", result.ElevLossM)
	}
	if result.MaxElevM != 150 || result.MinElevM != 120 {
		t.Fatalf("unexpected elevation min/max: min=%.2f max=%.2f", result.MinElevM, result.MaxElevM)
	}
	if math.Abs(result.AvgHR-145) > 0.01 {
		t.Fatalf("expected avg HR 145, got %.2f", result.AvgHR)
	}
	if result.MaxHR != 150 {
		t.Fatalf("expected max HR 150, got %d", result.MaxHR)
	}
	if math.Abs(result.AvgCadence-84) > 0.01 {
		t.Fatalf("expected avg cadence 84, got %.2f", result.AvgCadence)
	}
	if !result.ActivityDate.Equal(t0) {
		t.Fatalf("expected activity date to equal first point time, got %s", result.ActivityDate)
	}
}

func TestCompute_WithoutTimeSensors(t *testing.T) {
	points := []gpx.Point{
		{Lat: 50.0, Lon: 6.0, Ele: 10},
		{Lat: 50.01, Lon: 6.01, Ele: 20},
	}

	result := Compute(points)

	if result.DurationSec != 0 {
		t.Fatalf("expected duration 0 without timestamps, got %d", result.DurationSec)
	}
	if result.AvgSpeedKMH != 0 {
		t.Fatalf("expected avg speed 0 without timestamps, got %.2f", result.AvgSpeedKMH)
	}
	if result.PaceMinPerKM != 0 {
		t.Fatalf("expected pace 0 without timestamps, got %.2f", result.PaceMinPerKM)
	}
	if result.AvgHR != 0 || result.MaxHR != 0 {
		t.Fatalf("expected HR metrics to be 0, got avg=%.2f max=%d", result.AvgHR, result.MaxHR)
	}
}

func mustTime(raw string) time.Time {
	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		panic(err)
	}
	return t
}
