package gpx

import (
	"strings"
	"testing"
)

func TestParse_WithGarminExtensions(t *testing.T) {
	input := `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <trk>
    <name>Morning Ride</name>
    <trkseg>
      <trkpt lat="50.7700" lon="6.0900">
        <ele>120.5</ele>
        <time>2026-02-15T08:00:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>145</gpxtpx:hr>
            <gpxtpx:cad>88</gpxtpx:cad>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <trkpt lat="50.7710" lon="6.0910">
        <ele>122.0</ele>
        <time>2026-02-15T08:00:30Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>148</gpxtpx:hr>
            <gpxtpx:cad>90</gpxtpx:cad>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

	parsed, err := Parse([]byte(input))
	if err != nil {
		t.Fatalf("Parse() returned unexpected error: %v", err)
	}

	if parsed.Name != "Morning Ride" {
		t.Fatalf("expected track name 'Morning Ride', got %q", parsed.Name)
	}
	if len(parsed.Points) != 2 {
		t.Fatalf("expected 2 points, got %d", len(parsed.Points))
	}

	first := parsed.Points[0]
	if first.HR == nil || *first.HR != 145 {
		t.Fatalf("expected first HR=145, got %+v", first.HR)
	}
	if first.Cadence == nil || *first.Cadence != 88 {
		t.Fatalf("expected first cadence=88, got %+v", first.Cadence)
	}
	if first.Time == nil {
		t.Fatal("expected first timestamp to be parsed")
	}
}

func TestParse_WithoutTrackName_UsesDefault(t *testing.T) {
	input := `<?xml version="1.0"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="50.0" lon="6.0"><time>2026-02-15T08:00:00Z</time></trkpt>
    <trkpt lat="50.001" lon="6.001"><time>2026-02-15T08:01:00Z</time></trkpt>
  </trkseg></trk>
</gpx>`

	parsed, err := Parse([]byte(input))
	if err != nil {
		t.Fatalf("Parse() returned unexpected error: %v", err)
	}
	if parsed.Name != "Imported GPX Activity" {
		t.Fatalf("expected default name, got %q", parsed.Name)
	}
}

func TestParse_NoTrack_ReturnsError(t *testing.T) {
	input := `<?xml version="1.0"?><gpx version="1.1" creator="x"></gpx>`
	_, err := Parse([]byte(input))
	if err == nil {
		t.Fatal("expected error for missing track")
	}
	if !strings.Contains(err.Error(), "no <trk>") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestParse_LessThanTwoPoints_ReturnsError(t *testing.T) {
	input := `<?xml version="1.0"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>One Point</name><trkseg>
    <trkpt lat="50.0" lon="6.0"><time>2026-02-15T08:00:00Z</time></trkpt>
  </trkseg></trk>
</gpx>`

	_, err := Parse([]byte(input))
	if err == nil {
		t.Fatal("expected error for less than two points")
	}
	if !strings.Contains(err.Error(), "at least 2 track points") {
		t.Fatalf("unexpected error: %v", err)
	}
}
