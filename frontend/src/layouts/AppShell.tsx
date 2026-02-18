import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Upload, Archive, Shield, Menu, X, LogOut, Bell, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload GPX", icon: Upload },
  { to: "/activities", label: "Activities", icon: Archive },
];

const adminLinks = [{ to: "/admin", label: "Admin Panel", icon: Shield }];

const pageInfo: Record<string, { title: string; icon: typeof LayoutDashboard }> = {
  "/dashboard": { title: "Dashboard", icon: LayoutDashboard },
  "/upload": { title: "Upload GPX", icon: Upload },
  "/activities": { title: "Activities Archive", icon: Archive },
  "/admin": { title: "Admin Dashboard", icon: Shield },
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user?.role === "admin" ? [...adminLinks, ...userLinks] : userLinks;
  const currentPage = pageInfo[location.pathname] || (location.pathname.startsWith("/activity/") ? { title: "Activity Details", icon: BarChart3 } : null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen w-full bg-[hsl(216,30%,98.5%)]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200/60 bg-[hsl(214,45%,95%)] transition-transform duration-300 lg:sticky lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <Link to="/" className="flex items-center gap-3.5">
            <img src="/logo-gpx-trackpro.png" alt="GPX TrackPro" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-xl font-bold tracking-tight text-slate-700">GPX TrackPro</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          {user?.role === "admin" && (
            <>
              <p className="px-3 text-[10px] uppercase tracking-widest text-slate-400 mb-2">Admin</p>
              {adminLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-slate-100 text-slate-700"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-slate-400 rounded-r-full" />}
                    <link.icon className="h-[18px] w-[18px]" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="my-4 border-t border-slate-100" />
              <p className="px-3 text-[10px] uppercase tracking-widest text-slate-400 mb-2">Athlete</p>
            </>
          )}
          {userLinks.map((link) => {
            const active = location.pathname === link.to || (link.to === "/activities" && location.pathname.startsWith("/activity/"));
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-100 text-slate-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-slate-400 rounded-r-full" />}
                <link.icon className="h-[18px] w-[18px]" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-5 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-3.5 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 ring-2 ring-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">
              {user?.name?.charAt(0) ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-slate-500 border-slate-200 bg-slate-50">
                  {user?.role === "admin" ? "Admin" : "Athlete"}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-400 hover:text-slate-700 hover:bg-slate-100 h-10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 light-theme">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-100 bg-[hsl(216,30%,98.5%)]/90 backdrop-blur-lg px-4 h-14 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-700">
            <Menu className="h-5 w-5" />
          </button>
          {currentPage && (
            <div className="hidden sm:flex items-center gap-2">
              <currentPage.icon className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700">{currentPage.title}</h2>
            </div>
          )}
          <div className="flex-1" />
          <button className="text-slate-400 hover:text-slate-700 transition-colors relative">
            <Bell className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-400 font-mono-data hidden sm:inline">
            {user?.role === "admin" ? "Admin" : "Athlete"}
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
