"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  Users, Wallet, Gamepad2, TrendingUp, Shield, AlertTriangle,
  DollarSign, Activity, BarChart3, Clock,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activeGames: 0,
    totalRevenue: 0,
    totalGamesPlayed: 0,
    activeSessions: 0,
  });
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, depsRes, wdRes, gameStatsRes] = await Promise.all([
        fetch("/api/admin/users?limit=1", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/transactions?type=deposit&status=pending", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/transactions?type=withdraw&status=pending", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/game-stats", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [usersData, depsData, wdData, gameStatsData] = await Promise.all([
        usersRes.ok ? usersRes.json() : { pagination: { total: 0 } },
        depsRes.ok ? depsRes.json() : { transactions: [] },
        wdRes.ok ? wdRes.json() : { transactions: [] },
        gameStatsRes.ok ? gameStatsRes.json() : { stats: {}, recentSessions: [] },
      ]);
      setStats({
        totalUsers: usersData.pagination?.total || 0,
        pendingDeposits: depsData.transactions?.length || 0,
        pendingWithdrawals: wdData.transactions?.length || 0,
        activeGames: gameStatsData.stats?.activeGames || 0,
        totalRevenue: gameStatsData.stats?.totalRevenue || 0,
        totalGamesPlayed: gameStatsData.stats?.completedSessions || 0,
        activeSessions: gameStatsData.stats?.activeSessions || 0,
      });
      setRecentGames(gameStatsData.recentSessions || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield size={48} className="mx-auto mb-4 text-red-400 opacity-50" />
          <h2 className="text-xl font-bold font-heading mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
          <Shield size={28} className="text-red-400" /> Admin Panel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Platform management & oversight</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "from-blue-500/10 to-cyan-500/10" },
          { label: "Pending Deposits", value: stats.pendingDeposits, icon: DollarSign, color: "text-green-400", bg: "from-green-500/10 to-emerald-500/10" },
          { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Wallet, color: "text-amber-400", bg: "from-amber-500/10 to-yellow-500/10" },
          { label: "Active Games", value: stats.activeGames, icon: Gamepad2, color: "text-purple-400", bg: "from-purple-500/10 to-pink-500/10" },
        ].map((stat) => (
          <div key={stat.label} className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${stat.bg}`}>
            <stat.icon size={20} className={`${stat.color} mb-3`} />
            <div className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue & Games Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-emerald-500/10 to-green-500/10">
          <TrendingUp size={20} className="text-emerald-400 mb-3" />
          <div className="text-2xl font-bold font-heading text-emerald-400">
            Rs. {stats.totalRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total Platform Revenue</div>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-indigo-500/10 to-blue-500/10">
          <BarChart3 size={20} className="text-indigo-400 mb-3" />
          <div className="text-2xl font-bold font-heading text-indigo-400">
            {stats.totalGamesPlayed}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total Games Played</div>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-rose-500/10 to-pink-500/10">
          <Activity size={20} className="text-rose-400 mb-3" />
          <div className="text-2xl font-bold font-heading text-rose-400">
            {stats.activeSessions}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Live Sessions Now</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/admin/users", label: "User Management", desc: "View, ban, or restrict users", icon: Users, color: "text-blue-400" },
          { href: "/admin/transactions", label: "Transactions", desc: "Approve deposits & withdrawals", icon: Wallet, color: "text-green-400" },
          { href: "/admin/tournaments", label: "Tournaments", desc: "Create high-stakes competitions", icon: Trophy, color: "text-amber-400" },
          { href: "/admin/game-config", label: "Game Configuration", desc: "Manage fees, commissions, rewards", icon: Gamepad2, color: "text-purple-400" },
          { href: "/admin/bots", label: "Bot Control", desc: "Manage bot settings per game", icon: Activity, color: "text-cyan-400" },
          { href: "/leaderboard", label: "Leaderboard", desc: "View player rankings", icon: TrendingUp, color: "text-amber-400" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="glass-card rounded-2xl p-6 hover:bg-white/[0.06] transition-all group"
          >
            <item.icon size={24} className={`${item.color} mb-3 group-hover:scale-110 transition-transform`} />
            <h3 className="font-semibold font-heading mb-1">{item.label}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Game Sessions */}
      {recentGames.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h3 className="font-semibold font-heading flex items-center gap-2">
              <Clock size={18} className="text-blue-400" /> Recent Game Sessions
            </h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentGames.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{session.gameIcon}</span>
                  <div>
                    <div className="text-sm font-semibold">{session.gameName}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.playerCount} players • Room {session.roomCode}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-400">
                    +Rs. {session.commission.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pool: Rs. {session.prizePool.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
