import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { type, payload } = await req.json();

    if (type === "food_analysis") {
      const { imageUrl } = payload;
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are a professional nutritionist AI. Analyze this food image and return ONLY a valid JSON object with these exact keys: foodName (string), calories (number), protein_g (number), carbs_g (number), fat_g (number), fiber_g (number), sugar_g (number), portionSize (string), healthScore (number 1-10), detectedItems (array of strings), improvements (array of strings). Be as accurate as possible based on visual estimation. Return ONLY the JSON, no markdown or explanation."
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this food image and provide nutritional information." },
                { type: "image_url", image_url: { url: imageUrl } }
              ]
            }
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        const t = await response.text();
        console.error("AI gateway error:", status, t);
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI analysis failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Parse JSON from response, handling potential markdown wrapping
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch {
        parsed = { error: "Failed to parse AI response", raw: content };
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "workout_gen") {
      const { fitnessLevel, equipment, timeMinutes, targetMuscles } = payload;
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are an elite personal trainer. Based on the user's inputs, generate a complete workout plan. Return ONLY valid JSON: { planName, duration_weeks, sessionsPerWeek, days: [{ dayName, focus, exercises: [{ name, sets, reps, rest_seconds, instructions, tips }] }] }. No markdown."
            },
            {
              role: "user",
              content: `Fitness level: ${fitnessLevel}. Equipment: ${equipment}. Time available: ${timeMinutes} minutes. Target muscles: ${targetMuscles}.`
            }
          ],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "Workout generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch {
        parsed = { error: "Failed to parse", raw: content };
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "coach_chat") {
      const { messages } = payload;
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: "You are Del, the AI fitness coach for the DelFitness app. You are knowledgeable, encouraging, and motivating. You specialize in nutrition, workout programming, exercise science, and healthy lifestyle habits. Keep responses concise, practical, and personalized. Always be supportive and positive. Use markdown formatting for readability."
            },
            ...messages,
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        const t = await response.text();
        console.error("AI gateway error:", status, t);
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Coach error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    if (type === "motivation") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You are a fitness motivator. Give ONE short, powerful motivational quote about fitness, health, or perseverance. Just the quote and author, nothing else." },
            { role: "user", content: "Give me a motivational fitness quote." }
          ],
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ quote: "The only bad workout is the one that didn't happen." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const quote = data.choices?.[0]?.message?.content || "The only bad workout is the one that didn't happen.";
      return new Response(JSON.stringify({ quote }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "video_recommend") {
      const { goal, muscleGroup, fitnessLevel } = payload;
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "You are a fitness video curator. Based on the user's goals, suggest 5 YouTube search queries that would find the best workout videos. Return ONLY valid JSON: { queries: string[], description: string }. Make queries specific and varied."
            },
            {
              role: "user",
              content: `Goal: ${goal || "general fitness"}. Muscle group: ${muscleGroup || "full body"}. Fitness level: ${fitnessLevel || "intermediate"}.`
            }
          ],
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ queries: [`${muscleGroup || "full body"} workout for ${fitnessLevel || "beginners"}`], description: "Recommended workout videos" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch {
        parsed = { queries: [`${muscleGroup || "full body"} workout`], description: "Recommended videos" };
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "meal_plan") {
      const { goal, dietaryPreferences, mealsPerDay, calorieTarget } = payload;
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are a professional nutritionist. Create a detailed 7-day meal plan. Return ONLY valid JSON: { planName: string, dailyCalories: number, days: [{ day: string, meals: [{ name: string, type: string (breakfast/lunch/dinner/snack), calories: number, protein_g: number, carbs_g: number, fat_g: number, ingredients: string[], instructions: string }] }] }. No markdown."
            },
            {
              role: "user",
              content: `Goal: ${goal}. Dietary preferences: ${dietaryPreferences}. Meals per day: ${mealsPerDay}. Target calories: ${calorieTarget} cal/day.`
            }
          ],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Meal plan generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch {
        parsed = { error: "Failed to parse", raw: content };
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-fitness error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
