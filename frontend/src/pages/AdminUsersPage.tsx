import { useRef, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonTable } from "@/components/SkeletonCards";
import { adminService } from "@/services/adminService";
import { useAdminUsers } from "@/hooks/useAdmin";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { CheckCircle, XCircle, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const statusFilters = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      else await adminService.deleteUser(action.user.id);
      invalidate();
    } catch (e) {
      toast.error("Action failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
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
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="section-icon-bg">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              {!isLoading && (
                <p className="text-sm text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""} shown</p>
              )}
            </div>
          </div>

          <div className="glass-surface rounded-xl p-4 flex flex-wrap items-center gap-3 accent-line-top">
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

          {isLoading ? <SkeletonTable /> : (
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
