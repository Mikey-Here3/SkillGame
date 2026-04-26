"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bot, Save, AlertTriangle, Users, Target, Activity } from "lucide-react";

export default function ManageBotsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    botsEnabled: true,
    easyWinRate: 20,
    mediumWinRate: 50,
    hardWinRate: 80,
    maxBotsPer1v1: 1,
    maxBotsPerTourney: 8,
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchConfig();
  }, [user, router]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/bot-config");
      const data = await res.json();
      if (res.ok && data) {
        setConfig(data);
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
        headers: { "Content-Type": "application/json" },
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

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
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
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl col-span-1 lg:col-span-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-green-400" /> Global Bot Status
            </h2>
            <p className="text-slate-400 text-sm mt-1">
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
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="text-red-400" /> Target Win Rates (Dynamic Handicapping)
          </h2>
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <label className="text-slate-300 font-bold block">Easy Bots</label>
                  <span className="text-xs text-slate-500">Targeted at losing players to boost retention.</span>
                </div>
                <span className="text-green-400 font-mono text-xl">{config.easyWinRate}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={config.easyWinRate} 
                onChange={(e) => setConfig({...config, easyWinRate: parseInt(e.target.value)})}
                className="w-full accent-green-500"
              />
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <label className="text-slate-300 font-bold block">Medium Bots</label>
                  <span className="text-xs text-slate-500">Standard audience filler bots.</span>
                </div>
                <span className="text-yellow-400 font-mono text-xl">{config.mediumWinRate}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={config.mediumWinRate} 
                onChange={(e) => setConfig({...config, mediumWinRate: parseInt(e.target.value)})}
                className="w-full accent-yellow-500"
              />
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <label className="text-slate-300 font-bold block">Expert Bots</label>
                  <span className="text-xs text-slate-500">Targeted at high-rollers and winning streaks to challenge them.</span>
                </div>
                <span className="text-red-400 font-mono text-xl">{config.hardWinRate}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={config.hardWinRate} 
                onChange={(e) => setConfig({...config, hardWinRate: parseInt(e.target.value)})}
                className="w-full accent-red-500"
              />
            </div>
          </div>
        </div>

        {/* Match Limits */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="text-indigo-400" /> Active Bot Limits
          </h2>
          <div className="space-y-6">
            <div>
              <label className="text-slate-300 font-bold block mb-2">Max Bots per 1v1 Match</label>
              <input 
                type="number" 
                min="0" max="4"
                value={config.maxBotsPer1v1}
                onChange={(e) => setConfig({...config, maxBotsPer1v1: parseInt(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">Usually 1 to simulate a human opponent.</p>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-2">Max Bots per Tournament</label>
              <input 
                type="number" 
                min="0" max="32"
                value={config.maxBotsPerTourney}
                onChange={(e) => setConfig({...config, maxBotsPerTourney: parseInt(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">Fill empty tournament brackets with bots.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-700">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
        >
          <Save size={20} />
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
