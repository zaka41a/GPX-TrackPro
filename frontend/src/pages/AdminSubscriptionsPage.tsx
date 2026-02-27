import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { useAdminSubscriptions, useUpdateSubscription } from "@/hooks/useSubscription";
import { SubscriptionWithUser } from "@/services/subscriptionService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const subStatusFilters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
];

export default function AdminSubscriptionsPage() {
  const { data: subscriptions = [], isLoading } = useAdminSubscriptions();
  const updateSubscription = useUpdateSubscription();
  const [subFilter, setSubFilter] = useState("all");

  const filtered = subscriptions.filter((s) => subFilter === "all" || s.status === subFilter);

  const handleAction = async (sub: SubscriptionWithUser, action: "activate" | "extend" | "deactivate") => {
    try {
      await updateSubscription.mutateAsync({ userId: sub.userId, action });
      toast.success(`Subscription ${action}d`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const subStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-success/10 text-success border-success/20",
      trial: "bg-accent/10 text-accent border-accent/20",
      inactive: "bg-muted text-muted-foreground border-border",
      expired: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={cn("capitalize", styles[status] || "")}>{status}</Badge>;
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="section-icon-bg">
              <CreditCard className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
              <p className="text-sm text-muted-foreground">{filtered.length} subscription{filtered.length !== 1 ? "s" : ""} shown</p>
            </div>
          </div>

          {/* Filter bar */}
          <div className="glass-surface rounded-xl p-4 flex flex-wrap items-center gap-2 accent-line-top">
            {subStatusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setSubFilter(f.value)}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-medium transition-all",
                  subFilter === f.value ? "bg-accent/10 text-accent border border-accent/30" : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="glass-surface rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-surface rounded-xl p-6 text-center accent-line-top">
              <p className="text-sm text-muted-foreground">No subscriptions found</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="glass-surface rounded-xl overflow-hidden hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-accent/5 transition-colors">
                        <TableCell className="font-medium text-foreground">{s.userFirstName} {s.userLastName}</TableCell>
                        <TableCell className="text-muted-foreground">{s.userEmail}</TableCell>
                        <TableCell>{subStatusBadge(s.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.periodEnd ? new Date(s.periodEnd).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="text-success hover:text-success hover:bg-success/10 h-8 text-xs" onClick={() => handleAction(s, "activate")}>
                              Activate 30d
                            </Button>
                            <Button size="sm" variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10 h-8 text-xs" onClick={() => handleAction(s, "extend")}>
                              +30d
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => handleAction(s, "deactivate")}>
                              Deactivate
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {filtered.map((s) => (
                  <div key={s.id} className="glass-card rounded-xl p-4 accent-line-left">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">{s.userFirstName} {s.userLastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.userEmail}</p>
                      </div>
                      {subStatusBadge(s.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Expires: {s.periodEnd ? new Date(s.periodEnd).toLocaleDateString() : "—"}
                    </p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-success hover:bg-success/10 h-9 text-xs px-3" onClick={() => handleAction(s, "activate")}>Activate</Button>
                      <Button size="sm" variant="ghost" className="text-accent hover:bg-accent/10 h-9 text-xs px-3" onClick={() => handleAction(s, "extend")}>+30d</Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-9 text-xs px-3" onClick={() => handleAction(s, "deactivate")}>Deactivate</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
