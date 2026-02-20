import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { PublicLayout } from "@/components/PublicLayout";
import { Eye, EyeOff, AlertCircle, Clock, ArrowRight, Users, Globe, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  if (!password) return null;

  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-destructive", "bg-warning", "bg-accent", "bg-success"];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < strength ? colors[strength - 1] : "bg-border")} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels[strength - 1] || "Too short"}</p>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const pw = fd.get("password") as string;
    if (!name || !email || !pw) { setError("All fields are required."); setLoading(false); return; }
    if (pw.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }
    try {
      await register({ name, email, password: pw });
      setRegistered(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "mt-1.5 h-11 bg-muted border-border rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

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
                <p className="text-slate-400 max-w-sm mx-auto mb-10">Join thousands of athletes tracking their performance with precision.</p>
                <div className="space-y-4 max-w-xs mx-auto">
                  {[
                    { icon: Users, text: "10,000+ athletes already onboard" },
                    { icon: Globe, text: "Used in 40+ countries worldwide" },
                    { icon: TrendingUp, text: "Track progress across all sports" },
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
              {registered ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-card border border-border p-10 text-center shadow-sm"
                >
                  <div className="h-14 w-14 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-5">
                    <Clock className="h-7 w-7 text-warning" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-foreground">Registration Submitted</h2>
                  <p className="text-sm text-muted-foreground mb-6">Your account is pending admin approval. You'll be able to sign in once approved.</p>
                  <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted" asChild>
                    <Link to="/login">Go to Sign In <ArrowRight className="h-4 w-4 ml-2" /></Link>
                  </Button>
                </motion.div>
              ) : (
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

                  <h1 className="text-2xl font-bold mb-1 text-foreground">Create Account</h1>
                  <p className="text-sm text-muted-foreground mb-6">Join GPX TrackPro and start tracking your performance.</p>

                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-foreground text-sm font-medium">Full Name <span className="text-destructive">*</span></Label>
                      <Input id="name" name="name" required placeholder="John Doe" className={inputClass} />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground text-sm font-medium">Email <span className="text-destructive">*</span></Label>
                      <Input id="email" name="email" type="email" required placeholder="you@example.com" className={inputClass} />
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
                          className={`pr-10 ${inputClass}`}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                      <PasswordStrength password={password} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                      {loading ? "Creating..." : "Create Account"} {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                  </form>

                  <p className="text-sm text-muted-foreground mt-6 text-center">
                    Already have an account?{" "}
                    <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </PublicLayout>
    </PageTransition>
  );
}
