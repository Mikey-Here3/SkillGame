"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { GAME_LIST } from "@/lib/game-engine";
import {
  Gamepad2, Users, Clock, Trophy, Zap, Shield, ArrowLeft, Play, Bot,
} from "lucide-react";
import { toast } from "sonner";

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedFee, setSelectedFee] = useState<number>(0);
  const [isPractice, setIsPractice] = useState(false);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const gameId = params.gameId as string;
  const gameMeta = GAME_LIST.find((g) => g.id === gameId);

  useEffect(() => {
    fetchConfig();
  }, [gameId]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/game-config");
      if (res.ok) {
        const data = await res.json();
        const cfg = data.configs.find((c: Record<string, unknown>) => c.gameId === gameId);
        if (cfg) {
          setConfig(cfg);
          setSelectedFee((cfg.entryFees as number[])[0] || 10);
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handlePlay = () => {
    if (!isPractice && user && user.balance < selectedFee) {
      toast.error("Insufficient balance. Please deposit first.");
      return;
    }
    // Navigate to game room with query params
    const params = new URLSearchParams({
      fee: isPractice ? "0" : selectedFee.toString(),
      practice: isPractice.toString(),
    });
    router.push(`/game-room/${gameId}?${params.toString()}`);
  };

  if (!gameMeta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Gamepad2 size={48} className="text-muted-foreground mb-4 opacity-30" />
        <h2 className="text-xl font-bold font-heading mb-2">Game Not Found</h2>
        <button onClick={() => router.push("/games")} className="text-blue-400 text-sm hover:text-blue-300">
          ← Back to Games
        </button>
      </div>
    );
  }

  const entryFees = config ? (config.entryFees as number[]) : [10, 20, 50, 100, 500];
  const rewards = config ? (config.rewardDistribution as { top1: number; top2: number; top3: number }) : { top1: 50, top2: 30, top3: 20 };
  const commission = config ? (config.commissionPercent as number) : 10;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/games")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Games
      </button>

      {/* Game Header */}
      <div className={`glass-card rounded-2xl p-8 bg-gradient-to-br ${gameMeta.color.replace("to-", "to-").replace("from-", "from-")}/10`}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="text-6xl">{gameMeta.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-muted-foreground">
                {gameMeta.category}
              </span>
              {config && (config.practiceEnabled as boolean) && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400">
                  Practice Available
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold font-heading mb-2">{gameMeta.name}</h1>
            <p className="text-muted-foreground">{gameMeta.description}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Play Settings */}
        <div className="md:col-span-2 space-y-4">
          {/* Mode Toggle */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <Zap size={18} className="text-blue-400" /> Game Mode
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsPractice(false)}
                className={`p-4 rounded-xl text-sm font-medium transition-all ${
                  !isPractice
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Trophy size={20} className="mx-auto mb-2" />
                <div className="font-semibold">Competitive</div>
                <div className="text-xs opacity-70 mt-1">Win real prizes</div>
              </button>
              <button
                onClick={() => setIsPractice(true)}
                className={`p-4 rounded-xl text-sm font-medium transition-all ${
                  isPractice
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bot size={20} className="mx-auto mb-2" />
                <div className="font-semibold">Practice</div>
                <div className="text-xs opacity-70 mt-1">Free play with bots</div>
              </button>
            </div>
          </div>

          {/* Entry Fee Selector */}
          {!isPractice && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                💰 Entry Fee
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {entryFees.map((fee: number) => (
                  <button
                    key={fee}
                    onClick={() => setSelectedFee(fee)}
                    className={`p-3 rounded-xl text-sm font-bold font-heading transition-all ${
                      selectedFee === fee
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-400 border border-blue-500/30"
                        : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Rs. {fee}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prize Breakdown */}
          {!isPractice && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                🏆 Prize Breakdown
              </h3>
              {(() => {
                const players = config ? (config.maxPlayers as number) : 4;
                const totalPool = selectedFee * players;
                const platformFee = totalPool * (commission / 100);
                const prizePool = totalPool - platformFee;
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Pool ({players} players × Rs. {selectedFee})</span>
                      <span className="font-bold">Rs. {totalPool}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee ({commission}%)</span>
                      <span className="text-red-400">-Rs. {platformFee.toFixed(0)}</span>
                    </div>
                    <hr className="border-white/[0.06]" />
                    <div className="flex justify-between text-sm font-bold">
                      <span>Prize Pool</span>
                      <span className="text-green-400">Rs. {prizePool.toFixed(0)}</span>
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-400">🥇 1st Place ({rewards.top1}%)</span>
                        <span className="font-bold text-amber-400">Rs. {(prizePool * rewards.top1 / 100).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">🥈 2nd Place ({rewards.top2}%)</span>
                        <span className="font-bold text-gray-300">Rs. {(prizePool * rewards.top2 / 100).toFixed(0)}</span>
                      </div>
                      {rewards.top3 > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-400">🥉 3rd Place ({rewards.top3}%)</span>
                          <span className="font-bold text-orange-400">Rs. {(prizePool * rewards.top3 / 100).toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Sidebar Info + Play Button */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold font-heading">Game Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Users size={14} /> Players</span>
                <span>{config ? `${config.minPlayers}-${config.maxPlayers}` : "2-4"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Clock size={14} /> Duration</span>
                <span>{config ? `${config.gameDuration}s` : "60s"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Bot size={14} /> Bots</span>
                <span>{config && (config.botsEnabled as boolean) ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Shield size={14} /> Anti-Cheat</span>
                <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={handlePlay}
            disabled={loading}
            className="w-full py-4 rounded-2xl btn-neon text-lg font-bold font-heading flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Play size={22} />
            {isPractice ? "Practice Free" : `Play Rs. ${selectedFee}`}
          </button>

          {!isPractice && user && (
            <p className="text-xs text-center text-muted-foreground">
              Your balance: <span className="text-green-400 font-bold">Rs. {user.balance.toFixed(2)}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
