import { motion } from "framer-motion";
import { Flame, Dumbbell, Apple, TrendingUp, Play, Bot, Calculator, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

const stats = [
  { label: "Calories", value: "1,840", target: "/ 2,200", icon: Flame, color: "text-secondary" },
  { label: "Protein", value: "124g", target: "/ 160g", icon: Apple, color: "text-primary" },
  { label: "Workouts", value: "3", target: "this week", icon: Dumbbell, color: "text-primary" },
  { label: "Streak", value: "12", target: "days", icon: Trophy, color: "text-secondary" },
];

const quickActions = [
  { label: "Log Food", icon: Apple, path: "/nutrition", color: "bg-primary/10 text-primary" },
  { label: "Start Workout", icon: Dumbbell, path: "/workouts", color: "bg-secondary/10 text-secondary" },
  { label: "Watch Video", icon: Play, path: "/videos", color: "bg-primary/10 text-primary" },
  { label: "Ask Coach", icon: Bot, path: "/coach", color: "bg-secondary/10 text-secondary" },
];

export default function Dashboard() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-muted-foreground text-sm">{today}</p>
          <h1 className="text-3xl md:text-4xl font-display mt-1">
            WELCOME BACK, <span className="text-gradient-primary">ATHLETE</span>
          </h1>
        </motion.div>

        {/* Motivational quote */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 italic text-muted-foreground text-sm"
        >
          "The only bad workout is the one that didn't happen." — Unknown
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 hover:glow-border hover:border-primary/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground text-sm">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="font-display text-3xl text-foreground">{s.value}</div>
              <span className="text-muted-foreground text-xs">{s.target}</span>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display text-xl mb-4 text-foreground">QUICK ACTIONS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Link to={a.path}>
                  <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3 hover:border-primary/30 transition-all cursor-pointer group">
                    <div className={`h-12 w-12 rounded-lg ${a.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <a.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{a.label}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* BMI Widget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">BMI CALCULATOR</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Set up your profile with height and weight to see your BMI and personalized recommendations.
          </p>
          <Link to="/profile">
            <Button variant="hero" size="sm" className="mt-4">Set Up Profile</Button>
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  );
}
