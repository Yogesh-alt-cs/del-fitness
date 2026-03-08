import { motion } from "framer-motion";
import { User, Settings, TrendingUp, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [goal, setGoal] = useState("");
  const [goalCalories, setGoalCalories] = useState("2200");
  const [goalProtein, setGoalProtein] = useState("160");
  const [goalWorkouts, setGoalWorkouts] = useState("4");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAge(profile.age?.toString() || "");
      setWeightKg(profile.weight_kg?.toString() || "");
      setHeightCm(profile.height_cm?.toString() || "");
      setGoal(profile.goal || "");
      setGoalCalories((profile as any).goal_calories?.toString() || "2200");
      setGoalProtein((profile as any).goal_protein?.toString() || "160");
      setGoalWorkouts((profile as any).goal_workouts_per_week?.toString() || "4");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        name: name || null,
        age: age ? parseInt(age) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        goal: goal || null,
        goal_calories: goalCalories ? parseInt(goalCalories) : 2200,
        goal_protein: goalProtein ? parseInt(goalProtein) : 160,
        goal_workouts_per_week: goalWorkouts ? parseInt(goalWorkouts) : 4,
      } as any).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const inputClass = "w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40";

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            YOUR <span className="text-gradient-primary">PROFILE</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-xl text-foreground">{name || "ATHLETE"}</p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
                <input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="75" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Fitness Goal</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)} className={inputClass}>
                  <option value="">Select goal</option>
                  <option value="lose_weight">Lose Weight</option>
                  <option value="build_muscle">Build Muscle</option>
                  <option value="maintain">Maintain</option>
                </select>
              </div>
            </div>

            {/* Weekly Goals Section */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Weekly Goals</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Calorie Target</label>
                  <input type="number" value={goalCalories} onChange={(e) => setGoalCalories(e.target.value)} placeholder="2200" min="500" max="10000" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Protein Target (g)</label>
                  <input type="number" value={goalProtein} onChange={(e) => setGoalProtein(e.target.value)} placeholder="160" min="10" max="500" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Workouts/Week</label>
                  <input type="number" value={goalWorkouts} onChange={(e) => setGoalWorkouts(e.target.value)} placeholder="4" min="1" max="14" className={inputClass} />
                </div>
              </div>
            </div>

            <Button variant="hero" type="submit" disabled={updateProfile.isPending} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {updateProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button variant="outline" onClick={handleSignOut} className="w-full border-secondary/30 text-secondary hover:bg-secondary/10">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
