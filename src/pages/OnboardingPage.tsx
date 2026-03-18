import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Dumbbell, Target, Zap, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/delfitness-logo.png";

const steps = [
  {
    key: "fitness_goal",
    title: "What's your fitness goal?",
    icon: Target,
    options: [
      { value: "muscle_gain", label: "Muscle Gain", emoji: "💪" },
      { value: "fat_loss", label: "Fat Loss", emoji: "🔥" },
      { value: "endurance", label: "Endurance", emoji: "🏃" },
      { value: "general_fitness", label: "General Fitness", emoji: "⚡" },
    ],
  },
  {
    key: "experience_level",
    title: "What's your experience level?",
    icon: Zap,
    options: [
      { value: "beginner", label: "Beginner", emoji: "🌱" },
      { value: "intermediate", label: "Intermediate", emoji: "💪" },
      { value: "advanced", label: "Advanced", emoji: "🏆" },
    ],
  },
  {
    key: "available_equipment",
    title: "What equipment do you have?",
    icon: Dumbbell,
    options: [
      { value: "none", label: "No Equipment", emoji: "🤸" },
      { value: "dumbbells", label: "Dumbbells", emoji: "🏋️" },
      { value: "full_gym", label: "Full Gym", emoji: "🏢" },
    ],
  },
  {
    key: "workout_frequency",
    title: "How many days per week can you train?",
    icon: Calendar,
    options: [
      { value: "2", label: "2 Days", emoji: "2️⃣" },
      { value: "3", label: "3 Days", emoji: "3️⃣" },
      { value: "4", label: "4 Days", emoji: "4️⃣" },
      { value: "5", label: "5 Days", emoji: "5️⃣" },
      { value: "6", label: "6 Days", emoji: "6️⃣" },
    ],
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = steps[step];

  const selectOption = (value: string) => {
    const updated = { ...answers, [current.key]: value };
    setAnswers(updated);

    if (step < steps.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      // Save to localStorage and go to auth
      localStorage.setItem("delfitness_onboarding", JSON.stringify(updated));
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="mb-8 flex items-center gap-2">
        <img src={logo} alt="DelFitness" className="h-9 w-9 object-contain" />
        <span className="font-display text-2xl text-foreground">DELFITNESS</span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <current.icon className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-foreground">{current.title}</h2>
          </div>

          <div className="space-y-3">
            {current.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectOption(opt.value)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                  answers[current.key] === opt.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/30"
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="font-medium">{opt.label}</span>
                {answers[current.key] === opt.value && (
                  <ArrowRight className="h-4 w-4 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-4 mt-8">
        {step > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground">
          Skip
        </Button>
      </div>
    </div>
  );
}
