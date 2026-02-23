import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Shield, Rocket, Target, Users, Zap, Globe,
  BarChart3, Map, Upload, Lock, ArrowRight, Heart, TrendingUp, Award,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.5 },
});

const values = [
  { icon: Lock, title: "Privacy First", desc: "Your data stays yours. We never sell, share, or monetize your personal training information." },
  { icon: Zap, title: "Blazing Fast", desc: "Instant GPX parsing and analysis. Get your metrics in milliseconds, not minutes." },
  { icon: Target, title: "Precision Metrics", desc: "Accurate calculations for distance, elevation, pace, speed, and heart rate zones." },
  { icon: Heart, title: "Built for Athletes", desc: "Designed by athletes, for athletes. Every feature serves your training goals." },
];

const capabilities = [
  { icon: Upload, title: "GPX Upload", desc: "Drag & drop any GPX file for instant parsing and analysis" },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Distance, duration, pace, speed, elevation gain, and heart rate metrics" },
  { icon: Map, title: "Route Visualization", desc: "Interactive maps rendering your exact route with elevation profiles" },
  { icon: Globe, title: "Activity Archive", desc: "Searchable, filterable archive of all your training sessions" },
  { icon: TrendingUp, title: "Progress Tracking", desc: "Monitor trends across your activities over time" },
  { icon: Shield, title: "Secure & Private", desc: "Full data ownership, export or delete anytime" },
];

const roadmap = [
  { phase: "Phase 1", title: "Core Platform", desc: "GPX upload, parsing, metrics dashboard, activity archive", status: "complete" as const },
  { phase: "Phase 2", title: "Live Map Rendering", desc: "Interactive route maps with elevation overlay and split markers", status: "progress" as const },
  { phase: "Phase 3", title: "Social Features", desc: "Share routes, compare with friends, community leaderboards", status: "planned" as const },
  { phase: "Phase 4", title: "AI Coaching", desc: "Personalized training suggestions based on your activity patterns", status: "planned" as const },
];

const stats = [
  { value: "10K+", label: "Athletes" },
  { value: "50K+", label: "Activities Analyzed" },
  { value: "1M+", label: "Kilometers Tracked" },
  { value: "99.9%", label: "Uptime" },
];

export default function AboutPage() {
  return (
    <PageTransition>
      <PublicLayout>
        {/* Hero - Dark */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
          </div>
          <div className="container relative py-20 md:py-32 text-center">
            <motion.div {...fadeUp()}>
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">About Us</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
                Built for Athletes Who<br />
                <span className="text-gradient-accent">Own Their Data</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                GPX TrackPro is a premium analytics platform that empowers athletes to upload, analyze, and visualize their training data with complete privacy and precision.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-card border-b border-border">
          <div className="container py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((s, i) => (
                <motion.div key={s.label} {...fadeUp(i * 0.1)} className="text-center">
                  <p className="text-3xl md:text-4xl font-extrabold font-mono-data text-gradient-accent">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="bg-card">
          <div className="container py-20 md:py-28">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Our Values</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">What Drives Us</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">The principles behind every feature we build and every decision we make.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  {...fadeUp(i * 0.1)}
                  className="flex gap-4 p-6 rounded-xl bg-muted border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="stat-icon-bg bg-accent/10 shrink-0">
                    <v.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Capabilities */}
        <section className="bg-background">
          <div className="container py-20 md:py-28">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Platform</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">What GPX TrackPro Does</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">A complete toolkit for tracking, analyzing, and owning your athletic performance data.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {capabilities.map((c, i) => (
                <motion.div
                  key={c.title}
                  {...fadeUp(i * 0.08)}
                  className="p-6 rounded-xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="stat-icon-bg bg-accent/10 mb-4">
                    <c.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-card">
          <div className="container py-20 md:py-28">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp()}>
                <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Our Mission</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Empowering Athletes Through Data</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We believe every athlete deserves access to powerful, accurate performance insights without compromising their privacy.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  GPX TrackPro was born from the frustration of fragmented tools and platforms that lock away your own data. We built a solution that puts you in complete control.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Open Standards", "Full Ownership", "Zero Ads", "Export Anytime"].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
              <motion.div {...fadeUp(0.2)}>
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
                  </div>
                  <div className="relative space-y-5">
                    {[
                      { icon: Rocket, text: "Launch in 2024" },
                      { icon: Users, text: "10,000+ athletes trusted" },
                      { icon: Award, text: "Privacy-first architecture" },
                      { icon: Globe, text: "Used in 40+ countries" },
                    ].map((item, i) => (
                      <motion.div key={item.text} {...fadeUp(0.3 + i * 0.1)} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                          <item.icon className="h-4 w-4 text-accent" />
                        </div>
                        <span className="text-sm text-slate-300 font-medium">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="bg-background">
          <div className="container py-20 md:py-28">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Roadmap</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Where We're Headed</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Our vision for the future of GPX TrackPro.</p>
            </motion.div>
            <div className="max-w-2xl mx-auto space-y-4 relative">
              <div className="absolute left-[23px] top-8 bottom-8 w-px bg-border" />
              {roadmap.map((r, i) => (
                <motion.div
                  key={r.phase}
                  {...fadeUp(i * 0.12)}
                  className="relative pl-14"
                >
                  <div className={`absolute left-3.5 top-6 h-4 w-4 rounded-full border-[3px] ${
                    r.status === "complete"
                      ? "bg-success border-success/30"
                      : r.status === "progress"
                      ? "bg-warning border-warning/30"
                      : "bg-muted-foreground/30 border-border"
                  }`} />
                  <div className="p-5 rounded-xl bg-muted border border-border hover:border-accent/30 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-accent font-mono-data tracking-wider">{r.phase}</span>
                        <h3 className="font-semibold text-foreground">{r.title}</h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        r.status === "complete"
                          ? "bg-success/10 text-success"
                          : r.status === "progress"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {r.status === "complete" ? "Complete" : r.status === "progress" ? "In Progress" : "Planned"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - Dark */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="container py-20 md:py-28 text-center relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-1/3 w-72 h-72 bg-accent/8 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-1/3 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />
            </div>
            <motion.div {...fadeUp()} className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Own Your Training Data?</h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Join thousands of athletes already using GPX TrackPro to track, analyze, and improve their performance.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent h-12 px-8" asChild>
                  <Link to="/register">Get Started Free <ArrowRight className="h-4 w-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </PublicLayout>
    </PageTransition>
  );
}
