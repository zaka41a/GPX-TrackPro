import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useAdminBans } from "@/hooks/useAdmin";
import { communityService } from "@/services/communityService";
import { CommunityBan } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CheckCircle, MessageSquare, Search, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

function BanSkeleton() {
  return (
    <div className="glass-surface rounded-xl overflow-hidden animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
          <div className="h-4 w-32 rounded bg-muted/50" />
          <div className="h-4 w-44 rounded bg-muted/40" />
          <div className="h-4 w-24 rounded bg-muted/30" />
          <div className="h-4 w-20 rounded bg-muted/30 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function AdminCommunityModPage() {
  const qc = useQueryClient();
  const { data: bans = [], isLoading } = useAdminBans();
  const [search, setSearch] = useState("");
  const [unbanTarget, setUnbanTarget] = useState<CommunityBan | null>(null);

  const filtered = bans.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.userName.toLowerCase().includes(q) || b.userEmail.toLowerCase().includes(q);
  });

  const handleUnban = async () => {
    if (!unbanTarget) return;
    try {
      await communityService.unbanUser(unbanTarget.userId);
      qc.invalidateQueries({ queryKey: ["admin", "bans"] });
      toast.success(`${unbanTarget.userName} has been unbanned`);
    } catch {
      toast.error("Failed to unban user");
    } finally {
      setUnbanTarget(null);
    }
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="section-icon-bg">
              <MessageSquare className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Community Moderation</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading…" : `${bans.length} banned user${bans.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Link to="/community">
              <Button variant="outline" size="sm" className="text-xs">View Community</Button>
            </Link>
          </div>

          {/* Search */}
          <div className="glass-surface rounded-xl p-4 accent-line-top">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search banned users by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 bg-muted/50 text-sm max-w-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <BanSkeleton />
          ) : bans.length === 0 ? (
            <div className="glass-surface rounded-xl p-10 flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <p className="text-base font-semibold text-foreground">Community is clean</p>
              <p className="text-sm text-muted-foreground text-center">No users are currently banned. Keep it up!</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No results" description={`No banned users match "${search}"`} />
          ) : (
            <>
              {/* Desktop */}
              <div className="glass-surface rounded-xl overflow-hidden accent-line-top hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Banned</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((ban) => (
                      <TableRow key={ban.id} className="hover:bg-accent/5 transition-colors">
                        <TableCell className="font-medium text-foreground">{ban.userName}</TableCell>
                        <TableCell className="text-muted-foreground">{ban.userEmail}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {ban.reason || <span className="italic text-muted-foreground/60">No reason</span>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(ban.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:text-success hover:bg-success/10 h-8 text-xs"
                            onClick={() => setUnbanTarget(ban)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Unban
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {filtered.map((ban) => (
                  <div key={ban.id} className="glass-card rounded-xl p-4 accent-line-left">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">{ban.userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{ban.userEmail}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-success hover:bg-success/10 h-8 text-xs shrink-0"
                        onClick={() => setUnbanTarget(ban)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Unban
                      </Button>
                    </div>
                    {ban.reason && (
                      <p className={cn("text-xs mb-1", ban.reason ? "text-muted-foreground" : "text-muted-foreground/50 italic")}>
                        Reason: {ban.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Banned {new Date(ban.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <ConfirmDialog
          open={!!unbanTarget}
          onOpenChange={() => setUnbanTarget(null)}
          title="Unban User"
          description={`Are you sure you want to unban ${unbanTarget?.userName}? They will be able to post and comment in the community again.`}
          confirmLabel="Unban"
          variant="default"
          onConfirm={handleUnban}
        />
      </PageTransition>
    </AppShell>
  );
}
