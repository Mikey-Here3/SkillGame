"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { AlertTriangle, Shield, Eye, Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

type FraudFlag = {
  id: string;
  username: string;
  type: string;
  detail: string;
  severity: string;
  userId: string;
  createdAt: string;
};

type FraudStats = {
  activeFlags: number;
  bannedUsers: number;
  totalGames: number;
  flagRate: string;
};

export default function AdminFraudPage() {
  const { user, token } = useAuthStore();
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [stats, setStats] = useState<FraudStats>({ activeFlags: 0, bannedUsers: 0, totalGames: 0, flagRate: "0%" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFraudData();
  }, []);

  const fetchFraudData = async () => {
    try {
      const [statsRes, flagsRes] = await Promise.all([
        fetch("/api/admin/fraud/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/fraud/flags", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (flagsRes.ok) {
        const data = await flagsRes.json();
        setFlags(data.flags || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: string, username: string) => {
    if (!confirm(`Ban user @${username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success(`User @${username} has been banned`);
        fetchFraudData();
      } else {
        toast.error("Failed to ban user");
      }
    } catch {
      toast.error("Failed to ban user");
    }
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Access denied</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
          <AlertTriangle size={24} className="text-red-400" /> Fraud Detection
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor and investigate suspicious activity</p>
      </div>

      {/* Anti-Cheat Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Flags", value: stats.activeFlags.toString(), color: "text-red-400", bg: "from-red-500/10 to-orange-500/10" },
          { label: "Users Banned", value: stats.bannedUsers.toString(), color: "text-amber-400", bg: "from-amber-500/10 to-yellow-500/10" },
          { label: "Total Games", value: stats.totalGames.toLocaleString(), color: "text-green-400", bg: "from-green-500/10 to-emerald-500/10" },
          { label: "Flag Rate", value: stats.flagRate, color: "text-blue-400", bg: "from-blue-500/10 to-cyan-500/10" },
        ].map((stat) => (
          <div key={stat.label} className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${stat.bg}`}>
            <div className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Anti-Cheat Measures */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
        <h3 className="font-semibold font-heading mb-3 flex items-center gap-2">
          <Shield size={18} className="text-green-400" /> Active Anti-Cheat Measures
        </h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          {[
            "Server-side score validation on every game action",
            "Impossible score detection (reaction times, speed limits)",
            "Multi-account detection via IP & device fingerprinting",
            "Rapid win pattern analysis (statistical anomalies)",
            "Bot behavior detection in competitive matches",
            "Transaction velocity monitoring (deposit/withdrawal abuse)",
          ].map((measure, i) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              {measure}
            </div>
          ))}
        </div>
      </div>

      {/* Flagged Activity */}
      <div>
        <h3 className="text-lg font-semibold font-heading mb-3">Flagged Activity</h3>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-400" />
          </div>
        ) : flags.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Shield size={48} className="mx-auto mb-4 text-green-400 opacity-30" />
            <p className="text-muted-foreground">No flagged activity detected. All clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <div key={flag.id} className={`glass-card rounded-xl p-5 border ${severityColors[flag.severity] || severityColors.low}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${severityColors[flag.severity] || severityColors.low}`}>
                        {flag.severity}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(flag.createdAt).toLocaleString()}</span>
                    </div>
                    <h4 className="font-semibold text-sm">
                      <span className="text-blue-400">@{flag.username}</span> — {flag.type.replace(/_/g, " ")}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{flag.detail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] text-muted-foreground" title="Investigate">
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleBan(flag.userId, flag.username)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                      title="Ban User"
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
