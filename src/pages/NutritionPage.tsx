import { motion } from "framer-motion";
import { Apple, Upload, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

export default function NutritionPage() {
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
          className="bg-card border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-4 hover:border-primary/30 transition-all cursor-pointer"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="text-foreground font-medium">Drop your food photo here</p>
          <p className="text-muted-foreground text-sm">or click to browse</p>
          <Button variant="hero" size="sm">Upload Image</Button>
        </motion.div>

        {/* Daily tracker placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl text-foreground">DAILY NUTRITION TRACKER</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Start logging meals to see your daily macro breakdown and weekly summary charts.
          </p>
          <div className="grid grid-cols-4 gap-4 mt-6">
            {["Calories", "Protein", "Carbs", "Fats"].map((m) => (
              <div key={m} className="text-center">
                <div className="h-2 bg-muted rounded-full mb-2">
                  <div className="h-2 bg-primary/30 rounded-full w-0" />
                </div>
                <span className="text-xs text-muted-foreground">{m}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
