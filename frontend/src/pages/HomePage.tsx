import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/PublicLayout";
import { PageTransition } from "@/components/PageTransition";
import { Upload, BarChart3, Map, Archive, Download, Shield, ArrowRight, CheckCircle2, Zap, Star } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { delay, duration: 0.5 },
});

const features = [
  { icon: Upload, title: "GPX Upload", desc: "Drag & drop your GPX files for instant analysis" },
  { icon: BarChart3, title: "Analytics", desc: "Deep metrics: speed, pace, elevation, heart rate" },
  { icon: Map, title: "Map Visualization", desc: "See your routes rendered on interactive maps" },
  { icon: Archive, title: "Activity Archive", desc: "Searchable archive with filters and sorting" },
  { icon: Download, title: "Export Data", desc: "Export to JSON, CSV, or PDF formats" },
  { icon: Shield, title: "Privacy First", desc: "Your data stays yours, always" },
];

const steps = [
  { step: "01", title: "Upload", desc: "Drop your GPX file from any device or app" },
  { step: "02", title: "Analyze", desc: "Get instant metrics, charts, and map views" },
  { step: "03", title: "Track", desc: "Build your archive and monitor progress" },
];

const trustedBy = [
  "Real-time GPX parsing",
  "Multi-sport support",
  "Elevation analysis",
  "Heart rate zones",
  "Export anywhere",
  "Zero data selling",
];

const testimonials = [
  {
    name: "Sophie M.",
    role: "Trail Runner",
    avatar: "SM",
    text: "GPX TrackPro transformed how I analyze my mountain runs. The elevation charts are incredibly detailed.",
  },
  {
    name: "Marc D.",
    role: "Cyclist",
    avatar: "MD",
    text: "Finally a platform that respects my data. Clean interface, powerful analytics — everything I need.",
  },
  {
    name: "Léa F.",
    role: "Triathlete",
    avatar: "LF",
    text: "I love the multi-sport archive. Being able to compare my swim, bike and run stats in one place is invaluable.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for getting started",
    features: [
      "Up to 50 activity uploads",
      "Basic GPX analytics",
      "Interactive maps",
      "JSON/CSV export",
      "7-day trial included",
    ],
    cta: "Get Started Free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "€9.99",
    period: "/month",
    description: "For dedicated athletes",
    features: [
      "Unlimited activity uploads",
      "Advanced performance analytics",
      "Heart rate zone analysis",
      "PDF reports",
      "Community access",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "€19.99",
    period: "/month",
    description: "For elite performance",
    features: [
      "Everything in Pro",
      "Custom training plans",
      "Coach sharing",
      "Advanced stats dashboard",
      "API access",
      "Dedicated support",
    ],
    cta: "Start Premium",
    href: "/register",
    highlighted: false,
  },
];

/* ---------- Animated track paths ---------- */
const trackPaths = [
  "M-20,280 C80,260 140,120 260,140 C380,160 340,300 460,260 C580,220 560,80 680,100 C800,120 780,280 900,240 C1020,200 1000,60 1120,100 C1240,140 1200,300 1340,260 C1460,220 1500,140 1600,160",
  "M-40,400 C60,370 160,240 280,280 C400,320 380,460 520,420 C660,380 620,220 760,260 C900,300 880,440 1020,400 C1160,360 1120,200 1280,240 C1400,280 1440,420 1560,380 L1640,360",
  "M-10,140 C100,110 180,220 300,180 C420,140 440,60 560,100 C680,140 660,260 800,220 C940,180 920,80 1060,120 C1200,160 1180,280 1340,240 C1460,200 1520,100 1640,130",
];

function HeroTrackAnimation() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice" fill="none">
        {trackPaths.map((d, i) => (
          <g key={i}>
            <path d={d} stroke={`hsl(var(--accent) / ${0.08 + i * 0.02})`} strokeWidth={2 - i * 0.3} strokeLinecap="round" fill="none" />
            <path d={d} stroke={`hsl(var(--accent) / ${0.25 + i * 0.05})`} strokeWidth={2.5 - i * 0.3} strokeLinecap="round" strokeDasharray="60 1600" fill="none">
              <animate attributeName="stroke-dashoffset" values={`${1660};${-60}`} dur={`${8 + i * 3}s`} begin={`${i * 2}s`} repeatCount="indefinite" />
            </path>
            <circle r={3.5 - i * 0.5} fill={`hsl(var(--accent) / ${0.6 + i * 0.1})`}>
              <animateMotion dur={`${8 + i * 3}s`} begin={`${i * 2}s`} repeatCount="indefinite" path={d} />
            </circle>
            <circle r={8 - i} fill={`hsl(var(--accent) / ${0.12 + i * 0.02})`}>
              <animateMotion dur={`${8 + i * 3}s`} begin={`${i * 2}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        ))}
        {[{ cx: 260, cy: 140 }, { cx: 680, cy: 100 }, { cx: 1120, cy: 100 }].map((pt, i) => (
          <g key={`wp-${i}`}>
            <circle cx={pt.cx} cy={pt.cy} r="12" fill="hsl(var(--accent) / 0.06)" stroke="hsl(var(--accent) / 0.12)" strokeWidth="1">
              <animate attributeName="r" values="10;14;10" dur="4s" begin={`${i * 1.2}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="4s" begin={`${i * 1.2}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={pt.cx} cy={pt.cy} r="3" fill="hsl(var(--accent) / 0.25)" />
          </g>
        ))}
        {Array.from({ length: 12 }).map((_, i) =>
          Array.from({ length: 6 }).map((_, j) => (
            <circle key={`g-${i}-${j}`} cx={120 * i + 60} cy={100 * j + 30} r="1" fill="hsl(var(--accent) / 0.05)" />
          ))
        )}
      </svg>
    </div>
  );
}

interface PublicStats {
  users: number;
  activities: number;
  totalKm: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`;
  return String(n);
}

export default function HomePage() {
  const { data: stats } = useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats/public");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  const liveStats = [
    { value: stats ? formatNumber(stats.users) : "...", label: "Athletes" },
    { value: stats ? formatNumber(stats.activities) : "...", label: "Activities" },
    { value: stats ? `${formatNumber(Math.round(stats.totalKm))} km` : "...", label: "Km Tracked" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <PageTransition>
      <PublicLayout>
        {/* Hero - Dark */}
        <section className="relative overflow-hidden min-h-[85vh] flex items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
          </div>
          <HeroTrackAnimation />

          <div className="container relative py-24 md:py-36 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <motion.p
                className="text-accent text-sm font-semibold tracking-widest uppercase mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                GPX Activity Tracker
              </motion.p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
                Track Every <span className="text-gradient-accent">Mile</span>,<br />
                Own Every <span className="text-gradient-accent">Metric</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Upload GPX files, analyze performance metrics, visualize routes, and build your personal activity archive all in one premium dashboard.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent h-12 px-8 w-full sm:w-auto" asChild>
                  <Link to="/register">Get Started Free <ArrowRight className="h-4 w-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Real Stats counter bar */}
        <section className="bg-card border-b border-border">
          <div className="container py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {liveStats.map((s, i) => (
                <motion.div key={s.label} {...fadeUp(i * 0.1)} className="text-center">
                  <p className="text-2xl md:text-3xl font-extrabold font-mono-data text-gradient-accent">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-card">
          <div className="container py-20 md:py-28">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Features</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">Everything You Need</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Powerful tools to analyze, visualize, and track your training data.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  {...fadeUp(i * 0.08)}
                  className="rounded-xl p-6 bg-muted border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="stat-icon-bg bg-accent/10 mb-4">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-background">
          <div className="container py-20 md:py-28">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Process</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">How It Works</h2>
              <p className="text-muted-foreground">Three simple steps to get started.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
              <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
              {steps.map((s, i) => (
                <motion.div key={s.step} {...fadeUp(i * 0.15)} className="text-center relative">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
                    <span className="text-xl font-extrabold text-accent font-mono-data">{s.step}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-card" id="pricing">
          <div className="container py-20 md:py-28">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Pricing</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">Simple, Transparent Pricing</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Start free, upgrade when you're ready. No hidden fees.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingPlans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  {...fadeUp(i * 0.1)}
                  className={`rounded-2xl p-7 border flex flex-col ${plan.highlighted
                    ? "bg-accent/5 border-accent/40 shadow-xl shadow-accent/10 relative"
                    : "bg-muted border-border"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={plan.highlighted
                      ? "w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      : "w-full"
                    }
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link to={plan.href}>{plan.cta} <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-background">
          <div className="container py-20 md:py-28">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Testimonials</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">Athletes Love GPX TrackPro</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  {...fadeUp(i * 0.1)}
                  className="rounded-xl p-6 bg-card border border-border"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 text-accent fill-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-accent">{t.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / Highlights */}
        <section className="bg-card">
          <div className="container py-20 md:py-28">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp()}>
                <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Why GPX TrackPro</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Built for Serious Athletes</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Whether you're a cyclist, runner, or hiker, GPX TrackPro gives you the precision analytics and privacy-first approach you deserve.
                </p>
                <div className="space-y-3">
                  {trustedBy.map((item, i) => (
                    <motion.div key={item} {...fadeUp(0.1 + i * 0.06)} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <span className="text-sm text-foreground font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div {...fadeUp(0.2)}>
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
                  </div>
                  <div className="relative space-y-6">
                    {stats ? (
                      <>
                        <div>
                          <p className="text-4xl font-extrabold text-white font-mono-data">{formatNumber(stats.activities)}</p>
                          <p className="text-sm text-slate-400 mt-1">Activities analyzed</p>
                        </div>
                        <div className="h-px bg-slate-700" />
                        <div>
                          <p className="text-4xl font-extrabold text-white font-mono-data">{formatNumber(Math.round(stats.totalKm))}<span className="text-accent"> km</span></p>
                          <p className="text-sm text-slate-400 mt-1">Kilometers tracked</p>
                        </div>
                        <div className="h-px bg-slate-700" />
                        <div>
                          <p className="text-4xl font-extrabold text-white font-mono-data">{formatNumber(stats.users)}</p>
                          <p className="text-sm text-slate-400 mt-1">Athletes on the platform</p>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                          <div key={i}>
                            <div className="h-10 w-24 bg-slate-700 rounded mb-1" />
                            <div className="h-4 w-40 bg-slate-800 rounded" />
                            {i < 2 && <div className="h-px bg-slate-700 mt-4" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Banner - Dark */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="container py-20 md:py-28 text-center relative">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-1/3 w-72 h-72 bg-accent/8 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-1/3 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />
            </div>
            <motion.div {...fadeUp()} className="relative max-w-xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Ready to Track Your Performance?</h2>
              <p className="text-slate-400 mb-8">
                Join athletes already using GPX TrackPro to analyze and improve their training.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent h-12 px-8 w-full sm:w-auto" asChild>
                  <Link to="/register">Start for Free <ArrowRight className="h-4 w-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
              <p className="text-slate-500 text-xs mt-6">
                By signing up you agree to our{" "}
                <a href="/terms" className="text-slate-400 hover:text-white underline">Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" className="text-slate-400 hover:text-white underline">Privacy Policy</a>.
              </p>
            </motion.div>
          </div>
        </section>
      </PublicLayout>
    </PageTransition>
  );
}
