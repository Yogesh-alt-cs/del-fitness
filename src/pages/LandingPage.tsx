import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Apple, Play, Bot, ArrowRight, Zap, Brain, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-fitness.jpg";

const features = [
  { icon: Camera, title: "AI Food Analyzer", desc: "Snap a photo of any meal and get instant nutritional breakdown powered by AI." },
  { icon: Dumbbell, title: "Smart Workouts", desc: "AI-generated workout plans tailored to your goals, equipment, and schedule." },
  { icon: Play, title: "Video Library", desc: "Curated gym videos from top fitness creators, organized by muscle group." },
  { icon: Brain, title: "AI Coach", desc: "Chat with Del, your personal AI fitness coach, anytime you need guidance." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-primary" />
            <span className="font-display text-2xl text-foreground">DELFITNESS</span>
          </div>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button variant="heroOutline" size="sm">Log In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero" size="sm">Get Started <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Athlete in dark gym" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>
        <div className="container mx-auto relative z-10 px-4 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">AI-Powered Fitness</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display leading-none mb-6">
              TRAIN <span className="text-gradient-primary">SMART.</span><br />
              EAT <span className="text-gradient-primary">RIGHT.</span><br />
              LIVE <span className="text-gradient-primary">STRONG.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              Your all-in-one AI fitness companion. Analyze meals, generate workouts, and get coached — all in one app.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button variant="hero" size="lg" className="h-14 px-8 text-lg">
                  Start Training <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="heroOutline" size="lg" className="h-14 px-8 text-lg">
                  Meet Your AI Coach
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gradient-hero">
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
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

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-display text-lg text-foreground">DELFITNESS</span>
          </div>
          <span>© 2026 DelFitness. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
