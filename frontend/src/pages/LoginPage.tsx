import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTransition } from "@/components/PageTransition";
import { PublicLayout } from "@/components/PublicLayout";
import { Eye, EyeOff, AlertCircle, Clock, XCircle, ArrowRight, Shield, Zap, BarChart3, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, LoginFormData } from "@/lib/schemas";
import { motion } from "framer-motion";
import { ApiError, apiFetch } from "@/services/api";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setEmailNotVerified(false);
    try {
      await login({ email: data.email, password: data.password });
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code === "EMAIL_NOT_VERIFIED") {
        setEmailNotVerified(true);
        setResendEmail(data.email);
      } else {
        setServerError(e instanceof Error ? e.message : "Login failed");
      }
    }
  };

  const handleResend = async () => {
    try {
      await apiFetch<{ message: string }>("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: resendEmail }),
      });
      setResendSent(true);
    } catch (_err) {
      setServerError("Unable to resend verification email");
    }
  };

  if (user && user.status === "approved") {
    const dest = user.role === "admin" ? "/admin" : "/dashboard";
    navigate(dest, { replace: true });
  }

  const inputClass = "mt-1.5 h-11 bg-muted border-border rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <PageTransition>
      <PublicLayout showFooter={false}>
        <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
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
                <div className="flex items-center justify-center mb-6 lg:hidden">
                  <img src="/logo-gpx-trackpro.png" alt="GPX TrackPro" className="h-12 w-12 rounded-xl object-cover" />
                </div>

                <h1 className="text-2xl font-bold mb-1 text-foreground">Welcome Back</h1>
                <p className="text-sm text-muted-foreground mb-6">Sign in to your GPX TrackPro account.</p>

                {emailNotVerified && (
                  <div className="rounded-lg p-4 mb-4 bg-blue-500/10 border border-blue-500/20 text-sm">
                    <div className="flex items-start gap-2 mb-3">
                      <Mail className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Email not verified</p>
                        <p className="text-muted-foreground mt-0.5">
                          Please check your inbox and click the verification link before logging in.
                        </p>
                      </div>
                    </div>
                    {resendSent ? (
                      <p className="text-green-500 text-xs font-medium">✓ Verification email resent!</p>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleResend}>
                        Resend verification email
                      </Button>
                    )}
                  </div>
                )}
                {serverError && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-foreground text-sm font-medium">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className={inputClass}
                      {...register("email")}
                    />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-foreground text-sm font-medium">Password <span className="text-destructive">*</span></Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pr-10 ${inputClass}`}
                        {...register("password")}
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
                    {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                    {isSubmitting ? "Signing in..." : "Sign In"} {!isSubmitting && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </form>

                <p className="text-sm text-muted-foreground mt-4 text-center">
                  <Link to="/forgot-password" className="text-accent font-medium hover:underline">Forgot your password?</Link>
                </p>

                <p className="text-sm text-muted-foreground mt-4 text-center">
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
