import { useEffect, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { SkeletonKpiRow } from "@/components/SkeletonCards";
import { EmptyState } from "@/components/EmptyState";
import { activityService } from "@/services/activityService";
import { Activity } from "@/types";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

export default function StatisticsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService.getActivities().then((a) => {
      setActivities(a);
      setLoading(false);
    });
  }, []);

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

  // Sport breakdown
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

  // Monthly breakdown (last 6 months)
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

  // Personal records
  const fastestActivity =
    activities.length > 0 ? activities.reduce((best, a) => (a.maxSpeed > best.maxSpeed ? a : best)) : null;
  const mostElevation =
    activities.length > 0
      ? activities.reduce((best, a) => (a.elevationGain > best.elevationGain ? a : best))
      : null;

  // Weekly avg
  const weeks = activities.length > 0
    ? (() => {
        const dates = activities.map((a) => new Date(a.date).getTime());
        const range = Math.max(...dates) - Math.min(...dates);
        return Math.max(1, Math.ceil(range / (7 * 24 * 60 * 60 * 1000)));
      })()
    : 1;
  const weeklyAvgDistance = totalDistance / weeks;
  const weeklyAvgDuration = totalDuration / weeks;

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-8 max-w-6xl mx-auto">
          {/* Header */}
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
              {activities.length > 0 && (
                <Badge className="bg-accent/10 text-accent border-accent/20 text-xs self-start sm:self-auto">
                  <Calendar className="h-3 w-3 mr-1" />
                  {activities.length} activities tracked
                </Badge>
              )}
            </div>
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
              {/* Hero Stats Row */}
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

              {/* Speed & Performance Row */}
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

              {/* Two Column: Sport Breakdown + Personal Records */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Sport Breakdown */}
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

                          {/* Animated progress bar */}
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

                {/* Personal Records */}
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

              {/* Monthly Overview */}
              {sortedMonths.length > 0 && (
                <motion.section {...fadeIn(0.45)}>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="section-icon-bg">
                      <Calendar className="h-4 w-4 text-accent" />
                    </div>
                    Monthly Overview
                  </h2>
                  <div className="glass-surface rounded-xl p-6">
                    <div className="space-y-4">
                      {sortedMonths.map(([month, data], i) => {
                        const pct = (data.distance / maxMonthlyDistance) * 100;
                        const label = new Date(month + "-01").toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });
                        return (
                          <motion.div key={month} {...fadeIn(0.5 + i * 0.05)}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{label}</p>
                                {i === 0 && (
                                  <Badge className="text-[10px] font-medium bg-accent/10 text-accent border-accent/20 px-1.5 py-0.5">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="font-mono-data">
                                  {data.count} {data.count === 1 ? "activity" : "activities"}
                                </span>
                                <span className="font-mono-data font-medium text-foreground">
                                  {data.distance.toFixed(1)} km
                                </span>
                              </div>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                              />
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground">
                              <span>
                                {Math.floor(data.duration / 3600)}h {Math.floor((data.duration % 3600) / 60)}m total
                              </span>
                              <span>{data.elevation.toFixed(0)} m elevation</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
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
