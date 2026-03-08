import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Timer, Plus, Minus, Check, X, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type ExerciseLog = {
  name: string;
  sets: { reps: number; weight: number; completed: boolean }[];
};

type Props = {
  onClose: () => void;
  initialExercises?: string[];
  workoutName?: string;
};

export default function WorkoutLogger({ onClose, initialExercises, workoutName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exercises, setExercises] = useState<ExerciseLog[]>(
    initialExercises?.map((name) => ({
      name,
      sets: [{ reps: 10, weight: 0, completed: false }],
    })) || [{ name: "", sets: [{ reps: 10, weight: 0, completed: false }] }]
  );
  const [name, setName] = useState(workoutName || "My Workout");
  const [saving, setSaving] = useState(false);

  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, { name: "", sets: [{ reps: 10, weight: 0, completed: false }] }]);
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { reps: 10, weight: 0, completed: false }] } : ex
      )
    );
  };

  const removeExercise = (exIdx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const updateSet = (exIdx: number, setIdx: number, field: "reps" | "weight", value: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)),
            }
          : ex
      )
    );
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, completed: !s.completed } : s)),
            }
          : ex
      )
    );
  };

  const saveWorkout = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const validExercises = exercises.filter((ex) => ex.name.trim());
      const { data: wl, error: wlError } = await supabase
        .from("workout_logs")
        .insert({
          user_id: user.id,
          workout_name: name,
          exercises_json: validExercises as any,
          duration_mins: Math.floor(timerSeconds / 60),
        })
        .select("id")
        .single();

      if (wlError) throw wlError;

      // Insert individual exercise sets
      const setsToInsert = validExercises.flatMap((ex) =>
        ex.sets
          .filter((s) => s.completed)
          .map((s, idx) => ({
            workout_log_id: wl.id,
            user_id: user.id,
            exercise_name: ex.name,
            set_number: idx + 1,
            reps: s.reps,
            weight_kg: s.weight,
          }))
      );

      if (setsToInsert.length > 0) {
        await supabase.from("exercise_sets").insert(setsToInsert);
      }

      toast({ title: "Workout saved!", description: `${validExercises.length} exercises, ${Math.floor(timerSeconds / 60)} min` });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 text-center";

  const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer className="h-5 w-5 text-primary" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent font-display text-xl text-foreground focus:outline-none"
            placeholder="Workout name"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Timer */}
      <div className="p-4 bg-muted/50 flex items-center justify-center gap-4">
        <div className="font-display text-4xl text-foreground tabular-nums">{formatTime(timerSeconds)}</div>
        <div className="flex gap-2">
          <Button
            variant={timerRunning ? "outline" : "hero"}
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setTimerRunning(!timerRunning)}
          >
            {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {completedSets}/{totalSets} sets
        </div>
      </div>

      {/* Exercises */}
      <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={ex.name}
                onChange={(e) =>
                  setExercises((prev) =>
                    prev.map((ex2, i) => (i === exIdx ? { ...ex2, name: e.target.value } : ex2))
                  )
                }
                className="flex-1 bg-transparent text-sm font-medium text-foreground focus:outline-none border-b border-transparent focus:border-primary/40 pb-1"
                placeholder="Exercise name"
              />
              <button onClick={() => removeExercise(exIdx)} className="text-muted-foreground hover:text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Set headers */}
            <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-xs text-muted-foreground px-1">
              <span>Set</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Weight (kg)</span>
              <span />
            </div>

            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center">
                <span className="text-xs text-muted-foreground text-center">{setIdx + 1}</span>
                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) => updateSet(exIdx, setIdx, "reps", parseInt(e.target.value) || 0)}
                  className={inputClass}
                />
                <input
                  type="number"
                  step="0.5"
                  value={set.weight}
                  onChange={(e) => updateSet(exIdx, setIdx, "weight", parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
                <button
                  onClick={() => toggleSetComplete(exIdx, setIdx)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                    set.completed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              onClick={() => addSet(exIdx)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add Set
            </button>
          </div>
        ))}

        <button
          onClick={addExercise}
          className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Exercise
        </button>
      </div>

      {/* Save */}
      <div className="p-4 border-t border-border">
        <Button variant="hero" className="w-full" onClick={saveWorkout} disabled={saving}>
          {saving ? "Saving..." : "Finish & Save Workout"}
        </Button>
      </div>
    </motion.div>
  );
}
