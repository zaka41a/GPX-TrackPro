import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { PublicLayout } from "@/components/PublicLayout";
import {
  Send, CheckCircle, AlertCircle, Mail, Clock3, ShieldCheck,
  MapPin, MessageSquare, Headphones, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.5 },
});

const contactCards = [
  { icon: Mail, title: "Email Us", desc: "support@gpxtrackpro.com", sub: "For general inquiries and support" },
  { icon: Headphones, title: "Technical Support", desc: "help@gpxtrackpro.com", sub: "For bugs, issues, and technical questions" },
  { icon: MapPin, title: "Location", desc: "Remote-first Team", sub: "Operating globally, building locally" },
];

const faqItems = [
  { q: "How long does it take to get a response?", a: "We typically respond within 24-48 hours during business days." },
  { q: "Can I request a new feature?", a: "Absolutely! Use the contact form and select 'Feature Request' as the subject. We review every suggestion." },
  { q: "Is my data safe when I contact you?", a: "Yes. All communications are encrypted and we never share your personal information with third parties." },
  { q: "Do you offer enterprise plans?", a: "We're working on enterprise features. Reach out to discuss your organization's needs." },
];

const subjects = [
  "General Inquiry",
  "Technical Support",
  "Feature Request",
  "Bug Report",
  "Partnership",
  "Other",
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const subject = fd.get("subject") as string;
    const message = fd.get("message") as string;
    if (!name || !email || !subject || !message) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <PageTransition>
      <PublicLayout>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
          </div>
          <div className="container relative py-20 md:py-28 text-center">
            <motion.div {...fadeUp()}>
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">Contact</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
                Get in <span className="text-gradient-accent">Touch</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Have a question, feedback, or feature request? We'd love to hear from you.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="bg-white border-b border-slate-200/60">
          <div className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {contactCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  {...fadeUp(i * 0.1)}
                  className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-accent/30 hover:shadow-lg transition-all duration-300 text-center"
                >
                  <div className="stat-icon-bg bg-accent/10 mx-auto mb-4">
                    <card.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{card.title}</h3>
                  <p className="text-sm text-accent font-medium mb-1">{card.desc}</p>
                  <p className="text-xs text-slate-400">{card.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form + Info */}
        <section className="bg-[hsl(216,30%,98.5%)]">
          <div className="container py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Left - Form */}
              <motion.div {...fadeUp()}>
                <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Send a Message</p>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">We'd Love to Hear From You</h2>
                <p className="text-slate-500 mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-10 rounded-2xl bg-white border border-slate-200/60 text-center"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                    <p className="text-sm text-slate-500 mb-6">Thank you for reaching out. We'll get back to you within 24-48 hours.</p>
                    <Button
                      variant="outline"
                      className="border-slate-200 text-slate-600 hover:bg-slate-50"
                      onClick={() => setSubmitted(false)}
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/60 space-y-5">
                    {error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-slate-700 text-sm font-medium">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your name"
                          className="mt-1.5 h-11 bg-slate-50 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-accent focus:ring-accent"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="mt-1.5 h-11 bg-slate-50 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-accent focus:ring-accent"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-slate-700 text-sm font-medium">Subject</Label>
                      <select
                        id="subject"
                        name="subject"
                        className="mt-1.5 flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        defaultValue=""
                      >
                        <option value="" disabled className="text-slate-400">Select a subject</option>
                        {subjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-slate-700 text-sm font-medium">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us how we can help..."
                        rows={5}
                        className="mt-1.5 bg-slate-50 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-accent focus:ring-accent"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                      <Send className="h-4 w-4 mr-2" /> {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </motion.div>

              {/* Right - Info panel */}
              <motion.div {...fadeUp(0.2)} className="flex flex-col gap-6">
                <div>
                  <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Why Contact Us</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">We're Here to Help</h2>
                  <p className="text-slate-500 leading-relaxed">
                    Whether you have a question about features, need technical help, or want to share feedback, our team is ready to assist.
                  </p>
                </div>

                {/* Trust indicators */}
                <div className="space-y-4">
                  {[
                    { icon: Clock3, title: "Fast Response", desc: "24-48 hour average reply time" },
                    { icon: ShieldCheck, title: "Secure & Private", desc: "Your messages are encrypted and confidential" },
                    { icon: MessageSquare, title: "Real Humans", desc: "No bots — you talk to our actual team" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      {...fadeUp(0.3 + i * 0.1)}
                      className="flex gap-4 p-5 rounded-xl bg-white border border-slate-200/60 hover:border-accent/30 hover:shadow-md transition-all duration-300"
                    >
                      <div className="stat-icon-bg bg-accent/10 shrink-0">
                        <item.icon className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Dark info card */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-7 mt-auto">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                  </div>
                  <div className="relative">
                    <h3 className="font-bold text-white mb-2">Need Urgent Help?</h3>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                      For critical issues affecting your account or data, reach out directly at our priority support email.
                    </p>
                    <p className="text-sm text-accent font-semibold">urgent@gpxtrackpro.com</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white">
          <div className="container py-20 md:py-28">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">FAQ</p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Frequently Asked Questions</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Quick answers to common questions before you reach out.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {faqItems.map((item, i) => (
                <motion.div
                  key={i}
                  {...fadeUp(i * 0.08)}
                  className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-accent/30 hover:shadow-md transition-all duration-300"
                >
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">{item.q}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </PublicLayout>
    </PageTransition>
  );
}
