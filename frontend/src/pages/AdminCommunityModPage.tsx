import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { useAdminBans } from "@/hooks/useAdmin";
import { communityService } from "@/services/communityService";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CheckCircle, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminCommunityModPage() {
  const qc = useQueryClient();
  const { data: bans = [], isLoading } = useAdminBans();

  return (
    <AppShell>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="section-icon-bg">
              <MessageSquare className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Community Moderation</h1>
              <p className="text-sm text-muted-foreground">{bans.length} banned user{bans.length !== 1 ? "s" : ""}</p>
            </div>
            <Link to="/community">
              <Button variant="outline" size="sm" className="text-xs">View Community Feed</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="glass-surface rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : bans.length === 0 ? (
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
        </div>
      </PageTransition>
    </AppShell>
  );
}
