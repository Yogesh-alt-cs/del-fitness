import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ChevronDown, UtensilsCrossed, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Meal = {
  name: string;
  type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: string[];
  instructions: string;
};

type MealDay = {
  day: string;
  meals: Meal[];
};

type MealPlanData = {
  planName: string;
  dailyCalories: number;
  days: MealDay[];
};

export default function MealPlanGenerator() {
  const { toast } = useToast();
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<MealPlanData | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const [goal, setGoal] = useState("build muscle");
  const [dietaryPreferences, setDietaryPreferences] = useState("no restrictions");
  const [mealsPerDay, setMealsPerDay] = useState("4");
  const [calorieTarget, setCalorieTarget] = useState("2200");

  const inputClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40";

  const handleGenerate = async () => {
    setGenerating(true);
    setPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-fitness", {
        body: {
          type: "meal_plan",
          payload: { goal, dietaryPreferences, mealsPerDay, calorieTarget },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setPlan(data);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const mealTypeColors: Record<string, string> = {
    breakfast: "bg-yellow-500/10 text-yellow-500",
    lunch: "bg-primary/10 text-primary",
    dinner: "bg-secondary/10 text-secondary",
    snack: "bg-orange-500/10 text-orange-500",
  };

  return (
    <div className="space-y-4">
      {/* Generator toggle */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-secondary/20 rounded-xl overflow-hidden glow-secondary"
      >
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="w-full p-6 flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-display text-lg text-foreground">AI MEAL PLAN GENERATOR</h3>
            <p className="text-muted-foreground text-sm">Get a custom 7-day meal plan based on your goals.</p>
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
                <label className="text-xs text-muted-foreground mb-1 block">Fitness Goal</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)} className={inputClass}>
                  <option value="build muscle">Build Muscle</option>
                  <option value="lose weight">Lose Weight</option>
                  <option value="maintain weight">Maintain Weight</option>
                  <option value="improve endurance">Improve Endurance</option>
                  <option value="general health">General Health</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dietary Preferences</label>
                <select value={dietaryPreferences} onChange={(e) => setDietaryPreferences(e.target.value)} className={inputClass}>
                  <option value="no restrictions">No Restrictions</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="keto">Keto</option>
                  <option value="paleo">Paleo</option>
                  <option value="gluten-free">Gluten-Free</option>
                  <option value="high protein">High Protein</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Meals Per Day</label>
                <select value={mealsPerDay} onChange={(e) => setMealsPerDay(e.target.value)} className={inputClass}>
                  <option value="3">3 meals</option>
                  <option value="4">4 meals</option>
                  <option value="5">5 meals</option>
                  <option value="6">6 meals</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Daily Calories Target</label>
                <select value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} className={inputClass}>
                  <option value="1500">1,500 cal</option>
                  <option value="1800">1,800 cal</option>
                  <option value="2000">2,000 cal</option>
                  <option value="2200">2,200 cal</option>
                  <option value="2500">2,500 cal</option>
                  <option value="2800">2,800 cal</option>
                  <option value="3000">3,000 cal</option>
                </select>
              </div>
            </div>
            <Button
              variant="hero"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating your meal plan...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate 7-Day Meal Plan</>
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Generated Plan */}
      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-secondary/20 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl text-foreground">{plan.planName}</h2>
              <p className="text-muted-foreground text-sm">
                ~{plan.dailyCalories} cal/day • 7 days
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPlan(null)}>
              Clear
            </Button>
          </div>

          <div className="space-y-2">
            {plan.days?.map((day, i) => {
              const dayCals = day.meals?.reduce((s, m) => s + (m.calories || 0), 0) || 0;
              return (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded">{day.day}</span>
                      <span className="text-xs text-muted-foreground">{day.meals?.length || 0} meals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{dayCals} cal</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedDay === i ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {expandedDay === i && day.meals && (
                    <div className="px-4 pb-4 space-y-3">
                      {day.meals.map((meal, j) => (
                        <div key={j} className="bg-muted rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${mealTypeColors[meal.type?.toLowerCase()] || "bg-muted text-muted-foreground"}`}>
                                {meal.type}
                              </span>
                              <span className="text-sm font-medium text-foreground">{meal.name}</span>
                            </div>
                            <span className="text-xs text-primary">{meal.calories} cal</span>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>P: {meal.protein_g}g</span>
                            <span>C: {meal.carbs_g}g</span>
                            <span>F: {meal.fat_g}g</span>
                          </div>
                          {meal.ingredients && meal.ingredients.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="text-foreground">Ingredients: </span>
                              {meal.ingredients.join(", ")}
                            </div>
                          )}
                          {meal.instructions && (
                            <p className="text-xs text-muted-foreground/80">{meal.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
