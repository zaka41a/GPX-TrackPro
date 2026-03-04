import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type Status = "loading" | "success" | "error" | "already_used" | "expired";

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message ?? "Your email has been verified!");
        } else if (data.error?.includes("already used")) {
          setStatus("already_used");
          setMessage("This verification link has already been used.");
        } else if (data.error?.includes("expired")) {
          setStatus("expired");
          setMessage("This verification link has expired. Please request a new one.");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed. Please try again.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please check your connection and try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <PageTransition>
      <PublicLayout showFooter={false}>
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
          <div className="w-full max-w-md text-center">
            {status === "loading" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-accent animate-spin" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-foreground">Verifying your email…</h1>
                <p className="text-muted-foreground text-sm">Please wait a moment.</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {message}
                    <br /><br />
                    Your account is now pending admin approval. You'll be able to log in once approved.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link to="/login">Go to Login</Link>
                </Button>
              </div>
            )}

            {(status === "already_used") && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">Already Verified</h1>
                  <p className="text-muted-foreground text-sm">{message}</p>
                </div>
                <Button asChild className="w-full">
                  <Link to="/login">Go to Login</Link>
                </Button>
              </div>
            )}

            {(status === "expired" || status === "error") && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    {status === "expired" ? (
                      <Mail className="h-8 w-8 text-destructive" />
                    ) : (
                      <XCircle className="h-8 w-8 text-destructive" />
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {status === "expired" ? "Link Expired" : "Verification Failed"}
                  </h1>
                  <p className="text-muted-foreground text-sm">{message}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button asChild variant="outline">
                    <Link to="/login">Back to Login</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PublicLayout>
    </PageTransition>
  );
}
