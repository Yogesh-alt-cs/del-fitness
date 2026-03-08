import { motion } from "framer-motion";
import { Dumbbell, Sparkles, Loader2, X, ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import WorkoutLogger from "@/components/WorkoutLogger";

type WorkoutPlan = {
  planName: string;
  duration_weeks: number;
  sessionsPerWeek: number;
  days: {
    dayName: string;
    focus: string;
    exercises: {
      name: string;
      sets: number;
      reps: string | number;
      rest_seconds: number;
      instructions: string;
      tips: string;
    }[];
  }[];
};

const prePlans = [
  { name: "Beginner Full Body", level: "Beginner", goal: "Muscle Gain", days: 3, color: "border-primary/30" },
  { name: "Fat Burner HIIT", level: "Intermediate", goal: "Fat Loss", days: 4, color: "border-secondary/30" },
  { name: "Advanced Push/Pull/Legs", level: "Advanced", goal: "Muscle Gain", days: 6, color: "border-primary/30" },
  { name: "Endurance Builder", level: "Intermediate", goal: "Endurance", days: 5, color: "border-secondary/30" },
];

export default function WorkoutsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [showLogger, setShowLogger] = useState(false);
  const [loggerExercises, setLoggerExercises] = useState<string[] | undefined>();
  const [loggerName, setLoggerName] = useState<string | undefined>();

  const { data: recentWorkouts, refetch: refetchWorkouts } = useQuery({
    queryKey: ["recent_workouts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // Generator form
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [equipment, setEquipment] = useState("full gym");
  const [timeMinutes, setTimeMinutes] = useState("45");
  const [targetMuscles, setTargetMuscles] = useState("full body");

  const inputClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40";

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-fitness", {
        body: {
          type: "workout_gen",
          payload: { fitnessLevel, equipment, timeMinutes, targetMuscles },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGeneratedPlan(data);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const startFromPlan = (plan: WorkoutPlan, dayIdx: number) => {
    const day = plan.days[dayIdx];
    if (!day) return;
    setLoggerExercises(day.exercises.map((e) => e.name));
    setLoggerName(`${plan.planName} - ${day.dayName}`);
    setShowLogger(true);
  };

  const startBlankWorkout = () => {
    setLoggerExercises(undefined);
    setLoggerName(undefined);
    setShowLogger(true);
  };

  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            <span className="text-gradient-primary">WORKOUT</span> PLANS
          </h1>
          <p className="text-muted-foreground mt-2">Choose a plan or let AI create one for you.</p>
        </motion.div>

        {/* Active Workout Logger */}
        {showLogger && (
          <WorkoutLogger
            onClose={() => { setShowLogger(false); refetchWorkouts(); }}
            initialExercises={loggerExercises}
            workoutName={loggerName}
          />
        )}

        {/* Start workout button */}
        {!showLogger && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Button variant="hero" className="w-full h-14 text-lg" onClick={startBlankWorkout}>
              <Play className="h-5 w-5 mr-2" /> Start Empty Workout
            </Button>
          </motion.div>
        )}

        {/* AI Generator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-primary/20 rounded-xl overflow-hidden glow-primary"
        >
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="w-full p-6 flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-display text-lg text-foreground">AI WORKOUT GENERATOR</h3>
              <p className="text-muted-foreground text-sm">Tell us your goals and we'll create a custom plan.</p>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showGenerator ? "rotate-180" : ""}`} />
          </button>

          {showGenerator && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="px-6 pb-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fitness Level</label>
                  <select value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)} className={inputClass}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Available Equipment</label>
                  <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className={inputClass}>
                    <option value="full gym">Full Gym</option>
                    <option value="dumbbells only">Dumbbells Only</option>
                    <option value="bodyweight">Bodyweight Only</option>
                    <option value="resistance bands">Resistance Bands</option>
                    <option value="home gym">Home Gym</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Time Available (min)</label>
                  <select value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} className={inputClass}>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target Muscles</label>
                  <select value={targetMuscles} onChange={(e) => setTargetMuscles(e.target.value)} className={inputClass}>
                    <option value="full body">Full Body</option>
                    <option value="chest and triceps">Chest & Triceps</option>
                    <option value="back and biceps">Back & Biceps</option>
                    <option value="legs and glutes">Legs & Glutes</option>
                    <option value="shoulders and arms">Shoulders & Arms</option>
                    <option value="core and abs">Core & Abs</option>
                  </select>
                </div>
              </div>
              <Button variant="hero" onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating your plan...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate Workout Plan</>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Generated Plan */}
        {generatedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-primary/20 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-display text-2xl text-foreground">{generatedPlan.planName}</h2>
                <p className="text-muted-foreground text-sm">
                  {generatedPlan.duration_weeks} weeks • {generatedPlan.sessionsPerWeek} sessions/week
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setGeneratedPlan(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {generatedPlan.days?.map((day, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{day.dayName}</span>
                      <span className="text-sm font-medium text-foreground">{day.focus}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{day.exercises?.length || 0} exercises</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedDay === i ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {expandedDay === i && day.exercises && (
                    <div className="px-4 pb-4 space-y-3">
                      {day.exercises.map((ex, j) => (
                        <div key={j} className="bg-muted rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{ex.name}</span>
                            <span className="text-xs text-primary">
                              {ex.sets} × {ex.reps} • {ex.rest_seconds}s rest
                            </span>
                          </div>
                          {ex.instructions && <p className="text-xs text-muted-foreground">{ex.instructions}</p>}
                          {ex.tips && <p className="text-xs text-primary/70 mt-1">💡 {ex.tips}</p>}
                        </div>
                      ))}
                      <Button
                        variant="hero"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => startFromPlan(generatedPlan, i)}
                      >
                        <Play className="h-4 w-4 mr-2" /> Start This Day's Workout
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pre-built plans */}
        <div className="grid md:grid-cols-2 gap-4">
          {prePlans.map((p, i) => (
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

        {/* Recent workouts */}
        {recentWorkouts && recentWorkouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Dumbbell className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl text-foreground">RECENT WORKOUTS</h2>
            </div>
            <div className="space-y-3">
              {recentWorkouts.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm text-foreground">{w.workout_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(w.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                  {w.duration_mins && (
                    <span className="text-sm text-primary font-medium">{w.duration_mins} min</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
