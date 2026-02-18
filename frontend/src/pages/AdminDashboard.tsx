import { useEffect, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonKpiRow, SkeletonTable } from "@/components/SkeletonCards";
import { adminService } from "@/services/adminService";
import { User, AdminStats, AdminAction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusFilters = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject"; user: User } | null>(null);

  const fetchData = async () => {
    const [s, u, a] = await Promise.all([adminService.getDashboardStats(), adminService.getUsers(), adminService.getActionTimeline()]);
    setStats(s);
    setUsers(u);
    setActions(a);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === "approve") await adminService.approveUser(confirmAction.user.id);
    else await adminService.rejectUser(confirmAction.user.id);
    setConfirmAction(null);
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

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>

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
            <h2 className="text-lg font-semibold mb-4">User Management</h2>
            <div className="glass-surface rounded-xl p-4 flex flex-wrap items-center gap-3 mb-4">
              <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 h-9 bg-muted/50 text-sm" />
              <div className="flex gap-1.5">
                {statusFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      statusFilter === f.value ? "bg-accent/10 text-accent border border-accent/30" : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <SkeletonTable /> : (
              <div className="glass-surface rounded-xl overflow-hidden">
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
                        <TableCell className="font-medium">{u.name}</TableCell>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* Timeline */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Action Timeline</h2>
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No actions yet</p>
            ) : (
              <div className="space-y-2 relative">
                <div className="absolute left-[17px] top-3 bottom-3 w-px bg-border/50" />
                {actions.map((a) => (
                  <div key={a.id} className="glass-card rounded-lg p-4 pl-10 relative">
                    <div className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full",
                      a.action === "Approved" ? "bg-success" : "bg-destructive"
                    )} />
                    <div className="flex items-center justify-between">
                      <p className="text-sm"><span className="font-medium">{a.action}</span> <span className="text-muted-foreground">{a.targetUser}</span></p>
                      <p className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={() => setConfirmAction(null)}
          title={confirmAction?.type === "approve" ? "Approve User" : "Reject User"}
          description={`Are you sure you want to ${confirmAction?.type} ${confirmAction?.user.name}?`}
          confirmLabel={confirmAction?.type === "approve" ? "Approve" : "Reject"}
          variant={confirmAction?.type === "reject" ? "destructive" : "default"}
          onConfirm={handleConfirm}
        />
      </PageTransition>
    </AppShell>
  );
}
