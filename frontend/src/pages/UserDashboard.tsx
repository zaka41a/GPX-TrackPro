import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";
import { SkeletonKpiRow, SkeletonActivityList } from "@/components/SkeletonCards";
import { useAuth } from "@/hooks/useAuth";
import { activityService } from "@/services/activityService";
import { Activity } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Archive, BarChart3, MapPin, Clock, Route, Timer, Gauge, Bike, Footprints, Dumbbell, ChevronRight, Activity as ActivityIcon } from "lucide-react";
import { motion } from "framer-motion";

const sportIcons: Record<string, typeof Bike> = { cycling: Bike, running: Footprints, other: Dumbbell };

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return dateStr;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService.getActivities().then((a) => { setActivities(a); setLoading(false); });
  }, []);

  const totalDistance = activities.reduce((s, a) => s + a.distance, 0);
  const totalDuration = activities.reduce((s, a) => s + a.duration, 0);
  const avgSpeed = activities.length > 0 ? activities.reduce((s, a) => s + a.avgSpeed, 0) / activities.length : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-8">
          {/* Welcome */}
          <div className="glass-surface rounded-xl p-6 border-l-2 border-accent/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{greeting()}, {user?.name?.split(" ")[0]}</h1>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent" asChild>
                <Link to="/upload"><Upload className="h-4 w-4 mr-2" /> Upload GPX</Link>
              </Button>
            </div>
          </div>

          {/* KPI Row */}
          {loading ? (
            <SkeletonKpiRow />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total Distance"
                value={activities.length > 0 ? `${totalDistance.toFixed(1)} km` : null}
                icon={<Route className="h-5 w-5" />}
                iconBg="bg-accent/10 text-accent"
              />
              <KpiCard
                title="Total Time"
                value={activities.length > 0 ? `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m` : null}
                icon={<Timer className="h-5 w-5" />}
                iconBg="bg-success/10 text-success"
              />
              <KpiCard
                title="Activities"
                value={activities.length > 0 ? activities.length : null}
                icon={<BarChart3 className="h-5 w-5" />}
                iconBg="bg-warning/10 text-warning"
              />
              <KpiCard
                title="Avg Speed"
                value={activities.length > 0 ? `${avgSpeed.toFixed(1)} km/h` : null}
                icon={<Gauge className="h-5 w-5" />}
                iconBg="bg-accent/10 text-accent"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { to: "/upload", icon: Upload, label: "Upload", desc: "Add new activity", color: "text-accent", bg: "bg-accent/10" },
              { to: "/activities", icon: Archive, label: "Archive", desc: "Browse all", color: "text-success", bg: "bg-success/10" },
              { to: "/statistics", icon: BarChart3, label: "Statistics", desc: "View insights", color: "text-warning", bg: "bg-warning/10" },
            ].map((link, i) => (
              <motion.div key={link.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link to={link.to} className="glass-card rounded-xl p-6 flex items-center gap-4 block hover-lift border-t-2 border-transparent hover:border-accent/30">
                  <div className={`stat-icon-bg ${link.bg}`}>
                    <link.icon className={`h-5 w-5 ${link.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Recent Activities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="section-icon-bg">
                  <ActivityIcon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Recent Activities</h2>
                  {activities.length > 0 && (
                    <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">{activities.length}</Badge>
                  )}
                </div>
              </div>
              {activities.length > 0 && (
                <Link to="/activities" className="text-xs text-accent hover:underline">View all</Link>
              )}
            </div>
            {loading ? (
              <SkeletonActivityList />
            ) : activities.length === 0 ? (
              <EmptyState
                icon={<MapPin className="h-12 w-12" />}
                title="No activities yet"
                description="Upload your first GPX file to start tracking your performance."
                action={
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                    <Link to="/upload"><Upload className="h-4 w-4 mr-2" /> Upload GPX</Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 5).map((a, i) => {
                  const SportIcon = sportIcons[a.sportType] || Dumbbell;
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/activity/${a.id}`} className="glass-card rounded-xl p-4 flex items-center justify-between block border-l-2 border-accent/20 hover:border-accent/60 transition-all hover:shadow-md group">
                        <div className="flex items-center gap-3">
                          <div className="stat-icon-bg h-9 w-9 bg-accent/10 rounded-lg">
                            <SportIcon className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground truncate">{a.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {formatRelativeDate(a.date)} <span className="text-accent/60">·</span> <span className="capitalize">{a.sportType}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-mono-data font-medium text-foreground">{a.distance} km</p>
                            <p className="text-xs text-muted-foreground">{Math.floor(a.duration / 60)} min</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </PageTransition>
    </AppShell>
  );
}
