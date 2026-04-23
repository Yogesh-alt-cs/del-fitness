import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const order = ["light", "dark", "glass"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next = () => {
    const idx = order.indexOf((theme as typeof order[number]) ?? "dark");
    setTheme(order[(idx + 1) % order.length]);
  };

  const Icon = theme === "light" ? Sun : theme === "glass" ? Sparkles : Moon;
  const label =
    theme === "light" ? "Light theme" : theme === "glass" ? "Liquid Glass theme" : "Dark theme";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={next}
      className="h-9 w-9 rounded-lg"
      aria-label={`Theme: ${label}. Click to switch.`}
      title={label}
    >
      <Icon className="h-4 w-4 transition-all" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
