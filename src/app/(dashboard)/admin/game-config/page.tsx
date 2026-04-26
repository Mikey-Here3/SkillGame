"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Gamepad2, Save, ToggleLeft, ToggleRight, Plus, X, Bot } from "lucide-react";
import { toast } from "sonner";

type GameCfg = {
  id: string; gameId: string; gameName: string; gameIcon: string;
  entryFees: number[]; commissionPercent: number;
  rewardDistribution: { top1: number; top2: number; top3: number };
  maxPlayers: number; minPlayers: number; gameDuration: number;
  isActive: boolean; botsEnabled: boolean; maxBots: number;
  botDifficulty: { easy: number; medium: number; hard: number };
  practiceEnabled: boolean;
};

export default function AdminGameConfigPage() {
  const { token } = useAuthStore();
  const [configs, setConfigs] = useState<GameCfg[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<GameCfg>>({});
  const [newFee, setNewFee] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    const res = await fetch("/api/admin/game-config", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setConfigs(data.configs);
    }
  };

  const startEdit = (cfg: GameCfg) => {
    setEditingId(cfg.id);
    setEditData({ ...cfg });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setNewFee("");
  };

  const saveConfig = async (id: string) => {
    // Validate
    const rd = editData.rewardDistribution;
    if (rd && (rd.top1 + rd.top2 + rd.top3) !== 100) {
      toast.error("Reward percentages must total 100%");
      return;
    }
    if (editData.commissionPercent !== undefined && (editData.commissionPercent < 5 || editData.commissionPercent > 20)) {
      toast.error("Commission must be between 5% and 20%");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/admin/game-config/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editData),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Game config updated!");
      cancelEdit();
      fetchConfigs();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update");
    }
  };

  const toggleActive = async (cfg: GameCfg) => {
    const res = await fetch(`/api/admin/game-config/${cfg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !cfg.isActive }),
    });
    if (res.ok) {
      toast.success(`${cfg.gameName} ${cfg.isActive ? "disabled" : "enabled"}`);
      fetchConfigs();
    }
  };

  const addFee = () => {
    const fee = parseFloat(newFee);
    if (isNaN(fee) || fee <= 0) return;
    const fees = [...(editData.entryFees || []), fee].sort((a, b) => a - b);
    setEditData({ ...editData, entryFees: fees });
    setNewFee("");
  };

  const removeFee = (fee: number) => {
    setEditData({
      ...editData,
      entryFees: (editData.entryFees || []).filter((f) => f !== fee),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
          <Gamepad2 size={24} className="text-purple-400" /> Game Configuration
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage entry fees, commissions, rewards, and bot settings for all games
        </p>
      </div>

      <div className="space-y-4">
        {configs.map((cfg) => (
          <div key={cfg.id} className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cfg.gameIcon}</span>
                <div>
                  <h3 className="font-semibold font-heading">{cfg.gameName}</h3>
                  <p className="text-xs text-muted-foreground">{cfg.gameId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(cfg)}
                  className={`flex items-center gap-1 text-xs font-bold ${cfg.isActive ? "text-green-400" : "text-red-400"}`}
                >
                  {cfg.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {cfg.isActive ? "Active" : "Disabled"}
                </button>
                {editingId === cfg.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => saveConfig(cfg.id)} disabled={saving}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1">
                      <Save size={12} /> {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg glass-card text-xs text-muted-foreground">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(cfg)}
                    className="px-3 py-1.5 rounded-lg glass-card text-xs text-blue-400 hover:bg-blue-500/10">
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Config Details */}
            {editingId === cfg.id ? (
              <div className="p-5 space-y-5">
                {/* Entry Fees */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">
                    💰 Entry Fees
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editData.entryFees || []).map((fee) => (
                      <span key={fee} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-bold">
                        ${fee}
                        <button onClick={() => removeFee(fee)} className="ml-1 text-red-400 hover:text-red-300">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input type="number" value={newFee} onChange={(e) => setNewFee(e.target.value)}
                        placeholder="Add fee" className="h-8 w-20 px-2 rounded-lg glass-input text-xs"
                        onKeyDown={(e) => e.key === "Enter" && addFee()} />
                      <button onClick={addFee} className="p-1.5 rounded-lg bg-green-500/20 text-green-400">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Commission */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">
                    📊 Commission ({editData.commissionPercent || cfg.commissionPercent}%)
                  </label>
                  <input type="range" min="5" max="20" step="1"
                    value={editData.commissionPercent || cfg.commissionPercent}
                    onChange={(e) => setEditData({ ...editData, commissionPercent: parseInt(e.target.value) })}
                    className="w-full accent-blue-500" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5%</span><span>20%</span>
                  </div>
                </div>

                {/* Reward Distribution */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">
                    🏆 Reward Distribution
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["top1", "top2", "top3"] as const).map((key, i) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground">
                          {["🥇 1st", "🥈 2nd", "🥉 3rd"][i]}
                        </label>
                        <div className="flex items-center gap-1">
                          <input type="number" min="0" max="100"
                            value={(editData.rewardDistribution || cfg.rewardDistribution)[key]}
                            onChange={(e) => setEditData({
                              ...editData,
                              rewardDistribution: {
                                ...(editData.rewardDistribution || cfg.rewardDistribution),
                                [key]: parseInt(e.target.value) || 0,
                              },
                            })}
                            className="h-9 w-full px-3 rounded-lg glass-input text-sm" />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const rd = editData.rewardDistribution || cfg.rewardDistribution;
                    const total = rd.top1 + rd.top2 + rd.top3;
                    return (
                      <p className={`text-xs mt-2 ${total === 100 ? "text-green-400" : "text-red-400"}`}>
                        Total: {total}% {total === 100 ? "✓" : "(must be 100%)"}
                      </p>
                    );
                  })()}
                </div>

                {/* Player Limits & Duration */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Min Players</label>
                    <input type="number" min="2" value={editData.minPlayers || cfg.minPlayers}
                      onChange={(e) => setEditData({ ...editData, minPlayers: parseInt(e.target.value) })}
                      className="h-9 w-full px-3 rounded-lg glass-input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Players</label>
                    <input type="number" min="2" value={editData.maxPlayers || cfg.maxPlayers}
                      onChange={(e) => setEditData({ ...editData, maxPlayers: parseInt(e.target.value) })}
                      className="h-9 w-full px-3 rounded-lg glass-input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Duration (s)</label>
                    <input type="number" min="10" value={editData.gameDuration || cfg.gameDuration}
                      onChange={(e) => setEditData({ ...editData, gameDuration: parseInt(e.target.value) })}
                      className="h-9 w-full px-3 rounded-lg glass-input text-sm" />
                  </div>
                </div>

                {/* Bot Settings */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2 flex items-center gap-1">
                    <Bot size={12} /> Bot Settings
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox"
                        checked={editData.botsEnabled ?? cfg.botsEnabled}
                        onChange={(e) => setEditData({ ...editData, botsEnabled: e.target.checked })}
                        className="rounded" />
                      Bots Enabled
                    </label>
                    <div>
                      <label className="text-xs text-muted-foreground">Max Bots</label>
                      <input type="number" min="0" max="10"
                        value={editData.maxBots ?? cfg.maxBots}
                        onChange={(e) => setEditData({ ...editData, maxBots: parseInt(e.target.value) })}
                        className="h-9 w-full px-3 rounded-lg glass-input text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Entry Fees</div>
                  <div className="flex flex-wrap gap-1">
                    {cfg.entryFees.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded bg-white/5 text-xs">${f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Commission</div>
                  <div className="font-bold">{cfg.commissionPercent}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Rewards</div>
                  <div className="text-xs">{cfg.rewardDistribution.top1}% / {cfg.rewardDistribution.top2}% / {cfg.rewardDistribution.top3}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Players</div>
                  <div>{cfg.minPlayers}-{cfg.maxPlayers} • {cfg.gameDuration}s</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
