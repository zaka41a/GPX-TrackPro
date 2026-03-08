import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { SkeletonKpiRow } from "@/components/SkeletonCards";
import { activityService } from "@/services/activityService";
import { ActivityStatistics, HRZone, ClimbSegment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, MapPin, BarChart3, Bike, Footprints, Dumbbell, Calendar, HeartPulse, TrendingUp, Mountain } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip as MapTooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function metricToColor(value: number, min: number, max: number): string {
  if (max <= min) return "#3b82f6";
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // blue (hue 240) → green (120) → red (0)
  const hue = Math.round(240 - t * 240);
  return `hsl(${hue}, 85%, 50%)`;
}

function fmtDuration(sec: number): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

const ZONE_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444"];

// ── Colored polyline for map ──────────────────────────────────────────────────

function ColoredPolyline({
  positions,
  values,
}: {
  positions: [number, number][];
  values: (number | undefined)[];
}) {
  const valid = values.filter((v): v is number => v !== undefined);
  const min = valid.length ? Math.min(...valid) : 0;
  const max = valid.length ? Math.max(...valid) : 1;

  return (
    <>
      {positions.slice(0, -1).map((pos, i) => {
        const v = values[i] ?? min;
        return (
          <Polyline
            key={i}
            positions={[pos, positions[i + 1]]}
            pathOptions={{ color: metricToColor(v, min, max), weight: 4, opacity: 0.9 }}
          />
        );
      })}
    </>
  );
}

// ── Color legend ──────────────────────────────────────────────────────────────

function ColorLegend({ label, unit, min, max }: { label: string; unit: string; min: number; max: number }) {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1.5 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{min.toFixed(0)}{unit}</span>
        <div
          className="h-2 w-24 rounded-full"
          style={{ background: "linear-gradient(to right, hsl(240,85%,50%), hsl(120,85%,50%), hsl(0,85%,50%))" }}
        />
        <span className="text-muted-foreground">{max.toFixed(0)}{unit}</span>
      </div>
    </div>
  );
}

const sportIcons: Record<string, typeof Bike> = { cycling: Bike, running: Footprints, other: Dumbbell };
const sportBg: Record<string, string> = { cycling: "bg-accent/10 text-accent", running: "bg-success/10 text-success", other: "bg-warning/10 text-warning" };

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [positions, map]);
  return null;
}

// ── HR Zones section ──────────────────────────────────────────────────────────

function HRZonesSection({ zones }: { zones: HRZone[] }) {
  const data = zones.map((z, i) => ({
    name: z.label,
    pct: z.pctTime,
    time: fmtDuration(z.timeSec),
    range: `${z.minBpm}–${z.maxBpm} bpm`,
    color: ZONE_COLORS[i],
  }));

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <div className="section-icon-bg bg-destructive/10">
          <TrendingUp className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <span>Training Zones</span>
          <p className="text-xs text-muted-foreground font-normal">Time distribution per HR zone</p>
        </div>
      </h2>
      <div className="rounded-xl border border-border bg-card p-4 accent-line-top">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(_: number, __: string, entry: { payload: { time: string; range: string } }) => [
                `${entry.payload.time} · ${entry.payload.range}`,
                "Time",
              ]}
              labelFormatter={(label: string) => label}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(v: number) => (v > 0 ? `${v}%` : "")}
                style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ── Climbs section ────────────────────────────────────────────────────────────

function ClimbsSection({ climbs }: { climbs: ClimbSegment[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <div className="section-icon-bg">
          <Mountain className="h-4 w-4 text-accent" />
        </div>
        <div>
          <span>Climbs</span>
          <p className="text-xs text-muted-foreground font-normal">
            {climbs.length} detected segment{climbs.length > 1 ? "s" : ""}
          </p>
        </div>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {climbs.map((c) => (
          <div
            key={c.index}
            className="rounded-xl border border-border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow accent-line-top"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                Climb #{c.index}
              </span>
              <span className="text-xs text-muted-foreground">
                {c.startKm} → {c.endKm} km
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gain</p>
                <p className="text-base font-bold text-foreground">
                  {c.elevGainM}<span className="text-xs font-normal text-muted-foreground ml-0.5">m</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p>
                <p className="text-base font-bold text-foreground">
                  {c.distanceKm}<span className="text-xs font-normal text-muted-foreground ml-0.5">km</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Gradient</p>
                <p className="text-base font-bold text-foreground">
                  {c.gradientPct}<span className="text-xs font-normal text-muted-foreground ml-0.5">%</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">VAM</p>
                <p className="text-base font-bold text-foreground">
                  {c.vam > 0 ? (
                    <>{c.vam}<span className="text-xs font-normal text-muted-foreground ml-0.5">m/h</span></>
                  ) : "—"}
                </p>
              </div>
            </div>
            {c.durationSec > 0 && (
              <p className="text-xs text-muted-foreground border-t border-border pt-2">
                Duration: {fmtDuration(c.durationSec)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type MapMode = "route" | "speed" | "hr";

export default function ActivityStatsPage() {
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<ActivityStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState<MapMode>("route");

  useEffect(() => {
    if (id) activityService.getActivityById(id).then((a) => { setActivity(a); setLoading(false); });
  }, [id]);

  const elevationData = useMemo(() => {
    if (!activity?.elevationProfile?.length) return [];
    const step = Math.max(1, Math.floor(activity.elevationProfile.length / 300));
    return activity.elevationProfile.filter((_, i) => i % step === 0 || i === activity.elevationProfile!.length - 1);
  }, [activity]);

  const avgElevation = useMemo(() => {
    if (!elevationData.length) return 0;
    return elevationData.reduce((sum, d) => sum + d.elevation, 0) / elevationData.length;
  }, [elevationData]);

  const hrData = useMemo(() => {
    if (!activity?.elevationProfile?.length) return [];
    const withHr = activity.elevationProfile.filter((p) => p.hr && p.hr > 0);
    if (withHr.length < 5) return [];
    const step = Math.max(1, Math.floor(withHr.length / 200));
    return withHr
      .filter((_, i) => i % step === 0 || i === withHr.length - 1)
      .map((p) => ({ distance: p.distance, hr: p.hr! }));
  }, [activity]);

  const avgHr = useMemo(() => {
    if (!hrData.length) return 0;
    return Math.round(hrData.reduce((s, d) => s + d.hr, 0) / hrData.length);
  }, [hrData]);

  const sampledCoords = useMemo(() => {
    if (!activity?.coordinates?.length) return [];
    const step = Math.max(1, Math.floor(activity.coordinates.length / 500));
    return activity.coordinates.filter(
      (_, i) => i % step === 0 || i === activity.coordinates!.length - 1,
    );
  }, [activity]);

  const mapPositions = useMemo<[number, number][]>(
    () => sampledCoords.map((c) => [c.lat, c.lng]),
    [sampledCoords],
  );

  const mapSpeedValues = useMemo(
    () => sampledCoords.map((c) => c.speed),
    [sampledCoords],
  );

  const mapHRValues = useMemo(
    () => sampledCoords.map((c) => c.hr),
    [sampledCoords],
  );

  const speedRange = useMemo(() => {
    const vals = mapSpeedValues.filter((v): v is number => v !== undefined);
    return { min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 1 };
  }, [mapSpeedValues]);

  const hrRange = useMemo(() => {
    const vals = mapHRValues.filter((v): v is number => v !== undefined);
    return { min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 1 };
  }, [mapHRValues]);

  if (loading) return (
    <AppShell>
      <div className="space-y-8">
        <div className="skeleton-shimmer h-8 w-48 rounded" />
        <SkeletonKpiRow count={5} />
        <div className="skeleton-shimmer h-48 rounded-xl" />
      </div>
    </AppShell>
  );

  if (!activity) return (
    <AppShell>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Activity not found.</p>
        <Button variant="outline" className="mt-4" asChild><Link to="/activities">Back to Archive</Link></Button>
      </div>
    </AppShell>
  );

  const SportIcon = sportIcons[activity.sportType] || Dumbbell;
  const sportColor = sportBg[activity.sportType] || sportBg.other;

  const metrics = [
    { label: "Distance", value: activity.distance, unit: "km" },
    { label: "Duration", value: Math.floor(activity.duration / 60), unit: "min" },
    { label: "Avg Speed", value: activity.avgSpeed, unit: "km/h" },
    { label: "Max Speed", value: activity.maxSpeed, unit: "km/h" },
    { label: "Pace", value: activity.pace || null, unit: "min/km" },
    { label: "Elev. Gain", value: activity.elevationGain, unit: "m" },
    { label: "Elev. Loss", value: activity.elevationLoss, unit: "m" },
    { label: "Avg HR", value: activity.avgHeartRate || null, unit: "bpm" },
    { label: "Max HR", value: activity.maxHeartRate || null, unit: "bpm" },
    { label: "Avg Cadence", value: activity.avgCadence || null, unit: "rpm" },
  ];

  const handleExport = (format: string) => {
    let data: string;
    let mime: string;

    if (format === "json") {
      data = JSON.stringify(activity, null, 2);
      mime = "application/json";
    } else if (format === "csv") {
      const headers = ["Name", "Date", "Sport", "Distance (km)", "Duration (s)", "Avg Speed (km/h)", "Max Speed (km/h)", "Elevation Gain (m)", "Elevation Loss (m)", "Avg HR (bpm)", "Max HR (bpm)", "Avg Cadence (rpm)", "Pace (min/km)"];
      const values = [activity.name, activity.date, activity.sportType, activity.distance, activity.duration, activity.avgSpeed, activity.maxSpeed, activity.elevationGain, activity.elevationLoss, activity.avgHeartRate ?? "", activity.maxHeartRate ?? "", activity.avgCadence ?? "", activity.pace ?? ""];
      data = headers.join(",") + "\n" + values.join(",");
      if (activity.elevationProfile?.length) {
        data += "\n\nElevation Profile\nDistance (km),Elevation (m)";
        activity.elevationProfile.forEach((p) => { data += `\n${p.distance},${p.elevation}`; });
      }
      mime = "text/csv";
    } else if (format === "pdf") {
      const win = window.open("", "_blank");
      if (!win) return;
      const metricsHtml = metrics.filter((m) => m.value !== null).map((m) => `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;font-weight:500">${m.label}</td><td style="padding:8px 16px;border-bottom:1px solid #eee;font-family:monospace">${m.value} ${m.unit}</td></tr>`).join("");
      win.document.write(`<!DOCTYPE html><html><head><title>${activity.name}</title><style>body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a1a}h1{font-size:24px;margin-bottom:4px}h2{font-size:16px;margin-top:32px;margin-bottom:12px;color:#666}table{border-collapse:collapse;width:100%}td{text-align:left}.meta{color:#666;font-size:14px;margin-bottom:24px}@media print{body{padding:20px}}</style></head><body><h1>${activity.name}</h1><p class="meta">${activity.date} · ${activity.sportType} · ${activity.distance} km · ${Math.floor(activity.duration / 60)} min</p><h2>Metrics</h2><table>${metricsHtml}</table><script>window.print();window.onafterprint=()=>window.close();<` + `/script></body></html>`);
      win.document.close();
      return;
    } else {
      return;
    }

    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activity.name}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-8">
          <div className="rounded-xl border border-border bg-card overflow-hidden relative">
            <div className="h-1.5 bg-gradient-to-r from-accent via-accent/60 to-accent/20" />
            <div className="flex items-center gap-3 p-6">
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" asChild>
                <Link to="/activities" aria-label="Back to archive"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", sportColor)}>
                <SportIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground truncate">{activity.name}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {activity.date}
                  </span>
                  <Badge variant="outline" className="text-accent border-accent/30 gap-1">
                    <SportIcon className="h-3 w-3" />
                    <span className="capitalize">{activity.sportType}</span>
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {metrics.slice(0, 2).map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow accent-line-top">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{m.label}</p>
                {m.value !== null ? (
                  <p className="font-bold">
                    <span className="text-2xl text-foreground">{m.value}</span>
                    <span className="text-xs text-muted-foreground ml-1">{m.unit}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">&mdash;</p>
                )}
              </div>
            ))}
            {metrics.slice(2).map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow border-l-2 border-l-accent/15">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{m.label}</p>
                {m.value !== null ? (
                  <p className="font-bold">
                    <span className="text-xl text-foreground">{m.value}</span>
                    <span className="text-xs text-muted-foreground ml-1">{m.unit}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">&mdash;</p>
                )}
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="section-icon-bg">
                <BarChart3 className="h-4 w-4 text-accent" />
              </div>
              <div>
                <span>Elevation Profile</span>
                {elevationData.length > 0 && (
                  <p className="text-xs text-muted-foreground font-normal">Gain {activity.elevationGain}m · Loss {activity.elevationLoss}m</p>
                )}
              </div>
            </h2>
            <div className="rounded-xl border border-border bg-card p-4 accent-line-top">
              {elevationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={elevationData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="distance"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v: number) => `${v.toFixed(1)}`}
                      label={{ value: "km", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: "m", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => [`${value.toFixed(0)} m`, "Elevation"]}
                      labelFormatter={(label: number) => `${label.toFixed(2)} km`}
                    />
                    {avgElevation > 0 && (
                      <ReferenceLine
                        y={Math.round(avgElevation)}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        strokeOpacity={0.6}
                        label={{ value: `Avg ${Math.round(avgElevation)}m`, position: "insideTopRight", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="elevation"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      fill="url(#elevGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No elevation data available</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {hrData.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="section-icon-bg bg-destructive/10">
                  <HeartPulse className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <span>Heart Rate</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Avg {avgHr} bpm · Max {activity.maxHeartRate} bpm
                  </p>
                </div>
              </h2>
              <div className="rounded-xl border border-border bg-card p-4 accent-line-top">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={hrData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="distance"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v: number) => `${v.toFixed(1)}`}
                      label={{
                        value: "km",
                        position: "insideBottomRight",
                        offset: -5,
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      label={{
                        value: "bpm",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value} bpm`, "Heart Rate"]}
                      labelFormatter={(label: number) => `${label.toFixed(2)} km`}
                    />
                    {avgHr > 0 && (
                      <ReferenceLine
                        y={avgHr}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        strokeOpacity={0.6}
                        label={{
                          value: `Avg ${avgHr} bpm`,
                          position: "insideTopRight",
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="hr"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="section-icon-bg">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                Route Map
              </h2>
              {mapPositions.length > 1 && (
                <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-muted/40">
                  {(["route", "speed", "hr"] as MapMode[]).map((mode) => {
                    const disabled =
                      (mode === "speed" && mapSpeedValues.every((v) => v === undefined)) ||
                      (mode === "hr" && mapHRValues.every((v) => v === undefined));
                    return (
                      <button
                        key={mode}
                        disabled={disabled}
                        onClick={() => setMapMode(mode)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                          mapMode === mode
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed",
                        )}
                      >
                        {mode === "route" ? "Route" : mode === "speed" ? "Speed" : "Heart Rate"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {mapPositions.length > 1 ? (
                <div className="relative">
                  <MapContainer
                    center={mapPositions[0]}
                    zoom={13}
                    scrollWheelZoom
                    style={{ height: 420, width: "100%" }}
                    className="z-0"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapMode === "route" && (
                      <Polyline
                        positions={mapPositions}
                        pathOptions={{ color: "hsl(217, 91%, 60%)", weight: 4, opacity: 0.9 }}
                      />
                    )}
                    {mapMode === "speed" && (
                      <ColoredPolyline positions={mapPositions} values={mapSpeedValues} />
                    )}
                    {mapMode === "hr" && (
                      <ColoredPolyline positions={mapPositions} values={mapHRValues} />
                    )}
                    <CircleMarker
                      center={mapPositions[0]}
                      radius={8}
                      pathOptions={{ color: "#15803d", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
                    >
                      <MapTooltip>Start</MapTooltip>
                    </CircleMarker>
                    <CircleMarker
                      center={mapPositions[mapPositions.length - 1]}
                      radius={8}
                      pathOptions={{ color: "#b91c1c", fillColor: "#ef4444", fillOpacity: 1, weight: 2 }}
                    >
                      <MapTooltip>End</MapTooltip>
                    </CircleMarker>
                    <FitBounds positions={mapPositions} />
                  </MapContainer>
                  {mapMode === "speed" && (
                    <ColorLegend
                      label="Speed"
                      unit=" km/h"
                      min={speedRange.min}
                      max={speedRange.max}
                    />
                  )}
                  {mapMode === "hr" && (
                    <ColorLegend
                      label="Heart Rate"
                      unit=" bpm"
                      min={hrRange.min}
                      max={hrRange.max}
                    />
                  )}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No GPS coordinates available</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* HR Zones */}
          {activity.hrZones && activity.hrZones.some((z) => z.timeSec > 0) && (
            <HRZonesSection zones={activity.hrZones} />
          )}

          {/* Climbs */}
          {activity.climbs && activity.climbs.length > 0 && (
            <ClimbsSection climbs={activity.climbs} />
          )}

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="section-icon-bg">
                <Download className="h-4 w-4 text-accent" />
              </div>
              Export Data
            </h2>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2 text-foreground hover:text-accent hover:border-accent/30" onClick={() => handleExport("json")}>
                <Download className="h-4 w-4" /> JSON
              </Button>
              <Button variant="outline" className="gap-2 text-foreground hover:text-accent hover:border-accent/30" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" className="gap-2 text-foreground hover:text-accent hover:border-accent/30" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4" /> PDF
              </Button>
            </div>
          </section>
        </div>
      </PageTransition>
    </AppShell>
  );
}
