"use client";

import { useState, useEffect } from "react";
import { BarChart3, Trophy, Medal } from "lucide-react";

type LeaderEntry = {
  rank: number; username: string; gamesPlayed: number;
  gamesWon: number; winRate: number; coins: number;
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("weekly");
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);

  useEffect(() => { fetchLeaderboard(); }, [period]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/leaderboard?period=${period}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch { /* silent */ }
  };

  const rankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-sm text-muted-foreground font-bold">#{rank}</span>;
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
            <BarChart3 size={28} className="text-amber-400" /> Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Top players ranked by performance</p>
        </div>
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                period === p ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" : "glass-card text-muted-foreground"
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
            const pos = [2, 1, 3][i];
            const height = pos === 1 ? "pt-0" : pos === 2 ? "pt-6" : "pt-10";
            const bg = pos === 1 ? "from-amber-500/20 to-yellow-500/20" : pos === 2 ? "from-gray-400/20 to-gray-500/20" : "from-orange-500/20 to-amber-500/20";
            return (
              <div key={entry.username} className={`${height}`}>
                <div className={`glass-card rounded-2xl p-4 text-center bg-gradient-to-br ${bg} h-full`}>
                  <div className="text-3xl mb-2">{pos === 1 ? "👑" : pos === 2 ? "🥈" : "🥉"}</div>
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white mb-2">
                    {entry.username[0].toUpperCase()}
                  </div>
                  <div className="font-semibold font-heading text-sm truncate">{entry.username}</div>
                  <div className="text-xs text-muted-foreground">{entry.winRate}% win rate</div>
                  <div className="text-amber-400 font-bold text-sm mt-1">🪙 {entry.coins}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No players on the leaderboard yet.</p>
          </div>
        ) : (
          <div>
            {leaderboard.map((entry) => (
              <div key={entry.rank}
                className={`flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] ${
                  entry.rank <= 3 ? "bg-gradient-to-r from-amber-500/5 to-transparent" : ""
                }`}>
                <div className="w-8 text-center">{rankBadge(entry.rank)}</div>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/50 to-purple-500/50 flex items-center justify-center text-sm font-bold">
                  {entry.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{entry.username}</div>
                  <div className="text-xs text-muted-foreground">{entry.gamesPlayed} games • {entry.gamesWon} wins</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-purple-400">{entry.winRate}%</div>
                  <div className="text-xs text-amber-400">🪙 {entry.coins}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
