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
import { Upload, Archive, ExternalLink, Download, Bike, Footprints, Dumbbell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const sportFilters = [
  { value: "all", label: "All Sports" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "other", label: "Other" },
];

const sportIcons: Record<string, typeof Bike> = { cycling: Bike, running: Footprints, other: Dumbbell };

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Activities Archive</h1>
              {!loading && filtered.length > 0 && (
                <Badge className="bg-accent/10 text-accent border-accent/20 text-xs">{filtered.length} {filtered.length === 1 ? "activity" : "activities"}</Badge>
              )}
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link to="/upload"><Upload className="h-4 w-4 mr-2" /> Upload GPX</Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="glass-surface rounded-xl p-4 flex flex-wrap items-center gap-3">
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
            <Input
              type="number"
              placeholder="Min distance (km)"
              value={minDist}
              onChange={(e) => setMinDist(e.target.value)}
              className="w-44 h-9 bg-muted/50 text-sm"
            />
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
                      return (
                        <TableRow key={a.id} className="hover:bg-accent/5 even:bg-muted/30 transition-colors">
                          <TableCell className="font-medium text-foreground">{a.name}</TableCell>
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
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild aria-label={`View ${a.name}`}>
                                <Link to={`/activity/${a.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Download ${a.name}`}>
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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
                  return (
                    <Link key={a.id} to={`/activity/${a.id}`} className="block glass-card rounded-xl p-4 hover:shadow-md border-l-2 border-accent/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="stat-icon-bg h-9 w-9 bg-accent/10 rounded-lg shrink-0">
                            <SportIcon className="h-4 w-4 text-accent" />
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
