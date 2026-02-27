import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageTransition } from "@/components/PageTransition";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/services/api";
import { motion } from "framer-motion";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: data.email }),
      });
      setSent(true);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Request failed");
    }
  };

  const inputClass = "mt-1.5 h-11 bg-muted border-border rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

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
              {sent ? (
                <div className="text-center">
                  <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="h-7 w-7 text-success" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2 text-foreground">Check your email</h1>
                  <p className="text-sm text-muted-foreground mb-6">
                    If an account with that email exists, you will receive a password reset link shortly.
                  </p>
                  <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted" asChild>
                    <Link to="/login"><ArrowLeft className="h-4 w-4 mr-2" />Back to Sign In</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-1 text-foreground">Forgot Password</h1>
                  <p className="text-sm text-muted-foreground mb-6">
                    Enter your email and we'll send you a reset link.
                  </p>

                  {serverError && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-foreground text-sm font-medium">Email <span className="text-destructive">*</span></Label>
                      <Input id="email" type="email" placeholder="you@example.com" className={inputClass} {...register("email")} />
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                      {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </form>

                  <p className="text-sm text-muted-foreground mt-6 text-center">
                    <Link to="/login" className="text-accent font-medium hover:underline inline-flex items-center gap-1">
                      <ArrowLeft className="h-3.5 w-3.5" />Back to Sign In
                    </Link>
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </PublicLayout>
    </PageTransition>
  );
}
