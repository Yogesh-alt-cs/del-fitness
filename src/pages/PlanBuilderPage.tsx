import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, Star, ClipboardList } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type PlanExercise = { name: string; sets: number; reps: number };
const blank = (): PlanExercise => ({ name: "", sets: 3, reps: 10 });

const PlanBuilderPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<PlanExercise[]>([blank()]);
  const [saving, setSaving] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["workout_plans", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("workout_plans").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = (i: number, patch: Partial<PlanExercise>) =>
    setExercises((ex) => ex.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["workout_plans"] });
    qc.invalidateQueries({ queryKey: ["active_plan"] });
  };

  const save = async () => {
    const valid = exercises.filter((e) => e.name.trim());
    if (!name.trim() || valid.length === 0) {
      toast({ title: "Add a name and at least one exercise", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (user) await supabase.from("workout_plans").update({ is_active: false }).eq("user_id", user.id);
    const { error } = await supabase.from("workout_plans").insert({
      user_id: user!.id, name: name.trim(), exercises: valid, is_active: true,
    });
    setSaving(false);
    if (error) return toast({ title: "Couldn't save plan", description: error.message, variant: "destructive" });
    toast({ title: "Plan saved", description: "It's now on your dashboard." });
    setName(""); setExercises([blank()]); refresh();
  };

  const activate = async (id: string) => {
    await supabase.from("workout_plans").update({ is_active: false }).eq("user_id", user!.id);
    await supabase.from("workout_plans").update({ is_active: true }).eq("id", id);
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("workout_plans").delete().eq("id", id);
    refresh();
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="font-display text-4xl text-foreground">PLAN BUILDER</h1>
          <p className="text-muted-foreground text-sm">Create your own workout and show it on your dashboard.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <Input placeholder="Workout name (e.g. Push Day)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-[1fr_70px_70px_40px] gap-2 text-xs text-muted-foreground px-1">
            <span>Exercise</span><span>Sets</span><span>Reps</span><span />
          </div>
          {exercises.map((ex, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_70px_40px] gap-2">
              <Input placeholder="Bench Press" value={ex.name} onChange={(e) => update(i, { name: e.target.value })} />
              <Input type="number" min={1} value={ex.sets} onChange={(e) => update(i, { sets: Math.max(1, +e.target.value) })} />
              <Input type="number" min={1} value={ex.reps} onChange={(e) => update(i, { reps: Math.max(1, +e.target.value) })} />
              <Button variant="ghost" size="icon" aria-label="Remove exercise" disabled={exercises.length === 1}
                onClick={() => setExercises((x) => x.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" onClick={() => setExercises((x) => [...x, blank()])}>
              <Plus className="h-4 w-4 mr-1" /> Add Exercise
            </Button>
            <Button variant="hero" onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Plan"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl text-foreground flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> MY PLANS</h2>
          {plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
          {plans.map((p) => {
            const ex = (p.exercises as PlanExercise[]) || [];
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg text-foreground">{p.name}</h3>
                    {p.is_active && <Badge>On dashboard</Badge>}
                  </div>
                  <div className="flex gap-1">
                    {!p.is_active && (
                      <Button size="sm" variant="outline" onClick={() => activate(p.id)}><Star className="h-3.5 w-3.5 mr-1" /> Use</Button>
                    )}
                    <Button size="icon" variant="ghost" aria-label="Delete plan" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {ex.map((e, i) => <li key={i}>{e.name} — {e.sets} × {e.reps}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default PlanBuilderPage;
