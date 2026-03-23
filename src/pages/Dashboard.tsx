import { motion } from "framer-motion";
import {
  Flame, Dumbbell, Apple, Play, Bot, Calculator, Trophy, Target, CheckCircle2,
  TrendingUp, TrendingDown, Zap, BarChart3, Scale, Calendar, Share2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid
} from "recharts";

const quickActions = [
  { label: "Log Food", icon: Apple, path: "/nutrition", color: "bg-primary/10 text-primary" },
  { label: "Start Workout", icon: Dumbbell, path: "/workouts", color: "bg-secondary/10 text-secondary" },
  { label: "Watch Video", icon: Play, path: "/videos", color: "bg-primary/10 text-primary" },
  { label: "Ask Coach", icon: Bot, path: "/coach", color: "bg-secondary/10 text-secondary" },
];

const MACRO_COLORS = {
  protein: "hsl(66, 92%, 52%)",
  carbs: "hsl(45, 93%, 47%)",
  fats: "hsl(24, 95%, 53%)",
};

const DEFAULT_GOALS = { workouts: 4, calories: 2200, protein: 160 };

// Workout plan recommendations based on fitness goal
const PLAN_RECOMMENDATIONS: Record<string, { name: string; difficulty: string; duration: string; daysPerWeek: number; description: string }[]> = {
  "lose weight": [
    { name: "HIIT Blast", difficulty: "Intermediate", duration: "30 min", daysPerWeek: 4, description: "High intensity intervals for fat burn" },
    { name: "Morning Cardio", difficulty: "Beginner", duration: "25 min", daysPerWeek: 5, description: "Easy morning cardio sessions" },
    { name: "Fat Burn Circuit", difficulty: "Intermediate", duration: "40 min", daysPerWeek: 3, description: "Full body circuit training" },
  ],
  "build muscle": [
    { name: "Push Pull Legs", difficulty: "Intermediate", duration: "60 min", daysPerWeek: 6, description: "Classic PPL hypertrophy split" },
    { name: "Upper/Lower Split", difficulty: "Intermediate", duration: "50 min", daysPerWeek: 4, description: "Balanced upper/lower training" },
    { name: "Hypertrophy Plan", difficulty: "Advanced", duration: "65 min", daysPerWeek: 5, description: "Volume-focused muscle building" },
  ],
  "improve endurance": [
    { name: "Zone 2 Cardio", difficulty: "Beginner", duration: "45 min", daysPerWeek: 4, description: "Aerobic base building" },
    { name: "5K Training", difficulty: "Intermediate", duration: "35 min", daysPerWeek: 4, description: "Run your first/fastest 5K" },
    { name: "Stamina Builder", difficulty: "Advanced", duration: "50 min", daysPerWeek: 5, description: "Endurance & conditioning" },
  ],
  default: [
    { name: "Full Body Basics", difficulty: "Beginner", duration: "35 min", daysPerWeek: 3, description: "Foundational full body training" },
    { name: "Mobility Flow", difficulty: "Beginner", duration: "20 min", daysPerWeek: 3, description: "Flexibility & mobility work" },
    { name: "Daily Movement", difficulty: "Beginner", duration: "25 min", daysPerWeek: 5, description: "Stay active every day" },
  ],
};

function StatSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-8 w-20 mb-1" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <Skeleton className="h-5 w-40 mb-4" />
      <Skeleton className="h-[200px] w-full rounded-lg" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quote, setQuote] = useState("The only bad workout is the one that didn't happen.");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const userGoals = {
    workouts: (profile as any)?.goal_workouts_per_week || DEFAULT_GOALS.workouts,
    calories: (profile as any)?.goal_calories || DEFAULT_GOALS.calories,
    protein: (profile as any)?.goal_protein || DEFAULT_GOALS.protein,
  };

  const { data: todayFoodLogs, isLoading: todayFoodLoading } = useQuery({
    queryKey: ["today_food", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("logged_at", today);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: weekFoodLogs, isLoading: weekFoodLoading } = useQuery({
    queryKey: ["week_food", user?.id],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("logged_at", weekAgo)
        .order("logged_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: workoutLogs, isLoading: workoutsLoading } = useQuery({
    queryKey: ["week_workouts", user?.id],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("completed_at", weekAgo)
        .order("completed_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: allWorkoutLogs } = useQuery({
    queryKey: ["all_workouts_streak", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: bodyWeightLogs } = useQuery({
    queryKey: ["body_weight_30d", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("body_weight_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("logged_at", thirtyDaysAgo.split("T")[0])
        .order("logged_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    supabase.functions.invoke("ai-fitness", { body: { type: "motivation", payload: {} } })
      .then(({ data }) => { if (data?.quote) setQuote(data.quote); })
      .catch(() => {});
  }, []);

  const todayCalories = todayFoodLogs?.reduce((s, l) => s + (Number(l.calories) || 0), 0) || 0;
  const todayProtein = todayFoodLogs?.reduce((s, l) => s + (Number(l.protein_g) || 0), 0) || 0;
  const todayCarbs = todayFoodLogs?.reduce((s, l) => s + (Number(l.carbs_g) || 0), 0) || 0;
  const todayFats = todayFoodLogs?.reduce((s, l) => s + (Number(l.fat_g) || 0), 0) || 0;
  const weekWorkouts = workoutLogs?.length || 0;
  const displayName = profile?.name || user?.user_metadata?.name || "Athlete";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Streak calculation
  const streak = useMemo(() => {
    if (!allWorkoutLogs || allWorkoutLogs.length === 0) return 0;
    const workoutDates = new Set(
      allWorkoutLogs.map((w) => new Date(w.completed_at).toISOString().split("T")[0])
    );
    let count = 0;
    const d = new Date();
    const todayStr = d.toISOString().split("T")[0];
    if (!workoutDates.has(todayStr)) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split("T")[0];
      if (workoutDates.has(key)) { count++; d.setDate(d.getDate() - 1); } else break;
    }
    return count;
  }, [allWorkoutLogs]);

  // Weekly avg calories & protein
  const weekAvgCalories = useMemo(() => {
    if (!weekFoodLogs || weekFoodLogs.length === 0) return 0;
    const dayMap = new Map<string, number>();
    weekFoodLogs.forEach((l) => {
      const key = l.logged_at.split("T")[0];
      dayMap.set(key, (dayMap.get(key) || 0) + (Number(l.calories) || 0));
    });
    const total = Array.from(dayMap.values()).reduce((a, b) => a + b, 0);
    return Math.round(total / dayMap.size);
  }, [weekFoodLogs]);

  const weekAvgProtein = useMemo(() => {
    if (!weekFoodLogs || weekFoodLogs.length === 0) return 0;
    const dayMap = new Map<string, number>();
    weekFoodLogs.forEach((l) => {
      const key = l.logged_at.split("T")[0];
      dayMap.set(key, (dayMap.get(key) || 0) + (Number(l.protein_g) || 0));
    });
    const total = Array.from(dayMap.values()).reduce((a, b) => a + b, 0);
    return Math.round(total / dayMap.size);
  }, [weekFoodLogs]);

  const weeklyGoalPct = Math.round(
    [
      Math.min((weekWorkouts / userGoals.workouts) * 100, 100),
      Math.min((weekAvgCalories / userGoals.calories) * 100, 100),
      Math.min((weekAvgProtein / userGoals.protein) * 100, 100),
    ].reduce((a, b) => a + b, 0) / 3
  );

  const weeklyGoals = [
    { label: "Workouts", current: weekWorkouts, target: userGoals.workouts, unit: "sessions", color: "bg-primary" },
    { label: "Avg Calories", current: weekAvgCalories, target: userGoals.calories, unit: "kcal/day", color: "bg-secondary" },
    { label: "Avg Protein", current: weekAvgProtein, target: userGoals.protein, unit: "g/day", color: "bg-primary" },
  ];

  // Stat cards with trend
  const stats = [
    { label: "Workouts", value: String(weekWorkouts), target: `/ ${userGoals.workouts} this week`, icon: Dumbbell, color: "text-primary", trend: weekWorkouts >= userGoals.workouts ? "up" : null },
    { label: "Calories Today", value: todayCalories.toLocaleString(), target: `/ ${userGoals.calories.toLocaleString()}`, icon: Flame, color: "text-secondary", trend: todayCalories > 0 ? "up" : null },
    { label: "Streak", value: streak > 0 ? String(streak) : "0", target: streak > 0 ? "days" : "start today", icon: Trophy, color: "text-secondary", trend: streak >= 3 ? "up" : null },
    { label: "Weekly Goal", value: `${weeklyGoalPct}%`, target: "completed", icon: Target, color: "text-primary", trend: weeklyGoalPct >= 80 ? "up" : weeklyGoalPct > 0 ? "down" : null },
  ];

  let bmi: number | null = null;
  if (profile?.weight_kg && profile?.height_cm) {
    const hm = Number(profile.height_cm) / 100;
    bmi = Number(profile.weight_kg) / (hm * hm);
  }

  const macroTotal = todayProtein + todayCarbs + todayFats;
  const macroDonutData = macroTotal > 0
    ? [
        { name: "Protein", value: todayProtein },
        { name: "Carbs", value: todayCarbs },
        { name: "Fats", value: todayFats },
      ]
    : [{ name: "Protein", value: 33 }, { name: "Carbs", value: 34 }, { name: "Fats", value: 33 }];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Weekly workout bar chart (duration per day)
  const weeklyWorkoutChart = useMemo(() => {
    const days: { name: string; duration: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = workoutLogs?.filter((w) => w.completed_at.startsWith(dateStr)) || [];
      days.push({
        name: dayNames[d.getDay()],
        duration: dayLogs.reduce((s, w) => s + (Number(w.duration_mins) || 0), 0),
      });
    }
    return days;
  }, [workoutLogs]);

  // Weekly calorie line chart
  const weeklyCalorieChart = useMemo(() => {
    const days: { name: string; calories: number; target: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = weekFoodLogs?.filter((l) => l.logged_at.startsWith(dateStr)) || [];
      days.push({
        name: dayNames[d.getDay()],
        calories: dayLogs.reduce((s, l) => s + (Number(l.calories) || 0), 0),
        target: userGoals.calories,
      });
    }
    return days;
  }, [weekFoodLogs, userGoals.calories]);

  // Body weight trend chart
  const weightChartData = useMemo(() => {
    if (!bodyWeightLogs || bodyWeightLogs.length === 0) return [];
    return bodyWeightLogs.map((w) => ({
      date: new Date(w.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: Number(w.weight_kg),
    }));
  }, [bodyWeightLogs]);

  // Weight change
  const weightChange = useMemo(() => {
    if (!bodyWeightLogs || bodyWeightLogs.length < 2) return null;
    const first = Number(bodyWeightLogs[0].weight_kg);
    const last = Number(bodyWeightLogs[bodyWeightLogs.length - 1].weight_kg);
    return { change: last - first, start: first, current: last };
  }, [bodyWeightLogs]);

  // Streak dots
  const streakDots = useMemo(() => {
    if (!allWorkoutLogs) return [];
    const workoutDates = new Set(
      allWorkoutLogs.map((w) => new Date(w.completed_at).toISOString().split("T")[0])
    );
    const dots = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dots.push({ day: dayNames[d.getDay()], active: workoutDates.has(key), isToday: i === 0 });
    }
    return dots;
  }, [allWorkoutLogs]);

  // Weekly summary
  const weeklySummary = useMemo(() => {
    const bestWorkout = workoutLogs?.reduce<any>((best, w) => {
      if (!best || (Number(w.duration_mins) || 0) > (Number(best.duration_mins) || 0)) return w;
      return best;
    }, null);
    const activeDays = new Set(workoutLogs?.map(w => new Date(w.completed_at).toLocaleDateString("en-US", { weekday: "long" })) || []);
    const mostActiveDay = activeDays.size > 0 ? Array.from(activeDays)[0] : "—";
    const onTrack = weekWorkouts >= userGoals.workouts;
    const behindBy = Math.max(userGoals.workouts - weekWorkouts, 0);
    const message = onTrack
      ? "Great week! You're crushing your goals 💪"
      : behindBy === 1
      ? "Just 1 more workout to hit your goal — let's go!"
      : `You're ${behindBy} workouts behind — let's catch up!`;
    return { bestWorkout, mostActiveDay, message, onTrack };
  }, [workoutLogs, weekWorkouts, userGoals.workouts]);

  // Recommended plans
  const recommendedPlans = useMemo(() => {
    const goal = (profile?.fitness_goal || "").toLowerCase();
    if (goal.includes("lose") || goal.includes("fat")) return PLAN_RECOMMENDATIONS["lose weight"];
    if (goal.includes("muscle") || goal.includes("build") || goal.includes("strength")) return PLAN_RECOMMENDATIONS["build muscle"];
    if (goal.includes("endurance") || goal.includes("cardio")) return PLAN_RECOMMENDATIONS["improve endurance"];
    return PLAN_RECOMMENDATIONS.default;
  }, [profile?.fitness_goal]);

  const isLoading = profileLoading || todayFoodLoading || workoutsLoading;

  const tooltipStyle = {
    contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" },
    labelStyle: { color: "hsl(var(--muted-foreground))" },
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-muted-foreground text-sm">{today}</p>
          <h1 className="text-3xl md:text-4xl font-display mt-1">
            WELCOME BACK, <span className="text-gradient-primary">{displayName.toUpperCase()}</span>
          </h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 italic text-muted-foreground text-sm"
        >
          {quote}
        </motion.div>

        {/* 4A. Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            : stats.map((s, i) => (
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
                  <div className="flex items-end gap-2">
                    <div className="font-display text-3xl text-foreground">{s.value}</div>
                    {s.trend && (
                      s.trend === "up"
                        ? <TrendingUp className="h-4 w-4 text-primary mb-1" />
                        : <TrendingDown className="h-4 w-4 text-secondary mb-1" />
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">{s.target}</span>
                </motion.div>
              ))}
        </div>

        {/* Section 2: Recommended Plans */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-lg text-foreground">RECOMMENDED FOR YOU</h2>
            </div>
            <Link to="/workouts" className="text-xs text-primary hover:underline flex items-center gap-1">
              See All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
            {recommendedPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="min-w-[260px] md:min-w-0 bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-base text-foreground">{plan.name}</h3>
                  <Badge variant={plan.difficulty === "Advanced" ? "destructive" : plan.difficulty === "Intermediate" ? "default" : "secondary"} className="text-[10px]">
                    {plan.difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3 flex-1">{plan.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{plan.daysPerWeek}x/week</span>
                  <span>⏱ {plan.duration}</span>
                </div>
                <Link to="/workouts">
                  <Button variant="outline" size="sm" className="w-full">Start Plan</Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Streak Tracker + Weekly Goals */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-lg text-foreground">WORKOUT STREAK</h2>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-secondary/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-display text-3xl text-foreground">{streak}</div>
                    <div className="text-[10px] text-muted-foreground -mt-1">DAYS</div>
                  </div>
                </div>
                {streak >= 7 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-secondary rounded-full flex items-center justify-center"
                  >
                    <Flame className="h-3.5 w-3.5 text-secondary-foreground" />
                  </motion.div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium">
                  {streak === 0 ? "Start your streak today!" : streak < 3 ? "You're building momentum!" : streak < 7 ? "Great consistency!" : "You're on fire! 🔥"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {streak === 0 ? "Complete a workout to start." : `${streak} consecutive day${streak !== 1 ? "s" : ""} of training.`}
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              {streakDots.map((dot, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                    dot.active ? "bg-secondary/20 border-2 border-secondary" : dot.isToday ? "bg-muted border-2 border-dashed border-muted-foreground/30" : "bg-muted border border-border"
                  }`}>
                    {dot.active ? <Flame className="h-4 w-4 text-secondary" /> : dot.isToday ? <span className="text-[10px] text-muted-foreground">?</span> : null}
                  </div>
                  <span className={`text-[10px] ${dot.isToday ? "text-foreground font-bold" : "text-muted-foreground"}`}>{dot.day}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Goals */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">WEEKLY GOALS</h2>
            </div>
            <div className="space-y-5">
              {weeklyGoals.map((g) => {
                const pct = Math.min((g.current / g.target) * 100, 100);
                const met = pct >= 100;
                return (
                  <div key={g.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {met && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        <span className="text-sm text-foreground font-medium">{g.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {g.current.toLocaleString()} / {g.target.toLocaleString()} {g.unit}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${g.color} ${met ? "glow-primary" : ""}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-display text-foreground">{weeklyGoalPct}%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4B & 4C: Workout Duration + Calorie Intake Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {weekFoodLoading ? <ChartSkeleton /> : (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-lg text-foreground">WORKOUT DURATION</h2>
                </div>
                <Link to="/workouts" className="text-xs text-primary hover:underline">View All</Link>
              </div>
              {weeklyWorkoutChart.some(d => d.duration > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyWorkoutChart}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="duration" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No workouts this week yet</div>
              )}
              {/* Last 5 workouts */}
              {workoutLogs && workoutLogs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  {workoutLogs.slice(0, 5).map((w) => (
                    <div key={w.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{w.workout_name}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(w.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        {w.duration_mins && <span>{w.duration_mins} min</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {weekFoodLoading ? <ChartSkeleton /> : (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-secondary" />
                  <h2 className="font-display text-lg text-foreground">DAILY CALORIES</h2>
                </div>
                <Link to="/nutrition" className="text-xs text-primary hover:underline">Log Meal</Link>
              </div>
              {weeklyCalorieChart.some(d => d.calories > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyCalorieChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="calories" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ fill: "hsl(var(--secondary))", r: 4 }} name="Calories" />
                    <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No nutrition data this week</div>
              )}
              {/* Macro targets vs actual */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {[
                  { label: "Calories", value: todayCalories, max: userGoals.calories, unit: "kcal", color: "bg-secondary" },
                  { label: "Protein", value: todayProtein, max: userGoals.protein, unit: "g", color: "bg-primary" },
                ].map((m) => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="text-foreground">{Math.round(m.value)} / {m.max} {m.unit}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.color}`} style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Macros Donut + Weight Trend */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="font-display text-lg text-foreground mb-4">TODAY'S MACROS</h2>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={macroDonutData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                    {macroDonutData.map((_, i) => (
                      <Cell key={i} fill={Object.values(MACRO_COLORS)[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {[
                  { key: "protein", label: "Protein", val: todayProtein, max: userGoals.protein },
                  { key: "carbs", label: "Carbs", val: todayCarbs, max: 250 },
                  { key: "fats", label: "Fats", val: todayFats, max: 70 },
                ].map((m) => (
                  <div key={m.key}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: MACRO_COLORS[m.key as keyof typeof MACRO_COLORS] }} />
                      <span className="text-sm text-foreground">{m.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-5">{Math.round(m.val)}g / {m.max}g</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 4D: Weight / Progress Chart */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg text-foreground">WEIGHT TREND</h2>
              </div>
              <Link to="/progress" className="text-xs text-primary hover:underline">Log Progress</Link>
            </div>
            {weightChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Weight (kg)" />
                  </LineChart>
                </ResponsiveContainer>
                {weightChange && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    {weightChange.change < 0 ? (
                      <TrendingDown className="h-4 w-4 text-primary" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-secondary" />
                    )}
                    <span className="text-foreground font-medium">
                      {Math.abs(weightChange.change).toFixed(1)} kg {weightChange.change < 0 ? "lost" : "gained"}
                    </span>
                    <span className="text-muted-foreground text-xs">({weightChange.start} → {weightChange.current} kg)</span>
                  </div>
                )}
              </>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
                No weight data yet. <Link to="/progress" className="text-primary ml-1 hover:underline">Log your weight</Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* 4E: Weekly Summary Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">THIS WEEK</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="font-display text-2xl text-foreground">{weekWorkouts}/{userGoals.workouts}</div>
              <div className="text-xs text-muted-foreground">Workouts</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl text-foreground">{weekAvgCalories.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Avg Calories/Day</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl text-foreground">{weeklySummary.bestWorkout?.workout_name || "—"}</div>
              <div className="text-xs text-muted-foreground">Best Workout</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl text-foreground">{weeklySummary.mostActiveDay}</div>
              <div className="text-xs text-muted-foreground">Most Active Day</div>
            </div>
          </div>
          <div className={`rounded-lg p-3 text-sm text-center font-medium ${weeklySummary.onTrack ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
            {weeklySummary.message}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display text-xl mb-4 text-foreground">QUICK ACTIONS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((a, i) => (
              <motion.div key={a.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}>
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

        {/* BMI */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">BMI CALCULATOR</h2>
          </div>
          {bmi ? (
            <div>
              <div className="font-display text-4xl text-foreground">{bmi.toFixed(1)}</div>
              <p className="text-muted-foreground text-sm mt-1">
                {bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal weight" : bmi < 30 ? "Overweight" : "Obese"}
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">Set up your profile with height and weight to see your BMI.</p>
              <Link to="/profile"><Button variant="hero" size="sm" className="mt-4">Set Up Profile</Button></Link>
            </>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
