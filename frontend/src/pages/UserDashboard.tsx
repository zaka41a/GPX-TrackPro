import { useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";
import { SkeletonKpiRow, SkeletonActivityList } from "@/components/SkeletonCards";
import { useAuth } from "@/hooks/useAuth";
import { useActivities } from "@/hooks/useActivities";
import { useProfile } from "@/hooks/useProfile";
import { Activity, AthleteProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Archive, BarChart3, MapPin, Clock, Route, Timer, Gauge, Bike, Footprints, Dumbbell, ChevronRight, Activity as ActivityIcon, UserCircle2, X, Flame, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sportIcons: Record<string, typeof Bike> = { cycling: Bike, running: Footprints, other: Dumbbell };

function computeStreak(activities: Activity[]): number {
  if (activities.length === 0) return 0;
  const uniqueDays = [...new Set(activities.map((a) => a.date.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]).getTime();
    const curr = new Date(uniqueDays[i]).getTime();
    if ((prev - curr) / 86_400_000 === 1) streak++;
    else break;
  }
  return streak;
}

function thisWeekHours(activities: Activity[]): number {
  const now = new Date();
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return activities
    .filter((a) => new Date(a.date) >= monday)
    .reduce((s, a) => s + a.duration / 3600, 0);
}

function profileCompleteness(p: AthleteProfile): number {
  let score = 0;
  if (p.bio?.trim()) score += 20;
  if (p.avatarUrl?.trim()) score += 15;
  if (p.city?.trim() || p.country?.trim()) score += 10;
  if (p.dateOfBirth?.trim()) score += 10;
  if (p.weeklyGoalHours != null) score += 15;
  if (p.sportPhotoUrl?.trim()) score += 10;
  const hasSocial = [p.websiteUrl, p.stravaUrl, p.instagramUrl, p.twitterUrl, p.youtubeUrl, p.linkedinUrl]
    .some((v) => v?.trim());
  if (hasSocial) score += 20;
  return score;
}

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
  const { data: activities = [], isLoading: loading } = useActivities();
  const { data: profile } = useProfile();
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem("profileBannerDismissed") === "1",
  );

  const completeness = profile ? profileCompleteness(profile) : null;
  const showBanner = completeness !== null && completeness < 60 && !bannerDismissed;

  const dismissBanner = () => {
    sessionStorage.setItem("profileBannerDismissed", "1");
    setBannerDismissed(true);
  };

  const totalDistance = activities.reduce((s, a) => s + a.distance, 0);
  const totalDuration = activities.reduce((s, a) => s + a.duration, 0);
  const avgSpeed = activities.length > 0 ? activities.reduce((s, a) => s + a.avgSpeed, 0) / activities.length : 0;

  const streak = computeStreak(activities);
  const weekHours = thisWeekHours(activities);
  const goalHours = profile?.weeklyGoalHours ?? null;
  const goalPct = goalHours && goalHours > 0 ? Math.min(100, Math.round((weekHours / goalHours) * 100)) : null;

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
          <AnimatePresence>
            {showBanner && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
              >
                <UserCircle2 className="h-5 w-5 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Complete your profile — {completeness}% done
                  </p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add bio, photo, location and social links to stand out in the community.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="text-accent border-accent/30 hover:bg-accent/10 text-xs" asChild>
                    <Link to="/profile">Complete profile</Link>
                  </Button>
                  <button
                    onClick={dismissBanner}
                    className="text-muted-foreground hover:text-foreground p-1 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {!loading && activities.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className={`glass-surface rounded-xl p-4 flex items-center gap-4 border-l-2 ${streak >= 3 ? "border-warning/60" : "border-border"}`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${streak >= 3 ? "bg-warning/10" : "bg-muted/40"}`}>
                    <Flame className={`h-5 w-5 ${streak >= 3 ? "text-warning" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Active Streak</p>
                    <p className="text-2xl font-bold text-foreground leading-none mt-0.5">
                      {streak} <span className="text-sm font-normal text-muted-foreground">day{streak !== 1 ? "s" : ""}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {streak === 0 ? "No recent activity" : streak >= 7 ? "On fire! Keep it up 🔥" : "Keep the streak going"}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="glass-surface rounded-xl p-4 border-l-2 border-accent/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Target className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Weekly Goal</p>
                      {goalHours ? (
                        <p className="text-sm font-bold text-foreground leading-none mt-0.5">
                          {weekHours.toFixed(1)}h <span className="text-muted-foreground font-normal">/ {goalHours}h</span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-0.5">No goal set</p>
                      )}
                    </div>
                    {goalPct !== null && (
                      <span className={`text-sm font-bold ${goalPct >= 100 ? "text-success" : "text-accent"}`}>{goalPct}%</span>
                    )}
                  </div>
                  {goalHours ? (
                    <div className="h-2 rounded-full bg-muted/50">
                      <div
                        className={`h-full rounded-full transition-all ${goalPct! >= 100 ? "bg-success" : "bg-accent"}`}
                        style={{ width: `${goalPct}%` }}
                      />
                    </div>
                  ) : (
                    <Link to="/profile" className="text-xs text-accent hover:underline">Set a weekly goal →</Link>
                  )}
                </div>
              </motion.div>
            </div>
          )}

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
