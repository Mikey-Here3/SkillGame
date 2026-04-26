"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Users, Zap, Trophy, Search, Filter } from "lucide-react";
import { GAME_LIST } from "@/lib/game-engine";

type GameConfig = {
  id: string;
  gameId: string;
  gameName: string;
  gameIcon: string;
  gameDescription: string;
  entryFees: number[];
  commissionPercent: number;
  rewardDistribution: { top1: number; top2: number; top3: number };
  maxPlayers: number;
  minPlayers: number;
  gameDuration: number;
  isActive: boolean;
  botsEnabled: boolean;
  practiceEnabled: boolean;
};

// Static metadata for colors/categories (not stored in DB)
const GAME_META: Record<string, { color: string; bg: string; category: string }> = {
  "reaction-speed": { color: "from-yellow-500 to-orange-500", bg: "from-yellow-500/15 to-orange-500/15", category: "speed" },
  "fruit-slice": { color: "from-green-500 to-emerald-500", bg: "from-green-500/15 to-emerald-500/15", category: "action" },
  "word-search": { color: "from-blue-500 to-cyan-500", bg: "from-blue-500/15 to-cyan-500/15", category: "puzzle" },
  "memory-match": { color: "from-purple-500 to-pink-500", bg: "from-purple-500/15 to-pink-500/15", category: "puzzle" },
  "math-speed": { color: "from-indigo-500 to-blue-500", bg: "from-indigo-500/15 to-blue-500/15", category: "speed" },
  "typing-speed": { color: "from-cyan-500 to-teal-500", bg: "from-cyan-500/15 to-teal-500/15", category: "speed" },
  "target-hit": { color: "from-red-500 to-rose-500", bg: "from-red-500/15 to-rose-500/15", category: "action" },
  "sequence-memory": { color: "from-violet-500 to-purple-500", bg: "from-violet-500/15 to-purple-500/15", category: "puzzle" },
  "tic-tac-toe": { color: "from-amber-500 to-yellow-500", bg: "from-amber-500/15 to-yellow-500/15", category: "strategy" },
  "chess-blitz": { color: "from-slate-400 to-gray-600", bg: "from-slate-400/15 to-gray-600/15", category: "strategy" },
  "crash-timing": { color: "from-emerald-500 to-lime-500", bg: "from-emerald-500/15 to-lime-500/15", category: "timing" },
};

const categories = ["all", "speed", "action", "puzzle", "strategy", "timing"];

export default function GamesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [games, setGames] = useState<GameConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch("/api/admin/game-config");
      if (res.ok) {
        const data = await res.json();
        // Only show active games to users
        setGames(data.configs.filter((c: GameConfig) => c.isActive));
      }
    } catch {
      // Fallback: use GAME_LIST static data if DB fetch fails
      setGames(
        GAME_LIST.map((g) => ({
          id: g.id,
          gameId: g.id,
          gameName: g.name,
          gameIcon: g.icon,
          gameDescription: g.description,
          entryFees: [10, 20, 50, 100, 500],
          commissionPercent: 10,
          rewardDistribution: { top1: 50, top2: 30, top3: 20 },
          maxPlayers: 4,
          minPlayers: 2,
          gameDuration: 60,
          isActive: true,
          botsEnabled: true,
          practiceEnabled: true,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = games.filter((g) => {
    const meta = GAME_META[g.gameId];
    const matchSearch = g.gameName.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      activeCategory === "all" || (meta && meta.category === activeCategory);
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
            <Gamepad2 size={28} className="text-blue-400" /> Games
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Choose a game and start competing</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games..."
            className="w-full h-10 pl-9 pr-4 rounded-xl glass-input text-sm"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter size={14} className="text-muted-foreground flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20"
                : "glass-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-white/10 mb-4" />
              <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-4 w-full bg-white/5 rounded mb-1" />
              <div className="h-4 w-2/3 bg-white/5 rounded mb-4" />
              <div className="h-8 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Games Grid */}
      {!loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((game) => {
            const meta = GAME_META[game.gameId] || {
              color: "from-blue-500 to-purple-500",
              bg: "from-blue-500/15 to-purple-500/15",
              category: "other",
            };
            return (
              <Link
                key={game.gameId}
                href={`/games/${game.gameId}`}
                className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${meta.bg} group hover:scale-[1.02] transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform">
                    {game.gameIcon}
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-muted-foreground">
                    {meta.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold font-heading mb-1">{game.gameName}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {game.gameDescription}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={12} /> {game.minPlayers}-{game.maxPlayers} players
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Zap size={12} className="text-green-400" />
                    <span className="text-green-400 font-semibold">Play Now</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p>No games found matching your search.</p>
        </div>
      )}
    </div>
  );
}
