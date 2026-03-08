import { motion } from "framer-motion";
import { Flame, Dumbbell, Apple, Play, Bot, Calculator, Trophy, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

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

const WEEKLY_GOALS = {
  workouts: 4,
  calories: 2200,
  protein: 160,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [quote, setQuote] = useState("The only bad workout is the one that didn't happen.");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: todayFoodLogs } = useQuery({
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

  const { data: weekFoodLogs } = useQuery({
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

  const { data: workoutLogs } = useQuery({
    queryKey: ["week_workouts", user?.id],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("completed_at", weekAgo);
      return data || [];
    },
    enabled: !!user,
  });

  // All workout logs for streak calculation
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

  // Streak calculation: consecutive days with a workout going backwards from today
  const streak = useMemo(() => {
    if (!allWorkoutLogs || allWorkoutLogs.length === 0) return 0;
    const workoutDates = new Set(
      allWorkoutLogs.map((w) => new Date(w.completed_at).toISOString().split("T")[0])
    );
    let count = 0;
    const d = new Date();
    // Check today first; if no workout today, start from yesterday
    const todayStr = d.toISOString().split("T")[0];
    if (!workoutDates.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split("T")[0];
      if (workoutDates.has(key)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [allWorkoutLogs]);

  // Weekly goals progress
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

  const weeklyGoals = [
    {
      label: "Workouts",
      current: weekWorkouts,
      target: WEEKLY_GOALS.workouts,
      unit: "sessions",
      color: "bg-primary",
    },
    {
      label: "Avg Calories",
      current: weekAvgCalories,
      target: WEEKLY_GOALS.calories,
      unit: "kcal/day",
      color: "bg-secondary",
    },
    {
      label: "Avg Protein",
      current: weekAvgProtein,
      target: WEEKLY_GOALS.protein,
      unit: "g/day",
      color: "bg-primary",
    },
  ];

  const stats = [
    { label: "Calories", value: todayCalories.toLocaleString(), target: "/ 2,200", icon: Flame, color: "text-secondary" },
    { label: "Protein", value: `${Math.round(todayProtein)}g`, target: "/ 160g", icon: Apple, color: "text-primary" },
    { label: "Workouts", value: String(weekWorkouts), target: "this week", icon: Dumbbell, color: "text-primary" },
    { label: "Streak", value: streak > 0 ? String(streak) : "—", target: streak > 0 ? "days" : "start today", icon: Trophy, color: "text-secondary" },
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
    : [
        { name: "Protein", value: 33 },
        { name: "Carbs", value: 34 },
        { name: "Fats", value: 33 },
      ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyChartData = (() => {
    const days: { name: string; calories: number; protein: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = weekFoodLogs?.filter((l) => l.logged_at.startsWith(dateStr)) || [];
      days.push({
        name: dayNames[d.getDay()],
        calories: dayLogs.reduce((s, l) => s + (Number(l.calories) || 0), 0),
        protein: dayLogs.reduce((s, l) => s + (Number(l.protein_g) || 0), 0),
      });
    }
    return days;
  })();

  // Streak flame dots for last 7 days
  const streakDots = useMemo(() => {
    if (!allWorkoutLogs) return [];
    const workoutDates = new Set(
      allWorkoutLogs.map((w) => new Date(w.completed_at).toISOString().split("T")[0])
    );
    const dots = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dots.push({
        day: dayNames[d.getDay()],
        active: workoutDates.has(key),
        isToday: i === 0,
      });
    }
    return dots;
  }, [allWorkoutLogs]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-muted-foreground text-sm">{today}</p>
          <h1 className="text-3xl md:text-4xl font-display mt-1">
            WELCOME BACK, <span className="text-gradient-primary">{displayName.toUpperCase()}</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 italic text-muted-foreground text-sm"
        >
          {quote}
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

        {/* Streak Tracker + Weekly Goals */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Streak Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-secondary rounded-full flex items-center justify-center"
                  >
                    <Flame className="h-3.5 w-3.5 text-secondary-foreground" />
                  </motion.div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium">
                  {streak === 0
                    ? "Start your streak today!"
                    : streak < 3
                    ? "You're building momentum!"
                    : streak < 7
                    ? "Great consistency! Keep it up!"
                    : "You're on fire! 🔥"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {streak === 0
                    ? "Complete a workout to start."
                    : `${streak} consecutive day${streak !== 1 ? "s" : ""} of training.`}
                </p>
              </div>
            </div>
            {/* 7-day dots */}
            <div className="flex justify-between">
              {streakDots.map((dot, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                      dot.active
                        ? "bg-secondary/20 border-2 border-secondary"
                        : dot.isToday
                        ? "bg-muted border-2 border-dashed border-muted-foreground/30"
                        : "bg-muted border border-border"
                    }`}
                  >
                    {dot.active ? (
                      <Flame className="h-4 w-4 text-secondary" />
                    ) : dot.isToday ? (
                      <span className="text-[10px] text-muted-foreground">?</span>
                    ) : null}
                  </div>
                  <span className={`text-[10px] ${dot.isToday ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                    {dot.day}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Goals */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
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
                <span className="text-sm font-display text-foreground">
                  {Math.round(
                    weeklyGoals.reduce((a, g) => a + Math.min((g.current / g.target) * 100, 100), 0) / weeklyGoals.length
                  )}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="font-display text-lg text-foreground mb-4">WEEKLY CALORIES</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="name" stroke="hsl(0,0%,64%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(0,0%,64%)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(0,0%,8%)", border: "1px solid hsl(0,0%,16%)", borderRadius: "8px", color: "hsl(0,0%,94%)" }}
                  labelStyle={{ color: "hsl(0,0%,64%)" }}
                />
                <Bar dataKey="calories" fill="hsl(354,100%,62%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="protein" fill="hsl(66,92%,52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-secondary inline-block" /> Calories</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Protein (g)</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="font-display text-lg text-foreground mb-4">TODAY'S MACROS</h2>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={macroDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {macroDonutData.map((_, i) => (
                      <Cell key={i} fill={Object.values(MACRO_COLORS)[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {[
                  { key: "protein", label: "Protein", val: todayProtein, max: 160 },
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
        </div>

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
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
