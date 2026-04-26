"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { Trophy, Gamepad2, Wallet, Target, TrendingUp, Users, Gift, ArrowUpRight } from "lucide-react";

type TopPlayer = { username: string; winRate: number; gamesWon: number };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard?period=weekly&limit=3")
      .then((r) => r.json())
      .then((data) => setTopPlayers(data.leaderboard || []))
      .catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-6 md:p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading mb-1">
              Welcome back, <span className="text-blue-400">{user.username}</span>
            </h1>
            <p className="text-muted-foreground text-sm">Ready to compete? Your stats are looking good.</p>
          </div>
          <Link
            href="/games"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-neon text-sm font-semibold whitespace-nowrap"
          >
            <Gamepad2 size={18} /> Play Now
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Balance", value: `Rs. ${(user.balance ?? 0).toFixed(2)}`, icon: Wallet, color: "text-green-400", bg: "from-green-500/10 to-emerald-500/10" },
          { label: "Coins", value: `🪙 ${user.coins ?? 0}`, icon: Gift, color: "text-amber-400", bg: "from-amber-500/10 to-yellow-500/10" },
          { label: "Games Played", value: (user.gamesPlayed ?? 0).toString(), icon: Gamepad2, color: "text-blue-400", bg: "from-blue-500/10 to-cyan-500/10" },
          { label: "Win Rate", value: `${user.winRate ?? 0}%`, icon: TrendingUp, color: "text-purple-400", bg: "from-purple-500/10 to-pink-500/10" },
        ].map((stat) => (
          <div key={stat.label} className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${stat.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <stat.icon size={20} className={stat.color} />
              <ArrowUpRight size={14} className="text-muted-foreground" />
            </div>
            <div className={`text-xl font-bold font-heading ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/games" className="glass-card rounded-2xl p-6 hover:bg-white/[0.06] transition-all group">
          <Gamepad2 size={24} className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold font-heading mb-1">Play Games</h3>
          <p className="text-sm text-muted-foreground">Choose from 11+ skill-based games</p>
        </Link>

        <Link href="/wallet" className="glass-card rounded-2xl p-6 hover:bg-white/[0.06] transition-all group">
          <Wallet size={24} className="text-green-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold font-heading mb-1">Wallet</h3>
          <p className="text-sm text-muted-foreground">Deposit or withdraw funds</p>
        </Link>

        <Link href="/tournaments" className="glass-card rounded-2xl p-6 hover:bg-white/[0.06] transition-all group">
          <Trophy size={24} className="text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold font-heading mb-1">Tournaments</h3>
          <p className="text-sm text-muted-foreground">Join competitive brackets</p>
        </Link>
      </div>

      {/* Recent Activity + Leaderboard */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Games */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
            <Target size={18} className="text-blue-400" /> Recent Games
          </h3>
          <div className="space-y-3">
            {user.gamesPlayed === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No games played yet.{" "}
                <Link href="/games" className="text-blue-400 hover:text-blue-300">Play your first game!</Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                You&apos;ve played {user.gamesPlayed} games with a {user.winRate}% win rate.
              </p>
            )}
          </div>
        </div>

        {/* Quick Leaderboard */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
            <Users size={18} className="text-purple-400" /> Top Players
          </h3>
          <div className="space-y-3">
            {topPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No players yet. Be the first!
              </p>
            ) : (
              topPlayers.map((player, idx) => (
                <div key={player.username} className="flex items-center gap-3 py-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? "bg-amber-500/20 text-amber-400" :
                    idx === 1 ? "bg-gray-400/20 text-gray-300" :
                    "bg-orange-500/20 text-orange-400"
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{player.username}</div>
                    <div className="text-xs text-muted-foreground">Win rate: {player.winRate}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/leaderboard" className="block text-center text-sm text-blue-400 hover:text-blue-300 mt-4 pt-3 border-t border-white/[0.06]">
            View Full Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
