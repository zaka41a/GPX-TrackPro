import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageTransition } from "@/components/PageTransition";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setServerError("Invalid reset link. Please request a new one.");
      return;
    }
    setServerError(null);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: data.password }),
      });
      toast.success("Password updated successfully. Please sign in.");
      navigate("/login");
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Reset failed");
    }
  };

  const inputClass = "mt-1.5 h-11 bg-muted border-border rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

  if (!token) {
    return (
      <PageTransition>
        <PublicLayout showFooter={false}>
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
            <div className="text-center">
              <p className="text-destructive mb-4">Invalid or missing reset token.</p>
              <Button asChild variant="outline"><Link to="/forgot-password">Request a new link</Link></Button>
            </div>
          </div>
        </PublicLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PublicLayout showFooter={false}>
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-6 bg-background">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-card border border-border p-8 shadow-sm"
            >
              <h1 className="text-2xl font-bold mb-1 text-foreground">Set New Password</h1>
              <p className="text-sm text-muted-foreground mb-6">Enter your new password below.</p>

              {serverError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-foreground text-sm font-medium">New Password <span className="text-destructive">*</span></Label>
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
                <div>
                  <Label htmlFor="confirm" className="text-foreground text-sm font-medium">Confirm Password <span className="text-destructive">*</span></Label>
                  <Input id="confirm" type="password" placeholder="••••••••" className={inputClass} {...register("confirm")} />
                  {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                  {isSubmitting ? "Updating..." : "Update Password"} {!isSubmitting && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </PublicLayout>
    </PageTransition>
  );
}
