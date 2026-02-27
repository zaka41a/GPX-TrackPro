import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useMessaging";
import { useNotificationUnreadCount, useNotifications, useMarkNotificationsRead, useClearNotifications } from "@/hooks/useNotifications";
import { useMySubscription } from "@/hooks/useSubscription";
import { LayoutDashboard, Upload, Archive, Shield, Menu, X, LogOut, Bell, BarChart3, UserCircle, TrendingUp, Users, MessageCircle, Settings, CreditCard, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload GPX", icon: Upload },
  { to: "/activities", label: "Activities", icon: Archive },
  { to: "/activity-details", label: "Activity Details", icon: BarChart3 },
  { to: "/statistics", label: "Statistics", icon: TrendingUp },
  { to: "/community", label: "Community", icon: Users },
  { to: "/messages", label: "Messages", icon: MessageCircle },
];

const userOnlyLinks = [
  { to: "/profile", label: "Profile", icon: UserCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { to: "/admin", label: "Admin Panel", icon: Shield },
  { to: "/admin/users", label: "User Management", icon: UserCircle },
  { to: "/admin/community-mod", label: "Community Mod.", icon: MessageSquare },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/community", label: "Community", icon: Users },
  { to: "/messages", label: "Messages", icon: MessageCircle },
];

const pageInfo: Record<string, { title: string; icon: typeof LayoutDashboard }> = {
  "/dashboard": { title: "Dashboard", icon: LayoutDashboard },
  "/upload": { title: "Upload GPX", icon: Upload },
  "/activities": { title: "Activities Archive", icon: Archive },
  "/admin": { title: "Admin Dashboard", icon: Shield },
  "/statistics": { title: "Statistics", icon: TrendingUp },
  "/profile": { title: "Profile", icon: UserCircle },
  "/community": { title: "Community", icon: Users },
  "/messages": { title: "Messages", icon: MessageCircle },
  "/settings": { title: "Settings", icon: Settings },
  "/admin/users": { title: "User Management", icon: UserCircle },
  "/admin/community-mod": { title: "Community Moderation", icon: MessageSquare },
  "/admin/subscriptions": { title: "Subscriptions", icon: CreditCard },
};

function SubscriptionRequiredOverlay({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 text-center px-4">
      <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center">
        <CreditCard className="h-8 w-8 text-warning" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Subscription Required</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your subscription has expired or is inactive. Please contact an administrator to renew your access.
        </p>
        <p className="text-xs text-muted-foreground">19€ / month</p>
      </div>
      <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifCount = 0 } = useNotificationUnreadCount();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const clearAll = useClearNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: subscription } = useMySubscription();

  // Block access when subscription is confirmed inactive.
  // null = endpoint not available (old backend) → don't block
  // undefined = still loading → don't block
  // {isActive:false} = definitive inactive subscription → block (except on /settings)
  const settingsPath = location.pathname === "/settings";
  const isBlocked =
    user?.role !== "admin" &&
    subscription !== undefined &&
    subscription !== null &&
    !subscription.isActive &&
    !settingsPath;

  const currentPage = pageInfo[location.pathname] || (location.pathname.startsWith("/activity/") ? { title: "Activity Details", icon: BarChart3 } : null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:sticky lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <Link to={user?.role === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-3.5">
            <img src="/logo-gpx-trackpro.png" alt="GPX TrackPro" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-xl font-bold tracking-tight text-foreground">GPX TrackPro</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          {user?.role === "admin" ? (
            <>
              {adminLinks.map((link) => {
                const active = link.to === "/community"
                  ? location.pathname.startsWith("/community")
                  : location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full" />}
                    <link.icon className="h-[18px] w-[18px]" />
                    {link.label}
                    {link.to === "/messages" && unreadCount > 0 && (
                      <Badge className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px] bg-accent text-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              {userLinks.map((link) => {
                const active = link.to === "/activity-details"
                  ? location.pathname.startsWith("/activity/") || location.pathname === "/activity-details"
                  : link.to === "/community"
                  ? location.pathname.startsWith("/community")
                  : location.pathname === link.to;
                const href = link.to === "/activity-details" && location.pathname.startsWith("/activity/")
                  ? location.pathname
                  : link.to === "/activity-details"
                  ? "/activities"
                  : link.to;
                return (
                  <Link
                    key={link.to}
                    to={href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full" />}
                    <link.icon className="h-[18px] w-[18px]" />
                    {link.label}
                    {link.to === "/messages" && unreadCount > 0 && (
                      <Badge className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px] bg-accent text-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </>
          )}
          {user?.role !== "admin" && userOnlyLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full" />}
                <link.icon className="h-[18px] w-[18px]" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-5 border-t border-border mt-auto">
          <div className="flex items-center gap-3.5 mb-4 px-2">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent/70 ring-2 ring-border flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  user?.name?.charAt(0) ?? "U"
                )}
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border-2 border-sidebar" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className={cn(
                "text-[10px] px-1.5 py-0 h-4 mb-1",
                user?.role === "admin"
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-success/10 text-success border-success/20"
              )}>
                {user?.role === "admin" ? "Admin" : "Athlete"}
              </Badge>
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/90 backdrop-blur-lg px-4 h-14 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {currentPage && (
            <div className="hidden sm:flex items-center gap-2">
              <currentPage.icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{currentPage.title}</h2>
            </div>
          )}
          <div className="flex-1" />
          <div className="relative">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors relative p-1 rounded-md hover:bg-muted"
              aria-label="Notifications"
              onClick={() => {
                const opening = !notifOpen;
                setNotifOpen(opening);
                if (opening && notifCount > 0) markRead.mutate();
              }}
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-accent text-[9px] text-white flex items-center justify-center font-bold leading-none">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-8 z-50 w-80 rounded-xl bg-card border border-border shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {notifications.length > 0 && (
                      <div className="flex items-center gap-3">
                        {notifCount > 0 && (
                          <button
                            onClick={() => markRead.mutate()}
                            className="text-xs text-accent hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => clearAll.mutate()}
                          className="text-xs text-muted-foreground hover:text-destructive hover:underline"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={cn("px-4 py-3 text-sm", n.readAt ? "opacity-60" : "bg-accent/5")}>
                        <p className="font-medium text-foreground">{n.title}</p>
                        {n.body && <p className="text-muted-foreground text-xs mt-0.5">{n.body}</p>}
                        <p className="text-muted-foreground text-xs mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <ThemeToggle />
          <span className="text-xs text-muted-foreground font-mono-data hidden sm:inline">
            {user?.role === "admin" ? "Admin" : "Athlete"}
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {isBlocked ? (
            <SubscriptionRequiredOverlay onLogout={handleLogout} />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
