"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Trophy, Plus, Calendar, Users, DollarSign, Clock, Trash2, Edit3, Save, X, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminTournamentsPage() {
  const { token } = useAuthStore();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [gameConfigs, setGameConfigs] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    gameId: "",
    entryFee: "100",
    prizePool: "1000",
    maxParticipants: "16",
    startTime: "",
    prizeDistribution: [
      { rank: 1, percent: 50 },
      { rank: 2, percent: 30 },
      { rank: 3, percent: 20 },
    ]
  });

  useEffect(() => {
    fetchTournaments();
    fetchGameConfigs();
  }, []);

  const fetchTournaments = async () => {
    const res = await fetch("/api/admin/tournaments", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTournaments(data.tournaments);
    }
    setLoading(false);
  };

  const fetchGameConfigs = async () => {
    const res = await fetch("/api/admin/game-config", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setGameConfigs(data.configs);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gameId) {
      toast.error("Please select a game");
      return;
    }

    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success("Tournament created successfully");
      setIsCreating(false);
      fetchTournaments();
      setFormData({
        title: "",
        description: "",
        gameId: "",
        entryFee: "100",
        prizePool: "1000",
        maxParticipants: "16",
        startTime: "",
        prizeDistribution: [
          { rank: 1, percent: 50 },
          { rank: 2, percent: 30 },
          { rank: 3, percent: 20 },
        ]
      });
    } else {
      toast.error("Failed to create tournament");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
            <Trophy size={28} className="text-amber-400" /> Tournament Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage high-stakes competitions</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 btn-neon px-4 py-2 rounded-xl font-semibold transition-all"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? "Cancel" : "New Tournament"}
        </button>
      </div>

      {isCreating && (
        <div className="glass-card rounded-2xl p-6 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Tournament Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Weekend Blitz Cup"
                    className="w-full h-11 px-4 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full h-24 px-4 py-3 rounded-xl glass-input resize-none"
                    placeholder="Rules, prize details, etc."
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Select Game</label>
                  <select
                    required
                    value={formData.gameId}
                    onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl glass-input bg-[#131315]"
                  >
                    <option value="">Select a game...</option>
                    {gameConfigs.map((game) => (
                      <option key={game.gameId} value={game.gameId}>
                        {game.gameIcon} {game.gameName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Entry Fee (Rs.)</label>
                    <input
                      type="number"
                      required
                      value={formData.entryFee}
                      onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl glass-input font-bold text-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Total Prize (Rs.)</label>
                    <input
                      type="number"
                      required
                      value={formData.prizePool}
                      onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl glass-input font-bold text-green-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Max Participants</label>
                    <input
                      type="number"
                      required
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl glass-input text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Prize Distribution (%)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.prizeDistribution.map((dist, i) => (
                      <div key={i}>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rank {dist.rank}</div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={dist.percent}
                            onChange={(e) => {
                              const newDist = [...formData.prizeDistribution];
                              newDist[i].percent = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, prizeDistribution: newDist });
                            }}
                            className="w-full h-9 px-2 rounded-lg glass-input text-xs text-center"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] mt-2 text-muted-foreground">
                    Total: {formData.prizeDistribution.reduce((acc, curr) => acc + curr.percent, 0)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/[0.06]">
              <button
                type="submit"
                className="btn-neon px-8 py-2.5 rounded-xl font-bold flex items-center gap-2"
              >
                <Save size={18} />
                Create Tournament
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tournaments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((t) => (
          <div key={t.id} className="glass-card rounded-2xl p-5 group hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                t.status === "upcoming" ? "bg-blue-500/20 text-blue-400" :
                t.status === "active" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
              }`}>
                {t.status}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400">
                  <Edit3 size={14} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold font-heading mb-1">{t.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{t.description}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2 rounded-xl bg-white/[0.03]">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Entry</div>
                <div className="text-sm font-bold text-blue-400">Rs. {t.entryFee}</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03]">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Prize Pool</div>
                <div className="text-sm font-bold text-green-400">Rs. {t.prizePool}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(t.startTime).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} />
                {t._count?.participants || 0} / {t.maxParticipants}
              </div>
            </div>
          </div>
        ))}
        
        {!loading && tournaments.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center glass-card rounded-2xl">
            <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No tournaments scheduled yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
