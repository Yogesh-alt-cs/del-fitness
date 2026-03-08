import { motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

const quickPrompts = [
  "Create me a meal plan",
  "What should I eat post-workout?",
  "Help me fix my squat form",
  "I only have 20 mins, what workout?",
];

type Message = { role: "user" | "assistant"; content: string };

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm **Del**, your AI fitness coach 💪 Ask me anything about nutrition, workouts, form, or your fitness goals. I'm here to help you crush it!" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    // AI response placeholder
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connect Lovable Cloud to enable AI coaching! I'll be able to help with personalized nutrition advice, workout plans, form corrections, and more." },
      ]);
    }, 1000);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground">DEL — AI FITNESS COACH</h1>
              <p className="text-xs text-primary">Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <div className="px-6 pb-2 flex gap-2 flex-wrap">
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 bg-card border border-border rounded-full text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
              >
                <Sparkles className="h-3 w-3 inline mr-1" />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Del anything about fitness..."
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
            <Button variant="hero" size="icon" type="submit" className="h-12 w-12 rounded-xl">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
