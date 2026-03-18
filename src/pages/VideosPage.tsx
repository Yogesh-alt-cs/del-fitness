import { motion } from "framer-motion";
import { Play, Heart, Search, X, Sparkles, Loader2, Eye, ThumbsUp, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { name: "All", key: "all" },
  { name: "Chest", key: "chest" },
  { name: "Back", key: "back" },
  { name: "Legs", key: "legs" },
  { name: "Arms", key: "arms" },
  { name: "Core", key: "core" },
  { name: "Full Body", key: "full body" },
  { name: "HIIT", key: "hiit" },
  { name: "Favorites", key: "favorites" },
];

type Video = {
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  description?: string;
  viewCount?: string;
  likeCount?: string;
  duration?: string;
};

const fallbackVideos: Video[] = [
  { id: "2xMfFDjJg9A", title: "Best Chest Exercises for Mass", channel: "Jeremy Ethier", thumbnail: `https://img.youtube.com/vi/2xMfFDjJg9A/mqdefault.jpg` },
  { id: "eGo4IYlbE5g", title: "Back Workout Science", channel: "Jeremy Ethier", thumbnail: `https://img.youtube.com/vi/eGo4IYlbE5g/mqdefault.jpg` },
  { id: "SW_q7GQCalw", title: "Leg Day Essentials", channel: "Jeff Nippard", thumbnail: `https://img.youtube.com/vi/SW_q7GQCalw/mqdefault.jpg` },
  { id: "nRjKBi5QMsM", title: "Bigger Arms in 30 Days", channel: "Jeremy Ethier", thumbnail: `https://img.youtube.com/vi/nRjKBi5QMsM/mqdefault.jpg` },
  { id: "AnYl6Mv5pag", title: "Core Stability Workout", channel: "Jeff Nippard", thumbnail: `https://img.youtube.com/vi/AnYl6Mv5pag/mqdefault.jpg` },
  { id: "ml6cT4AZdqI", title: "20 Min Full Body HIIT", channel: "THENX", thumbnail: `https://img.youtube.com/vi/ml6cT4AZdqI/mqdefault.jpg` },
];

function formatViewCount(count?: string) {
  if (!count) return null;
  const n = parseInt(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return count;
}

function formatDuration(iso?: string) {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const h = match[1] ? `${match[1]}:` : "";
  const m = match[2] || "0";
  const s = (match[3] || "0").padStart(2, "0");
  return `${h}${h ? m.padStart(2, "0") : m}:${s}`;
}

function VideoSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export default function VideosPage() {
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Favorites
  const { data: favorites, refetch: refetchFavs } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorite_videos").select("video_id").eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user,
  });

  // YouTube search with error handling
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["youtube-search", search, active],
    queryFn: async () => {
      if (active === "favorites") return null;
      setApiError(null);
      const query = search.trim() || (active === "all" ? "workout fitness" : `${active} workout exercise`);
      try {
        const { data, error } = await supabase.functions.invoke("youtube-search", {
          body: { type: "search", payload: { query, maxResults: 15 } },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const result = data as { videos: Video[]; nextPageToken?: string };
        setAllVideos(result.videos || []);
        setNextPageToken(result.nextPageToken);
        return result;
      } catch (err: any) {
        console.error("YouTube search error:", err);
        setApiError(err.message || "Failed to load videos");
        setAllVideos([]);
        return null;
      }
    },
    enabled: active !== "favorites",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const loadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const query = search.trim() || (active === "all" ? "workout fitness" : `${active} workout exercise`);
      const { data, error } = await supabase.functions.invoke("youtube-search", {
        body: { type: "search", payload: { query, maxResults: 15, pageToken: nextPageToken } },
      });
      if (error) throw error;
      const result = data as { videos: Video[]; nextPageToken?: string };
      setAllVideos((prev) => [...prev, ...(result.videos || [])]);
      setNextPageToken(result.nextPageToken);
    } catch (err: any) {
      toast({ title: "Error loading more", description: err.message, variant: "destructive" });
    } finally {
      setLoadingMore(false);
    }
  };

  // Video details
  const allVideoIds = allVideos.map((v) => v.id).join(",");
  const { data: videoDetails } = useQuery({
    queryKey: ["youtube-details", allVideoIds],
    queryFn: async () => {
      if (!allVideoIds) return null;
      const { data, error } = await supabase.functions.invoke("youtube-search", {
        body: { type: "details", payload: { videoIds: allVideoIds } },
      });
      if (error) return null;
      return data as { videos: Video[] };
    },
    enabled: !!allVideoIds,
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });

  const detailsMap = new Map(videoDetails?.videos?.map((v) => [v.id, v]) || []);
  
  // Use fallback when API fails
  const useFallback = apiError || (allVideos.length === 0 && !searchLoading && active !== "favorites" && !search);
  const videos: Video[] = active === "favorites"
    ? fallbackVideos.filter((v) => favorites?.includes(v.id))
    : useFallback
      ? fallbackVideos
      : allVideos.map((v) => ({ ...v, ...(detailsMap.get(v.id) || {}) }));

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  }, [searchInput]);

  const handleCategoryChange = (key: string) => {
    setActive(key);
    setSearch("");
    setSearchInput("");
    setApiError(null);
  };

  const getAiRecommendations = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-fitness", {
        body: {
          type: "video_recommend",
          payload: { goal: "general fitness", muscleGroup: active === "all" ? "full body" : active, fitnessLevel: "intermediate" },
        },
      });
      if (error) throw error;
      const query = data.queries?.[0] || "best workout video";
      setSearchInput(query);
      setSearch(query);
      toast({ title: "AI Recommendation", description: data.description || "Found recommended videos for you!" });
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const toggleFavorite = async (video: Video) => {
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
        category: active !== "all" && active !== "favorites" ? active : null,
      });
      toast({ title: "Added to favorites!" });
    }
    refetchFavs();
  };

  const handlePlayVideo = (id: string) => {
    setPlayerError(false);
    setPlayingId(id);
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            <span className="text-gradient-primary">GYM</span> VIDEOS
          </h1>
          <p className="text-muted-foreground mt-2">Search real YouTube workout videos powered by AI recommendations.</p>
        </motion.div>

        {/* API Error Banner */}
        {apiError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">YouTube API unavailable</p>
              <p className="text-xs text-muted-foreground mt-1">Showing curated fallback videos. Error: {apiError}</p>
            </div>
          </motion.div>
        )}

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search YouTube for workouts..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="default" className="rounded-xl px-5">
            <Search className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="rounded-xl px-4" onClick={getAiRecommendations} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </Button>
        </form>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => handleCategoryChange(c.key)}
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
              {playerError ? (
                <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">This video is unavailable</p>
                  <Button variant="outline" size="sm" onClick={() => setPlayingId(null)}>Close</Button>
                </div>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${playingId}?autoplay=1&rel=0`}
                  title="Video Player"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setPlayerError(true)}
                />
              )}
            </div>
            <button
              onClick={() => { setPlayingId(null); setPlayerError(false); }}
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {searchLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Video grid */}
        {!searchLoading && videos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No videos found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          !searchLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v, i) => {
                const isFav = favorites?.includes(v.id);
                const views = formatViewCount(v.viewCount);
                const dur = formatDuration(v.duration);
                return (
                  <motion.div
                    key={`${v.id}-${i}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group"
                  >
                    <div
                      className="aspect-video relative cursor-pointer bg-muted"
                      onClick={() => handlePlayVideo(v.id)}
                    >
                      <img
                        src={v.thumbnail || `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                        alt={v.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${v.id}/default.jpg`; }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center">
                          <Play className="h-7 w-7 text-primary-foreground ml-1" />
                        </div>
                      </div>
                      {dur && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                          {dur}
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="cursor-pointer flex-1" onClick={() => handlePlayVideo(v.id)}>
                          <h3 className="text-sm font-medium text-foreground line-clamp-2">{v.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{v.channel}</p>
                        </div>
                        <button
                          onClick={() => toggleFavorite(v)}
                          className={`transition-colors shrink-0 ${isFav ? "text-secondary" : "text-muted-foreground hover:text-secondary"}`}
                        >
                          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                        </button>
                      </div>
                      {(views || v.likeCount) && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {views && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{views}</span>}
                          {v.likeCount && <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{formatViewCount(v.likeCount)}</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}

        {/* Load More */}
        {!searchLoading && active !== "favorites" && nextPageToken && videos.length > 0 && !apiError && (
          <div className="flex justify-center pt-2 pb-4">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="rounded-xl px-8">
              {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</> : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
