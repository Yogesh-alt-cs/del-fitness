import { motion } from "framer-motion";
import { Play, Heart, Search, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { name: "All", key: "all" },
  { name: "Chest", key: "chest" },
  { name: "Back", key: "back" },
  { name: "Legs", key: "legs" },
  { name: "Arms", key: "arms" },
  { name: "Core", key: "core" },
  { name: "Full Body", key: "fullbody" },
  { name: "Favorites", key: "favorites" },
];

const allVideos = [
  // Chest
  { id: "2xMfFDjJg9A", title: "Best Chest Exercises", category: "chest", channel: "Jeremy Ethier" },
  { id: "IEhMYQHAFKg", title: "Chest Workout for Mass", category: "chest", channel: "JEFIT" },
  { id: "k2KiR0lOvQg", title: "Push Up Variations for Chest", category: "chest", channel: "Calisthenicmovement" },
  { id: "4Y2ZdHCOXok", title: "Dumbbell Chest Workout", category: "chest", channel: "Buff Dudes" },
  { id: "gey73xiS8F4", title: "Build a Bigger Chest", category: "chest", channel: "Jeff Nippard" },
  // Back
  { id: "eGo4IYlbE5g", title: "Back Workout Science", category: "back", channel: "Jeremy Ethier" },
  { id: "r8lbMKGMg34", title: "Full Back Workout", category: "back", channel: "Buff Dudes" },
  { id: "ytGaGIn3SjE", title: "Back Exercises Ranked", category: "back", channel: "Jeff Nippard" },
  { id: "8LJ3Q3Fsrzs", title: "Best Back Width Exercises", category: "back", channel: "Renaissance Periodization" },
  // Legs
  { id: "SW_q7GQCalw", title: "Leg Day Essentials", category: "legs", channel: "Jeff Nippard" },
  { id: "sMu4JnoNWcU", title: "Squat Tips for Growth", category: "legs", channel: "Squat University" },
  { id: "hipM1VBgrDE", title: "Build Bigger Quads", category: "legs", channel: "Jeremy Ethier" },
  { id: "IB_icGRKa8c", title: "Glute Workout Complete", category: "legs", channel: "Bret Contreras" },
  // Arms
  { id: "nRjKBi5QMsM", title: "Bigger Arms in 30 Days", category: "arms", channel: "Jeremy Ethier" },
  { id: "8d5QlbCRAJk", title: "Best Bicep Exercises", category: "arms", channel: "Jeff Nippard" },
  { id: "ogFSbEkLa_s", title: "Tricep Workout for Mass", category: "arms", channel: "Buff Dudes" },
  { id: "JyV7mUFSpXs", title: "Arm Building Mistakes", category: "arms", channel: "Renaissance Periodization" },
  // Core
  { id: "AnYl6Mv5pag", title: "Core Stability Workout", category: "core", channel: "Jeff Nippard" },
  { id: "sYlhQK8Scqs", title: "6 Pack Abs Routine", category: "core", channel: "Jeremy Ethier" },
  { id: "8jyhJ6TiUPA", title: "10 Min Ab Workout", category: "core", channel: "THENX" },
  { id: "2pLT-olgUJs", title: "Plank Variations for Abs", category: "core", channel: "Calisthenicmovement" },
  // Full Body
  { id: "ml6cT4AZdqI", title: "20 Min Full Body HIIT", category: "fullbody", channel: "THENX" },
  { id: "UBMk30rjy0o", title: "No Equipment Full Body", category: "fullbody", channel: "Chloe Ting" },
  { id: "vc1E5CfRfos", title: "Full Body Dumbbell Workout", category: "fullbody", channel: "Buff Dudes" },
  { id: "Ng5EYMfFu0U", title: "Home Full Body Workout", category: "fullbody", channel: "Jeremy Ethier" },
];

export default function VideosPage() {
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: favorites, refetch } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorite_videos").select("video_id").eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    let list = allVideos;
    if (active === "favorites") {
      list = allVideos.filter((v) => favorites?.includes(v.id));
    } else if (active !== "all") {
      list = allVideos.filter((v) => v.category === active);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channel.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [active, search, favorites]);

  const toggleFavorite = async (video: (typeof allVideos)[0]) => {
    if (!user) return;
    const isFav = favorites?.includes(video.id);
    if (isFav) {
      await supabase.from("favorite_videos").delete().eq("user_id", user.id).eq("video_id", video.id);
      toast({ title: "Removed from favorites" });
    } else {
      await supabase.from("favorite_videos").insert({
        user_id: user.id,
        video_id: video.id,
        video_title: video.title,
        category: video.category,
      });
      toast({ title: "Added to favorites!" });
    }
    refetch();
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            <span className="text-gradient-primary">GYM</span> VIDEOS
          </h1>
          <p className="text-muted-foreground mt-2">Curated workout videos from top fitness creators.</p>
        </motion.div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workouts (e.g. dumbbell chest workout)..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                active === c.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.key === "favorites" && "❤️ "}
              {c.name}
            </button>
          ))}
        </div>

        {/* Inline player */}
        {playingId && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="aspect-video rounded-xl overflow-hidden border border-primary/30 glow-primary">
              <iframe
                src={`https://www.youtube.com/embed/${playingId}?autoplay=1&rel=0`}
                title="Video Player"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <button
              onClick={() => setPlayingId(null)}
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </motion.div>
        )}

        {/* Video grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No videos found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v, i) => {
              const isFav = favorites?.includes(v.id);
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group"
                >
                  <div
                    className="aspect-video relative cursor-pointer bg-muted"
                    onClick={() => setPlayingId(v.id)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                      alt={v.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="h-7 w-7 text-primary-foreground ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex items-start justify-between">
                    <div className="cursor-pointer flex-1" onClick={() => setPlayingId(v.id)}>
                      <h3 className="text-sm font-medium text-foreground">{v.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{v.channel}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(v)}
                      className={`transition-colors ml-2 ${isFav ? "text-secondary" : "text-muted-foreground hover:text-secondary"}`}
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
