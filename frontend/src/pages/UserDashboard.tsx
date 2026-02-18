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
import { Upload, Archive, BarChart3, MapPin, Clock, Zap, Route, Timer, Gauge } from "lucide-react";
import { motion } from "framer-motion";

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{greeting()}, {user?.name?.split(" ")[0]}</h1>
              <p className="text-sm text-slate-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent" asChild>
              <Link to="/upload"><Upload className="h-4 w-4 mr-2" /> Upload GPX</Link>
            </Button>
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
                iconBg="bg-primary/20 text-secondary"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { to: "/upload", icon: Upload, label: "Upload", desc: "Add new activity", color: "text-accent" },
              { to: "/activities", icon: Archive, label: "Archive", desc: "Browse all", color: "text-success" },
              { to: "/activities", icon: BarChart3, label: "Statistics", desc: "View insights", color: "text-warning" },
            ].map((link, i) => (
              <motion.div key={link.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link to={link.to} className="glass-card rounded-xl p-5 flex items-center gap-4 block">
                  <div className={`stat-icon-bg ${link.color === "text-accent" ? "bg-accent/10" : link.color === "text-success" ? "bg-success/10" : "bg-warning/10"}`}>
                    <link.icon className={`h-5 w-5 ${link.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{link.label}</p>
                    <p className="text-xs text-slate-500">{link.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Recent Activities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activities</h2>
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
                {activities.slice(0, 5).map((a) => (
                  <Link key={a.id} to={`/activity/${a.id}`} className="glass-card rounded-lg p-4 flex items-center justify-between block">
                    <div className="flex items-center gap-3">
                      <div className="stat-icon-bg h-9 w-9 bg-accent/10 rounded-lg">
                        <Zap className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800">{a.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {a.date} <span className="text-accent/60">·</span> <span className="capitalize">{a.sportType}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono-data font-medium text-slate-800">{a.distance} km</p>
                      <p className="text-xs text-slate-500">{Math.floor(a.duration / 60)} min</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </PageTransition>
    </AppShell>
  );
}
