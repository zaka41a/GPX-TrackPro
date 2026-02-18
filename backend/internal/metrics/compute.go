package metrics

import (
	"math"
	"time"

	"gpx-training-analyzer/backend/internal/gpx"
)

type Result struct {
	DistanceKM   float64   `json:"distanceKm"`
	DurationSec  int       `json:"durationSec"`
	AvgSpeedKMH  float64   `json:"avgSpeedKmh"`
	MaxSpeedKMH  float64   `json:"maxSpeedKmh"`
	PaceMinPerKM float64   `json:"paceMinPerKm"`
	ElevGainM    float64   `json:"elevGainM"`
	ElevLossM    float64   `json:"elevLossM"`
	MaxElevM     float64   `json:"maxElevM"`
	MinElevM     float64   `json:"minElevM"`
	AvgHR        float64   `json:"avgHr"`
	MaxHR        int       `json:"maxHr"`
	AvgCadence   float64   `json:"avgCadence"`
	ActivityDate time.Time `json:"activityDate"`
}

func Compute(points []gpx.Point) Result {
	if len(points) == 0 {
		return Result{ActivityDate: time.Now().UTC()}
	}

	var totalMeters float64
	var elevGain float64
	var elevLoss float64
	maxElev := points[0].Ele
	minElev := points[0].Ele
	maxSpeed := 0.0

	hasStart := points[0].Time != nil
	hasEnd := points[len(points)-1].Time != nil
	activityDate := time.Now().UTC()
	if points[0].Time != nil {
		activityDate = points[0].Time.UTC()
	}

	var hrSum int
	var hrCount int
	maxHR := 0
	var cadSum int
	var cadCount int

	for i := 1; i < len(points); i++ {
		prev := points[i-1]
		curr := points[i]

		segmentMeters := haversineMeters(prev.Lat, prev.Lon, curr.Lat, curr.Lon)
		totalMeters += segmentMeters

		eleDiff := curr.Ele - prev.Ele
		if eleDiff > 0 {
			elevGain += eleDiff
		} else {
			elevLoss += math.Abs(eleDiff)
		}

		if curr.Ele > maxElev {
			maxElev = curr.Ele
		}
		if curr.Ele < minElev {
			minElev = curr.Ele
		}

		if prev.Time != nil && curr.Time != nil {
			deltaSec := curr.Time.Sub(*prev.Time).Seconds()
			if deltaSec > 0 {
				kmh := (segmentMeters / 1000.0) / (deltaSec / 3600.0)
				if kmh > maxSpeed && kmh < 120 {
					maxSpeed = kmh
				}
			}
		}

		if curr.HR != nil {
			hrCount++
			hrSum += *curr.HR
			if *curr.HR > maxHR {
				maxHR = *curr.HR
			}
		}
		if curr.Cadence != nil {
			cadCount++
			cadSum += *curr.Cadence
		}
	}

	durationSec := 0
	if hasStart && hasEnd {
		dur := points[len(points)-1].Time.Sub(*points[0].Time)
		if dur > 0 {
			durationSec = int(dur.Seconds())
		}
	}

	distanceKM := totalMeters / 1000.0
	avgSpeed := 0.0
	pace := 0.0
	if durationSec > 0 && distanceKM > 0 {
		avgSpeed = distanceKM / (float64(durationSec) / 3600.0)
		pace = (float64(durationSec) / 60.0) / distanceKM
	}

	avgHR := 0.0
	if hrCount > 0 {
		avgHR = float64(hrSum) / float64(hrCount)
	}
	avgCadence := 0.0
	if cadCount > 0 {
		avgCadence = float64(cadSum) / float64(cadCount)
	}

	return Result{
		DistanceKM:   round(distanceKM),
		DurationSec:  durationSec,
		AvgSpeedKMH:  round(avgSpeed),
		MaxSpeedKMH:  round(maxSpeed),
		PaceMinPerKM: round(pace),
		ElevGainM:    round(elevGain),
		ElevLossM:    round(elevLoss),
		MaxElevM:     round(maxElev),
		MinElevM:     round(minElev),
		AvgHR:        round(avgHR),
		MaxHR:        maxHR,
		AvgCadence:   round(avgCadence),
		ActivityDate: activityDate,
	}
}

func haversineMeters(lat1, lon1, lat2, lon2 float64) float64 {
	const earthR = 6371000.0
	dLat := toRad(lat2 - lat1)
	dLon := toRad(lon2 - lon1)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(toRad(lat1))*math.Cos(toRad(lat2))*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthR * c
}

func toRad(v float64) float64 {
	return v * math.Pi / 180.0
}

func round(v float64) float64 {
	return math.Round(v*100) / 100
}
