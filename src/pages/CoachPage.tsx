import { motion } from "framer-motion";
import { Bot, Send, Sparkles, Loader2, Plus, Trash2, MessageSquare, Edit2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-fitness`;

const quickPrompts = [
  "Create me a meal plan",
  "What should I eat post-workout?",
  "Help me fix my squat form",
  "I only have 20 mins, what workout?",
];

type Message = { role: "user" | "assistant"; content: string };

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Hey! I'm **Del**, your AI fitness coach 💪 Ask me anything about nutrition, workouts, form, or your fitness goals. I'm here to help you crush it!",
};

export default function CoachPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch user profile for personalization
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const isProfileIncomplete = !profile?.fitness_goal && !profile?.experience_level && !profile?.weight_kg;

  // Fetch conversations
  const { data: conversations, refetch: refetchConvos } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvoId || !user) {
      setMessages([WELCOME_MSG]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", activeConvoId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        setMessages(data as Message[]);
      } else {
        setMessages([WELCOME_MSG]);
      }
    })();
  }, [activeConvoId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessages = useCallback(async (convoId: string, msgs: Message[]) => {
    if (!user) return;
    const toSave = msgs.slice(-2);
    for (const m of toSave) {
      await supabase.from("chat_messages").insert({
        conversation_id: convoId,
        user_id: user.id,
        role: m.role,
        content: m.content,
      });
    }
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);
    refetchConvos();
  }, [user, refetchConvos]);

  const createNewConvo = async (firstMsg: string): Promise<string> => {
    const title = firstMsg.length > 40 ? firstMsg.slice(0, 40) + "..." : firstMsg;
    const { data } = await supabase
      .from("conversations")
      .insert({ user_id: user!.id, title })
      .select("id")
      .single();
    refetchConvos();
    return data!.id;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let convoId = activeConvoId;
    if (!convoId) {
      convoId = await createNewConvo(text);
      setActiveConvoId(convoId);
      await supabase.from("chat_messages").insert([
        { conversation_id: convoId, user_id: user!.id, role: "assistant", content: WELCOME_MSG.content },
        { conversation_id: convoId, user_id: user!.id, role: "user", content: text },
      ]);
    } else {
      await supabase.from("chat_messages").insert({
        conversation_id: convoId, user_id: user!.id, role: "user", content: text,
      });
    }

    let assistantSoFar = "";
    const updateAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === newMessages.length + 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "coach_chat",
          payload: {
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            userProfile: profile || undefined,
          },
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Coach is unavailable");
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }

      if (convoId && assistantSoFar) {
        await supabase.from("chat_messages").insert({
          conversation_id: convoId, user_id: user!.id, role: "assistant", content: assistantSoFar,
        });
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);
        refetchConvos();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I ran into an issue: ${err.message}. Please try again!` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveConvoId(null);
    setMessages([WELCOME_MSG]);
    setInput("");
  };

  const deleteConvo = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    if (activeConvoId === id) startNewChat();
    refetchConvos();
    toast({ title: "Chat deleted" });
  };

  const renameConvo = async (id: string) => {
    if (!editTitle.trim()) return;
    await supabase.from("conversations").update({ title: editTitle.trim() }).eq("id", id);
    setEditingId(null);
    refetchConvos();
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] md:h-screen">
        {/* Chat History Sidebar */}
        <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden border-r border-border bg-card shrink-0 flex flex-col`}>
          <div className="p-3 border-b border-border">
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={startNewChat}>
              <Plus className="h-4 w-4" /> New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations?.map((c: any) => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                  activeConvoId === c.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {editingId === c.id ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && renameConvo(c.id)}
                      className="flex-1 bg-transparent border-b border-primary text-sm text-foreground focus:outline-none min-w-0"
                      autoFocus
                    />
                    <button onClick={() => renameConvo(c.id)} className="text-primary"><Check className="h-3 w-3" /></button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0" onClick={() => setActiveConvoId(c.id)}>
                      <p className="text-sm truncate">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(c.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditingId(c.id); setEditTitle(c.title); }} className="text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => deleteConvo(c.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {(!conversations || conversations.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-8">No chat history yet</p>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground md:block">
                <MessageSquare className="h-5 w-5" />
              </button>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-xl text-foreground">DEL — AI FITNESS COACH</h1>
                <p className="text-xs text-primary">Online</p>
              </div>
            </div>
          </div>

          {/* Incomplete profile banner */}
          {isProfileIncomplete && (
            <div className="mx-4 mt-3 md:mx-6">
              <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-secondary shrink-0" />
                <p className="text-sm text-foreground flex-1">Complete your profile to get personalized advice from Del.</p>
                <Link to="/onboarding">
                  <Button variant="outline" size="sm" className="shrink-0">Complete Profile →</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
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
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 2 && (
            <div className="px-4 md:px-6 pb-2 flex gap-2 flex-wrap shrink-0">
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
          <div className="p-4 border-t border-border shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Del anything about fitness..."
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                disabled={isLoading}
              />
              <Button variant="hero" size="icon" type="submit" className="h-12 w-12 rounded-xl" disabled={isLoading}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
