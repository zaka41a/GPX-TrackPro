import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { PublicLayout } from "@/components/PublicLayout";
import { Eye, EyeOff, AlertCircle, Clock, XCircle, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    if (!email || !password) { setError("All fields are required."); setLoading(false); return; }
    try {
      await login({ email, password });
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  if (user && user.status === "approved") {
    const dest = user.role === "admin" ? "/admin" : "/dashboard";
    navigate(dest, { replace: true });
  }

  const inputClass = "mt-1.5 h-11 bg-muted border-border rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20";
  const inputErrorClass = error ? "border-destructive/50 focus:border-destructive focus:ring-destructive/20" : "";

  return (
    <PageTransition>
      <PublicLayout showFooter={false}>
        <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
          {/* Brand panel - desktop only */}
          <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
            </div>
            <div className="relative text-center px-12">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <img src="/logo-gpx-trackpro.png" alt="GPX TrackPro" className="h-20 w-20 rounded-2xl object-cover mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-3 text-white">GPX TrackPro</h2>
                <p className="text-slate-400 max-w-sm mx-auto mb-10">Track every mile, own every metric. Your premium GPX activity dashboard.</p>
                <div className="space-y-4 max-w-xs mx-auto">
                  {[
                    { icon: BarChart3, text: "Advanced performance analytics" },
                    { icon: Shield, text: "Privacy-first data ownership" },
                    { icon: Zap, text: "Instant GPX parsing & analysis" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                      className="flex items-center gap-3"
                    >
                      <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-sm text-slate-300 font-medium text-left">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Form panel */}
          <div className="flex-1 flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-md">
              {statusParam === "pending" && (
                <div className="rounded-xl p-5 mb-6 flex items-start gap-3 bg-warning/10 border border-warning/20">
                  <Clock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Account Pending Approval</h3>
                    <p className="text-sm text-muted-foreground mt-1">Your account is awaiting admin review. Please check back later.</p>
                  </div>
                </div>
              )}
              {statusParam === "rejected" && (
                <div className="rounded-xl p-5 mb-6 flex items-start gap-3 bg-destructive/10 border border-destructive/20">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Account Rejected</h3>
                    <p className="text-sm text-muted-foreground mt-1">Your account application has been rejected. Contact support for assistance.</p>
                  </div>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-card border border-border p-8 shadow-sm"
              >
                {/* Mobile logo */}
                <div className="flex items-center justify-center mb-6 lg:hidden">
                  <img src="/logo-gpx-trackpro.png" alt="GPX TrackPro" className="h-12 w-12 rounded-xl object-cover" />
                </div>

                <h1 className="text-2xl font-bold mb-1 text-foreground">Welcome Back</h1>
                <p className="text-sm text-muted-foreground mb-6">Sign in to your GPX TrackPro account.</p>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-foreground text-sm font-medium">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className={`${inputClass} ${inputErrorClass}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-foreground text-sm font-medium">Password <span className="text-destructive">*</span></Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="password"
                        name="password"
                        type={showPw ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className={`pr-10 ${inputClass} ${inputErrorClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                    {loading ? "Signing in..." : "Sign In"} {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </form>

                <p className="text-sm text-muted-foreground mt-6 text-center">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-accent font-medium hover:underline">Create one</Link>
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </PublicLayout>
    </PageTransition>
  );
}
