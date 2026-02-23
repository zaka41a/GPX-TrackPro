import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonTable } from "@/components/SkeletonCards";
import { activityService } from "@/services/activityService";
import { Activity } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Upload, Archive, ExternalLink, Bike, Footprints, Dumbbell, Clock, Route } from "lucide-react";
import { cn } from "@/lib/utils";

const sportFilters = [
  { value: "all", label: "All Sports" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "other", label: "Other" },
];

const sportIcons: Record<string, typeof Bike> = { cycling: Bike, running: Footprints, other: Dumbbell };

const sportColors: Record<string, { dot: string; border: string; iconBg: string; iconText: string }> = {
  cycling: { dot: "bg-accent", border: "border-accent/30", iconBg: "bg-accent/10", iconText: "text-accent" },
  running: { dot: "bg-success", border: "border-success/30", iconBg: "bg-success/10", iconText: "text-success" },
  other: { dot: "bg-warning", border: "border-warning/30", iconBg: "bg-warning/10", iconText: "text-warning" },
};

export default function ActivitiesArchivePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [minDist, setMinDist] = useState("");

  useEffect(() => {
    activityService.getActivities().then((a) => { setActivities(a); setLoading(false); });
  }, []);

  const filtered = activities.filter((a) => {
    if (sportFilter !== "all" && a.sportType !== sportFilter) return false;
    if (minDist && a.distance < parseFloat(minDist)) return false;
    return true;
  });

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="glass-surface rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="section-icon-bg">
                  <Archive className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Activities Archive</h1>
                  <p className="text-sm text-muted-foreground">Browse and manage all your recorded activities</p>
                </div>
                {!loading && filtered.length > 0 && (
                  <Badge className="bg-accent/10 text-accent border-accent/20 text-xs ml-1">{filtered.length} {filtered.length === 1 ? "activity" : "activities"}</Badge>
                )}
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link to="/upload"><Upload className="h-4 w-4 mr-2" /> Upload GPX</Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-surface rounded-xl p-4 flex flex-wrap items-center gap-3 accent-line-top">
            <div className="flex gap-1.5">
              {sportFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSportFilter(f.value)}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-xs font-medium transition-all",
                    sportFilter === f.value ? "bg-accent/10 text-accent border border-accent/30" : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-border/50 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Min distance (km)"
                value={minDist}
                onChange={(e) => setMinDist(e.target.value)}
                className="w-44 h-9 bg-muted/50 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={6} cols={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Archive className="h-12 w-12" />}
              title={activities.length === 0 ? "No activities yet" : "No matching activities"}
              description={activities.length === 0 ? "Upload your first GPX file to get started." : "Try adjusting your filters."}
              action={activities.length === 0 ? (
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <Link to="/upload"><Upload className="h-4 w-4 mr-2" /> Upload GPX</Link>
                </Button>
              ) : undefined}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="glass-surface rounded-xl overflow-hidden hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => {
                      const SportIcon = sportIcons[a.sportType] || Dumbbell;
                      const colors = sportColors[a.sportType] || sportColors.other;
                      return (
                        <TableRow key={a.id} className="hover:bg-accent/5 even:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className={cn("h-2 w-2 rounded-full shrink-0", colors.dot)} />
                              <span className="font-medium text-foreground">{a.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{a.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1 text-accent border-accent/20">
                              <SportIcon className="h-3 w-3" />
                              <span className="capitalize">{a.sportType}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono-data text-foreground">{a.distance} km</TableCell>
                          <TableCell className="text-right font-mono-data text-foreground">{Math.floor(a.duration / 60)} min</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-accent hover:text-accent hover:bg-accent/10" asChild>
                              <Link to={`/activity/${a.id}`}>
                                <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((a) => {
                  const SportIcon = sportIcons[a.sportType] || Dumbbell;
                  const colors = sportColors[a.sportType] || sportColors.other;
                  return (
                    <Link key={a.id} to={`/activity/${a.id}`} className={cn("block glass-card rounded-xl p-4 hover:shadow-md border-l-2", colors.border)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("stat-icon-bg h-9 w-9 rounded-lg shrink-0", colors.iconBg)}>
                            <SportIcon className={cn("h-4 w-4", colors.iconText)} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{a.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Clock className="h-3 w-3" /> {a.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-mono-data font-medium text-foreground">{a.distance} km</p>
                          <p className="text-xs text-muted-foreground">{Math.floor(a.duration / 60)} min</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
