import { useEffect, useRef, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonKpiRow, SkeletonTable } from "@/components/SkeletonCards";
import { adminService } from "@/services/adminService";
import { communityService } from "@/services/communityService";
import { User, AdminStats, CommunityBan } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Users, UserCheck, UserX, Clock, CheckCircle, XCircle, Trash2, Shield, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const statusFilters = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject" | "delete"; user: User } | null>(null);
  const [bans, setBans] = useState<CommunityBan[]>([]);
  const confirmRef = useRef(confirmAction);
  confirmRef.current = confirmAction;

  const fetchData = async () => {
    const [s, u] = await Promise.all([adminService.getDashboardStats(), adminService.getUsers()]);
    setStats(s);
    setUsers(u);
    setLoading(false);
    communityService.listBans().then(setBans).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const handleConfirm = async () => {
    const action = confirmRef.current;
    if (!action) return;
    setConfirmAction(null);
    try {
      if (action.type === "approve") await adminService.approveUser(action.user.id);
      else if (action.type === "reject") await adminService.rejectUser(action.user.id);
      else if (action.type === "delete") await adminService.deleteUser(action.user.id);
    } catch (e) {
      console.error("Action failed:", e);
    }
    await fetchData();
  };

  const filtered = users.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={cn("capitalize", styles[status] || "")}>{status}</Badge>;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage user approvals and system access</p>
          </div>

          {/* KPIs */}
          {loading ? (
            <SkeletonKpiRow />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Total Users" value={stats?.totalUsers ?? null} icon={<Users className="h-5 w-5" />} iconBg="bg-accent/10 text-accent" />
              <KpiCard title="Pending" value={stats?.pendingUsers ?? null} icon={<Clock className="h-5 w-5" />} iconBg="bg-warning/10 text-warning" />
              <KpiCard title="Approved" value={stats?.approvedUsers ?? null} icon={<UserCheck className="h-5 w-5" />} iconBg="bg-success/10 text-success" />
              <KpiCard title="Rejected" value={stats?.rejectedUsers ?? null} icon={<UserX className="h-5 w-5" />} iconBg="bg-destructive/10 text-destructive" />
            </div>
          )}

          {/* User table */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="section-icon-bg">
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">User Management</h2>
                {!loading && (
                  <p className="text-xs text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""} shown</p>
                )}
              </div>
            </div>
            <div className="glass-surface rounded-xl p-4 flex flex-wrap items-center gap-3 mb-4 accent-line-top">
              <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 h-9 bg-muted/50 text-sm" />
              <div className="flex gap-1.5">
                {statusFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-xs font-medium transition-all",
                      statusFilter === f.value ? "bg-accent/10 text-accent border border-accent/30" : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <SkeletonTable /> : (
              <>
                {/* Desktop table */}
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
                      {filtered.map((u) => (
                        <TableRow key={u.id} className="hover:bg-accent/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                              <span className="font-medium text-foreground">{u.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>{statusBadge(u.status)}</TableCell>
                          <TableCell className="text-muted-foreground">{u.createdAt}</TableCell>
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

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map((u) => (
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
                        <p className="text-xs text-muted-foreground">{u.createdAt}</p>
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

          {/* Community Moderation */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="section-icon-bg">
                <MessageSquare className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Community Moderation</h2>
                <p className="text-xs text-muted-foreground">{bans.length} banned user{bans.length !== 1 ? "s" : ""}</p>
              </div>
              <Link to="/community" className="ml-auto">
                <Button variant="outline" size="sm" className="text-xs">View Community Feed</Button>
              </Link>
            </div>

            {bans.length === 0 ? (
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
                    {bans.map((ban) => (
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
                              await communityService.unbanUser(ban.userId);
                              communityService.listBans().then(setBans).catch(() => {});
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
