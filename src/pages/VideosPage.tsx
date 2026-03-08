import { motion } from "framer-motion";
import { Play, Heart, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

const categories = [
  { name: "All", key: "all" },
  { name: "Chest", key: "chest" },
  { name: "Back", key: "back" },
  { name: "Legs", key: "legs" },
  { name: "Arms", key: "arms" },
  { name: "Core", key: "core" },
  { name: "Full Body", key: "fullbody" },
];

const videos = [
  { id: "cbKkB3POqaY", title: "Complete Chest Workout", category: "chest", channel: "Athlean-X" },
  { id: "gRVjAtPip0Y", title: "Upper Chest Training", category: "chest", channel: "Jeff Nippard" },
  { id: "j8_6lL8at-E", title: "Back Width Builder", category: "back", channel: "Jeff Nippard" },
  { id: "eGo4IYlbE5g", title: "Complete Back Workout", category: "back", channel: "Athlean-X" },
  { id: "SW_q7GQCalw", title: "Leg Day Essentials", category: "legs", channel: "Jeff Nippard" },
  { id: "0jaIqDBJimk", title: "Squat Masterclass", category: "legs", channel: "Athlean-X" },
  { id: "ml6cT4AZdqI", title: "20 Min Full Body HIIT", category: "fullbody", channel: "THENX" },
  { id: "UBMk30rjy0o", title: "No Equipment Full Body", category: "fullbody", channel: "Chloe Ting" },
  { id: "DHD1-2P4jfk", title: "10 Min Ab Shredder", category: "core", channel: "Athlean-X" },
  { id: "AnYl6Mv5pag", title: "Core Stability Flow", category: "core", channel: "Jeff Nippard" },
  { id: "7MnpQYYQoZg", title: "Arm Blaster Workout", category: "arms", channel: "Jeff Nippard" },
];

export default function VideosPage() {
  const [active, setActive] = useState("all");
  const filtered = active === "all" ? videos : videos.filter((v) => v.category === active);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-display">
            <span className="text-gradient-primary">GYM</span> VIDEOS
          </h1>
          <p className="text-muted-foreground mt-2">Curated workout videos from top fitness creators.</p>
        </motion.div>

        {/* Category pills */}
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
              {c.name}
            </button>
          ))}
        </div>

        {/* Video grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group"
            >
              <div className="aspect-video relative">
                <iframe
                  src={`https://www.youtube.com/embed/${v.id}`}
                  title={v.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="p-4 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{v.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{v.channel}</p>
                </div>
                <button className="text-muted-foreground hover:text-secondary transition-colors">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
