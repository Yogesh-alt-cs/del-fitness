import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const YT_API = "https://www.googleapis.com/youtube/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not configured");

    const { type, payload } = await req.json();

    if (type === "search") {
      const { query, maxResults = 12, pageToken } = payload;
      const params = new URLSearchParams({
        part: "snippet",
        q: query + " workout fitness exercise",
        type: "video",
        maxResults: String(maxResults),
        key: YOUTUBE_API_KEY,
        videoEmbeddable: "true",
        relevanceLanguage: "en",
        safeSearch: "strict",
      });
      if (pageToken) params.set("pageToken", pageToken);

      const resp = await fetch(`${YT_API}/search?${params}`);
      if (!resp.ok) {
        const t = await resp.text();
        console.error("YouTube search error:", resp.status, t);
        throw new Error(`YouTube API error: ${resp.status}`);
      }

      const data = await resp.json();
      const videos = data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description,
      })) || [];

      return new Response(JSON.stringify({ videos, nextPageToken: data.nextPageToken }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "details") {
      const { videoIds } = payload; // comma-separated string or array
      const ids = Array.isArray(videoIds) ? videoIds.join(",") : videoIds;
      const params = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        id: ids,
        key: YOUTUBE_API_KEY,
      });

      const resp = await fetch(`${YT_API}/videos?${params}`);
      if (!resp.ok) throw new Error(`YouTube API error: ${resp.status}`);

      const data = await resp.json();
      const videos = data.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description,
        viewCount: item.statistics?.viewCount,
        likeCount: item.statistics?.likeCount,
        duration: item.contentDetails?.duration,
      })) || [];

      return new Response(JSON.stringify({ videos }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("youtube-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
