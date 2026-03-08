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

// ── HR Zones ─────────────────────────────────────────────────────────────────

// HRZone holds the time distribution for one training zone.
type HRZone struct {
	Zone    int     `json:"zone"`
	Label   string  `json:"label"`
	MinBPM  int     `json:"minBpm"`
	MaxBPM  int     `json:"maxBpm"`
	TimeSec int     `json:"timeSec"`
	PctTime float64 `json:"pctTime"`
}

// ComputeHRZones returns Z1–Z5 time distribution based on % of maxHR.
// If maxHR <= 0 a default of 190 bpm is assumed.
func ComputeHRZones(points []gpx.Point, maxHR int) []HRZone {
	if maxHR <= 0 {
		maxHR = 190
	}

	// Zone boundaries as fraction of maxHR
	bounds := [5][2]float64{
		{0.50, 0.60},
		{0.60, 0.70},
		{0.70, 0.80},
		{0.80, 0.90},
		{0.90, 1.01},
	}
	labels := [5]string{"Z1 Recovery", "Z2 Aerobic Base", "Z3 Aerobic", "Z4 Threshold", "Z5 VO2Max"}

	zones := make([]HRZone, 5)
	for i, b := range bounds {
		zones[i] = HRZone{
			Zone:   i + 1,
			Label:  labels[i],
			MinBPM: int(b[0] * float64(maxHR)),
			MaxBPM: int(b[1] * float64(maxHR)),
		}
	}

	totalSec := 0
	for i := 1; i < len(points); i++ {
		p := points[i]
		if p.HR == nil || *p.HR <= 0 {
			continue
		}
		// Estimate interval duration
		sec := 5 // fallback
		if points[i-1].Time != nil && p.Time != nil {
			d := p.Time.Sub(*points[i-1].Time).Seconds()
			if d > 0 && d < 3600 {
				sec = int(d)
			}
		}
		pct := float64(*p.HR) / float64(maxHR)
		for j := range zones {
			if pct >= bounds[j][0] && pct < bounds[j][1] {
				zones[j].TimeSec += sec
				totalSec += sec
				break
			}
		}
	}
	if totalSec > 0 {
		for i := range zones {
			zones[i].PctTime = round(float64(zones[i].TimeSec) / float64(totalSec) * 100)
		}
	}
	return zones
}

// ── Climb / Segment Analysis ──────────────────────────────────────────────────

// ClimbSegment describes a detected ascent segment.
type ClimbSegment struct {
	Index       int     `json:"index"`
	StartKm     float64 `json:"startKm"`
	EndKm       float64 `json:"endKm"`
	ElevGainM   float64 `json:"elevGainM"`
	DistanceKm  float64 `json:"distanceKm"`
	GradientPct float64 `json:"gradientPct"`
	VAM         float64 `json:"vam"` // m/h — vertical ascent per hour
	DurationSec int     `json:"durationSec"`
}

// DetectClimbs finds significant ascent segments in the track.
func DetectClimbs(points []gpx.Point) []ClimbSegment {
	const minGainM = 20.0
	const minDistKm = 0.3
	const descentThreshold = 3.0 // metres below peak before ending a climb

	if len(points) < 10 {
		return nil
	}

	// Smooth elevation to reduce GPS noise
	raw := make([]float64, len(points))
	for i, p := range points {
		raw[i] = p.Ele
	}
	ele := smoothEle(raw, 3)

	// Cumulative distance (km)
	cumDist := make([]float64, len(points))
	for i := 1; i < len(points); i++ {
		cumDist[i] = cumDist[i-1] + haversineMeters(
			points[i-1].Lat, points[i-1].Lon,
			points[i].Lat, points[i].Lon,
		)/1000.0
	}

	var climbs []ClimbSegment
	inClimb := false
	climbStart := 0
	peakIdx := 0
	peakEle := ele[0]

	for i := 1; i < len(points); i++ {
		if !inClimb {
			if ele[i] > ele[i-1] {
				inClimb = true
				climbStart = i - 1
				peakIdx = i
				peakEle = ele[i]
			}
		} else {
			if ele[i] > peakEle {
				peakIdx = i
				peakEle = ele[i]
			}
			atEnd := i == len(points)-1
			descended := ele[i] < peakEle-descentThreshold
			if descended || atEnd {
				gain := peakEle - ele[climbStart]
				dist := cumDist[peakIdx] - cumDist[climbStart]
				if gain >= minGainM && dist >= minDistKm {
					var durationSec int
					if points[climbStart].Time != nil && points[peakIdx].Time != nil {
						d := points[peakIdx].Time.Sub(*points[climbStart].Time).Seconds()
						if d > 0 {
							durationSec = int(d)
						}
					}
					var vam float64
					if durationSec > 0 {
						vam = round(gain * 3600.0 / float64(durationSec))
					}
					gradient := 0.0
					if dist > 0 {
						gradient = round(gain / (dist * 1000.0) * 100)
					}
					climbs = append(climbs, ClimbSegment{
						Index:       len(climbs) + 1,
						StartKm:     round(cumDist[climbStart]),
						EndKm:       round(cumDist[peakIdx]),
						ElevGainM:   round(gain),
						DistanceKm:  round(dist),
						GradientPct: gradient,
						VAM:         vam,
						DurationSec: durationSec,
					})
				}
				inClimb = false
				// Immediately start a new climb if elevation is rising
				if i < len(points)-1 && ele[i] > ele[i-1] {
					inClimb = true
					climbStart = i - 1
					peakIdx = i
					peakEle = ele[i]
				}
			}
		}
	}
	return climbs
}

func smoothEle(ele []float64, halfWindow int) []float64 {
	result := make([]float64, len(ele))
	for i := range ele {
		s := i - halfWindow
		if s < 0 {
			s = 0
		}
		e := i + halfWindow
		if e >= len(ele) {
			e = len(ele) - 1
		}
		sum := 0.0
		for j := s; j <= e; j++ {
			sum += ele[j]
		}
		result[i] = sum / float64(e-s+1)
	}
	return result
}
