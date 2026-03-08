import { motion } from "framer-motion";
import { Flame, Dumbbell, Apple, Play, Bot, Calculator, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const quickActions = [
  { label: "Log Food", icon: Apple, path: "/nutrition", color: "bg-primary/10 text-primary" },
  { label: "Start Workout", icon: Dumbbell, path: "/workouts", color: "bg-secondary/10 text-secondary" },
  { label: "Watch Video", icon: Play, path: "/videos", color: "bg-primary/10 text-primary" },
  { label: "Ask Coach", icon: Bot, path: "/coach", color: "bg-secondary/10 text-secondary" },
];

const MACRO_COLORS = {
  protein: "hsl(66, 92%, 52%)",   // primary
  carbs: "hsl(45, 93%, 47%)",     // yellow
  fats: "hsl(24, 95%, 53%)",      // orange
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

  const stats = [
    { label: "Calories", value: todayCalories.toLocaleString(), target: "/ 2,200", icon: Flame, color: "text-secondary" },
    { label: "Protein", value: `${Math.round(todayProtein)}g`, target: "/ 160g", icon: Apple, color: "text-primary" },
    { label: "Workouts", value: String(weekWorkouts), target: "this week", icon: Dumbbell, color: "text-primary" },
    { label: "Streak", value: "—", target: "days", icon: Trophy, color: "text-secondary" },
  ];

  // BMI
  let bmi: number | null = null;
  if (profile?.weight_kg && profile?.height_cm) {
    const hm = Number(profile.height_cm) / 100;
    bmi = Number(profile.weight_kg) / (hm * hm);
  }

  // Macro donut data
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

  // Weekly bar chart data
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyChartData = (() => {
    const days: { name: string; calories: number; protein: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = weekFoodLogs?.filter(
        (l) => l.logged_at.startsWith(dateStr)
      ) || [];
      days.push({
        name: dayNames[d.getDay()],
        calories: dayLogs.reduce((s, l) => s + (Number(l.calories) || 0), 0),
        protein: dayLogs.reduce((s, l) => s + (Number(l.protein_g) || 0), 0),
      });
    }
    return days;
  })();

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

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Calories Chart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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

          {/* Macro Donut */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
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
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: MACRO_COLORS.protein }} />
                    <span className="text-sm text-foreground">Protein</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-5">{Math.round(todayProtein)}g / 160g</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: MACRO_COLORS.carbs }} />
                    <span className="text-sm text-foreground">Carbs</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-5">{Math.round(todayCarbs)}g / 250g</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: MACRO_COLORS.fats }} />
                    <span className="text-sm text-foreground">Fats</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-5">{Math.round(todayFats)}g / 70g</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display text-xl mb-4 text-foreground">QUICK ACTIONS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((a, i) => (
              <motion.div key={a.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
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
          transition={{ delay: 0.4 }}
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
