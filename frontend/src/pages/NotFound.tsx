import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageTransition>
      <PublicLayout showFooter={false}>
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/10 pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center px-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <p className="text-[8rem] md:text-[10rem] font-extrabold leading-none text-gradient-accent opacity-20 select-none">404</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="-mt-8 md:-mt-12">
              <h1 className="text-2xl md:text-3xl font-bold mb-3">Page Not Found</h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" asChild>
                  <Link to="/"><Home className="h-4 w-4" /> Go Home</Link>
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-4 w-4" /> Go Back
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </PublicLayout>
    </PageTransition>
  );
}
