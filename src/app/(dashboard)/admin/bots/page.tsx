"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bot, Save, Users, Target, Activity, ToggleLeft, ToggleRight, Gamepad2, Loader2 } from "lucide-react";

type PerGameBot = {
  id: string; // Database CUID
  gameId: string; // Slug
  gameName: string;
  gameIcon: string;
  botsEnabled: boolean;
  maxBots: number;
  botDifficulty: { easy: number; medium: number; hard: number };
};

export default function ManageBotsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingGameId, setUpdatingGameId] = useState<string | null>(null);
  const [perGameConfigs, setPerGameConfigs] = useState<PerGameBot[]>([]);
  const [config, setConfig] = useState({
    botsEnabled: true,
    easyWinRate: 20,
    mediumWinRate: 50,
    hardWinRate: 80,
    maxBotsPer1v1: 1,
    maxBotsPerTourney: 100,
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchAll();
  }, [user, router]);

  const fetchAll = async () => {
    try {
      const [globalRes, gamesRes] = await Promise.all([
        fetch("/api/admin/bot-config", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/game-config", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (globalRes.ok) {
        const data = await globalRes.json();
        if (data) setConfig(data);
      }

      if (gamesRes.ok) {
        const data = await gamesRes.json();
        setPerGameConfigs(
          (data.configs || []).map((c: any) => ({
            id: c.id,
            gameId: c.gameId,
            gameName: c.gameName,
            gameIcon: c.gameIcon,
            botsEnabled: c.botsEnabled,
            maxBots: c.maxBots,
            botDifficulty: c.botDifficulty,
          }))
        );
      }
    } catch (error) {
      toast.error("Failed to fetch bot configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bot-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Bot configuration saved successfully");
        setConfig(data.config);
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save bot configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGameBots = async (game: PerGameBot) => {
    setUpdatingGameId(game.id);
    try {
      const res = await fetch(`/api/admin/game-config/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ botsEnabled: !game.botsEnabled }),
      });

      if (res.ok) {
        toast.success(`Bots ${!game.botsEnabled ? 'enabled' : 'disabled'} for ${game.gameName}`);
        setPerGameConfigs(prev => prev.map(c => c.id === game.id ? { ...c, botsEnabled: !game.botsEnabled } : c));
      } else {
        toast.error("Failed to update game bot status");
      }
    } catch (error) {
      toast.error("An error occurred during update");
    } finally {
      setUpdatingGameId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-bold font-heading text-white flex items-center gap-3">
          <Bot className="text-blue-500" size={40} />
          Bot & AI Economy Management
        </h1>
        <p className="text-slate-400 mt-2">
          Configure the smart matchmaking engine, bot win rates, and platform-wide bot limits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Global Toggle */}
        <div className="glass-card rounded-2xl p-6 col-span-1 lg:col-span-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-green-400" /> Global Bot Status
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              If disabled, the matchmaking engine will never spawn bots, even if matchmaking times out.
            </p>
          </div>
          <button
            onClick={() => setConfig({ ...config, botsEnabled: !config.botsEnabled })}
            className={`w-16 h-8 rounded-full relative transition-colors ${config.botsEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${config.botsEnabled ? 'translate-x-9' : 'translate-x-1'}`}></div>
          </button>
        </div>

        {/* Dynamic Win Rates */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="text-red-400" /> Target Win Rates (Dynamic Handicapping)
          </h2>
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <label className="text-slate-300 font-bold block">Easy Bots</label>
                  <span className="text-xs text-muted-foreground">Targeted at losing players to boost retention.</span>
                </div>
                <span className="text-green-400 font-mono text-xl">{config.easyWinRate}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={config.easyWinRate}
                onChange={(e) => setConfig({ ...config, easyWinRate: parseInt(e.target.value) })}
                className="w-full accent-green-500"
              />
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <label className="text-slate-300 font-bold block">Medium Bots</label>
                  <span className="text-xs text-muted-foreground">Standard audience filler bots.</span>
                </div>
                <span className="text-amber-400 font-mono text-xl">{config.mediumWinRate}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={config.mediumWinRate}
                onChange={(e) => setConfig({ ...config, mediumWinRate: parseInt(e.target.value) })}
                className="w-full accent-yellow-500"
              />
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <label className="text-slate-300 font-bold block">Expert Bots</label>
                  <span className="text-xs text-muted-foreground">Targeted at high-rollers and winning streaks.</span>
                </div>
                <span className="text-red-400 font-mono text-xl">{config.hardWinRate}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={config.hardWinRate}
                onChange={(e) => setConfig({ ...config, hardWinRate: parseInt(e.target.value) })}
                className="w-full accent-red-500"
              />
            </div>
          </div>
        </div>

        {/* Match Limits */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="text-indigo-400" /> Active Bot Limits
          </h2>
          <div className="space-y-6">
            <div>
              <label className="text-slate-300 font-bold block mb-2">Max Bots per 1v1 Match</label>
              <input
                type="number"
                min="0" max="10"
                value={config.maxBotsPer1v1}
                onChange={(e) => setConfig({ ...config, maxBotsPer1v1: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0e0e10] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">Usually 1 to simulate a human opponent.</p>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-2">Max Bots per Tournament</label>
              <input
                type="number"
                min="0" max="1000"
                value={config.maxBotsPerTourney}
                onChange={(e) => setConfig({ ...config, maxBotsPerTourney: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0e0e10] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">For startup phase, set 100-1000 to fill brackets.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Game Bot Overview */}
      <div>
        <h2 className="text-2xl font-bold font-heading text-white mb-4 flex items-center gap-2">
          <Gamepad2 className="text-purple-400" /> Per-Game Bot Status
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {perGameConfigs.map((cfg) => (
            <div key={cfg.gameId} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cfg.gameIcon}</span>
                  <div>
                    <h3 className="font-semibold font-heading text-sm">{cfg.gameName}</h3>
                    <p className="text-xs text-muted-foreground">{cfg.gameId}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleGameBots(cfg)}
                  disabled={updatingGameId === cfg.id}
                  className={`flex items-center gap-1 text-xs font-bold transition-colors hover:opacity-80 ${cfg.botsEnabled ? "text-green-400" : "text-red-400"}`}
                >
                  {updatingGameId === cfg.id ? <Loader2 size={18} className="animate-spin" /> : (cfg.botsEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />)}
                  {cfg.botsEnabled ? "On" : "Off"}
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Bots</span>
                  <span className="font-bold">{cfg.maxBots}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Easy</span>
                  <span className="text-green-400 font-bold">{cfg.botDifficulty.easy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medium</span>
                  <span className="text-amber-400 font-bold">{cfg.botDifficulty.medium}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hard</span>
                  <span className="text-red-400 font-bold">{cfg.botDifficulty.hard}%</span>
                </div>
              </div>

              {/* Difficulty Distribution Bar */}
              <div className="flex h-2 rounded-full overflow-hidden mt-3">
                <div className="bg-green-500" style={{ width: `${cfg.botDifficulty.easy}%` }} />
                <div className="bg-amber-500" style={{ width: `${cfg.botDifficulty.medium}%` }} />
                <div className="bg-red-500" style={{ width: `${cfg.botDifficulty.hard}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-6 flex justify-end gap-4 mt-8 pt-6 border-t border-white/[0.06] bg-[#0e0e10]/80 backdrop-blur-md p-4 rounded-xl shadow-2xl z-50">
        <div className="mr-auto flex items-center gap-2 text-sm text-slate-400">
          <Activity size={16} className="text-blue-400" />
          <span>Last synced: {new Date().toLocaleTimeString()}</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 btn-neon px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {saving ? "Saving Changes..." : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}

