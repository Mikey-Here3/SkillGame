"use client";

import { useState, useEffect } from "react";
import { Target, CheckCircle, Clock, Gift, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

type Quest = {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  rewardCoins: number;
  rewardCash: number;
  userQuest?: {
    progress: number;
    completed: boolean;
    claimed: boolean;
  };
};

export default function QuestsPage() {
  const { token } = useAuthStore();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await fetch("/api/quests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuests(data.quests || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (questId: string) => {
    try {
      const res = await fetch(`/api/quests/${questId}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Quest reward claimed!");
        fetchQuests();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to claim");
      }
    } catch {
      toast.error("Failed to claim reward");
    }
  };

  const typeColors: Record<string, string> = {
    daily: "bg-blue-500/20 text-blue-400",
    weekly: "bg-purple-500/20 text-purple-400",
    hard: "bg-red-500/20 text-red-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
          <Target size={28} className="text-blue-400" /> Quests
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Complete quests to earn coins and rewards</p>
      </div>

      {quests.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Target size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-bold font-heading mb-2">No Active Quests</h3>
          <p className="text-muted-foreground text-sm">Check back soon for new challenges!</p>
        </div>
      )}

      {["daily", "weekly", "hard"].map((type) => {
        const typeQuests = quests.filter((q) => q.type === type);
        if (typeQuests.length === 0) return null;
        return (
          <div key={type}>
            <h2 className="text-lg font-semibold font-heading mb-3 capitalize flex items-center gap-2">
              {type === "daily" ? <Clock size={18} className="text-blue-400" /> :
               type === "weekly" ? <Target size={18} className="text-purple-400" /> :
               <Gift size={18} className="text-red-400" />}
              {type} Quests
            </h2>
            <div className="space-y-3">
              {typeQuests.map((quest) => {
                const progress = quest.userQuest?.progress || 0;
                const completed = quest.userQuest?.completed || false;
                const claimed = quest.userQuest?.claimed || false;
                const pct = Math.min(100, Math.round((progress / quest.target) * 100));
                return (
                  <div key={quest.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeColors[quest.type]}`}>
                            {quest.type}
                          </span>
                          {completed && (
                            <span className="flex items-center gap-1 text-green-400 text-xs">
                              <CheckCircle size={12} /> Complete
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold font-heading">{quest.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{quest.description}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{progress}/{quest.target}</span>
                            <span className="font-bold">{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full progress-neon rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-amber-400 font-bold text-sm">🪙 {quest.rewardCoins}</div>
                        {completed && !claimed ? (
                          <button onClick={() => handleClaim(quest.id)} className="mt-2 px-3 py-1.5 rounded-lg btn-neon text-xs font-semibold">Claim</button>
                        ) : claimed ? (
                          <span className="text-xs text-green-400 mt-2 block">Claimed ✓</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
