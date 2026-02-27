import { useRef, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonKpiRow, SkeletonTable } from "@/components/SkeletonCards";
import { adminService } from "@/services/adminService";
import { communityService } from "@/services/communityService";
import { useAdminUsers, useAdminStats, useAdminBans } from "@/hooks/useAdmin";
import { useAdminSubscriptions, useUpdateSubscription } from "@/hooks/useSubscription";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";
import { SubscriptionWithUser } from "@/services/subscriptionService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Users, UserCheck, UserX, Clock, CheckCircle, XCircle, Trash2, Shield, MessageSquare, CreditCard, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { data: users = [], isLoading: loading } = useAdminUsers();
  const { data: stats } = useAdminStats();
  const { data: bans = [] } = useAdminBans();
  const { data: subscriptions = [], isLoading: subsLoading, isError: subsIsError, error: subsError, refetch: refetchSubs } = useAdminSubscriptions();
  const updateSubscription = useUpdateSubscription();
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject" | "delete"; user: User } | null>(null);
  const confirmRef = useRef(confirmAction);
  confirmRef.current = confirmAction;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const handleConfirm = async () => {
    const action = confirmRef.current;
    if (!action) return;
    setConfirmAction(null);
    try {
      if (action.type === "approve") await adminService.approveUser(action.user.id);
      else if (action.type === "reject") await adminService.rejectUser(action.user.id);
      else if (action.type === "delete") await adminService.deleteUser(action.user.id);
      invalidate();
    } catch (e) {
      toast.error("Action failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const handleSubAction = async (sub: SubscriptionWithUser, action: "activate" | "extend" | "deactivate") => {
    try {
      await updateSubscription.mutateAsync({ userId: sub.userId, action });
      toast.success(`Subscription ${action}d`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={cn("capitalize", styles[status] || "")}>{status}</Badge>;
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

  const recentUsers = users.slice(-3).reverse();
  const recentSubs = subscriptions.slice(-3).reverse();
  const recentBans = bans.slice(-3).reverse();

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of users, subscriptions and community</p>
          </div>

          {/* KPIs */}
          {loading ? (
            <SkeletonKpiRow />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard title="Total Users" value={stats?.totalUsers ?? null} icon={<Users className="h-5 w-5" />} iconBg="bg-accent/10 text-accent" />
              <KpiCard title="Pending" value={stats?.pendingUsers ?? null} icon={<Clock className="h-5 w-5" />} iconBg="bg-warning/10 text-warning" />
              <KpiCard title="Approved" value={stats?.approvedUsers ?? null} icon={<UserCheck className="h-5 w-5" />} iconBg="bg-success/10 text-success" />
              <KpiCard title="Rejected" value={stats?.rejectedUsers ?? null} icon={<UserX className="h-5 w-5" />} iconBg="bg-destructive/10 text-destructive" />
              <KpiCard
                title="Active Subs"
                value={subscriptions.filter((s) => s.status === "active" || s.status === "trial").length}
                icon={<CreditCard className="h-5 w-5" />}
                iconBg="bg-success/10 text-success"
              />
            </div>
          )}

          {/* Recent Users */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="section-icon-bg">
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Recent Users</h2>
                <p className="text-xs text-muted-foreground">{users.length} total user{users.length !== 1 ? "s" : ""}</p>
              </div>
              <Link to="/admin/users">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {loading ? <SkeletonTable /> : recentUsers.length === 0 ? (
              <div className="glass-surface rounded-xl p-6 text-center accent-line-top">
                <p className="text-sm text-muted-foreground">No users yet</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="glass-surface rounded-xl overflow-hidden hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentUsers.map((u) => (
                        <TableRow key={u.id} className="hover:bg-accent/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                              <span className="font-medium text-foreground">{u.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>{statusBadge(u.status)}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {u.status !== "approved" && (
                                <Button size="sm" variant="ghost" className="text-success hover:text-success hover:bg-success/10 h-8 text-xs" onClick={() => setConfirmAction({ type: "approve", user: u })}>
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                              )}
                              {u.status !== "rejected" && (
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => setConfirmAction({ type: "reject", user: u })}>
                                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => setConfirmAction({ type: "delete", user: u })}>
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
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
                  {recentUsers.map((u) => (
                    <div key={u.id} className="glass-card rounded-xl p-4 accent-line-left">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        {statusBadge(u.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</p>
                        <div className="flex gap-1">
                          {u.status !== "approved" && (
                            <Button size="sm" variant="ghost" className="text-success hover:bg-success/10 h-9 text-xs px-3" onClick={() => setConfirmAction({ type: "approve", user: u })}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                          )}
                          {u.status !== "rejected" && (
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-9 text-xs px-3" onClick={() => setConfirmAction({ type: "reject", user: u })}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-9 text-xs px-3" onClick={() => setConfirmAction({ type: "delete", user: u })}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Recent Subscriptions */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="section-icon-bg">
                <CreditCard className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Recent Subscriptions</h2>
                <p className="text-xs text-muted-foreground">{subscriptions.length} total subscription{subscriptions.length !== 1 ? "s" : ""}</p>
              </div>
              <Link to="/admin/subscriptions">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {subsLoading ? (
              <SkeletonTable />
            ) : subsIsError ? (
              <div className="glass-surface rounded-xl p-6 text-center accent-line-top space-y-3">
                <p className="text-sm text-muted-foreground">Failed to load subscriptions</p>
                <p className="text-xs text-destructive font-mono">{(subsError as Error)?.message ?? "Unknown error"}</p>
                <Button variant="outline" size="sm" onClick={() => refetchSubs()}>Retry</Button>
              </div>
            ) : recentSubs.length === 0 ? (
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
                      {recentSubs.map((s) => (
                        <TableRow key={s.id} className="hover:bg-accent/5 transition-colors">
                          <TableCell className="font-medium text-foreground">{s.userFirstName} {s.userLastName}</TableCell>
                          <TableCell className="text-muted-foreground">{s.userEmail}</TableCell>
                          <TableCell>{subStatusBadge(s.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.periodEnd ? new Date(s.periodEnd).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="text-success hover:text-success hover:bg-success/10 h-8 text-xs" onClick={() => handleSubAction(s, "activate")}>
                                Activate 30d
                              </Button>
                              <Button size="sm" variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10 h-8 text-xs" onClick={() => handleSubAction(s, "extend")}>
                                +30d
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => handleSubAction(s, "deactivate")}>
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
                  {recentSubs.map((s) => (
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
                        <Button size="sm" variant="ghost" className="text-success hover:bg-success/10 h-9 text-xs px-3" onClick={() => handleSubAction(s, "activate")}>Activate</Button>
                        <Button size="sm" variant="ghost" className="text-accent hover:bg-accent/10 h-9 text-xs px-3" onClick={() => handleSubAction(s, "extend")}>+30d</Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-9 text-xs px-3" onClick={() => handleSubAction(s, "deactivate")}>Deactivate</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Recent Bans */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="section-icon-bg">
                <MessageSquare className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Community Moderation</h2>
                <p className="text-xs text-muted-foreground">{bans.length} banned user{bans.length !== 1 ? "s" : ""}</p>
              </div>
              <Link to="/admin/community-mod">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {recentBans.length === 0 ? (
              <div className="glass-surface rounded-xl p-6 text-center accent-line-top">
                <p className="text-sm text-muted-foreground">No banned users</p>
              </div>
            ) : (
              <div className="glass-surface rounded-xl overflow-hidden accent-line-top">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Banned At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBans.map((ban) => (
                      <TableRow key={ban.id} className="hover:bg-accent/5 transition-colors">
                        <TableCell className="font-medium text-foreground">{ban.userName}</TableCell>
                        <TableCell className="text-muted-foreground">{ban.userEmail}</TableCell>
                        <TableCell className="text-muted-foreground">{ban.reason || "No reason"}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(ban.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:text-success hover:bg-success/10 h-8 text-xs"
                            onClick={async () => {
                              try {
                                await communityService.unbanUser(ban.userId);
                                qc.invalidateQueries({ queryKey: ["admin", "bans"] });
                              } catch {
                                toast.error("Failed to unban user");
                              }
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Unban
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

        </div>

        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={() => setConfirmAction(null)}
          title={confirmAction?.type === "approve" ? "Approve User" : confirmAction?.type === "delete" ? "Delete User" : "Reject User"}
          description={`Are you sure you want to ${confirmAction?.type} ${confirmAction?.user.name}?${confirmAction?.type === "delete" ? " This action cannot be undone." : ""}`}
          confirmLabel={confirmAction?.type === "approve" ? "Approve" : confirmAction?.type === "delete" ? "Delete" : "Reject"}
          variant={confirmAction?.type === "approve" ? "default" : "destructive"}
          onConfirm={handleConfirm}
        />
      </PageTransition>
    </AppShell>
  );
}
