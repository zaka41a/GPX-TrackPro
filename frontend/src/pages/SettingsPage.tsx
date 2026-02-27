import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageTransition } from "@/components/PageTransition";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useChangeEmail, useChangePassword, useUnlinkGoogle } from "@/hooks/useAccount";
import { useMySubscription } from "@/hooks/useSubscription";
import { accountService } from "@/services/accountService";
import { apiFetch } from "@/services/api";
import { changeEmailSchema, ChangeEmailFormData, changePasswordSchema, ChangePasswordFormData } from "@/lib/schemas";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Lock, Chrome, CreditCard, AlertTriangle, CheckCircle2, Clock, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function SubscriptionBadge({ status }: { status: string }) {
  const styles: Record<string, { cls: string; label: string }> = {
    active: { cls: "bg-success/10 text-success border-success/20", label: "Active" },
    trial: { cls: "bg-accent/10 text-accent border-accent/20", label: "Trial" },
    inactive: { cls: "bg-muted text-muted-foreground border-border", label: "Inactive" },
    expired: { cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Expired" },
    none: { cls: "bg-muted text-muted-foreground border-border", label: "None" },
    "—": { cls: "bg-muted text-muted-foreground border-border", label: "Loading…" },
  };
  const style = styles[status] ?? styles["none"];
  return (
    <Badge variant="outline" className={cn("capitalize text-sm px-3 py-1", style.cls)}>
      {style.label}
    </Badge>
  );
}

function SubscriptionIcon({ status }: { status: string }) {
  if (status === "active") return <CheckCircle2 className="h-10 w-10 text-success" />;
  if (status === "trial") return <Clock className="h-10 w-10 text-accent" />;
  return <XCircle className="h-10 w-10 text-destructive" />;
}

function daysLeft(periodEnd?: string | null): number | null {
  if (!periodEnd) return null;
  const diff = new Date(periodEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [googleUnavailable, setGoogleUnavailable] = useState(false);
  const changeEmail = useChangeEmail();
  const changePassword = useChangePassword();
  const unlinkGoogle = useUnlinkGoogle();
  const { data: subscription } = useMySubscription();

  // Handle Google OAuth redirect result
  useEffect(() => {
    const google = searchParams.get("google");
    const msg = searchParams.get("msg");
    if (google === "linked") {
      toast.success("Google account linked successfully");
      setSearchParams({}, { replace: true });
    } else if (google === "error") {
      toast.error("Failed to link Google account" + (msg ? `: ${msg.replace(/\+/g, " ")}` : ""));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const emailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", currentPassword: "" },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onChangeEmail = async (data: ChangeEmailFormData) => {
    try {
      await changeEmail.mutateAsync(data);
      toast.success("Email updated successfully");
      emailForm.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update email");
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      await changePassword.mutateAsync({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success("Password updated successfully");
      passwordForm.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password");
    }
  };

  const handleGoogleLink = async () => {
    try {
      const { url } = await accountService.startGoogleLink();
      window.location.href = url;
    } catch (e) {
      // 503 = Google OAuth not configured on the server
      if (e instanceof Error && (e.message.includes("configured") || e.message.includes("503"))) {
        setGoogleUnavailable(true);
      } else {
        toast.error(e instanceof Error ? e.message : "Failed to start Google link");
      }
    }
  };

  const handleGoogleUnlink = async () => {
    try {
      await unlinkGoogle.mutateAsync();
      toast.success("Google account unlinked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unlink Google account");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiFetch("/api/users/me", { method: "DELETE" }, true);
      await logout();
      navigate("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  const subLoading = subscription === undefined;
  const days = daysLeft(subscription?.periodEnd);

  return (
    <AppShell>
      <PageTransition>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="section-icon-bg">
              <Settings className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and subscription</p>
            </div>
          </div>

          <Tabs defaultValue="security">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" /> Security
              </TabsTrigger>
              <TabsTrigger value="google" className="flex items-center gap-2">
                <Chrome className="h-3.5 w-3.5" /> Google
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5" /> Subscription
              </TabsTrigger>
            </TabsList>

            {/* Security tab */}
            <TabsContent value="security" className="space-y-6 mt-6">
              {/* Change email */}
              <div className="glass-surface rounded-xl p-6 accent-line-top space-y-4">
                <h2 className="text-base font-semibold text-foreground">Change Email</h2>
                <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Current Email</Label>
                    <Input value={user?.email ?? ""} readOnly className="bg-muted/50 text-muted-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newEmail">New Email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      placeholder="new@example.com"
                      {...emailForm.register("newEmail")}
                    />
                    {emailForm.formState.errors.newEmail && (
                      <p className="text-xs text-destructive">{emailForm.formState.errors.newEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emailPassword">Current Password</Label>
                    <Input
                      id="emailPassword"
                      type="password"
                      placeholder="Your current password"
                      {...emailForm.register("currentPassword")}
                    />
                    {emailForm.formState.errors.currentPassword && (
                      <p className="text-xs text-destructive">{emailForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={changeEmail.isPending} className="w-full sm:w-auto">
                    {changeEmail.isPending ? "Saving..." : "Save Email"}
                  </Button>
                </form>
              </div>

              {/* Change password */}
              <div className="glass-surface rounded-xl p-6 accent-line-top space-y-4">
                <h2 className="text-base font-semibold text-foreground">Change Password</h2>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPass">Current Password</Label>
                    <Input
                      id="currentPass"
                      type="password"
                      placeholder="Current password"
                      {...passwordForm.register("currentPassword")}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPass">New Password</Label>
                    <Input
                      id="newPass"
                      type="password"
                      placeholder="Min. 8 characters"
                      {...passwordForm.register("newPassword")}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPass">Confirm New Password</Label>
                    <Input
                      id="confirmPass"
                      type="password"
                      placeholder="Repeat new password"
                      {...passwordForm.register("confirmPassword")}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={changePassword.isPending} className="w-full sm:w-auto">
                    {changePassword.isPending ? "Saving..." : "Save Password"}
                  </Button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Delete Account</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete your account and all associated data. This cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setDeleteOpen(true)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Google tab */}
            <TabsContent value="google" className="mt-6">
              <div className="glass-surface rounded-xl p-6 accent-line-top">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Chrome className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Google Account</h2>
                    <p className="text-xs text-muted-foreground">Link your Google account to sign in with one click</p>
                  </div>
                </div>

                {googleUnavailable ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">Google Sign-In is not configured. Contact your administrator.</p>
                  </div>
                ) : user?.googleEmail ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Connected</p>
                        <p className="text-xs text-muted-foreground truncate">{user.googleEmail}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={unlinkGoogle.isPending}
                      onClick={handleGoogleUnlink}
                    >
                      {unlinkGoogle.isPending ? "Unlinking..." : "Disconnect Google Account"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground">No Google account linked</p>
                    </div>
                    <Button onClick={handleGoogleLink} className="flex items-center gap-2">
                      <Chrome className="h-4 w-4" />
                      Connect Google Account
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Subscription tab */}
            <TabsContent value="subscription" className="mt-6">
              <div className="glass-surface rounded-xl p-6 accent-line-top space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Subscription</h2>
                  <SubscriptionBadge status={subLoading ? "—" : (subscription?.status ?? "none")} />
                </div>

                {subLoading && (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
                )}

                {!subLoading && subscription === null && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <XCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Subscription information unavailable.<br />
                      Contact an administrator for assistance.
                    </p>
                  </div>
                )}

                {!subLoading && subscription && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <SubscriptionIcon status={subscription.status} />
                    <div className="text-center space-y-1">
                      {subscription.status === "active" && (
                        <>
                          <p className="text-sm font-medium text-foreground">Your subscription is active</p>
                          {days !== null && (
                            <p className="text-xs text-muted-foreground">{days} day{days !== 1 ? "s" : ""} remaining</p>
                          )}
                        </>
                      )}
                      {subscription.status === "trial" && (
                        <>
                          <p className="text-sm font-medium text-foreground">You are on a free trial</p>
                          {days !== null && (
                            <p className="text-xs text-muted-foreground">{days} day{days !== 1 ? "s" : ""} left in trial</p>
                          )}
                        </>
                      )}
                      {(subscription.status === "inactive" || subscription.status === "none") && (
                        <>
                          <p className="text-sm font-medium text-foreground">No active subscription</p>
                          <p className="text-xs text-muted-foreground">Contact an administrator to activate your account</p>
                        </>
                      )}
                      {subscription.status === "expired" && (
                        <>
                          <p className="text-sm font-medium text-foreground">Subscription expired</p>
                          <p className="text-xs text-muted-foreground">Contact an administrator to renew</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4 space-y-3">
                  {subscription?.periodStart && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Period start</span>
                      <span className="text-foreground">{new Date(subscription.periodStart).toLocaleDateString()}</span>
                    </div>
                  )}
                  {subscription?.periodEnd && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Period end</span>
                      <span className="text-foreground">{new Date(subscription.periodEnd).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="text-foreground font-medium">19€ / month</span>
                  </div>
                </div>

                {subscription && (!subscription.isActive) && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground">
                      To activate or renew your subscription, please contact the administrator.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete Account"
          description={`Are you sure you want to permanently delete your account (${user?.email})? All your activities, data and history will be lost. This action cannot be undone.`}
          confirmLabel="Delete My Account"
          variant="destructive"
          onConfirm={handleDeleteAccount}
        />
      </PageTransition>
    </AppShell>
  );
}
