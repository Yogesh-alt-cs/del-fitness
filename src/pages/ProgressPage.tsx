import { motion } from "framer-motion";
import { TrendingUp, Weight, BarChart3, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function ProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Body weight form
  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Exercise filter for strength chart
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  // --- Queries ---
  const { data: exerciseSets } = useQuery({
    queryKey: ["exercise_sets_progress", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_sets")
        .select("*")
        .eq("user_id", user!.id)
        .order("workout_log_id", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: workoutLogs } = useQuery({
    queryKey: ["workout_logs_progress", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: bodyWeightLogs, refetch: refetchWeight } = useQuery({
    queryKey: ["body_weight_logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("body_weight_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  // --- Derived data ---
  const exerciseNames = [...new Set(exerciseSets?.map((s) => s.exercise_name) || [])];
  const activeExercise = selectedExercise || exerciseNames[0] || "";

  // Strength progress: best weight per workout for the selected exercise
  const strengthData = (() => {
    if (!exerciseSets || !workoutLogs) return [];
    const logMap = new Map(workoutLogs.map((w) => [w.id, w.completed_at]));
    const filtered = exerciseSets.filter((s) => s.exercise_name === activeExercise && s.weight_kg);
    const byWorkout = new Map<string, number>();
    filtered.forEach((s) => {
      const date = logMap.get(s.workout_log_id);
      if (!date) return;
      const key = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const prev = byWorkout.get(key) || 0;
      if ((s.weight_kg || 0) > prev) byWorkout.set(key, Number(s.weight_kg));
    });
    return Array.from(byWorkout, ([date, weight]) => ({ date, weight }));
  })();

  // Body weight chart data
  const weightChartData = (bodyWeightLogs || []).map((l) => ({
    date: new Date(l.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: Number(l.weight_kg),
  }));

  // Weekly volume: total sets, reps, weight per week
  const volumeData = (() => {
    if (!exerciseSets || !workoutLogs) return [];
    const logMap = new Map(workoutLogs.map((w) => [w.id, w.completed_at]));
    const weekMap = new Map<string, { sets: number; reps: number; volume: number }>();
    exerciseSets.forEach((s) => {
      const date = logMap.get(s.workout_log_id);
      if (!date) return;
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const prev = weekMap.get(key) || { sets: 0, reps: 0, volume: 0 };
      weekMap.set(key, {
        sets: prev.sets + 1,
        reps: prev.reps + (s.reps || 0),
        volume: prev.volume + (s.weight_kg || 0) * (s.reps || 0),
      });
    });
    return Array.from(weekMap, ([week, v]) => ({ week, ...v }));
  })();

  const logWeight = async () => {
    const w = parseFloat(weightInput);
    if (!w || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("body_weight_logs").insert({ user_id: user.id, weight_kg: w });
      if (error) throw error;
      toast({ title: "Weight logged!" });
      setWeightInput("");
      refetchWeight();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const chartTooltipStyle = {
    contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" },
    labelStyle: { color: "hsl(var(--foreground))" },
    itemStyle: { color: "hsl(var(--primary))" },
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            <span className="text-gradient-primary">PROGRESS</span> TRACKING
          </h1>
          <p className="text-muted-foreground mt-2">Visualize your strength, weight, and training volume over time.</p>
        </motion.div>

        {/* Strength Progress */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">STRENGTH PROGRESS</h2>
          </div>
          {exerciseNames.length > 0 ? (
            <>
              <select
                value={activeExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground mb-4 focus:outline-none focus:border-primary/40"
              >
                {exerciseNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              {strengthData.length > 1 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={strengthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip {...chartTooltipStyle} />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} name="Weight (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">Log more workouts with this exercise to see a trend.</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No exercise data yet. Complete a workout to start tracking.</p>
          )}
        </motion.div>

        {/* Body Weight */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Weight className="h-5 w-5 text-secondary" />
            <h2 className="font-display text-xl text-foreground">BODY WEIGHT</h2>
          </div>
          <div className="flex gap-3 mb-4">
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Enter weight (kg)"
              className="bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground flex-1 focus:outline-none focus:border-primary/40"
            />
            <Button variant="hero" onClick={logWeight} disabled={saving || !weightInput}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Log</>}
            </Button>
          </div>
          {weightChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip {...chartTooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ fill: "hsl(var(--secondary))", r: 4 }} name="Weight (kg)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">{weightChartData.length === 1 ? "Log one more entry to see the trend." : "No body weight entries yet."}</p>
          )}
        </motion.div>

        {/* Training Volume */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">WEEKLY TRAINING VOLUME</h2>
          </div>
          {volumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip {...chartTooltipStyle} />
                <Legend />
                <Bar dataKey="sets" fill="hsl(var(--primary))" name="Sets" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reps" fill="hsl(var(--secondary))" name="Reps" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">No training data yet. Complete workouts to see volume trends.</p>
          )}

          {volumeData.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: "Total Sets", value: volumeData.reduce((a, v) => a + v.sets, 0) },
                { label: "Total Reps", value: volumeData.reduce((a, v) => a + v.reps, 0) },
                { label: "Total Volume (kg)", value: Math.round(volumeData.reduce((a, v) => a + v.volume, 0)) },
              ].map((s) => (
                <div key={s.label} className="bg-muted rounded-lg p-3 text-center">
                  <div className="font-display text-2xl text-foreground">{s.value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
