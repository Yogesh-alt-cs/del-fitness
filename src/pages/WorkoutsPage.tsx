import { motion } from "framer-motion";
import { Dumbbell, Sparkles, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const plans = [
  { name: "Beginner Full Body", level: "Beginner", goal: "Muscle Gain", days: 3, color: "border-primary/30" },
  { name: "Fat Burner HIIT", level: "Intermediate", goal: "Fat Loss", days: 4, color: "border-secondary/30" },
  { name: "Advanced Push/Pull/Legs", level: "Advanced", goal: "Muscle Gain", days: 6, color: "border-primary/30" },
  { name: "Endurance Builder", level: "Intermediate", goal: "Endurance", days: 5, color: "border-secondary/30" },
];

export default function WorkoutsPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            <span className="text-gradient-primary">WORKOUT</span> PLANS
          </h1>
          <p className="text-muted-foreground mt-2">Choose a plan or let AI create one for you.</p>
        </motion.div>

        {/* AI Generator CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-primary/20 rounded-xl p-6 glow-primary flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg text-foreground">AI WORKOUT GENERATOR</h3>
            <p className="text-muted-foreground text-sm">Tell us your goals and we'll create a custom plan.</p>
          </div>
          <Button variant="hero" size="sm">Generate</Button>
        </motion.div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className={`bg-card border ${p.color} rounded-xl p-6 hover:border-primary/40 transition-all cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">{p.level}</span>
                <span className="text-xs text-muted-foreground">{p.days} days/week</span>
              </div>
              <h3 className="font-display text-xl text-foreground mb-1">{p.name}</h3>
              <p className="text-muted-foreground text-sm">Goal: {p.goal}</p>
            </motion.div>
          ))}
        </div>

        {/* Workout logger */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">WORKOUT LOGGER</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Start a workout to log sets, reps, and weight. Track your personal records over time.
          </p>
          <Button variant="hero" size="sm" className="mt-4">Start Workout</Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
