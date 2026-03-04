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
import { useMySubscription, useRequestUpgrade } from "@/hooks/useSubscription";
import { subscriptionService, PlanName } from "@/services/subscriptionService";
import { accountService } from "@/services/accountService";
import { apiFetch } from "@/services/api";
import {
  changeEmailSchema,
  ChangeEmailFormData,
  changePasswordSchema,
  ChangePasswordFormData,
} from "@/lib/schemas";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Lock,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Check,
  Zap,
  Star,
  Crown,
  ExternalLink,
  Mail,
  ShieldCheck,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type PublicConfig = {
  googleConfigured: boolean;
  stripeConfigured: boolean;
  smtpConfigured: boolean;
};

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function daysLeft(periodEnd?: string | null): number | null {
  if (!periodEnd) return null;
  const diff = new Date(periodEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: "bg-success/10 text-success border-success/20", label: "Active" },
    trial: { cls: "bg-accent/10 text-accent border-accent/20", label: "Free Trial" },
    inactive: { cls: "bg-muted text-muted-foreground border-border", label: "Inactive" },
    expired: { cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Expired" },
    none: { cls: "bg-muted text-muted-foreground border-border", label: "No Plan" },
    "—": { cls: "bg-muted text-muted-foreground border-border", label: "Loading…" },
  };
  const { cls, label } = map[status] ?? map["none"];
  return (
    <Badge variant="outline" className={cn("text-sm px-3 py-1", cls)}>
      {label}
    </Badge>
  );
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    priceDetail: "during trial",
    icon: Zap,
    color: "text-muted-foreground",
    border: "border-border",
    highlight: false,
    features: [
      "Up to 5 GPX uploads",
      "Basic activity stats",
      "7-day activity history",
      "Personal profile",
    ],
    missing: ["Community access", "Messaging", "Advanced charts", "Data export"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "9.99€",
    priceDetail: "per month",
    icon: Star,
    color: "text-accent",
    border: "border-accent/40",
    highlight: true,
    features: [
      "Unlimited GPX uploads",
      "Full activity analytics",
      "Community & messaging",
      "Heart rate & map charts",
      "Data export (CSV / JSON)",
      "Personal athlete profile",
    ],
    missing: ["Priority support", "API access"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "19.99€",
    priceDetail: "per month",
    icon: Crown,
    color: "text-warning",
    border: "border-warning/30",
    highlight: false,
    features: [
      "Everything in Pro",
      "Priority support",
      "API access",
      "PDF export & reports",
      "Advanced training load",
      "Early access to features",
    ],
    missing: [],
  },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [googleUnavailable, setGoogleUnavailable] = useState(false);
  const [activeTab, setActiveTab] = useState<"security" | "google" | "subscription">("security");
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null);

  const changeEmail = useChangeEmail();
  const changePassword = useChangePassword();
  const unlinkGoogle = useUnlinkGoogle();
  const { data: subscription } = useMySubscription();
  const requestUpgrade = useRequestUpgrade();

  useEffect(() => {
    apiFetch<PublicConfig>("/api/public/config")
      .then((cfg) => setPublicConfig(cfg))
      .catch(() => {
        setPublicConfig(null);
      });
  }, []);

  useEffect(() => {
    let nextTab: "security" | "google" | "subscription" = activeTab;
    const tab = searchParams.get("tab");
    if (tab === "security" || tab === "google" || tab === "subscription") {
      setActiveTab(tab);
      nextTab = tab;
    }

    const google = searchParams.get("google");
    const msg = searchParams.get("msg");
    const checkout = searchParams.get("checkout");

    if (google === "linked") {
      toast.success("Google account linked successfully");
    } else if (google === "error") {
      toast.error(
        "Failed to link Google account" + (msg ? `: ${msg.replace(/\+/g, " ")}` : ""),
      );
    }

    if (checkout === "success") {
      setActiveTab("subscription");
      nextTab = "subscription";
      toast.success("Payment completed. Your subscription is being activated.");
    } else if (checkout === "cancelled") {
      setActiveTab("subscription");
      nextTab = "subscription";
      toast.info("Checkout was cancelled.");
    }

    if (google || msg || checkout) {
      const next = new URLSearchParams(searchParams);
      next.delete("google");
      next.delete("msg");
      next.delete("checkout");
      if (!next.get("tab")) {
        next.set("tab", nextTab);
      }
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, activeTab]);

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
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
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
      toast.error(e instanceof Error ? e.message : "Failed to unlink");
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await apiFetch<unknown>("/api/users/me/export", undefined, true);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gpx-trackpro-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleUpgradeRequest = async (planName: PlanName) => {
    try {
      await requestUpgrade.mutateAsync(planName);
      toast.success(`Upgrade request sent! An admin will review your ${planName} plan request.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send request");
    }
  };

  const handleStripeCheckout = async (planName: "pro" | "premium") => {
    setCheckoutLoading(planName);
    try {
      const url = await subscriptionService.createCheckout(planName);
      window.location.href = url;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to start checkout";
      if (message.toLowerCase().includes("stripe") && message.toLowerCase().includes("configured")) {
        await handleUpgradeRequest(planName);
        toast.info("Stripe is not configured yet. Upgrade request sent to admin.");
      } else {
        toast.error(message);
      }
      setCheckoutLoading(null);
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
  const subStatus = subLoading ? "—" : (subscription?.status ?? "none");
  const days = daysLeft(subscription?.periodEnd);
  const currentPlan = subscription?.planName ?? "starter";
  const requestedPlan = subscription?.requestedPlan ?? "";

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
              <p className="text-sm text-muted-foreground">
                Security, Google account and subscription management
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "security" | "google" | "subscription")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="security" className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Security
              </TabsTrigger>
              <TabsTrigger value="google" className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold leading-none">G</span> Google
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Plan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="space-y-5 mt-6">
              <div className="glass-surface rounded-xl p-6 accent-line-top space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-accent" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Email Address</h2>
                </div>
                <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Current Email</Label>
                    <Input
                      value={user?.email ?? ""}
                      readOnly
                      className="bg-muted/50 text-muted-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="newEmail">New Email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="new@example.com"
                        {...emailForm.register("newEmail")}
                      />
                      {emailForm.formState.errors.newEmail && (
                        <p className="text-xs text-destructive">
                          {emailForm.formState.errors.newEmail.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="emailPassword">Confirm with Password</Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        placeholder="Current password"
                        {...emailForm.register("currentPassword")}
                      />
                      {emailForm.formState.errors.currentPassword && (
                        <p className="text-xs text-destructive">
                          {emailForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button type="submit" disabled={changeEmail.isPending} size="sm">
                    {changeEmail.isPending ? "Saving…" : "Update Email"}
                  </Button>
                </form>
              </div>

              {publicConfig && (
                <div
                  className={cn(
                    "rounded-xl p-4 border",
                    publicConfig.smtpConfigured
                      ? "bg-success/10 border-success/30"
                      : "bg-warning/10 border-warning/30",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">Password reset emails</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {publicConfig.smtpConfigured
                      ? "SMTP is configured. Reset/verification emails are sent normally."
                      : "SMTP is not configured. In development, reset links are shown directly in the app."}
                  </p>
                </div>
              )}

              <div className="glass-surface rounded-xl p-6 accent-line-top space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-warning" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Password</h2>
                </div>
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
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPass">New Password</Label>
                      <Input
                        id="newPass"
                        type="password"
                        placeholder="Min. 8 characters"
                        {...passwordForm.register("newPassword")}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-xs text-destructive">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPass">Confirm Password</Label>
                      <Input
                        id="confirmPass"
                        type="password"
                        placeholder="Repeat new password"
                        {...passwordForm.register("confirmPassword")}
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-destructive">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button type="submit" disabled={changePassword.isPending} size="sm">
                    {changePassword.isPending ? "Saving…" : "Update Password"}
                  </Button>
                </form>
              </div>

              <div className="glass-surface rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Export My Data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Download all your activities, profile and account data as JSON (GDPR).
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={exporting}
                  onClick={handleExportData}
                >
                  {exporting ? "Exporting…" : "Export"}
                </Button>
              </div>

              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Danger Zone</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Permanently delete your account and all associated data. Cannot be undone.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setDeleteOpen(true)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="google" className="mt-6">
              <div className="glass-surface rounded-xl overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500/10 via-red-500/5 to-yellow-500/5 p-8 text-center border-b border-border">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
                      <GoogleLogo size={32} />
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Google Account</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Link your Google account for fast, secure sign-in
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { icon: Zap, title: "One-click login", desc: "Sign in instantly with Google" },
                      {
                        icon: ShieldCheck,
                        title: "Secure",
                        desc: "Google's security protects your account",
                      },
                      { icon: Lock, title: "No password needed", desc: "Use Google as your key" },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div
                        key={title}
                        className="rounded-lg bg-muted/40 p-3 text-center space-y-1"
                      >
                        <div className="flex justify-center">
                          <Icon className="h-5 w-5 text-accent" />
                        </div>
                        <p className="text-xs font-medium text-foreground">{title}</p>
                        <p className="text-[11px] text-muted-foreground">{desc}</p>
                      </div>
                    ))}
                  </div>

                  {googleUnavailable ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Not available</p>
                        <p className="text-xs text-muted-foreground">
                          Google Sign-In is not configured on this server. Contact your
                          administrator.
                        </p>
                      </div>
                    </div>
                  ) : publicConfig && !publicConfig.googleConfigured ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Google OAuth not configured</p>
                        <p className="text-xs text-muted-foreground">
                          Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in backend environment.
                        </p>
                      </div>
                    </div>
                  ) : user?.googleEmail ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                        <div className="h-10 w-10 rounded-full bg-white shadow flex items-center justify-center shrink-0">
                          <GoogleLogo size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-success flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" /> Connected
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.googleEmail}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={unlinkGoogle.isPending}
                        onClick={handleGoogleUnlink}
                      >
                        {unlinkGoogle.isPending ? "Disconnecting…" : "Disconnect Google Account"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                        <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">No Google account linked</p>
                      </div>
                      <Button
                        onClick={handleGoogleLink}
                        disabled={!!publicConfig && !publicConfig.googleConfigured}
                        className="flex items-center gap-2.5 bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 shadow-sm"
                      >
                        <GoogleLogo size={18} />
                        {publicConfig && !publicConfig.googleConfigured ? "Google not configured" : "Continue with Google"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="mt-6 space-y-5">
              {publicConfig && !publicConfig.stripeConfigured && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
                  <p className="text-sm font-semibold text-foreground">Stripe not configured</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Payments are unavailable. Upgrade buttons will send an admin request instead.
                  </p>
                </div>
              )}

              <div className="glass-surface rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      subStatus === "active"
                        ? "bg-success/10"
                        : subStatus === "trial"
                          ? "bg-accent/10"
                          : "bg-muted",
                    )}
                  >
                    {subStatus === "active" ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : subStatus === "trial" ? (
                      <Clock className="h-5 w-5 text-accent" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {subLoading ? "Loading…" : `${currentPlan} plan`}
                    </p>
                    {days !== null && !subLoading && (
                      <p className="text-xs text-muted-foreground">
                        {days} day{days !== 1 ? "s" : ""} remaining
                      </p>
                    )}
                    {subscription?.periodEnd && (
                      <p className="text-xs text-muted-foreground">
                        Renews {new Date(subscription.periodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={subStatus} />
              </div>

              {subStatus === "trial" && days !== null && days <= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30"
                >
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Trial ending in {days} day{days !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upgrade to Pro to keep full access to all features.
                    </p>
                  </div>
                </motion.div>
              )}

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Choose your plan</p>
                <div className="grid grid-cols-1 gap-3">
                  {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrent = currentPlan === plan.id;
                    const isPending = requestedPlan === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className={cn(
                          "rounded-xl border-2 p-4 transition-all",
                          isCurrent
                            ? cn("border-accent/50 bg-accent/5", plan.highlight && "shadow-md")
                            : isPending
                            ? "border-warning/40 bg-warning/5"
                            : "border-border bg-card/50 hover:border-border/80",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-9 w-9 rounded-lg flex items-center justify-center",
                                plan.id === "pro"
                                  ? "bg-accent/10"
                                  : plan.id === "premium"
                                    ? "bg-warning/10"
                                    : "bg-muted",
                              )}
                            >
                              <Icon className={cn("h-5 w-5", plan.color)} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-foreground">{plan.name}</p>
                                {isCurrent && (
                                  <Badge className="text-[10px] bg-accent/10 text-accent border-accent/20 px-1.5 py-0 h-4">
                                    Current
                                  </Badge>
                                )}
                                {isPending && (
                                  <Badge className="text-[10px] bg-warning/10 text-warning border-warning/20 px-1.5 py-0 h-4">
                                    Requested
                                  </Badge>
                                )}
                                {plan.highlight && !isCurrent && !isPending && (
                                  <Badge className="text-[10px] bg-success/10 text-success border-success/20 px-1.5 py-0 h-4">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                <span className="font-bold text-foreground text-sm">
                                  {plan.price}
                                </span>{" "}
                                {plan.priceDetail}
                              </p>
                            </div>
                          </div>

                          {!isCurrent && plan.id !== "starter" && (
                            <Button
                              size="sm"
                              variant={plan.highlight ? "default" : "outline"}
                              disabled={checkoutLoading === plan.id}
                              className={cn(
                                "shrink-0 text-xs",
                                plan.highlight && "bg-accent text-accent-foreground hover:bg-accent/90",
                              )}
                              onClick={() =>
                                publicConfig && !publicConfig.stripeConfigured
                                  ? handleUpgradeRequest(plan.id as PlanName)
                                  : handleStripeCheckout(plan.id as "pro" | "premium")
                              }
                            >
                              {checkoutLoading === plan.id ? (
                                "Redirecting…"
                              ) : (
                                <>
                                  {publicConfig && !publicConfig.stripeConfigured ? null : (
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                  )}
                                  {publicConfig && !publicConfig.stripeConfigured ? "Request upgrade" : "Upgrade"}
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                          {plan.features.map((f) => (
                            <p key={f} className="text-xs text-foreground flex items-center gap-1.5">
                              <Check className="h-3 w-3 text-success shrink-0" />
                              {f}
                            </p>
                          ))}
                          {plan.missing.map((f) => (
                            <p
                              key={f}
                              className="text-xs text-muted-foreground/50 flex items-center gap-1.5 line-through"
                            >
                              <XCircle className="h-3 w-3 shrink-0" />
                              {f}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center pb-2">
                To change your plan, contact your administrator or{" "}
                <button
                  className="underline hover:text-foreground"
                  onClick={() => toast.info("Email support@gpxtrackpro.com to manage your subscription.")}
                >
                  contact support
                </button>
                .
              </p>
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
