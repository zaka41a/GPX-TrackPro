import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { SkeletonKpiRow } from "@/components/SkeletonCards";
import { EmptyState } from "@/components/EmptyState";
import { useActivities } from "@/hooks/useActivities";
import { Activity } from "@/types";
import { activityService, LoadPoint } from "@/services/activityService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Route,
  Timer,
  Gauge,
  Mountain,
  TrendingUp,
  Upload,
  Bike,
  Footprints,
  Dumbbell,
  Flame,
  Trophy,
  Calendar,
  Zap,
  Target,
  BarChart3,
  HeartPulse,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area,
  Line,
  ReferenceLine,
} from "recharts";

const sportIcons: Record<string, typeof Bike> = {
  cycling: Bike,
  running: Footprints,
  other: Dumbbell,
};

const sportGradients: Record<string, { bg: string; ring: string; text: string }> = {
  cycling: { bg: "from-accent/20 to-accent/5", ring: "ring-accent/20", text: "text-accent" },
  running: { bg: "from-success/20 to-success/5", ring: "ring-success/20", text: "text-success" },
  other: { bg: "from-warning/20 to-warning/5", ring: "ring-warning/20", text: "text-warning" },
};

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.4 },
});

type DateRange = "all" | "year" | "6m" | "3m" | "month";

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "year", label: "This year" },
  { value: "6m", label: "Last 6 months" },
  { value: "3m", label: "Last 3 months" },
  { value: "month", label: "This month" },
];

function cutoffDate(range: DateRange): Date | null {
  if (range === "all") return null;
  const d = new Date();
  if (range === "year") return new Date(d.getFullYear(), 0, 1);
  if (range === "6m") { d.setMonth(d.getMonth() - 6); return d; }
  if (range === "3m") { d.setMonth(d.getMonth() - 3); return d; }
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ── PMC helpers ───────────────────────────────────────────────────────────────

function tsbLabel(tsb: number): { text: string; color: string } {
  if (tsb > 10)  return { text: "Very Fresh", color: "text-success" };
  if (tsb >= 0)  return { text: "Fresh",      color: "text-success" };
  if (tsb >= -10) return { text: "Optimal",   color: "text-accent" };
  if (tsb >= -20) return { text: "Training",  color: "text-warning" };
  return             { text: "Fatigued",       color: "text-destructive" };
}

function PMCSection({ data }: { data: LoadPoint[] }) {
  const last = data[data.length - 1];
  const prev = data.length > 7 ? data[data.length - 8] : null;

  const ctlTrend = prev ? last.ctl - prev.ctl : 0;
  const atlTrend = prev ? last.atl - prev.atl : 0;
  const tsb      = last?.tsb ?? 0;
  const tsbInfo  = tsbLabel(tsb);

  // Show every 7th label to avoid clutter
  const tickFormatter = (v: string, i: number) =>
    i % 7 === 0 ? new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  return (
    <motion.section {...fadeIn(0)} className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="section-icon-bg bg-accent/10">
            <HeartPulse className="h-4 w-4 text-accent" />
          </div>
          <div>
            <span>Load Flow</span>
            <p className="text-xs text-muted-foreground font-normal">
              Performance Management Chart · Banister TRIMP · CTL/ATL/TSB
            </p>
          </div>
        </h2>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 border border-border rounded-lg px-2.5 py-1.5">
          <Info className="h-3 w-3 shrink-0" />
          <span>Industry standard (TrainingPeaks / Garmin)</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "CTL — Fitness",
            value: last?.ctl.toFixed(1) ?? "0",
            sub: ctlTrend >= 0 ? `+${ctlTrend.toFixed(1)} vs 7d` : `${ctlTrend.toFixed(1)} vs 7d`,
            subColor: ctlTrend >= 0 ? "text-success" : "text-destructive",
            bg: "from-accent/15 to-accent/5",
            dot: "bg-accent",
          },
          {
            label: "ATL — Fatigue",
            value: last?.atl.toFixed(1) ?? "0",
            sub: atlTrend >= 0 ? `+${atlTrend.toFixed(1)} vs 7d` : `${atlTrend.toFixed(1)} vs 7d`,
            subColor: atlTrend >= 0 ? "text-warning" : "text-success",
            bg: "from-orange-500/15 to-orange-500/5",
            dot: "bg-orange-400",
          },
          {
            label: "TSB — Form",
            value: tsb >= 0 ? `+${tsb.toFixed(1)}` : tsb.toFixed(1),
            sub: tsbInfo.text,
            subColor: tsbInfo.color,
            bg: tsb >= 0 ? "from-success/15 to-success/5" : "from-destructive/15 to-destructive/5",
            dot: tsb >= 0 ? "bg-success" : "bg-destructive",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={cn(
              "glass-surface rounded-xl p-4 bg-gradient-to-br border border-border/50",
              kpi.bg,
            )}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className={cn("h-2 w-2 rounded-full shrink-0", kpi.dot)} />
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                {kpi.label}
              </p>
            </div>
            <p className="text-2xl font-extrabold font-mono-data text-foreground">{kpi.value}</p>
            <p className={cn("text-[11px] font-medium mt-0.5", kpi.subColor)}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-surface rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-muted-foreground">
          {[
            { color: "bg-accent/60",      label: "Daily TRIMP" },
            { color: "bg-accent",         label: "CTL — Fitness (42d)" },
            { color: "bg-orange-400",     label: "ATL — Fatigue (7d)" },
            { color: "bg-success",        label: "TSB+ — Fresh" },
            { color: "bg-destructive",    label: "TSB− — Fatigued" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-sm shrink-0", l.color)} />
              {l.label}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="load"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <YAxis
              yAxisId="tsb"
              orientation="right"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(label: string) =>
                new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
              }
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  trimp: "TRIMP",
                  ctl: "CTL (Fitness)",
                  atl: "ATL (Fatigue)",
                  tsb: "TSB (Form)",
                };
                return [value.toFixed(1), labels[name] ?? name];
              }}
            />
            <ReferenceLine yAxisId="tsb" y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />

            {/* Daily TRIMP — subtle background bars */}
            <Bar yAxisId="load" dataKey="trimp" fill="hsl(var(--accent))" opacity={0.25} maxBarSize={10} radius={[2, 2, 0, 0]} />

            {/* TSB — coloured bars on right axis */}
            <Bar yAxisId="tsb" dataKey="tsb" maxBarSize={6} radius={[2, 2, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.tsb >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.75} />
              ))}
            </Bar>

            {/* CTL — filled area */}
            <Area
              yAxisId="load"
              type="monotone"
              dataKey="ctl"
              stroke="hsl(var(--accent))"
              strokeWidth={2.5}
              fill="hsl(var(--accent))"
              fillOpacity={0.08}
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* ATL — line */}
            <Line
              yAxisId="load"
              type="monotone"
              dataKey="atl"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <p className="text-[10px] text-muted-foreground mt-3 text-right">
          TSB &gt; 0 = fresh · TSB −10→0 = optimal training · TSB &lt; −20 = overreached
        </p>
      </div>
    </motion.section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { data: allActivities = [], isLoading: loading } = useActivities();
  const [range, setRange] = useState<DateRange>("all");

  const { data: loadFlow = [] } = useQuery<LoadPoint[]>({
    queryKey: ["load-flow"],
    queryFn: () => activityService.getLoadFlow(),
    staleTime: 5 * 60_000,
  });

  const activities = useMemo(() => {
    const cutoff = cutoffDate(range);
    if (!cutoff) return allActivities;
    return allActivities.filter((a) => new Date(a.date) >= cutoff);
  }, [allActivities, range]);

  const totalDistance = activities.reduce((s, a) => s + a.distance, 0);
  const totalDuration = activities.reduce((s, a) => s + a.duration, 0);
  const totalElevation = activities.reduce((s, a) => s + a.elevationGain, 0);
  const avgSpeed =
    activities.length > 0
      ? activities.reduce((s, a) => s + a.avgSpeed, 0) / activities.length
      : 0;
  const maxSpeed =
    activities.length > 0 ? Math.max(...activities.map((a) => a.maxSpeed)) : 0;
  const longestActivity =
    activities.length > 0 ? Math.max(...activities.map((a) => a.distance)) : 0;
  const avgHeartRate =
    activities.filter((a) => a.avgHeartRate).length > 0
      ? Math.round(
          activities.filter((a) => a.avgHeartRate).reduce((s, a) => s + (a.avgHeartRate || 0), 0) /
            activities.filter((a) => a.avgHeartRate).length
        )
      : null;

  const sportBreakdown = activities.reduce<
    Record<string, { count: number; distance: number; duration: number; avgSpeed: number; elevation: number }>
  >((acc, a) => {
    if (!acc[a.sportType])
      acc[a.sportType] = { count: 0, distance: 0, duration: 0, avgSpeed: 0, elevation: 0 };
    acc[a.sportType].count++;
    acc[a.sportType].distance += a.distance;
    acc[a.sportType].duration += a.duration;
    acc[a.sportType].avgSpeed += a.avgSpeed;
    acc[a.sportType].elevation += a.elevationGain;
    return acc;
  }, {});

  const monthlyData = activities.reduce<
    Record<string, { count: number; distance: number; duration: number; elevation: number }>
  >((acc, a) => {
    const month = a.date.substring(0, 7);
    if (!acc[month]) acc[month] = { count: 0, distance: 0, duration: 0, elevation: 0 };
    acc[month].count++;
    acc[month].distance += a.distance;
    acc[month].duration += a.duration;
    acc[month].elevation += a.elevationGain;
    return acc;
  }, {});

  const sortedMonths = Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  const maxMonthlyDistance =
    sortedMonths.length > 0 ? Math.max(...sortedMonths.map(([, d]) => d.distance)) : 1;

  const fastestActivity =
    activities.length > 0 ? activities.reduce((best, a) => (a.maxSpeed > best.maxSpeed ? a : best)) : null;
  const mostElevation =
    activities.length > 0
      ? activities.reduce((best, a) => (a.elevationGain > best.elevationGain ? a : best))
      : null;

  const weeks = activities.length > 0
    ? (() => {
        const dates = activities.map((a) => new Date(a.date).getTime());
        const span = Math.max(...dates) - Math.min(...dates);
        return Math.max(1, Math.ceil(span / (7 * 24 * 60 * 60 * 1000)));
      })()
    : 1;
  const weeklyAvgDistance = totalDistance / weeks;
  const weeklyAvgDuration = totalDuration / weeks;

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="glass-surface rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
                  <p className="text-sm text-muted-foreground">
                    Deep dive into your training performance and progress.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRange(r.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      range === r.value
                        ? "bg-accent/10 text-accent border-accent/30"
                        : "text-muted-foreground border-transparent hover:text-foreground",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {activities.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing <span className="text-foreground font-medium">{activities.length}</span> activit{activities.length !== 1 ? "ies" : "y"}
                {range !== "all" && ` · ${DATE_RANGES.find(r => r.value === range)?.label}`}
              </p>
            )}
          </div>

          {loading ? (
            <SkeletonKpiRow />
          ) : activities.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-12 w-12" />}
              title="No statistics yet"
              description="Upload your first GPX file to start tracking your performance."
              action={
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <Link to="/upload">
                    <Upload className="h-4 w-4 mr-2" /> Upload GPX
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {/* Performance Management Chart */}
              {loadFlow.length > 0 && <PMCSection data={loadFlow} />}

              <motion.div {...fadeIn(0)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Distance",
                    value: `${totalDistance.toFixed(1)}`,
                    unit: "km",
                    icon: Route,
                    gradient: "from-accent/15 to-accent/5",
                    iconColor: "text-accent",
                  },
                  {
                    label: "Total Time",
                    value: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`,
                    unit: "",
                    icon: Timer,
                    gradient: "from-success/15 to-success/5",
                    iconColor: "text-success",
                  },
                  {
                    label: "Elevation Gained",
                    value: `${totalElevation.toFixed(0)}`,
                    unit: "m",
                    icon: Mountain,
                    gradient: "from-warning/15 to-warning/5",
                    iconColor: "text-warning",
                  },
                  {
                    label: "Activities",
                    value: `${activities.length}`,
                    unit: "",
                    icon: Flame,
                    gradient: "from-destructive/15 to-destructive/5",
                    iconColor: "text-destructive",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    {...fadeIn(i * 0.08)}
                    className={cn(
                      "glass-surface rounded-xl p-5 bg-gradient-to-br border border-border/50 hover:border-border transition-colors",
                      stat.gradient
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                    </div>
                    <p className="text-2xl lg:text-3xl font-extrabold font-mono-data text-foreground">
                      {stat.value}
                      {stat.unit && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {stat.unit}
                        </span>
                      )}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div {...fadeIn(0.15)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Avg Speed", value: `${avgSpeed.toFixed(1)} km/h`, icon: Gauge, color: "text-accent" },
                  { label: "Max Speed", value: `${maxSpeed.toFixed(1)} km/h`, icon: Zap, color: "text-warning" },
                  { label: "Longest Ride", value: `${longestActivity.toFixed(1)} km`, icon: Target, color: "text-success" },
                  {
                    label: "Weekly Avg",
                    value: `${weeklyAvgDistance.toFixed(1)} km`,
                    icon: TrendingUp,
                    color: "text-accent",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    {...fadeIn(0.15 + i * 0.06)}
                    className="glass-card rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className={cn("stat-icon-bg shrink-0", stat.color === "text-accent" ? "bg-accent/10" : stat.color === "text-warning" ? "bg-warning/10" : "bg-success/10")}>
                      <stat.icon className={cn("h-4.5 w-4.5", stat.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      <p className="text-sm font-bold font-mono-data text-foreground truncate">
                        {stat.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <motion.section {...fadeIn(0.25)} className="lg:col-span-3">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="section-icon-bg">
                      <Flame className="h-4 w-4 text-accent" />
                    </div>
                    Sport Breakdown
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(sportBreakdown).map(([sport, data], i) => {
                      const Icon = sportIcons[sport] || Dumbbell;
                      const colors = sportGradients[sport] || sportGradients.other;
                      const sportPct = ((data.distance / totalDistance) * 100).toFixed(0);
                      return (
                        <motion.div
                          key={sport}
                          {...fadeIn(0.3 + i * 0.08)}
                          className={cn(
                            "rounded-xl p-5 bg-gradient-to-br border ring-1",
                            colors.bg,
                            colors.ring,
                            "border-border/30"
                          )}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <Icon className={cn("h-5 w-5", colors.text)} />
                              <p className="font-semibold text-sm text-foreground capitalize">{sport}</p>
                            </div>
                            <span className={cn("text-xs font-bold font-mono-data", colors.text)}>
                              {sportPct}%
                            </span>
                          </div>

                          <div className="h-1.5 bg-background/50 rounded-full overflow-hidden mb-4">
                            <motion.div
                              className={cn(
                                "h-full rounded-full",
                                sport === "cycling"
                                  ? "bg-accent"
                                  : sport === "running"
                                  ? "bg-success"
                                  : "bg-warning"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${sportPct}%` }}
                              transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Distance
                              </p>
                              <p className="text-sm font-mono-data font-bold text-foreground">
                                {data.distance.toFixed(1)} km
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Duration
                              </p>
                              <p className="text-sm font-mono-data font-bold text-foreground">
                                {Math.floor(data.duration / 3600)}h{" "}
                                {Math.floor((data.duration % 3600) / 60)}m
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Avg Speed
                              </p>
                              <p className="text-sm font-mono-data font-bold text-foreground">
                                {(data.avgSpeed / data.count).toFixed(1)} km/h
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Elevation
                              </p>
                              <p className="text-sm font-mono-data font-bold text-foreground">
                                {data.elevation.toFixed(0)} m
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-border/30">
                            <p className="text-xs text-muted-foreground">
                              {data.count} {data.count === 1 ? "activity" : "activities"}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>

                <motion.section {...fadeIn(0.35)} className="lg:col-span-2">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="section-icon-bg bg-warning/10">
                      <Trophy className="h-4 w-4 text-warning" />
                    </div>
                    Personal Records
                  </h2>
                  <div className="glass-surface rounded-xl divide-y divide-border/50">
                    {[
                      {
                        label: "Fastest Top Speed",
                        value: fastestActivity ? `${fastestActivity.maxSpeed.toFixed(1)} km/h` : "N/A",
                        sub: fastestActivity?.name,
                        icon: Zap,
                        color: "text-warning bg-warning/10",
                      },
                      {
                        label: "Longest Distance",
                        value: `${longestActivity.toFixed(1)} km`,
                        sub: activities.find((a) => a.distance === longestActivity)?.name,
                        icon: Route,
                        color: "text-accent bg-accent/10",
                      },
                      {
                        label: "Most Elevation",
                        value: mostElevation ? `${mostElevation.elevationGain.toFixed(0)} m` : "N/A",
                        sub: mostElevation?.name,
                        icon: Mountain,
                        color: "text-success bg-success/10",
                      },
                      ...(avgHeartRate
                        ? [
                            {
                              label: "Avg Heart Rate",
                              value: `${avgHeartRate} bpm`,
                              sub: "Across all activities",
                              icon: Flame,
                              color: "text-destructive bg-destructive/10",
                            },
                          ]
                        : []),
                      {
                        label: "Weekly Avg Duration",
                        value: `${Math.floor(weeklyAvgDuration / 3600)}h ${Math.floor((weeklyAvgDuration % 3600) / 60)}m`,
                        sub: `Over ${weeks} week${weeks > 1 ? "s" : ""}`,
                        icon: Timer,
                        color: "text-accent bg-accent/10",
                      },
                    ].map((record, i) => (
                      <motion.div
                        key={record.label}
                        {...fadeIn(0.4 + i * 0.06)}
                        className="flex items-center gap-3.5 p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-border/10", record.color)}>
                          <record.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{record.label}</p>
                          <p className="text-sm font-bold font-mono-data text-foreground">
                            {record.value}
                          </p>
                        </div>
                        {record.sub && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[100px] text-right">
                            {record.sub}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              </div>

              {sortedMonths.length > 0 && (
                <motion.section {...fadeIn(0.45)}>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="section-icon-bg">
                      <Calendar className="h-4 w-4 text-accent" />
                    </div>
                    Monthly Distance (last 6 months)
                  </h2>
                  <div className="glass-surface rounded-xl p-6">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={[...sortedMonths].reverse().map(([month, d]) => ({
                          month: new Date(month + "-01").toLocaleDateString("en-US", {
                            month: "short",
                            year: "2-digit",
                          }),
                          distance: Number(d.distance.toFixed(1)),
                          activities: d.count,
                          elevation: Math.round(d.elevation),
                        }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          label={{
                            value: "km",
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
                          formatter={(value: number, name: string) => {
                            if (name === "distance") return [`${value} km`, "Distance"];
                            if (name === "elevation") return [`${value} m`, "Elevation gain"];
                            return [value, name];
                          }}
                        />
                        <Bar
                          dataKey="distance"
                          fill="hsl(var(--accent))"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 divide-y divide-border/40">
                      {sortedMonths.map(([month, data], i) => {
                        const label = new Date(month + "-01").toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });
                        return (
                          <div key={month} className="flex items-center justify-between py-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-medium">{label}</span>
                              {i === 0 && (
                                <Badge className="text-[9px] font-medium bg-accent/10 text-accent border-accent/20 px-1.5 py-0 h-4">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <span>{data.count} {data.count === 1 ? "activity" : "activities"}</span>
                              <span className="font-mono-data font-medium text-foreground w-16 text-right">
                                {data.distance.toFixed(1)} km
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.section>
              )}

              {Object.keys(sportBreakdown).length > 1 && (
                <motion.section {...fadeIn(0.55)}>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="section-icon-bg">
                      <Flame className="h-4 w-4 text-accent" />
                    </div>
                    Sport Distribution
                  </h2>
                  <div className="glass-surface rounded-xl p-6">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={Object.entries(sportBreakdown).map(([sport, d]) => ({
                            name: sport.charAt(0).toUpperCase() + sport.slice(1),
                            value: Number(d.distance.toFixed(1)),
                            count: d.count,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {Object.keys(sportBreakdown).map((sport, index) => (
                            <Cell
                              key={sport}
                              fill={
                                sport === "cycling"
                                  ? "hsl(var(--accent))"
                                  : sport === "running"
                                  ? "hsl(var(--success))"
                                  : "hsl(var(--warning))"
                              }
                              opacity={0.85 - index * 0.05}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number, name: string, props) => [
                            `${value} km (${props.payload.count} activities)`,
                            name,
                          ]}
                        />
                        <Legend
                          formatter={(value) => (
                            <span style={{ fontSize: "12px", color: "hsl(var(--foreground))" }}>
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.section>
              )}
            </>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
