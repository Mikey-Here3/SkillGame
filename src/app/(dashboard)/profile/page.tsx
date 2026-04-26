"use client";

import { useAuthStore } from "@/stores/authStore";
import { User, Trophy, Gamepad2, TrendingUp, Calendar, Copy, Shield } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuthStore();
  if (!user) return null;

  const copyReferral = () => {
    navigator.clipboard.writeText(user.referralCode);
    toast.success("Referral code copied!");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
        <User size={28} className="text-blue-400" /> Profile
      </h1>

      {/* Profile Card */}
      <div className="glass-card rounded-2xl p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold font-heading text-white">
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold font-heading">{user.username}</h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                user.role === "admin" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
              }`}>
                {user.role === "admin" ? "Admin" : "Player"}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400">
                {user.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Balance", value: `$${user.balance.toFixed(2)}`, icon: "💰", color: "text-green-400" },
          { label: "Coins", value: `${user.coins}`, icon: "🪙", color: "text-amber-400" },
          { label: "Games Played", value: user.gamesPlayed.toString(), icon: "🎮", color: "text-blue-400" },
          { label: "Win Rate", value: `${user.winRate}%`, icon: "📊", color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-xl font-bold font-heading ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" /> Game Stats
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Games Played</span>
              <span className="font-bold">{user.gamesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Games Won</span>
              <span className="font-bold text-green-400">{user.gamesWon}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-bold text-purple-400">{user.winRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Coins</span>
              <span className="font-bold text-amber-400">🪙 {user.coins}</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
            <Shield size={18} className="text-blue-400" /> Account Info
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-bold text-green-400 capitalize">{user.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-bold capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Referral Code</span>
              <button onClick={copyReferral} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold">
                {user.referralCode} <Copy size={12} />
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
