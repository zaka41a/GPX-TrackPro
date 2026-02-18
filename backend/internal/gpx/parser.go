package gpx

import (
	"encoding/xml"
	"errors"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type Point struct {
	Lat     float64    `json:"lat"`
	Lon     float64    `json:"lon"`
	Ele     float64    `json:"ele"`
	Time    *time.Time `json:"time,omitempty"`
	HR      *int       `json:"hr,omitempty"`
	Cadence *int       `json:"cadence,omitempty"`
}

type ParsedActivity struct {
	Name   string  `json:"name"`
	Points []Point `json:"points"`
}

type gpxDoc struct {
	Tracks []track `xml:"trk"`
}

type track struct {
	Name     string    `xml:"name"`
	Segments []segment `xml:"trkseg"`
}

type segment struct {
	Points []trackPointXML `xml:"trkpt"`
}

type trackPointXML struct {
	Lat        float64       `xml:"lat,attr"`
	Lon        float64       `xml:"lon,attr"`
	Ele        *float64      `xml:"ele"`
	Time       string        `xml:"time"`
	Extensions extensionsXML `xml:"extensions"`
}

type extensionsXML struct {
	Inner string `xml:",innerxml"`
}

var (
	hrRe  = regexp.MustCompile(`<(?:[a-zA-Z0-9_]+:)?hr>\s*([0-9]{1,3})\s*</(?:[a-zA-Z0-9_]+:)?hr>`)
	cadRe = regexp.MustCompile(`<(?:[a-zA-Z0-9_]+:)?cad>\s*([0-9]{1,3})\s*</(?:[a-zA-Z0-9_]+:)?cad>`)
)

func Parse(content []byte) (ParsedActivity, error) {
	var doc gpxDoc
	if err := xml.Unmarshal(content, &doc); err != nil {
		return ParsedActivity{}, err
	}
	if len(doc.Tracks) == 0 {
		return ParsedActivity{}, errors.New("no <trk> found in GPX")
	}

	trk := doc.Tracks[0]
	activity := ParsedActivity{Name: strings.TrimSpace(trk.Name)}
	if activity.Name == "" {
		activity.Name = "Imported GPX Activity"
	}

	for _, seg := range trk.Segments {
		for _, p := range seg.Points {
			point := Point{Lat: p.Lat, Lon: p.Lon}
			if p.Ele != nil {
				point.Ele = *p.Ele
			}
			if ts := parseTime(p.Time); ts != nil {
				point.Time = ts
			}
			if hr, ok := parseExtInt(hrRe, p.Extensions.Inner); ok {
				point.HR = &hr
			}
			if cad, ok := parseExtInt(cadRe, p.Extensions.Inner); ok {
				point.Cadence = &cad
			}
			activity.Points = append(activity.Points, point)
		}
	}

	if len(activity.Points) < 2 {
		return ParsedActivity{}, errors.New("GPX must contain at least 2 track points")
	}

	return activity, nil
}

func parseTime(raw string) *time.Time {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	layouts := []string{time.RFC3339Nano, time.RFC3339, "2006-01-02T15:04:05Z07:00"}
	for _, layout := range layouts {
		t, err := time.Parse(layout, raw)
		if err == nil {
			return &t
		}
	}
	return nil
}

func parseExtInt(re *regexp.Regexp, src string) (int, bool) {
	matches := re.FindStringSubmatch(src)
	if len(matches) != 2 {
		return 0, false
	}
	value, err := strconv.Atoi(matches[1])
	if err != nil {
		return 0, false
	}
	return value, true
}
