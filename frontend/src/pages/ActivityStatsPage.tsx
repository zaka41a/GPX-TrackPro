import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { SkeletonKpiRow } from "@/components/SkeletonCards";
import { activityService } from "@/services/activityService";
import { ActivityStatistics } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, MapPin, BarChart3, Bike, Footprints, Dumbbell } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip as MapTooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const sportIcons: Record<string, typeof Bike> = { cycling: Bike, running: Footprints, other: Dumbbell };

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

export default function ActivityStatsPage() {
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<ActivityStatistics | null>(null);
  const [loading, setLoading] = useState(true);

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

  const mapPositions = useMemo<[number, number][]>(() => {
    if (!activity?.coordinates?.length) return [];
    const step = Math.max(1, Math.floor(activity.coordinates.length / 500));
    return activity.coordinates
      .filter((_, i) => i % step === 0 || i === activity.coordinates!.length - 1)
      .map((c) => [c.lat, c.lng]);
  }, [activity]);

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
    if (format === "pdf") return;
    const data = format === "json" ? JSON.stringify(activity, null, 2) : Object.entries(activity).map(([k, v]) => `${k},${v}`).join("\n");
    const blob = new Blob([data], { type: "text/plain" });
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
          {/* Hero header */}
          <div className="rounded-xl border border-border bg-card overflow-hidden relative">
            <div className="h-1 bg-gradient-to-r from-accent to-accent/40" />
            <div className="flex items-center gap-3 p-6">
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" asChild>
                <Link to="/activities" aria-label="Back to archive"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground truncate">{activity.name}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm text-muted-foreground">{activity.date}</span>
                  <Badge variant="outline" className="text-accent border-accent/30 gap-1">
                    <SportIcon className="h-3 w-3" />
                    <span className="capitalize">{activity.sportType}</span>
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {metrics.slice(0, 2).map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
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
              <div key={m.label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
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

          {/* Elevation Profile Chart */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="h-7 w-7 bg-accent/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 text-accent" />
              </div>
              Elevation Profile
            </h2>
            <div className="rounded-xl border border-border bg-card p-4">
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

          {/* Route Map */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="h-7 w-7 bg-accent/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-accent" />
              </div>
              Route Map
            </h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {mapPositions.length > 1 ? (
                <MapContainer
                  center={mapPositions[0]}
                  zoom={13}
                  scrollWheelZoom
                  style={{ height: 400, width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Polyline
                    positions={mapPositions}
                    pathOptions={{ color: "hsl(217, 91%, 60%)", weight: 4, opacity: 0.85 }}
                  />
                  <CircleMarker center={mapPositions[0]} radius={7} pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}>
                    <MapTooltip>Start</MapTooltip>
                  </CircleMarker>
                  <CircleMarker center={mapPositions[mapPositions.length - 1]} radius={7} pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 1, weight: 2 }}>
                    <MapTooltip>End</MapTooltip>
                  </CircleMarker>
                  <FitBounds positions={mapPositions} />
                </MapContainer>
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

          {/* Export */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="h-7 w-7 bg-accent/10 rounded-lg flex items-center justify-center">
                <Download className="h-3.5 w-3.5 text-accent" />
              </div>
              Export Data
            </h2>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2 text-foreground" onClick={() => handleExport("json")}>
                <Download className="h-4 w-4" /> JSON
              </Button>
              <Button variant="outline" className="gap-2 text-foreground" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" disabled className="relative gap-2">
                <Download className="h-4 w-4" /> PDF
                <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 bg-warning/10 text-warning border border-warning/20">Soon</Badge>
              </Button>
            </div>
          </section>
        </div>
      </PageTransition>
    </AppShell>
  );
}
