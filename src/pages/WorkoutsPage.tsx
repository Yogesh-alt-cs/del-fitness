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

type Exercise = {
  name: string;
  sets: number;
  reps: string | number;
  rest_seconds: number;
  instructions: string;
  tips: string;
};

type WorkoutDay = {
  dayName: string;
  focus: string;
  exercises: Exercise[];
};

type WorkoutPlan = {
  planName: string;
  duration_weeks: number;
  sessionsPerWeek: number;
  days: WorkoutDay[];
};

// Full preset plans with exercise details
const presetPlans: WorkoutPlan[] = [
  {
    planName: "Beginner Full Body",
    duration_weeks: 8,
    sessionsPerWeek: 3,
    days: [
      {
        dayName: "Day A",
        focus: "Full Body Strength",
        exercises: [
          { name: "Goblet Squat", sets: 3, reps: 12, rest_seconds: 60, instructions: "Hold dumbbell at chest, squat to parallel", tips: "Keep chest up and knees tracking over toes" },
          { name: "Dumbbell Bench Press", sets: 3, reps: 10, rest_seconds: 60, instructions: "Lie flat, press dumbbells up from chest", tips: "Squeeze chest at top, control the descent" },
          { name: "Bent-Over Row", sets: 3, reps: 10, rest_seconds: 60, instructions: "Hinge at hips, pull dumbbells to ribcage", tips: "Keep back flat, squeeze shoulder blades" },
          { name: "Overhead Press", sets: 3, reps: 10, rest_seconds: 60, instructions: "Press dumbbells overhead from shoulders", tips: "Brace core, don't arch lower back" },
          { name: "Plank", sets: 3, reps: "30s", rest_seconds: 45, instructions: "Hold forearm plank position", tips: "Keep hips level, squeeze glutes" },
        ],
      },
      {
        dayName: "Day B",
        focus: "Full Body Hypertrophy",
        exercises: [
          { name: "Romanian Deadlift", sets: 3, reps: 12, rest_seconds: 60, instructions: "Hinge at hips with slight knee bend", tips: "Feel stretch in hamstrings, keep bar close" },
          { name: "Incline Dumbbell Press", sets: 3, reps: 10, rest_seconds: 60, instructions: "Set bench to 30-45°, press up", tips: "Focus on upper chest contraction" },
          { name: "Lat Pulldown", sets: 3, reps: 12, rest_seconds: 60, instructions: "Pull bar to upper chest, squeeze lats", tips: "Don't lean back excessively" },
          { name: "Lateral Raises", sets: 3, reps: 15, rest_seconds: 45, instructions: "Raise dumbbells to shoulder height", tips: "Light weight, control the movement" },
          { name: "Bicycle Crunches", sets: 3, reps: 20, rest_seconds: 45, instructions: "Alternate elbow to opposite knee", tips: "Slow and controlled, don't pull on neck" },
        ],
      },
      {
        dayName: "Day C",
        focus: "Full Body Power",
        exercises: [
          { name: "Leg Press", sets: 3, reps: 12, rest_seconds: 90, instructions: "Press platform away, don't lock knees", tips: "Feet shoulder-width, push through heels" },
          { name: "Push-ups", sets: 3, reps: 15, rest_seconds: 60, instructions: "Full range of motion push-ups", tips: "Body in straight line, chest to floor" },
          { name: "Cable Rows", sets: 3, reps: 12, rest_seconds: 60, instructions: "Pull handle to lower chest", tips: "Keep elbows close, squeeze back" },
          { name: "Dumbbell Lunges", sets: 3, reps: "10/leg", rest_seconds: 60, instructions: "Step forward, lower back knee toward floor", tips: "Keep torso upright" },
          { name: "Dead Bug", sets: 3, reps: "10/side", rest_seconds: 45, instructions: "Alternate extending opposite arm/leg", tips: "Keep lower back pressed to floor" },
        ],
      },
    ],
  },
  {
    planName: "Fat Burner HIIT",
    duration_weeks: 6,
    sessionsPerWeek: 4,
    days: [
      {
        dayName: "Day 1",
        focus: "Upper Body HIIT",
        exercises: [
          { name: "Burpees", sets: 4, reps: "30s", rest_seconds: 15, instructions: "Squat, jump back, push-up, jump up", tips: "Maintain speed but keep good form" },
          { name: "Mountain Climbers", sets: 4, reps: "30s", rest_seconds: 15, instructions: "Drive knees to chest alternating", tips: "Keep hips level, core tight" },
          { name: "Push-up to Renegade Row", sets: 3, reps: 10, rest_seconds: 30, instructions: "Push-up then row each dumbbell", tips: "Wide stance for stability" },
          { name: "Plank Shoulder Taps", sets: 3, reps: "30s", rest_seconds: 20, instructions: "In plank, tap opposite shoulder", tips: "Minimize hip rotation" },
          { name: "Jump Rope", sets: 3, reps: "60s", rest_seconds: 30, instructions: "Jump continuously", tips: "Stay on balls of feet, small jumps" },
        ],
      },
      {
        dayName: "Day 2",
        focus: "Lower Body HIIT",
        exercises: [
          { name: "Jump Squats", sets: 4, reps: 15, rest_seconds: 20, instructions: "Squat then explode upward", tips: "Land softly, absorb with legs" },
          { name: "Alternating Lunges", sets: 4, reps: 20, rest_seconds: 20, instructions: "Step forward alternating legs", tips: "Keep torso upright" },
          { name: "Box Jumps", sets: 3, reps: 10, rest_seconds: 30, instructions: "Jump onto box/step, step down", tips: "Swing arms for momentum" },
          { name: "Sumo Squat Pulses", sets: 3, reps: "30s", rest_seconds: 20, instructions: "Wide squat, pulse at bottom", tips: "Keep knees pushed outward" },
          { name: "High Knees", sets: 3, reps: "45s", rest_seconds: 20, instructions: "Drive knees high while running in place", tips: "Pump arms, stay on toes" },
        ],
      },
      {
        dayName: "Day 3",
        focus: "Full Body Circuit",
        exercises: [
          { name: "Kettlebell Swings", sets: 4, reps: 15, rest_seconds: 20, instructions: "Hip hinge, swing to shoulder height", tips: "Drive with hips, not arms" },
          { name: "Dumbbell Thrusters", sets: 4, reps: 12, rest_seconds: 20, instructions: "Squat then press overhead", tips: "One fluid motion" },
          { name: "Battle Ropes", sets: 3, reps: "30s", rest_seconds: 20, instructions: "Alternate arm waves", tips: "Slight squat, use full body" },
          { name: "Sprawls", sets: 3, reps: 10, rest_seconds: 30, instructions: "Like a burpee without push-up", tips: "Speed and explosiveness" },
          { name: "Dead Hang", sets: 3, reps: "30s", rest_seconds: 30, instructions: "Hang from pull-up bar", tips: "Relax shoulders, breathe" },
        ],
      },
      {
        dayName: "Day 4",
        focus: "Core & Cardio",
        exercises: [
          { name: "Russian Twists", sets: 3, reps: 20, rest_seconds: 20, instructions: "Sit V-position, rotate side to side", tips: "Lean back slightly, feet off ground" },
          { name: "Plank Jacks", sets: 3, reps: "30s", rest_seconds: 15, instructions: "Plank position, jump feet in/out", tips: "Keep core tight" },
          { name: "Bicycle Crunches", sets: 3, reps: 20, rest_seconds: 20, instructions: "Elbow to opposite knee", tips: "Slow, controlled movement" },
          { name: "Tuck Jumps", sets: 3, reps: 10, rest_seconds: 30, instructions: "Jump and bring knees to chest", tips: "Land softly" },
          { name: "Flutter Kicks", sets: 3, reps: "30s", rest_seconds: 20, instructions: "Lie flat, alternate small leg kicks", tips: "Keep lower back pressed down" },
        ],
      },
    ],
  },
  {
    planName: "Advanced Push/Pull/Legs",
    duration_weeks: 12,
    sessionsPerWeek: 6,
    days: [
      {
        dayName: "Push A",
        focus: "Chest & Triceps",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "6-8", rest_seconds: 120, instructions: "Flat bench, lower to chest, press up", tips: "Arch back slightly, retract scapula" },
          { name: "Incline Dumbbell Press", sets: 4, reps: "8-10", rest_seconds: 90, instructions: "30° incline, press dumbbells", tips: "Full range of motion" },
          { name: "Cable Flyes", sets: 3, reps: 12, rest_seconds: 60, instructions: "Slight bend in elbows, bring hands together", tips: "Squeeze chest hard at peak" },
          { name: "Overhead Tricep Extension", sets: 3, reps: 12, rest_seconds: 60, instructions: "Cable or dumbbell behind head", tips: "Keep elbows close to head" },
          { name: "Lateral Raises", sets: 4, reps: 15, rest_seconds: 45, instructions: "Raise to shoulder height", tips: "Lead with pinkies for better delt activation" },
        ],
      },
      {
        dayName: "Pull A",
        focus: "Back & Biceps",
        exercises: [
          { name: "Barbell Deadlift", sets: 4, reps: "5-6", rest_seconds: 180, instructions: "Hip hinge, pull bar from floor", tips: "Neutral spine, drive through heels" },
          { name: "Weighted Pull-ups", sets: 4, reps: "6-8", rest_seconds: 120, instructions: "Add weight, pull chin over bar", tips: "Full hang at bottom" },
          { name: "Barbell Rows", sets: 4, reps: "8-10", rest_seconds: 90, instructions: "Bent over, pull to lower chest", tips: "Keep core tight, 45° angle" },
          { name: "Face Pulls", sets: 3, reps: 15, rest_seconds: 60, instructions: "Cable at face height, pull apart", tips: "External rotation at peak" },
          { name: "Barbell Curls", sets: 3, reps: 10, rest_seconds: 60, instructions: "Curl bar to shoulders", tips: "No swinging, control the weight" },
        ],
      },
      {
        dayName: "Legs A",
        focus: "Quad Dominant",
        exercises: [
          { name: "Barbell Back Squat", sets: 4, reps: "6-8", rest_seconds: 180, instructions: "Bar on traps, squat to parallel or below", tips: "Brace core, push knees out" },
          { name: "Leg Press", sets: 4, reps: 12, rest_seconds: 90, instructions: "Heavy press, full range", tips: "Don't lock knees at top" },
          { name: "Walking Lunges", sets: 3, reps: "12/leg", rest_seconds: 90, instructions: "Dumbbell walking lunges", tips: "Long steps, upright torso" },
          { name: "Leg Extensions", sets: 3, reps: 15, rest_seconds: 60, instructions: "Squeeze quads at top", tips: "Slow negative" },
          { name: "Standing Calf Raises", sets: 4, reps: 15, rest_seconds: 60, instructions: "Full range calf raises", tips: "Pause at top and bottom" },
        ],
      },
      {
        dayName: "Push B",
        focus: "Shoulders & Chest",
        exercises: [
          { name: "Overhead Press", sets: 4, reps: "6-8", rest_seconds: 120, instructions: "Barbell strict press overhead", tips: "Tuck chin, push through" },
          { name: "Dumbbell Bench Press", sets: 4, reps: "8-10", rest_seconds: 90, instructions: "Flat bench dumbbell press", tips: "Touch at bottom, squeeze at top" },
          { name: "Arnold Press", sets: 3, reps: 10, rest_seconds: 60, instructions: "Rotate palms during press", tips: "Full rotation for all delt heads" },
          { name: "Dips", sets: 3, reps: 12, rest_seconds: 60, instructions: "Weighted if possible, lean forward", tips: "Control descent, chest focus" },
          { name: "Tricep Pushdowns", sets: 3, reps: 15, rest_seconds: 45, instructions: "Cable pushdowns, straight bar or rope", tips: "Lock elbows at sides" },
        ],
      },
      {
        dayName: "Pull B",
        focus: "Back & Rear Delts",
        exercises: [
          { name: "Rack Pulls", sets: 4, reps: "6-8", rest_seconds: 120, instructions: "Deadlift from knee height", tips: "Heavy load, squeeze at top" },
          { name: "Chest-Supported Row", sets: 4, reps: 10, rest_seconds: 90, instructions: "Incline bench, row dumbbells", tips: "No momentum, pure back" },
          { name: "Single Arm Pulldown", sets: 3, reps: "10/side", rest_seconds: 60, instructions: "One arm lat pulldown", tips: "Feel the lat stretch and squeeze" },
          { name: "Reverse Flyes", sets: 3, reps: 15, rest_seconds: 45, instructions: "Bent over or machine", tips: "Squeeze rear delts" },
          { name: "Hammer Curls", sets: 3, reps: 12, rest_seconds: 60, instructions: "Neutral grip curls", tips: "Target brachialis" },
        ],
      },
      {
        dayName: "Legs B",
        focus: "Hamstring Dominant",
        exercises: [
          { name: "Romanian Deadlift", sets: 4, reps: "8-10", rest_seconds: 120, instructions: "Barbell RDL, feel hamstring stretch", tips: "Push hips back, slight knee bend" },
          { name: "Bulgarian Split Squat", sets: 3, reps: "10/leg", rest_seconds: 90, instructions: "Rear foot elevated, squat down", tips: "Lean slightly forward" },
          { name: "Leg Curls", sets: 4, reps: 12, rest_seconds: 60, instructions: "Lying or seated leg curls", tips: "Slow eccentric" },
          { name: "Hip Thrusts", sets: 4, reps: 12, rest_seconds: 90, instructions: "Barbell on hips, thrust up", tips: "Full hip extension, squeeze glutes" },
          { name: "Seated Calf Raises", sets: 4, reps: 15, rest_seconds: 60, instructions: "Seated machine or plates on knees", tips: "Targets soleus" },
        ],
      },
    ],
  },
  {
    planName: "Endurance Builder",
    duration_weeks: 8,
    sessionsPerWeek: 5,
    days: [
      {
        dayName: "Day 1",
        focus: "Cardio Intervals",
        exercises: [
          { name: "Warm-up Jog", sets: 1, reps: "5 min", rest_seconds: 0, instructions: "Easy pace to warm up", tips: "Gradually increase speed" },
          { name: "Sprint Intervals", sets: 8, reps: "30s sprint / 60s walk", rest_seconds: 0, instructions: "All-out sprint then walk", tips: "Push hard on sprints" },
          { name: "Steady State Run", sets: 1, reps: "10 min", rest_seconds: 0, instructions: "Moderate pace continuous run", tips: "Conversational pace" },
          { name: "Cool Down Walk", sets: 1, reps: "5 min", rest_seconds: 0, instructions: "Easy walk to bring heart rate down", tips: "Deep breathing" },
        ],
      },
      {
        dayName: "Day 2",
        focus: "Muscular Endurance Upper",
        exercises: [
          { name: "Push-ups", sets: 4, reps: 20, rest_seconds: 30, instructions: "Standard push-ups for high reps", tips: "Maintain form throughout" },
          { name: "Dumbbell Rows", sets: 4, reps: 15, rest_seconds: 30, instructions: "Light weight, high reps", tips: "Focus on mind-muscle connection" },
          { name: "Shoulder Press", sets: 3, reps: 15, rest_seconds: 30, instructions: "Light dumbbells, controlled", tips: "Full range of motion" },
          { name: "Plank Hold", sets: 3, reps: "60s", rest_seconds: 30, instructions: "Hold solid plank", tips: "Breathe steadily" },
          { name: "Band Pull-aparts", sets: 3, reps: 20, rest_seconds: 20, instructions: "Resistance band at chest height", tips: "Squeeze shoulder blades" },
        ],
      },
      {
        dayName: "Day 3",
        focus: "Long Distance Cardio",
        exercises: [
          { name: "Steady State Run/Bike", sets: 1, reps: "30-45 min", rest_seconds: 0, instructions: "Moderate pace, zone 2 heart rate", tips: "Should be able to hold conversation" },
          { name: "Stretching", sets: 1, reps: "10 min", rest_seconds: 0, instructions: "Full body static stretching", tips: "Hold each stretch 30s" },
        ],
      },
      {
        dayName: "Day 4",
        focus: "Muscular Endurance Lower",
        exercises: [
          { name: "Bodyweight Squats", sets: 4, reps: 25, rest_seconds: 30, instructions: "Full depth squats", tips: "Keep heels planted" },
          { name: "Walking Lunges", sets: 3, reps: "20/leg", rest_seconds: 30, instructions: "Continuous walking lunges", tips: "Upright torso" },
          { name: "Wall Sits", sets: 3, reps: "45s", rest_seconds: 30, instructions: "Back against wall, 90° legs", tips: "Push through the burn" },
          { name: "Calf Raises", sets: 3, reps: 30, rest_seconds: 20, instructions: "Standing bodyweight calf raises", tips: "Full range" },
          { name: "Glute Bridges", sets: 3, reps: 20, rest_seconds: 30, instructions: "Lie flat, bridge hips up", tips: "Squeeze glutes at top" },
        ],
      },
      {
        dayName: "Day 5",
        focus: "Mixed Cardio Challenge",
        exercises: [
          { name: "Rowing Machine", sets: 1, reps: "10 min", rest_seconds: 0, instructions: "Moderate pace rowing", tips: "Drive with legs first" },
          { name: "Burpees", sets: 5, reps: 10, rest_seconds: 30, instructions: "Full burpees with jump", tips: "Steady pace" },
          { name: "Jump Rope", sets: 5, reps: "60s", rest_seconds: 20, instructions: "Continuous jumping", tips: "Small, efficient jumps" },
          { name: "Bear Crawls", sets: 3, reps: "30s", rest_seconds: 30, instructions: "Crawl forward and back", tips: "Keep hips low" },
          { name: "Stretching & Foam Rolling", sets: 1, reps: "10 min", rest_seconds: 0, instructions: "Recovery session", tips: "Focus on tight areas" },
        ],
      },
    ],
  },
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
  const [viewingPlan, setViewingPlan] = useState<WorkoutPlan | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

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
        body: { type: "workout_gen", payload: { fitnessLevel, equipment, timeMinutes, targetMuscles } },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGeneratedPlan(data);
      setViewingPlan(null);
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

  const activePlan = viewingPlan || generatedPlan;

  const PlanView = ({ plan, onClose }: { plan: WorkoutPlan; onClose: () => void }) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl text-foreground">{plan.planName}</h2>
          <p className="text-muted-foreground text-sm">
            {plan.duration_weeks} weeks • {plan.sessionsPerWeek} sessions/week
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {plan.days?.map((day, i) => (
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
                        {ex.sets} × {ex.reps} {ex.rest_seconds > 0 && `• ${ex.rest_seconds}s rest`}
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
                  onClick={() => startFromPlan(plan, i)}
                >
                  <Play className="h-4 w-4 mr-2" /> Start This Day's Workout
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            <span className="text-gradient-primary">WORKOUT</span> PLANS
          </h1>
          <p className="text-muted-foreground mt-2">Choose a plan or let AI create one for you.</p>
        </motion.div>

        {showLogger && (
          <WorkoutLogger
            onClose={() => { setShowLogger(false); refetchWorkouts(); }}
            initialExercises={loggerExercises}
            workoutName={loggerName}
          />
        )}

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

        {/* Active Plan View */}
        {activePlan && (
          <PlanView
            plan={activePlan}
            onClose={() => { setGeneratedPlan(null); setViewingPlan(null); }}
          />
        )}

        {/* Pre-built plans */}
        <div>
          <h2 className="font-display text-xl text-foreground mb-4">PRESET PLANS</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {presetPlans.map((p, i) => (
              <motion.div
                key={p.planName}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                onClick={() => { setViewingPlan(p); setGeneratedPlan(null); setExpandedDay(null); }}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {p.duration_weeks} weeks
                  </span>
                  <span className="text-xs text-muted-foreground">{p.sessionsPerWeek} days/week</span>
                </div>
                <h3 className="font-display text-xl text-foreground mb-1 group-hover:text-primary transition-colors">{p.planName}</h3>
                <p className="text-muted-foreground text-sm">{p.days.length} workout days • {p.days.reduce((sum, d) => sum + d.exercises.length, 0)} total exercises</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {p.days.slice(0, 3).map((d) => (
                    <span key={d.dayName} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{d.focus}</span>
                  ))}
                  {p.days.length > 3 && <span className="text-[10px] text-muted-foreground">+{p.days.length - 3} more</span>}
                </div>
              </motion.div>
            ))}
          </div>
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
