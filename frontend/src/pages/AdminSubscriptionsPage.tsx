import { useMemo, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { UserAvatar } from "@/components/UserAvatar";
import { useAdminSubscriptions, useUpdateSubscription } from "@/hooks/useSubscription";
import { SubscriptionWithUser, PlanName } from "@/services/subscriptionService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Search, AlertTriangle, ArrowUpCircle, CheckCircle, Clock3, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
  { value: "requests", label: "Requests" },
];

const PLAN_FILTERS = [
  { value: "all", label: "All plans" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
];

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

function SubStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    trial: "bg-accent/10 text-accent border-accent/20",
    inactive: "bg-muted text-muted-foreground border-border",
    expired: "bg-destructive/10 text-destructive border-destructive/20",
    none: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={cn("capitalize", styles[status] ?? "")}>{status}</Badge>;
}

function PlanBadge({ planName }: { planName?: string }) {
  const styles: Record<string, string> = {
    starter: "bg-muted text-muted-foreground border-border",
    pro: "bg-accent/10 text-accent border-accent/20",
    premium: "bg-warning/10 text-warning border-warning/20",
  };
  const name = planName ?? "starter";
  return (
    <Badge variant="outline" className={cn("capitalize", styles[name] ?? styles.starter)}>
      {name}
    </Badge>
  );
}

export default function AdminSubscriptionsPage() {
  const { data: subscriptions = [], isLoading } = useAdminSubscriptions();
  const updateSubscription = useUpdateSubscription();
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");

  const pendingCount = useMemo(() => subscriptions.filter((s) => s.requestedPlan).length, [subscriptions]);

  const activeCount = useMemo(
    () => subscriptions.filter((s) => s.status === "active" || s.status === "trial").length,
    [subscriptions],
  );

  const expiringCount = useMemo(
    () =>
      subscriptions.filter((s) => {
        const d = daysUntil(s.periodEnd);
        return d !== null && d <= 7 && d >= 0 && (s.status === "active" || s.status === "trial");
      }).length,
    [subscriptions],
  );

  const filtered = useMemo(
    () =>
      subscriptions.filter((s) => {
        if (statusFilter === "requests" && !s.requestedPlan) return false;
        if (statusFilter !== "all" && statusFilter !== "requests" && s.status !== statusFilter) return false;
        if (planFilter !== "all" && (s.planName ?? "starter") !== planFilter) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const fullName = `${s.userFirstName} ${s.userLastName}`.toLowerCase();
          if (!fullName.includes(q) && !s.userEmail.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [subscriptions, statusFilter, planFilter, search],
  );

  const handleAction = async (sub: SubscriptionWithUser, action: "activate" | "extend" | "deactivate") => {
    try {
      await updateSubscription.mutateAsync({ userId: sub.userId, action });
      toast.success(`Subscription ${action}d`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const handlePlanChange = async (sub: SubscriptionWithUser, planName: PlanName) => {
    try {
      await updateSubscription.mutateAsync({ userId: sub.userId, action: "setPlan", planName });
      toast.success(`Plan updated to ${planName}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Plan update failed");
    }
  };

  const handleApproveRequest = async (sub: SubscriptionWithUser) => {
    if (!sub.requestedPlan) return;
    try {
      await updateSubscription.mutateAsync({ userId: sub.userId, action: "setPlan", planName: sub.requestedPlan as PlanName });
      toast.success(`${sub.userFirstName} upgraded to ${sub.requestedPlan}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve upgrade");
    }
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="section-icon-bg">
              <CreditCard className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-[220px]">
              <h1 className="text-2xl font-bold text-foreground">Admin Subscriptions</h1>
              <p className="text-sm text-muted-foreground">Manage plans, upgrades and renewals in one place</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {pendingCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter("requests")}
                  className="text-accent border-accent/30 bg-accent/5 hover:bg-accent/10"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                  {pendingCount} request{pendingCount > 1 ? "s" : ""}
                </Button>
              )}
              {expiringCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-warning/20 bg-warning/10 text-warning text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {expiringCount} expiring soon
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Shown"
              value={filtered.length}
              icon={<Users className="h-5 w-5" />}
              iconBg="bg-accent/10 text-accent"
            />
            <KpiCard
              title="Active + Trial"
              value={activeCount}
              icon={<CheckCircle className="h-5 w-5" />}
              iconBg="bg-success/10 text-success"
            />
            <KpiCard
              title="Upgrade Requests"
              value={pendingCount}
              icon={<ArrowUpCircle className="h-5 w-5" />}
              iconBg="bg-accent/10 text-accent"
            />
            <KpiCard
              title="Expiring in 7d"
              value={expiringCount}
              icon={<Clock3 className="h-5 w-5" />}
              iconBg={expiringCount > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}
            />
          </div>

          <div className="glass-surface rounded-xl p-4 accent-line-top">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-[360px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 bg-muted/40"
                />
              </div>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="All plans" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border relative",
                      statusFilter === f.value
                        ? "bg-accent/10 text-accent border-accent/30"
                        : "text-muted-foreground hover:text-foreground border-transparent",
                    )}
                  >
                    {f.label}
                    {f.value === "requests" && pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[9px] text-white flex items-center justify-center font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="glass-surface rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-surface rounded-xl p-8 text-center accent-line-top">
              <p className="text-sm text-muted-foreground">
                {statusFilter === "requests" ? "No pending upgrade requests" : "No subscriptions found for current filters"}
              </p>
            </div>
          ) : (
            <>
              <div className="glass-surface rounded-xl overflow-hidden hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Signals</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => {
                      const days = daysUntil(s.periodEnd);
                      const expiringSoon = days !== null && days <= 7 && days >= 0 && (s.status === "active" || s.status === "trial");
                      const hasRequest = !!s.requestedPlan;
                      const displayName = `${s.userFirstName} ${s.userLastName}`;

                      return (
                        <TableRow
                          key={s.id}
                          className={cn(
                            "hover:bg-accent/5 transition-colors",
                            hasRequest && "bg-accent/5 hover:bg-accent/10",
                            expiringSoon && !hasRequest && "bg-warning/5 hover:bg-warning/10",
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar name={displayName} size="sm" />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.userEmail}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={s.planName ?? "starter"}
                                onValueChange={(v) => handlePlanChange(s, v as PlanName)}
                              >
                                <SelectTrigger className="h-8 w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="starter">Starter</SelectItem>
                                  <SelectItem value="pro">Pro</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                              </Select>
                              <PlanBadge planName={s.planName} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <SubStatusBadge status={s.status} />
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <p className="text-muted-foreground">Start: {formatDate(s.periodStart)}</p>
                              <p className={cn(expiringSoon ? "text-warning font-medium" : "text-muted-foreground")}>
                                End: {formatDate(s.periodEnd)}
                                {expiringSoon && days !== null && <span className="ml-1">({days}d)</span>}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              {hasRequest && (
                                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[11px]">
                                  Request: {s.requestedPlan}
                                </Badge>
                              )}
                              {expiringSoon && (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[11px]">
                                  Expiring soon
                                </Badge>
                              )}
                              {!hasRequest && !expiringSoon && <span className="text-xs text-muted-foreground">-</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {hasRequest && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-accent hover:text-accent hover:bg-accent/10 h-8 text-xs font-semibold"
                                  disabled={updateSubscription.isPending}
                                  onClick={() => handleApproveRequest(s)}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-success hover:text-success hover:bg-success/10 h-8 text-xs" onClick={() => handleAction(s, "activate")}>
                                Activate 30d
                              </Button>
                              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-accent hover:bg-accent/10 h-8 text-xs" onClick={() => handleAction(s, "extend")}>
                                +30d
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => handleAction(s, "deactivate")}>
                                Deactivate
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {filtered.map((s) => {
                  const days = daysUntil(s.periodEnd);
                  const expiringSoon = days !== null && days <= 7 && days >= 0 && (s.status === "active" || s.status === "trial");
                  const hasRequest = !!s.requestedPlan;
                  const displayName = `${s.userFirstName} ${s.userLastName}`;

                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "glass-card rounded-xl p-4 accent-line-left",
                        hasRequest && "border-accent/30 bg-accent/5",
                        expiringSoon && !hasRequest && "border-warning/30 bg-warning/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar name={displayName} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.userEmail}</p>
                          </div>
                        </div>
                        <SubStatusBadge status={s.status} />
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <PlanBadge planName={s.planName} />
                          {hasRequest && (
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[11px]">
                              req {s.requestedPlan}
                            </Badge>
                          )}
                        </div>
                        <Select value={s.planName ?? "starter"} onValueChange={(v) => handlePlanChange(s, v as PlanName)}>
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-xs text-muted-foreground mb-3 space-y-1">
                        <p>Start: {formatDate(s.periodStart)}</p>
                        <p className={cn(expiringSoon ? "text-warning font-medium" : "text-muted-foreground")}>
                          End: {formatDate(s.periodEnd)}
                          {expiringSoon && days !== null && ` (${days}d)`}
                        </p>
                      </div>

                      <div className="flex gap-1.5 flex-wrap">
                        {hasRequest && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-accent hover:bg-accent/10 h-9 text-xs px-3 font-semibold"
                            disabled={updateSubscription.isPending}
                            onClick={() => handleApproveRequest(s)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-success hover:bg-success/10 h-9 text-xs px-3" onClick={() => handleAction(s, "activate")}>
                          Activate
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-accent/10 h-9 text-xs px-3" onClick={() => handleAction(s, "extend")}>
                          +30d
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-9 text-xs px-3" onClick={() => handleAction(s, "deactivate")}>
                          Deactivate
                        </Button>
                      </div>
                    </div>
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
