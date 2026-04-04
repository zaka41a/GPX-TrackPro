import { useMemo, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { UserAvatar } from "@/components/UserAvatar";
import { useAdminSubscriptions, useUpdateSubscription } from "@/hooks/useSubscription";
import { SubscriptionWithUser, PlanName } from "@/services/subscriptionService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard, Search, AlertTriangle, ArrowUpCircle, CheckCircle,
  Clock3, Users, TrendingUp, Zap, Crown, Star,
  RefreshCw, Ban, ChevronDown, ChevronUp, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────── helpers ─────────────── */

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─────────────── plan config ─────────────── */

const PLAN_CONFIG: Record<string, { label: string; icon: typeof Star; color: string; bg: string; border: string }> = {
  starter: {
    label: "Starter", icon: Zap,
    color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20",
  },
  pro: {
    label: "Pro", icon: Star,
    color: "text-accent", bg: "bg-accent/10", border: "border-accent/20",
  },
  premium: {
    label: "Premium", icon: Crown,
    color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20",
  },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  active:   { label: "Active",    dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  trial:    { label: "Trial",     dot: "bg-accent",      text: "text-accent",      bg: "bg-accent/10",       border: "border-accent/20" },
  inactive: { label: "Inactive",  dot: "bg-slate-400",   text: "text-slate-400",   bg: "bg-slate-400/10",    border: "border-slate-400/20" },
  expired:  { label: "Expired",   dot: "bg-rose-400",    text: "text-rose-400",    bg: "bg-rose-400/10",     border: "border-rose-400/20" },
  none:     { label: "None",      dot: "bg-slate-400",   text: "text-muted-foreground", bg: "bg-muted",       border: "border-border" },
};

/* ─────────────── sub-components ─────────────── */

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.none;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", cfg.bg, cfg.border, cfg.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function PlanChip({ planName }: { planName?: string }) {
  const key = planName ?? "starter";
  const cfg = PLAN_CONFIG[key] ?? PLAN_CONFIG.starter;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border", cfg.bg, cfg.border, cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function ExpiryBar({ periodStart, periodEnd, status }: { periodStart?: string | null; periodEnd?: string | null; status: string }) {
  if (!periodStart || !periodEnd) return null;
  const start = new Date(periodStart).getTime();
  const end = new Date(periodEnd).getTime();
  const now = Date.now();
  const pct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
  const days = daysUntil(periodEnd);
  const isExpiring = days !== null && days <= 7 && days >= 0;
  const isExpired = days !== null && days < 0;

  return (
    <div className="w-full space-y-1">
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isExpired ? "bg-rose-400" : isExpiring ? "bg-amber-400" : "bg-emerald-400",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatDate(periodStart)}</span>
        <span className={cn(isExpiring && !isExpired ? "text-amber-400 font-semibold" : isExpired ? "text-rose-400 font-semibold" : "")}>
          {isExpired ? "Expired" : days === 0 ? "Today" : days !== null ? `${days}d left` : formatDate(periodEnd)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────── KPI Card ─────────────── */

function MetricCard({
  title, value, sub, icon: Icon, color, onClick, active,
}: {
  title: string; value: number; sub?: string; icon: typeof Users;
  color: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 w-full",
        active
          ? "border-accent/40 bg-accent/5 shadow-accent/10 shadow-md"
          : "border-border bg-card hover:border-border/80",
      )}
    >
      <div className={cn("absolute top-0 right-0 h-20 w-20 rounded-full -mr-8 -mt-8 opacity-10", color)} />
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mb-3", color + "/20")}>
        <Icon className={cn("h-5 w-5", color.replace("bg-", "text-"))} />
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{title}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </button>
  );
}

/* ─────────────── Row actions ─────────────── */

function ActionMenu({
  sub, hasRequest, isPending, onApprove, onActivate, onExtend, onDeactivate, onPlanChange,
}: {
  sub: SubscriptionWithUser; hasRequest: boolean; isPending: boolean;
  onApprove: () => void; onActivate: () => void; onExtend: () => void;
  onDeactivate: () => void; onPlanChange: (plan: PlanName) => void;
}) {
  return (
    <div className="flex items-center gap-1 justify-end flex-wrap">
      {hasRequest && (
        <Button
          size="sm" variant="ghost" disabled={isPending} onClick={onApprove}
          className="h-8 px-3 text-xs font-semibold text-emerald-400 hover:text-emerald-400 hover:bg-emerald-400/10 gap-1"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Approve
        </Button>
      )}
      <Button size="sm" variant="ghost" disabled={isPending} onClick={onActivate}
        className="h-8 px-3 text-xs text-emerald-400 hover:text-emerald-400 hover:bg-emerald-400/10 gap-1">
        <Activity className="h-3.5 w-3.5" />
        30d
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={onExtend}
        className="h-8 px-3 text-xs text-accent hover:text-accent hover:bg-accent/10 gap-1">
        <RefreshCw className="h-3.5 w-3.5" />
        +30d
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={onDeactivate}
        className="h-8 px-3 text-xs text-rose-400 hover:text-rose-400 hover:bg-rose-400/10 gap-1">
        <Ban className="h-3.5 w-3.5" />
        Off
      </Button>
      <Select value={sub.planName ?? "starter"} onValueChange={(v) => onPlanChange(v as PlanName)}>
        <SelectTrigger className="h-8 w-28 text-xs border-border/50 bg-muted/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─────────────── Filters ─────────────── */

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
  { value: "requests", label: "Requests" },
];

const PLAN_OPTS = [
  { value: "all", label: "All plans" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
];

type SortKey = "name" | "status" | "plan" | "expiry";

/* ─────────────── Main Page ─────────────── */

export default function AdminSubscriptionsPage() {
  const { data: subscriptions = [], isLoading, refetch } = useAdminSubscriptions();
  const updateSubscription = useUpdateSubscription();

  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("expiry");
  const [sortAsc, setSortAsc] = useState(true);

  /* KPI counts */
  const pendingCount  = useMemo(() => subscriptions.filter((s) => s.requestedPlan).length, [subscriptions]);
  const activeCount   = useMemo(() => subscriptions.filter((s) => s.status === "active" || s.status === "trial").length, [subscriptions]);
  const expiredCount  = useMemo(() => subscriptions.filter((s) => s.status === "expired" || s.status === "inactive").length, [subscriptions]);
  const expiringCount = useMemo(
    () => subscriptions.filter((s) => { const d = daysUntil(s.periodEnd); return d !== null && d <= 7 && d >= 0 && (s.status === "active" || s.status === "trial"); }).length,
    [subscriptions],
  );

  /* Filtered + sorted list */
  const filtered = useMemo(() => {
    let list = subscriptions.filter((s) => {
      if (statusFilter === "requests" && !s.requestedPlan) return false;
      if (statusFilter !== "all" && statusFilter !== "requests" && s.status !== statusFilter) return false;
      if (planFilter !== "all" && (s.planName ?? "starter") !== planFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = `${s.userFirstName} ${s.userLastName}`.toLowerCase();
        if (!name.includes(q) && !s.userEmail.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")   cmp = `${a.userFirstName}${a.userLastName}`.localeCompare(`${b.userFirstName}${b.userLastName}`);
      if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      if (sortKey === "plan")   cmp = (a.planName ?? "starter").localeCompare(b.planName ?? "starter");
      if (sortKey === "expiry") {
        const da = daysUntil(a.periodEnd) ?? Infinity;
        const db = daysUntil(b.periodEnd) ?? Infinity;
        cmp = da - db;
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [subscriptions, statusFilter, planFilter, search, sortKey, sortAsc]);

  /* Actions */
  const act = async (sub: SubscriptionWithUser, action: "activate" | "extend" | "deactivate") => {
    try {
      await updateSubscription.mutateAsync({ userId: sub.userId, action });
      toast.success(`Subscription ${action}d`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const changePlan = async (sub: SubscriptionWithUser, planName: PlanName) => {
    try {
      await updateSubscription.mutateAsync({ userId: sub.userId, action: "setPlan", planName });
      toast.success(`Plan updated to ${planName}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const approveRequest = async (sub: SubscriptionWithUser) => {
    if (!sub.requestedPlan) return;
    try {
      await updateSubscription.mutateAsync({ userId: sub.userId, action: "setPlan", planName: sub.requestedPlan as PlanName });
      toast.success(`Upgraded ${sub.userFirstName} to ${sub.requestedPlan}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortAsc ? <ChevronUp className="h-3 w-3 ml-1 inline" /> : <ChevronDown className="h-3 w-3 ml-1 inline" />)
    : null;

  /* ─── render ─── */
  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-7 max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Subscription Management</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Monitor, activate and manage all user subscriptions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {pendingCount > 0 && (
                <button
                  onClick={() => setStatusFilter("requests")}
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border border-accent/30 bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  {pendingCount} upgrade request{pendingCount > 1 ? "s" : ""}
                </button>
              )}
              {expiringCount > 0 && (
                <div className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  {expiringCount} expiring soon
                </div>
              )}
              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Shown" value={filtered.length}
              sub={`of ${subscriptions.length} total`}
              icon={Users} color="bg-accent"
            />
            <MetricCard
              title="Active & Trial" value={activeCount}
              sub="currently enabled"
              icon={TrendingUp} color="bg-emerald-400"
              onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
              active={statusFilter === "active"}
            />
            <MetricCard
              title="Upgrade Requests" value={pendingCount}
              sub="awaiting approval"
              icon={ArrowUpCircle} color="bg-accent"
              onClick={() => setStatusFilter(statusFilter === "requests" ? "all" : "requests")}
              active={statusFilter === "requests"}
            />
            <MetricCard
              title="Expiring ≤ 7d" value={expiringCount}
              sub="need renewal"
              icon={Clock3} color={expiringCount > 0 ? "bg-amber-400" : "bg-slate-400"}
            />
          </div>

          {/* ── Filters bar ── */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-muted/40 text-sm rounded-xl border-border/50"
              />
            </div>

            {/* Plan filter */}
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl text-sm border-border/50">
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Status tabs */}
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    "relative px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                    statusFilter === tab.value
                      ? "bg-accent/10 text-accent border-accent/30"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted",
                  )}
                >
                  {tab.label}
                  {tab.value === "requests" && pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-accent text-[9px] text-white flex items-center justify-center font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table / List ── */}
          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="h-2.5 w-48 rounded bg-muted/70" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-muted" />
                  <div className="h-6 w-14 rounded-md bg-muted" />
                  <div className="h-6 w-28 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-14 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {statusFilter === "requests" ? "No pending upgrade requests" : "No subscriptions found"}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {statusFilter !== "all" ? "Try adjusting your filters or search query." : "No subscription data available yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <button className="hover:text-foreground transition-colors" onClick={() => toggleSort("name")}>
                          User <SortIcon k="name" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <button className="hover:text-foreground transition-colors" onClick={() => toggleSort("plan")}>
                          Plan <SortIcon k="plan" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <button className="hover:text-foreground transition-colors" onClick={() => toggleSort("status")}>
                          Status <SortIcon k="status" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                        <button className="hover:text-foreground transition-colors" onClick={() => toggleSort("expiry")}>
                          Period <SortIcon k="expiry" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Signals
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((s) => {
                      const days = daysUntil(s.periodEnd);
                      const expiringSoon = days !== null && days <= 7 && days >= 0 && (s.status === "active" || s.status === "trial");
                      const hasRequest = !!s.requestedPlan;
                      const displayName = `${s.userFirstName} ${s.userLastName}`;

                      return (
                        <tr
                          key={s.id}
                          className={cn(
                            "group transition-colors",
                            hasRequest   ? "bg-accent/[0.03] hover:bg-accent/[0.07]" :
                            expiringSoon ? "bg-amber-400/[0.03] hover:bg-amber-400/[0.07]" :
                                           "hover:bg-muted/40",
                          )}
                        >
                          {/* User */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={displayName} size="sm" />
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.userEmail}</p>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-4">
                            <PlanChip planName={s.planName} />
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <StatusPill status={s.status} />
                          </td>

                          {/* Period bar */}
                          <td className="px-4 py-4 min-w-[200px]">
                            <ExpiryBar periodStart={s.periodStart} periodEnd={s.periodEnd} status={s.status} />
                          </td>

                          {/* Signals */}
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              {hasRequest && (
                                <Badge variant="outline" className="text-[10px] px-1.5 bg-accent/10 text-accent border-accent/20 w-fit">
                                  <ArrowUpCircle className="h-2.5 w-2.5 mr-1" />
                                  Req: {s.requestedPlan}
                                </Badge>
                              )}
                              {expiringSoon && (
                                <Badge variant="outline" className="text-[10px] px-1.5 bg-amber-400/10 text-amber-400 border-amber-400/20 w-fit">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                  Expiring {days}d
                                </Badge>
                              )}
                              {!hasRequest && !expiringSoon && (
                                <span className="text-xs text-muted-foreground/50">—</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <ActionMenu
                              sub={s} hasRequest={hasRequest}
                              isPending={updateSubscription.isPending}
                              onApprove={() => approveRequest(s)}
                              onActivate={() => act(s, "activate")}
                              onExtend={() => act(s, "extend")}
                              onDeactivate={() => act(s, "deactivate")}
                              onPlanChange={(p) => changePlan(s, p)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{subscriptions.length}</span> subscriptions
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {activeCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {activeCount} active
                      </span>
                    )}
                    {expiringCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        {expiringCount} expiring
                      </span>
                    )}
                    {expiredCount > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-400" />
                        {expiredCount} inactive/expired
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile cards */}
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
                        "rounded-2xl border bg-card p-4 space-y-4",
                        hasRequest ? "border-accent/30" : expiringSoon ? "border-amber-400/30" : "border-border",
                      )}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar name={displayName} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.userEmail}</p>
                          </div>
                        </div>
                        <StatusPill status={s.status} />
                      </div>

                      {/* Plan + signals */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <PlanChip planName={s.planName} />
                        {hasRequest && (
                          <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/20">
                            <ArrowUpCircle className="h-2.5 w-2.5 mr-1" />
                            Req: {s.requestedPlan}
                          </Badge>
                        )}
                        {expiringSoon && (
                          <Badge variant="outline" className="text-[10px] bg-amber-400/10 text-amber-400 border-amber-400/20">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                            {days}d left
                          </Badge>
                        )}
                      </div>

                      {/* Period bar */}
                      <ExpiryBar periodStart={s.periodStart} periodEnd={s.periodEnd} status={s.status} />

                      {/* Actions */}
                      <div className="flex gap-1.5 flex-wrap pt-1 border-t border-border">
                        {hasRequest && (
                          <Button size="sm" variant="ghost" disabled={updateSubscription.isPending} onClick={() => approveRequest(s)}
                            className="h-8 px-3 text-xs text-emerald-400 hover:bg-emerald-400/10 gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" disabled={updateSubscription.isPending} onClick={() => act(s, "activate")}
                          className="h-8 px-3 text-xs text-emerald-400 hover:bg-emerald-400/10">
                          Activate
                        </Button>
                        <Button size="sm" variant="ghost" disabled={updateSubscription.isPending} onClick={() => act(s, "extend")}
                          className="h-8 px-3 text-xs text-accent hover:bg-accent/10">
                          +30d
                        </Button>
                        <Button size="sm" variant="ghost" disabled={updateSubscription.isPending} onClick={() => act(s, "deactivate")}
                          className="h-8 px-3 text-xs text-rose-400 hover:bg-rose-400/10">
                          Deactivate
                        </Button>
                        <Select value={s.planName ?? "starter"} onValueChange={(v) => changePlan(s, v as PlanName)}>
                          <SelectTrigger className="h-8 w-28 text-xs ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
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
