import { motion } from "framer-motion";
import { Apple, Upload, BarChart3, Loader2, X, Check } from "lucide-react";
import MealPlanGenerator from "@/components/MealPlanGenerator";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

type FoodAnalysis = {
  foodName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  portionSize: string;
  healthScore: number;
  detectedItems: string[];
  improvements: string[];
};

export default function NutritionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: foodLogs, refetch: refetchLogs } = useQuery({
    queryKey: ["food_logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("food_logs")
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const todayLogs = foodLogs?.filter(
    (l) => new Date(l.logged_at).toDateString() === new Date().toDateString()
  ) || [];

  const todayTotals = todayLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + (Number(l.calories) || 0),
      protein: acc.protein + (Number(l.protein_g) || 0),
      carbs: acc.carbs + (Number(l.carbs_g) || 0),
      fats: acc.fats + (Number(l.fat_g) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (!user) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setAnalyzing(true);
    setAnalysis(null);

    try {
      // Upload to storage
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("food-images")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("food-images").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      // Analyze with AI
      const { data, error } = await supabase.functions.invoke("ai-fitness", {
        body: { type: "food_analysis", payload: { imageUrl } },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data);

      // Save to food_logs
      await supabase.from("food_logs").insert({
        user_id: user.id,
        food_name: data.foodName || "Unknown",
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
        fiber_g: data.fiber_g,
        sugar_g: data.sugar_g,
        health_score: data.healthScore,
        portion_size: data.portionSize,
        detected_items: data.detectedItems,
        improvements: data.improvements,
        image_url: imageUrl,
      });

      refetchLogs();
      toast({ title: "Food analyzed & logged!", description: `${data.foodName} — ${data.calories} cal` });
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }, [user, toast, refetchLogs]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const macroGoals = { calories: 2200, protein: 160, carbs: 250, fats: 70 };

  const MacroBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{Math.round(value)} / {max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            <span className="text-gradient-primary">AI</span> FOOD ANALYZER
          </h1>
          <p className="text-muted-foreground mt-2">Upload a photo of your meal to get instant nutritional analysis.</p>
        </motion.div>

        {/* Upload area */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-card border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-4 transition-all cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          {preview ? (
            <img src={preview} alt="Food preview" className="max-h-48 rounded-lg object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
          )}
          {analyzing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-foreground font-medium">Analyzing your meal...</span>
            </div>
          ) : (
            <>
              <p className="text-foreground font-medium">Drop your food photo here</p>
              <p className="text-muted-foreground text-sm">or click to browse</p>
            </>
          )}
        </motion.div>

        {/* Analysis result */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-foreground">{analysis.foodName}</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  analysis.healthScore >= 7 ? "bg-primary/10 text-primary" :
                  analysis.healthScore >= 4 ? "bg-yellow-500/10 text-yellow-500" :
                  "bg-secondary/10 text-secondary"
                }`}>
                  {analysis.healthScore}/10
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-4">Portion: {analysis.portionSize}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Calories", value: analysis.calories, unit: "kcal" },
                  { label: "Protein", value: analysis.protein_g, unit: "g" },
                  { label: "Carbs", value: analysis.carbs_g, unit: "g" },
                  { label: "Fats", value: analysis.fat_g, unit: "g" },
                ].map((m) => (
                  <div key={m.label} className="bg-muted rounded-lg p-3 text-center">
                    <div className="font-display text-2xl text-foreground">{m.value}</div>
                    <div className="text-xs text-muted-foreground">{m.unit} {m.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Fiber:</span> <span className="text-foreground">{analysis.fiber_g}g</span></div>
                <div><span className="text-muted-foreground">Sugar:</span> <span className="text-foreground">{analysis.sugar_g}g</span></div>
              </div>
            </div>

            {analysis.improvements?.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display text-lg mb-3 text-foreground">TIPS TO IMPROVE</h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Daily tracker */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">TODAY'S NUTRITION</h2>
          </div>
          <div className="space-y-3">
            <MacroBar label="Calories" value={todayTotals.calories} max={macroGoals.calories} color="bg-secondary" />
            <MacroBar label="Protein (g)" value={todayTotals.protein} max={macroGoals.protein} color="bg-primary" />
            <MacroBar label="Carbs (g)" value={todayTotals.carbs} max={macroGoals.carbs} color="bg-yellow-500" />
            <MacroBar label="Fats (g)" value={todayTotals.fats} max={macroGoals.fats} color="bg-orange-500" />
          </div>
        </motion.div>

        {/* Recent logs */}
        {foodLogs && foodLogs.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-xl text-foreground mb-4">RECENT MEALS</h2>
            <div className="space-y-3">
              {foodLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm text-foreground">{log.food_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(log.logged_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm text-primary font-medium">{log.calories} cal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meal Plan Generator */}
        <MealPlanGenerator />
      </div>
    </AppLayout>
  );
}
