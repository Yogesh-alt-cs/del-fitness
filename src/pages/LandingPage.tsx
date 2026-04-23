import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Play, Bot, ArrowRight, Zap, Brain, Camera, Dumbbell, Star, Quote, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-fitness.jpg";
import logo from "@/assets/delfitness-logo.png";

const features = [
  { icon: Camera, title: "AI Food Analyzer", desc: "Snap a photo of any meal and get instant nutritional breakdown powered by AI." },
  { icon: Dumbbell, title: "Smart Workouts", desc: "AI-generated workout plans tailored to your goals, equipment, and schedule." },
  { icon: Play, title: "Video Library", desc: "Curated gym videos from top fitness creators, organized by muscle group." },
  { icon: Brain, title: "AI Coach", desc: "Chat with Del, your personal AI fitness coach, anytime you need guidance." },
];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const faqs = [
  { q: "Is DelFitness really free?", a: "Yes! DelFitness is 100% free. You get unlimited AI meal analyses, workout logging, the full video library, AI Coach, and progress tracking — no credit card, no subscription, no catch." },
  { q: "How does the AI meal analyzer work?", a: "Simply snap a photo of your meal and our AI instantly identifies the food items, estimates portions, and provides a full nutritional breakdown including calories, protein, carbs, fat, and more." },
  { q: "Do I need an account?", a: "Yes — a free account lets us personalize your AI Coach, save your workouts, and track your progress across devices." },
  { q: "What makes Del (the AI Coach) different?", a: "Del learns from your workout history, nutrition data, and goals to provide personalized advice. It adapts recommendations based on your progress, fatigue levels, and schedule." },
  { q: "Do I need gym equipment to use DelFitness?", a: "Not at all! Our AI generates workouts based on your available equipment — whether that's a full gym, dumbbells at home, or just bodyweight exercises." },
  { q: "Is my data private and secure?", a: "Your privacy is our priority. All data is encrypted, stored securely, and never sold to third parties. You can export or delete your data at any time." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground text-sm md:text-base">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-muted-foreground text-sm leading-relaxed mt-3 overflow-hidden"
          >
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </button>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display mb-4">
            GOT <span className="text-gradient-primary">QUESTIONS?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to know about DelFitness.
          </p>
        </motion.div>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <FAQItem q={faq.q} a={faq.a} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "FAQ", id: "faq" },
  ];

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="DelFitness logo" className="h-9 w-9 object-contain" />
            <span className="font-display text-2xl text-foreground">DELFITNESS</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-3">
              <Link to="/auth">
                <Button variant="heroOutline" size="sm">Log In</Button>
              </Link>
              <Link to="/onboarding">
                <Button variant="hero" size="sm">Get Started <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden bg-background/95 backdrop-blur-md border-t border-border"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                {navLinks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="text-left text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex gap-3 pt-2 border-t border-border mt-1">
                  <Link to="/auth" className="flex-1">
                    <Button variant="heroOutline" size="sm" className="w-full">Log In</Button>
                  </Link>
                  <Link to="/onboarding" className="flex-1">
                    <Button variant="hero" size="sm" className="w-full">Get Started</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <motion.img
            src={heroImage}
            alt="Athlete in dark gym"
            className="w-full h-full object-cover opacity-40"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>
        <div className="container mx-auto relative z-10 px-4 pt-24">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">AI-Powered Fitness</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-display leading-none mb-6">
              TRAIN <span className="text-gradient-primary">SMART.</span><br />
              EAT <span className="text-gradient-primary">RIGHT.</span><br />
              LIVE <span className="text-gradient-primary">STRONG.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              Your all-in-one AI fitness companion. Analyze meals, generate workouts, and get coached — all in one app.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link to="/onboarding">
                <Button variant="hero" size="lg" className="h-14 px-8 text-lg">
                  Start Training <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="heroOutline" size="lg" className="h-14 px-8 text-lg">
                  Meet Your AI Coach
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating logo accent */}
        <motion.div
          className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 opacity-20"
          initial={{ opacity: 0, x: 80, rotate: -15 }}
          animate={{ opacity: 0.15, x: 0, rotate: 0 }}
          transition={{ duration: 1.2, delay: 0.6 }}
        >
          <img src={logo} alt="" className="w-72 h-72 object-contain" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gradient-hero scroll-mt-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display mb-4">
              EVERYTHING YOU NEED TO <span className="text-gradient-primary">DOMINATE</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powered by AI. Designed for results.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-card border border-border rounded-xl p-6 hover:glow-border hover:border-primary/30 transition-all group"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-primary transition-all">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl mb-2 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display mb-4">
              REAL PEOPLE. <span className="text-gradient-primary">REAL RESULTS.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              See what our community is saying about DelFitness.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Marcus J.", role: "Lost 30lbs in 4 months", rating: 5, text: "The AI meal analyzer changed everything for me. I just snap a photo and know exactly what I'm eating. No more guesswork." },
              { name: "Sarah K.", role: "Marathon runner", rating: 5, text: "Del the AI coach keeps me accountable and adjusts my training when I'm fatigued. It's like having a personal trainer 24/7." },
              { name: "Alex T.", role: "Gained 15lbs muscle", rating: 5, text: "Smart workout plans that actually adapt to my schedule and equipment. The progress tracking keeps me motivated every single day." },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="bg-card border border-border rounded-xl p-6 relative group hover:border-primary/20 transition-all"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-display text-sm text-primary">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: "10K+", label: "Active Users" },
              { value: "500K+", label: "Workouts Logged" },
              { value: "1M+", label: "Meals Analyzed" },
              { value: "4.9★", label: "Average Rating" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl md:text-4xl text-gradient-primary">{s.value}</p>
                <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-12 md:p-16 glow-primary"
          >
            <h2 className="text-4xl md:text-6xl font-display mb-4">
              READY TO <span className="text-gradient-primary">TRANSFORM?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Join DelFitness today and let AI supercharge your fitness journey.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="lg" className="h-14 px-10 text-lg">
                Get Started Free <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="DelFitness logo" className="h-6 w-6 object-contain" />
            <span className="font-display text-lg text-foreground">DELFITNESS</span>
          </div>
          <span>© 2026 DelFitness. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
